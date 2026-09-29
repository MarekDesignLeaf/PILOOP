import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {randomUUID} from 'node:crypto';

async function bundle(path) {
 const result=await build({entryPoints:[path],bundle:true,platform:'node',format:'esm',write:false});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const {DEMO_STORAGE_KEY,freshDemo,readDemo,saveDemo,updateDemo}=await bundle('lib/demo-session.ts');
const {GET,POST}=await bundle('app/api/toys/route.ts');
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}

test('every visitor gets independent fictional hearts and original Genesis remains immutable',()=>{
 const a=storage(), b=storage();
 assert.equal(readDemo(a).toys.length,5);
 assert.equal(readDemo(b).toys[0].awakened_at,null);
 const current=readDemo(a),id=current.toys[0].id;
 assert.throws(()=>updateDemo(current,{id,action:'awaken',key:'wrong',confirmed:true}),/key/);
 assert.throws(()=>updateDemo(current,{id,action:'awaken',key:'PILOOP-DEMO',confirmed:false}),/key/);
 const first=updateDemo(current,{id,action:'awaken',key:'PILOOP-DEMO',confirmed:true},'2026-09-29T00:00:00.000Z',randomUUID());
 assert.ok(first.toys[0].genesis_id);saveDemo(a,first);
 const repeat=updateDemo(readDemo(a),{id,action:'awaken',key:'PILOOP-DEMO',confirmed:true},'2026-09-29T00:00:11.000Z',randomUUID());
 assert.equal(repeat.toys[0].genesis_id,first.toys[0].genesis_id);
 assert.equal(repeat.toys[0].awakened_at,first.toys[0].awakened_at);
 assert.equal(readDemo(b).toys[0].awakened_at,null);
 const saved=updateDemo(first,{id,action:'name',name:'Sample Fox'}); saveDemo(a,saved);
 assert.equal(readDemo(a).toys[0].name,'Sample Fox'); assert.equal(readDemo(b).toys[0].name,'');
 const memoryId=randomUUID(), message=updateDemo(saved,{id,action:'memory',text:'A fictional memory',requestId:memoryId});
 const duplicate=updateDemo(message,{id,action:'memory',text:'A fictional memory',requestId:memoryId});
 assert.equal(duplicate.memories.length,1);
 a.removeItem(DEMO_STORAGE_KEY);assert.equal(readDemo(a).toys[0].genesis_id,null);
});
test('shared legacy database endpoint cannot expose or alter visitor histories',async()=>{
 const seed=await(await GET()).json();
 assert.equal(seed.toys.length,5);assert.ok(seed.toys.every(x=>x.awakened_at===null));
 assert.equal(seed.memories.length,0);
 assert.equal((await POST()).status,403);
});
test('visual instructions include NFC approach, fictional activation card and automatic key dialog',()=>{
 const guide=readFileSync('app/activation-guide.tsx','utf8'), app=readFileSync('app/piloop.tsx','utf8');
 for(const step of ['Switch on NFC','Approach the PILOOP','Automatic popup','Enter the card key','Confirm the first beat'])assert.ok(guide.includes(step),step);
 assert.ok(guide.includes('/assets/characters/DEMO-BASIC-001.png'));
 assert.ok(guide.includes('PILOOP-DEMO'));
 assert.match(app,/setTimeout\(\(\)=>\{setScan\('detected'\);setStep\(1\);setKey\(''\);setAgree\(false\);setError\(''\);setDialog\(true\)/);
 assert.ok(app.includes('<ActivationGuide onCapture={simulateDetection}'));
 assert.ok(app.includes('restartDemo'));
});
test('Living Heart opens independently from main PILOOP and never inherits OpenCrochet account',()=>{
 const app=readFileSync('app/piloop.tsx','utf8');
 assert.equal((app.match(/href="https:\/\/piloop\.co\.uk\/#living-heart" target="_top"/g)||[]).length,2);
 assert.match(app,/aria-label="Back to the main PILOOP website"/);
 assert.ok(!app.includes('fetch(\'/api/toys\''));
 assert.ok(app.includes('readDemo(window.localStorage)'));
});
