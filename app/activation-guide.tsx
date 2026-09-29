'use client';
import { Smartphone, Radio, CreditCard, Heart, CheckCircle2, ScanLine } from 'lucide-react';

export function ActivationGuide({ onCapture, scan, living }: {
  onCapture: () => void; scan: 'idle'|'searching'|'detected'; living: boolean;
}) {
  return <section className="activation-guide" aria-labelledby="activation-guide-title">
    <div className="activation-guide-heading">
      <div><span className="eyebrow">AWAKEN HEART · GUIDED EXPERIENCE</span>
        <h2 id="activation-guide-title">Your first heartbeat starts here.</h2>
        <p>Follow the same intended order as the physical PILOOP activation. This online version uses a simulated NFC signal and fictional product details only.</p></div>
      <span className="demo-pill">INTERACTIVE DEMONSTRATION</span>
    </div>
    <div className="activation-steps">
      <article><span className="activation-number">01 / PREPARE</span>
        <div className="activation-art nfc-art" aria-hidden="true"><Smartphone size={66} strokeWidth={1.4}/><span className="nfc-symbol"><Radio size={28}/></span><strong>NFC ON</strong></div>
        <h3>Switch on NFC</h3><p>Enable NFC in your mobile device settings if your phone has an NFC switch. Keep the phone unlocked.</p></article>
      <article><span className="activation-number">02 / APPROACH</span>
        <div className="activation-art toy-art"><img src="/assets/characters/DEMO-BASIC-001.png" alt="PILOOP fox design showing the orange heart on its chest"/><span className="scan-phone" aria-hidden="true"><Smartphone size={54}/><ScanLine size={21}/></span></div>
        <h3>Approach the PILOOP</h3><p>Bring the NFC area of your phone close to the crocheted character, near the indicated activation point.</p></article>
      <article><span className="activation-number">03 / DETECT</span>
        <div className="activation-art signal-art" aria-hidden="true"><Radio size={57} strokeWidth={1.25}/><CheckCircle2 size={29}/><strong>IDENTITY FOUND</strong></div>
        <h3>Automatic popup</h3><p>When the NFC signal is detected, the product identity is recognised and the activation key dialog opens automatically.</p></article>
      <article><span className="activation-number">04 / UNLOCK</span>
        <div className="activation-art key-art" aria-label="Illustration of the fictional product activation card"><div className="sample-card"><span>PILOOP · PRODUCT CARD</span><CreditCard size={29}/><strong>ACTIVATION KEY</strong><code>PILOOP-DEMO</code><small>FICTIONAL SAMPLE · NOT A REAL KEY</small></div></div>
        <h3>Enter the card key</h3><p>Enter the activation key supplied on that individual PILOOP's product card. This demo accepts the illustrated sample key.</p></article>
      <article><span className="activation-number">05 / GENESIS</span>
        <div className="activation-art genesis-art" aria-hidden="true"><Heart size={73} fill="currentColor"/><span>♥</span></div>
        <h3>Confirm the first beat</h3><p>Review the irreversible Awakening warning and confirm. The first beat, Genesis and the individual passport become part of its story.</p></article>
    </div>
    <div className="activation-demo-action">
      <div><strong>Try the entire sequence</strong><p>No physical NFC tag, real certificate or production Registry is connected. Demo data stays inside this browser.</p></div>
      <button className="primary" type="button" onClick={onCapture} disabled={living || scan==='searching'}>
        <Radio size={18}/>{living ? 'This sample is already awakened' : scan==='searching' ? 'Detecting fictional NFC signal…' : 'Simulate NFC detection'}
      </button>
      <span className="activation-status" role="status" aria-live="polite">{scan==='searching' ? 'Approach detected. Reading sample identity…' : scan==='detected' ? 'Sample signal detected. Activation key dialog opened automatically.' : 'No actual phone or physical toy is scanned.'}</span>
    </div>
    <p className="activation-photo-note">Character visual: existing PILOOP design study, not a photograph of certified production electronics. Illustrated phone and card are instructional mockups.</p>
  </section>;
}
