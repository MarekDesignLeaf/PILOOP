'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Heart,Play,RotateCcw,Square} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogTrigger} from '@/components/ui/dialog';
import {useHeartbeat} from '@/hooks/use-heartbeat';
import {HeartPreview,PREVIEW_READY} from '@/lib/heart-preview';

const copy = {
 cs: {open:'Ukázka života srdce',title:'Jeden tep. Celý příběh.',intro:'Pletené srdce PILOOP, od tlukotu až k tichu.',note:'Samostatná simulace. Probuzení, věk ani vzpomínky tvé postavičky se nemění.',ready:'Srdce čeká na tvé klepnutí.',living:'Srdce bije.',ending:'Tep slábne. Barva pomalu odchází.',ended:'Tep utichl. Příběh zůstává.',start:'Spustit ukázku',finish:'Simulovat konec života',again:'Přehrát simulaci znovu',stop:'Zastavit ukázku',preparing:'Připravuji zvuk…',sound:'Zvuk srdce',vibration:'Jemné vibrace',unsupported:'Na iPhonu funguje zvuk. Tento prohlížeč řízené vibrace nepodporuje.',error:'Zvuk nebo vibrace se nepodařily spustit. Animace může pokračovat samostatně.',volume:'Hlasitost',reduced:'Máš zapnuté omezení pohybu. Změny stavu a barvy zůstávají viditelné bez pulzování.',phase:'Průběh simulace',steps:['Tlukot','Slábnutí','Ticho'],alt:'Pletené srdce PILOOP'},
 en: {open:'Heart life preview',title:'One beat. A whole story.',intro:'The knitted PILOOP heart, from a heartbeat to stillness.',note:'A separate simulation. Your character’s awakening, age and memories stay unchanged.',ready:'The heart is waiting for your tap.',living:'The heart is beating.',ending:'The beat softens. The colour slowly fades.',ended:'The beat is silent. The story remains.',start:'Start preview',finish:'Simulate end of life',again:'Replay the simulation',stop:'Stop preview',preparing:'Preparing sound…',sound:'Heartbeat sound',vibration:'Gentle vibration',unsupported:'Sound works on iPhone. This browser does not support controlled vibration.',error:'Sound or vibration could not start. The animation can continue on its own.',volume:'Volume',reduced:'Reduced motion is enabled. State and colour changes remain visible without pulsing.',phase:'Preview progress',steps:['Heartbeat','Fading','Stillness'],alt:'Knitted PILOOP heart'},
};

function Preview({lang}:{lang:'cs'|'en'}) {
 const t=copy[lang], h=useHeartbeat('heart-life-preview');
 const [frame,setFrame]=useState(PREVIEW_READY),[preparing,setPreparing]=useState(false);
 const timeline=useRef<HeartPreview|null>(null),generation=useRef(0);
 const running=frame.state==='living'||frame.state==='ending';
 useEffect(()=>{
  const engine=new HeartPreview({frame:setFrame,pulse:h.previewPulse,silence:h.stop,setTimer:(fn,delay)=>setTimeout(fn,delay),clearTimer:id=>clearTimeout(id)});
  timeline.current=engine;
  const cancel=()=>{generation.current++;setPreparing(false);engine.cancel();};
  const hide=()=>{if(document.visibilityState!=='visible')cancel();};
  document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',cancel);
  return()=>{generation.current++;engine.dispose();timeline.current=null;document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',cancel);};
 },[h.previewPulse,h.stop]);
 async function start() {
  const token=++generation.current;setPreparing(true);
  await h.prepare();
  if(token!==generation.current||document.visibilityState!=='visible')return;
  setPreparing(false);timeline.current?.start();
 }
 function stop(){generation.current++;setPreparing(false);timeline.current?.cancel();}
 const phase=frame.state==='ended'?2:frame.state==='ending'?1:0;
 const style={'--heart-grey':frame.grey,'--heart-peak':1+frame.strength*.13,'--heart-second':1+frame.strength*.08,'--heart-warmth':running?frame.strength*.3:0} as CSSProperties;
 return <>
  <span className="eyebrow">PILOOP · {lang==='cs'?'SIMULACE':'SIMULATION'}</span>
  <DialogTitle>{t.title}</DialogTitle><DialogDescription>{t.intro}</DialogDescription>
  <div className="life-preview-stage" data-state={frame.state} style={style}>
   <div className="life-preview-halo" aria-hidden="true"/>
   <div className="life-preview-colour"><div key={frame.beat} className={'life-preview-knit '+(running?'life-preview-pulse':'')}><span className="yarn-heart" role="img" aria-label={t.alt}/></div></div>
   <span className="life-preview-shadow" aria-hidden="true"/>
  </div>
  <p className="life-preview-status" role="status">{t[frame.state]}</p>
  <ol className="life-preview-steps" aria-label={t.phase}>{t.steps.map((label,index)=><li key={label} aria-current={index===phase?'step':undefined}><span>{index+1}</span>{label}</li>)}</ol>
  <div className="life-preview-options"><label><input type="checkbox" checked={h.sound} onChange={e=>h.setSound(e.target.checked)} disabled={running||preparing||!h.ready}/>{t.sound}</label><label><input type="checkbox" checked={h.vibration} onChange={e=>h.setVibration(e.target.checked)} disabled={running||preparing||!h.ready||!h.supported}/>{t.vibration}</label></div>
  <label className="life-preview-volume">{t.volume}<input aria-label={t.volume} type="range" min="0" max="100" step="5" value={h.volume} onChange={e=>h.setVolume(Number(e.target.value))} disabled={!h.ready||!h.sound}/><output>{h.volume}%</output></label>
  {!h.supported&&<p className="heartbeat-help">{t.unsupported}</p>}
  <div className="life-preview-actions">{!running?<button className="primary" onClick={()=>void start()} disabled={preparing||!h.ready}>{frame.state==='ended'?<RotateCcw size={17}/>:<Play size={17}/>} {preparing?t.preparing:frame.state==='ended'?t.again:t.start}</button>:<button className="primary" onClick={()=>timeline.current?.finish()} disabled={frame.state==='ending'}><Heart size={17}/>{frame.state==='ending'?t.steps[1]+'…':t.finish}</button>}{(running||preparing)&&<button className="text-button" onClick={stop}><Square size={14}/>{t.stop}</button>}</div>
  {h.error&&<p className="heartbeat-error" role="alert">{t.error}</p>}
  <p className="life-preview-note">{t.note}</p><p className="life-preview-reduced">{t.reduced}</p>
 </>;
}

export function HeartLifePreview({lang,onOpen}:{lang:'cs'|'en';onOpen:()=>void}) {
 const [open,setOpen]=useState(false);
 return <Dialog open={open} onOpenChange={value=>{if(value)onOpen();setOpen(value)}}><DialogTrigger asChild><button className="secondary life-preview-trigger"><Play size={16}/>{copy[lang].open}</button></DialogTrigger><DialogContent className="life-preview-dialog">{open&&<Preview lang={lang}/>}</DialogContent></Dialog>;
}
