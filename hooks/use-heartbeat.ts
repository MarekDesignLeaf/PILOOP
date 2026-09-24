'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {HeartbeatPlayer,type HeartbeatOptions,type HeartbeatStatus,type HeartbeatError} from '@/lib/heartbeat';
const defaults:HeartbeatOptions={sound:true,vibration:false,volume:30};
export function useHeartbeat(scope:string) {
 const player=useRef<HeartbeatPlayer|null>(null);
 const [options,setOptions]=useState(defaults);
 const [status,setStatus]=useState<HeartbeatStatus>('idle');
 const [error,setError]=useState<HeartbeatError>(null);
 const [supported,setSupported]=useState(false);
 const [pulse,setPulse]=useState(0);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const hasVibration=typeof navigator.vibrate==='function';
  setSupported(hasVibration);
  const engine=new HeartbeatPlayer({
   createAudio:()=>{const Audio=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Audio)throw Error('Unsupported');return new Audio();},
   vibrate:hasVibration?pattern=>navigator.vibrate(pattern):undefined,
   visible:()=>document.visibilityState==='visible',
   setTimer:(fn,delay)=>setTimeout(fn,delay),clearTimer:timer=>clearTimeout(timer),
   status:setStatus,error:value=>{setError(value);if(value==='vibration')setOptions(old=>({...old,vibration:false}));},pulse:()=>setPulse(old=>old+1),
  });
  player.current=engine;
  try {const saved=JSON.parse(localStorage.getItem('piloop-heartbeat-preferences')||'null');if(saved)setOptions({sound:typeof saved.sound==='boolean'?saved.sound:true,vibration:hasVibration&&saved.vibration===true,volume:typeof saved.volume==='number'&&Number.isFinite(saved.volume)?Math.max(0,Math.min(100,saved.volume)):30});}catch{}
  setReady(true);
  const hide=()=>{if(document.visibilityState!=='visible')engine.stop();};
  const leave=()=>engine.stop();
  document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',leave);
  return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',leave);engine.dispose();player.current=null;};
 },[]);
 useEffect(()=>{if(!ready)return;player.current?.configure(options);try{localStorage.setItem('piloop-heartbeat-preferences',JSON.stringify(options));}catch{}},[options,ready]);
 useEffect(()=>{player.current?.stop();setError(null);},[scope]);
 const stop=useCallback(()=>player.current?.stop(),[]);
 const prepare=useCallback(async()=>{const p=player.current;if(!p)return undefined;const token=p.token;await p.prepare();return token;},[]);
 const start=useCallback((token?:number)=>player.current?.start(token),[]);
 const previewPulse=useCallback((strength:number)=>player.current?.previewPulse(strength),[]);
 const setSound=useCallback((sound:boolean)=>{player.current?.stop();setError(null);setOptions(old=>({...old,sound}));},[]);
 const setVibration=useCallback((vibration:boolean)=>{player.current?.stop();setError(null);setOptions(old=>({...old,vibration:supported&&vibration}));},[supported]);
 const setVolume=useCallback((volume:number)=>setOptions(old=>({...old,volume})),[]);
 return {...options,setSound,setVibration,setVolume,supported,status,error,pulse,stop,start,prepare,previewPulse,ready};
}
export type HeartbeatController=ReturnType<typeof useHeartbeat>;
