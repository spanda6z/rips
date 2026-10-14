export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type Token = { id:string; ticker:string; name:string; rarity:Rarity; color:string; icon:string; demoValue:number };
export type Pack = { id:string; name:string; subtitle:string; price:number; accent:string; odds:Record<Rarity,number>; featured?:boolean };
export type Rip = { id:string; token:Token; packName:string; openedAt:string };