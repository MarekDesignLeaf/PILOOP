import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['lib/heartbeat.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {HeartbeatPlayer,GENTLE_PULSE}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
function setup({vibrate=true,deferred=false,reject=false}={}){
 const timers=new Map(),vibrations=[],statuses=[],errors=[],sources=[];let count=0,visible=true,release;
 const parameter=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const context={state:'suspended',currentTime:0,destination:{},onstatechange:null,createGain:()=>({gain:parameter(),connect(){},disconnect(){}}),createOscillator(){const s={frequency:parameter(),type:'',connect(){},disconnect(){},start(){s.started=true},stop(){s.stopped=true},onended:null};sources.push(s);return s;},resume(){if(reject)return Promise.reject(Error('blocked'));if(deferred)return new Promise(resolve=>{release=()=>{context.state='running';resolve()}});context.state='running';return Promise.resolve();},close(){context.state='closed';return Promise.resolve();}};
 const player=new HeartbeatPlayer({createAudio:()=>context,vibrate:vibrate?pattern=>{vibrations.push(pattern);return true}:undefined,visible:()=>visible,setTimer(fn){timers.set(++count,fn);return count},clearTimer(id){timers.delete(id)},status:s=>statuses.push(s),error:e=>errors.push(e),pulse(){}});
 return{player,context,timers,vibrations,statuses,errors,sources,hide(){visible=false},release:()=>release(),tick(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn()}};
}
test('one audible double pulse loop, short haptics, complete stop and no duplicate timer',async()=>{
 const f=setup();f.player.configure({sound:true,vibration:true,volume:30});assert.equal(f.timers.size,0);
 assert.equal(await f.player.start(),true);assert.equal(f.sources.length,4);assert.deepEqual(f.vibrations.at(-1),GENTLE_PULSE);assert.equal(f.timers.size,1);
 await f.player.start();assert.equal(f.timers.size,1);assert.ok(f.sources.slice(0,4).every(s=>s.stopped));
 f.player.stop();assert.equal(f.timers.size,0);assert.equal(f.vibrations.at(-1),0);assert.ok(f.sources.every(s=>s.stopped));assert.equal(f.statuses.at(-1),'idle');
});
test('pending audio resume cannot restart after stopping or changing screen',async()=>{
 const f=setup({deferred:true});const start=f.player.start();f.player.stop();f.release();assert.equal(await start,false);assert.equal(f.sources.length,0);assert.equal(f.timers.size,0);
 const old=f.player.token;f.player.stop();assert.equal(await f.player.start(old),false);
});
test('unsupported vibration still permits audio and audio rejection leaves no loop',async()=>{
 const f=setup({vibrate:false});f.player.configure({sound:true,vibration:true,volume:20});assert.equal(await f.player.start(),true);assert.equal(f.vibrations.length,0);f.player.dispose();
 const failed=setup({reject:true});assert.equal(await failed.player.start(),false);assert.equal(failed.timers.size,0);assert.equal(failed.statuses.at(-1),'idle');assert.ok(failed.errors.includes('audio'));
});
test('visibility loss stops the next pulse and silent zero volume leaves no running loop',async()=>{
 const f=setup();await f.player.start();const count=f.sources.length;f.hide();f.tick();assert.equal(f.timers.size,0);assert.equal(f.sources.length,count);assert.equal(f.statuses.at(-1),'idle');
 const silent=setup();await silent.player.start();silent.player.configure({sound:true,vibration:false,volume:0});assert.equal(silent.timers.size,0);assert.equal(silent.statuses.at(-1),'idle');
});
test('preview pulse emits one double thump without a loop and is cancelled on stop',async()=>{
 const f=setup();f.player.configure({sound:true,vibration:true,volume:30});await f.player.prepare();
 f.player.previewPulse(.5);assert.equal(f.sources.length,4);assert.equal(f.timers.size,0);assert.deepEqual(f.vibrations.at(-1),[6,228,4]);
 f.player.stop();assert.equal(f.vibrations.at(-1),0);assert.ok(f.sources.every(s=>s.stopped));
 f.hide();f.player.previewPulse(1);assert.equal(f.sources.length,4);
});
