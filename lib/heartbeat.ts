export type HeartbeatOptions = { sound: boolean; vibration: boolean; volume: number };
export type HeartbeatStatus = 'idle' | 'starting' | 'playing';
export type HeartbeatError = 'audio' | 'vibration' | null;
export const HEARTBEAT_PERIOD = 1200;
export const GENTLE_PULSE = [12, 228, 8];
type Dependencies = {
 createAudio: () => AudioContext;
 vibrate?: (pattern: number | number[]) => boolean;
 visible: () => boolean;
 setTimer: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>;
 clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
 status: (status: HeartbeatStatus) => void;
 error: (error: HeartbeatError) => void;
 pulse: () => void;
};
export class HeartbeatPlayer {
 private context: AudioContext | null = null;
 private gain: GainNode | null = null;
 private sources = new Set<OscillatorNode>();
 private timer: ReturnType<typeof setTimeout> | null = null;
 private generation = 0;
 private active = false;
 private options: HeartbeatOptions = { sound: true, vibration: false, volume: 30 };
 constructor(private deps: Dependencies) {}
 get token() { return this.generation; }
 private audible() { return this.options.sound && this.options.volume > 0; }
 private available() { return this.audible() || (this.options.vibration && !!this.deps.vibrate); }
 configure(options: HeartbeatOptions) {
  this.options = {...options, volume: Number.isFinite(options.volume) ? Math.max(0, Math.min(100, options.volume)) : 30};
  if (!this.options.vibration) this.cancelVibration();
  this.setGain();
  if (!this.available()) this.stop();
 }
 private setGain() {
  if (!this.gain || !this.context) return;
  this.gain.gain.setValueAtTime(this.audible() ? this.options.volume / 100 * 0.45 : 0, this.context.currentTime);
 }
 async prepare() {
  if (!this.audible()) return true;
  try {
   if (!this.context || this.context.state === 'closed') {
    this.context = this.deps.createAudio();
    this.gain = this.context.createGain();
    this.gain.gain.setValueAtTime(0, this.context.currentTime);
    this.gain.connect(this.context.destination);
    this.context.onstatechange = () => {
     if (this.active && this.context?.state !== 'running') { this.stop(); this.deps.error('audio'); }
    };
   }
   if (this.context.state !== 'running') await this.context.resume();
   if (this.context.state !== 'running') throw new Error('Audio not running');
   return true;
  } catch { this.deps.error('audio'); return false; }
 }
 async start(expectedToken?: number) {
  if (expectedToken !== undefined && expectedToken !== this.generation) return false;
  this.stop();
  if (!this.available() || !this.deps.visible()) return false;
  const generation = this.generation;
  this.deps.error(null);
  this.deps.status('starting');
  const ready = await this.prepare();
  if (generation !== this.generation) return false;
  if (!ready || !this.deps.visible()) { this.stop(); return false; }
  this.active = true;
  this.setGain();
  this.deps.status('playing');
  this.cycle();
  return true;
 }
 private thump(time: number, weight: number) {
  const ctx = this.context;
  if (!ctx || !this.gain || !this.audible()) return;
  // Two low, descending tones with a short smooth envelope: a soft lub dub.
  [1, 2].forEach(harmonic => {
   const oscillator = ctx.createOscillator();
   const envelope = ctx.createGain();
   oscillator.type = 'sine';
   oscillator.frequency.setValueAtTime(110 * harmonic, time);
   oscillator.frequency.exponentialRampToValueAtTime(48 * harmonic, time + 0.12);
   envelope.gain.setValueAtTime(0, time);
   envelope.gain.linearRampToValueAtTime(weight / (harmonic * harmonic), time + 0.012);
   envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
   oscillator.connect(envelope); envelope.connect(this.gain!);
   this.sources.add(oscillator);
   oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.sources.delete(oscillator); };
   oscillator.start(time); oscillator.stop(time + 0.2);
  });
 }
 private cycle = () => {
  if (!this.active) return;
  if (!this.deps.visible()) { this.stop(); return; }
  try {
   if (this.audible()) {
    if (!this.context || this.context.state !== 'running') throw new Error('Audio interrupted');
    const now = this.context.currentTime;
    this.thump(now, 0.8); this.thump(now + 0.24, 0.5);
   }
  } catch { this.stop(); this.deps.error('audio'); return; }
  if (this.options.vibration && this.deps.vibrate) {
   try {
    if (!this.deps.vibrate([...GENTLE_PULSE])) throw new Error('Vibration refused');
   } catch {
    this.options.vibration = false; this.cancelVibration(); this.deps.error('vibration');
    if (!this.audible()) { this.stop(); return; }
   }
  }
  this.deps.pulse();
  this.timer = this.deps.setTimer(this.cycle, HEARTBEAT_PERIOD);
 };
 // A preview owns its own finite timeline. This emits one beat, never a loop.
 previewPulse(strength: number) {
  if (!this.deps.visible() || !this.available()) return;
  const weight = Math.max(0, Math.min(1, strength));
  if (!weight) return;
  try {
   if (this.audible()) {
    if (!this.context || this.context.state !== 'running') throw Error('Audio not ready');
    this.setGain();
    this.thump(this.context.currentTime, 0.8 * weight);
    this.thump(this.context.currentTime + 0.24, 0.5 * weight);
   }
  } catch { this.stop(); this.deps.error('audio'); return; }
  if (this.options.vibration && this.deps.vibrate) {
   try { if (!this.deps.vibrate([Math.max(1, Math.round(12 * weight)), 228, Math.max(1, Math.round(8 * weight))])) throw Error(); }
   catch { this.options.vibration = false; this.cancelVibration(); this.deps.error('vibration'); }
  }
  this.active = true;
  this.deps.status('playing');
 }
 private cancelVibration() { try { this.deps.vibrate?.(0); } catch {} }
 stop() {
  this.generation++; this.active = false;
  if (this.timer !== null) { this.deps.clearTimer(this.timer); this.timer = null; }
  if (this.gain && this.context) this.gain.gain.setValueAtTime(0, this.context.currentTime);
  this.sources.forEach(source => { try { source.stop(); } catch {} });
  this.sources.clear(); this.cancelVibration(); this.deps.status('idle');
 }
 dispose() {
  this.stop();
  if (this.context) { this.context.onstatechange = null; void this.context.close().catch(() => {}); }
  this.context = null; this.gain = null;
 }
}
