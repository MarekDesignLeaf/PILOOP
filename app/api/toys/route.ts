import { database } from '@/lib/store';
import { catalog } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
const response = (value:unknown, status=200) => Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function collection() {
 const db=database();
 await db.batch(catalog.map(t=>db.prepare('INSERT OR IGNORE INTO piloop_toys (id, name) VALUES (?, ?)').bind(t.id,'')));
 const [toys,memories]=await Promise.all([db.prepare('SELECT * FROM piloop_toys').all(),db.prepare('SELECT * FROM piloop_memories ORDER BY created_at DESC LIMIT 500').all()]);
 return {toys:catalog.map(t=>({...t,...toys.results.find(r=>r.id===t.id)})),memories:memories.results,serverTime:new Date().toISOString()};
}
export async function GET() {
 try {return response(await collection());} catch(e){console.error('PILOOP load failed',e);return response({error:'unavailable'},503);}
}
export async function POST(request:Request) {
 if (request.headers.get('origin') !== new URL(request.url).origin) return response({error:'origin'},403);
 if (!request.headers.get('content-type')?.includes('application/json')) return response({error:'invalid'},415);
 try {
  const raw=await request.text(); if(raw.length>8000)return response({error:'invalid'},413);
  const body=JSON.parse(raw); const {id,action}=body;
  if(!catalog.some(t=>t.id===id))return response({error:'invalid'},400);
  const db=database();
  const exists=await db.prepare('SELECT id FROM piloop_toys WHERE id = ?').bind(id).first();
  if(!exists)return response({error:'unavailable'},409);
  if(action==='awaken') {
   if(body.confirmed!==true || body.key!=='PILOOP-DEMO')return response({error:'key'},400);
   // Atomic compare-and-set. Retrying a committed awakening preserves its original Genesis.
   await db.prepare('UPDATE piloop_toys SET awakened_at = ?, genesis_id = ? WHERE id = ? AND awakened_at IS NULL').bind(new Date().toISOString(),crypto.randomUUID(),id).run();
  } else if(action==='name') {
   if(typeof body.name!=='string'||body.name.trim().length>40)return response({error:'invalid'},400);
   await db.prepare('UPDATE piloop_toys SET name = ? WHERE id = ?').bind(body.name.trim(),id).run();
  } else if(action==='memory') {
   if(typeof body.text!=='string'||!body.text.trim()||body.text.trim().length>2000||typeof body.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(body.requestId))return response({error:'invalid'},400);
   await db.prepare('INSERT OR IGNORE INTO piloop_memories (id,toy_id,text,created_at) VALUES (?,?,?,?)').bind(body.requestId,id,body.text.trim(),new Date().toISOString()).run();
  } else return response({error:'invalid'},400);
  return response(await collection());
 }catch(e){console.error('PILOOP save failed',e);return response({error:'unavailable'},503);}
}
