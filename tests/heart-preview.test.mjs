import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['lib/heart-preview.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {HeartPreview}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
function setup(){
 const timers=new Map(),frames=[],pulses=[],delays=[];let id=0,silences=0;
 const preview=new HeartPreview({frame:f=>frames.push(f),pulse:s=>pulses.push(s),silence:()=>silences++,setTimer:(fn,delay)=>{timers.set(++id,fn);delays.push(delay);return id},clearTimer:id=>timers.delete(id)});
 return{preview,timers,frames,pulses,delays,get silences(){return silences},tick(){const [id,fn]=timers.entries().next().value;timers.delete(id);fn()}};
}
test('ending slows and fades to completely grey, silent and timer-free state',()=>{
 const f=setup();f.preview.start();f.tick();assert.deepEqual(f.pulses,[1,1]);assert.equal(f.timers.size,1);
 f.preview.finish();f.preview.finish();assert.equal(f.timers.size,1);
 for(let i=0;i<4;i++)f.tick();
 assert.equal(f.timers.size,0);assert.equal(f.frames.at(-1).state,'ended');assert.equal(f.frames.at(-1).grey,1);assert.equal(f.frames.at(-1).strength,0);
 assert.deepEqual(f.pulses.slice(2),[.85,.6,.35,.12]);assert.deepEqual(f.delays.slice(2),[1500,1900,2400,2800]);assert.equal(f.silences,3);
});
test('cancellation, repeated starts and leaving dispose all pending preview work',()=>{
 const f=setup();f.preview.start();f.preview.start();assert.equal(f.timers.size,1);
 f.preview.finish();f.preview.cancel();assert.equal(f.timers.size,0);assert.equal(f.frames.at(-1).state,'ready');
 f.preview.finish();assert.equal(f.timers.size,0);
 f.preview.start();f.preview.dispose();assert.equal(f.timers.size,0);
});
test('replay is a fresh preview after a terminal grey state',()=>{
 const f=setup();f.preview.start();f.preview.finish();for(let i=0;i<4;i++)f.tick();
 f.preview.start();assert.equal(f.frames.at(-1).grey,0);assert.equal(f.frames.at(-1).state,'living');assert.equal(f.timers.size,1);f.preview.dispose();
});
