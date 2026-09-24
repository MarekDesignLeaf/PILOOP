export const catalog = [
 { id:'DEMO-BASIC-001', tier:'Basic', cs:'Liška', en:'Fox', x:0, heartX:57, heartY:66 },
 { id:'DEMO-LIMITED-001', tier:'Limited Edition', cs:'Králíček', en:'Rabbit', x:25, heartX:53, heartY:62 },
 { id:'DEMO-GOLD-001', tier:'Gold Edition', cs:'Medvídek', en:'Bear', x:50, heartX:50, heartY:64 },
 { id:'DEMO-SIGNED-001', tier:'Signed', cs:'Koloušek', en:'Deer', x:75, heartX:49, heartY:67 },
 { id:'DEMO-ONE-001', tier:'oNe', cs:'Dráček', en:'Dragon', x:100, heartX:55, heartY:64 },
];
export type Toy = typeof catalog[number] & { name:string; awakened_at:string|null; genesis_id:string|null };
export type Memory = {id:string;toy_id:string;text:string;created_at:string};
