// Presentation only. This module neither reads nor writes a toy's lifecycle.
export type PreviewState = 'ready' | 'living' | 'ending' | 'ended';
export type PreviewFrame = { state: PreviewState; strength: number; grey: number; beat: number };
export const PREVIEW_READY: PreviewFrame = { state: 'ready', strength: 0, grey: 0, beat: 0 };
const ending = [
 { strength: .85, grey: .15, delay: 1500 },
 { strength: .60, grey: .40, delay: 1900 },
 { strength: .35, grey: .65, delay: 2400 },
 { strength: .12, grey: .85, delay: 2800 },
];
type Dependencies = {
 frame: (frame: PreviewFrame) => void;
 pulse: (strength: number) => void;
 silence: () => void;
 setTimer: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>;
 clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
};
export class HeartPreview {
 private timer: ReturnType<typeof setTimeout> | null = null;
 private state: PreviewState = 'ready';
 private beat = 0;
 constructor(private deps: Dependencies) {}
 private clear() { if (this.timer !== null) this.deps.clearTimer(this.timer); this.timer = null; }
 private emit(state: PreviewState, strength: number, grey: number) {
  this.state = state;
  this.deps.frame({ state, strength, grey, beat: ++this.beat });
  if (strength) this.deps.pulse(strength);
 }
 start() { this.clear(); this.deps.silence(); this.living(); }
 private living = () => {
  this.emit('living', 1, 0);
  this.timer = this.deps.setTimer(this.living, 1200);
 };
 finish() {
  if (this.state !== 'living') return;
  this.clear(); this.deps.silence(); this.endBeat(0);
 }
 private endBeat(index: number) {
  if (index === ending.length) {
   this.timer = null; this.deps.silence(); this.emit('ended', 0, 1); return;
  }
  const step = ending[index];
  this.emit('ending', step.strength, step.grey);
  this.timer = this.deps.setTimer(() => this.endBeat(index + 1), step.delay);
 }
 cancel() { this.clear(); this.deps.silence(); this.emit('ready', 0, 0); }
 dispose() { this.clear(); this.deps.silence(); }
}
