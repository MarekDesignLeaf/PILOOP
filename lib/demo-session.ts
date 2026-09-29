import { catalog, type Toy, type Memory } from './catalog';
export const DEMO_STORAGE_KEY = 'piloop.awaken-heart.visitor.v3';
export type DemoState = { toys: Toy[]; memories: Memory[]; serverTime: string };
export type DemoAction = { id: string; action: string; key?: string; confirmed?: boolean; name?: string; text?: string; requestId?: string };
export function freshDemo(time = new Date().toISOString()): DemoState {
  return { toys: catalog.map(t => ({...t, name:'', awakened_at:null, genesis_id:null})), memories:[], serverTime:time };
}
export function readDemo(store: Pick<Storage,'getItem'> | null, time = new Date().toISOString()): DemoState {
  if (!store) return freshDemo(time);
  try {
    const raw = store.getItem(DEMO_STORAGE_KEY);
    if (!raw) return freshDemo(time);
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 3 || !Array.isArray(parsed.toys) || !Array.isArray(parsed.memories)) return freshDemo(time);
    const toys = catalog.map(t => {
      const previous = parsed.toys.find((x:Toy) => x?.id === t.id);
      const born = previous?.awakened_at && Number.isFinite(Date.parse(previous.awakened_at)) ? previous.awakened_at : null;
      return {...t, name: typeof previous?.name === 'string' ? previous.name.slice(0,40) : '',
        awakened_at: born, genesis_id: born && typeof previous?.genesis_id === 'string' ? previous.genesis_id : null};
    });
    const memories = parsed.memories.filter((m:Memory) => m && catalog.some(t=>t.id===m.toy_id) && typeof m.id==='string' && typeof m.text==='string' && typeof m.created_at==='string').slice(0,500);
    return {toys, memories, serverTime:time};
  } catch { return freshDemo(time); }
}
export function saveDemo(store: Pick<Storage,'setItem'>, state: DemoState) {
  store.setItem(DEMO_STORAGE_KEY, JSON.stringify({version:3,toys:state.toys,memories:state.memories}));
}
export function updateDemo(state: DemoState, body: DemoAction, when = new Date().toISOString(), unique = crypto.randomUUID()): DemoState {
  if (!catalog.some(t => t.id === body.id)) throw new Error('invalid');
  const current = state.toys.find(t => t.id === body.id)!;
  let toys = state.toys;
  let memories = state.memories;
  if (body.action === 'awaken') {
    if (body.key !== 'PILOOP-DEMO' || body.confirmed !== true) throw new Error('key');
    // A first Genesis is immutable within this visitor's fictional sample collection.
    if (!current.awakened_at) toys = toys.map(t => t.id === body.id ? {...t, awakened_at:when, genesis_id:unique} : t);
  } else if (body.action === 'name') {
    if (typeof body.name !== 'string' || body.name.trim().length > 40) throw new Error('invalid');
    toys = toys.map(t => t.id === body.id ? {...t, name:body.name!.trim()} : t);
  } else if (body.action === 'memory') {
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.trim().length > 2000 || !body.requestId || !/^[a-f0-9-]{36}$/i.test(body.requestId)) throw new Error('invalid');
    if (!memories.some(m => m.id === body.requestId)) memories = [{id:body.requestId, toy_id:body.id, text:body.text.trim(), created_at:when}, ...memories].slice(0,500);
  } else throw new Error('invalid');
  return {toys, memories, serverTime:when};
}
