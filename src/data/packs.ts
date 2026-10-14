import type { Pack } from '../types';
export const packs: Pack[] = [
{id:'starter',name:'Starter Pack',subtitle:'Your first rip starts here.',price:0.05,accent:'#8b7cff',odds:{Common:65,Rare:25,Epic:8,Legendary:2}},
{id:'degen',name:'Degen Pack',subtitle:'Higher stakes. Spicier pulls.',price:0.15,accent:'#ff7cba',featured:true,odds:{Common:45,Rare:32,Epic:18,Legendary:5}},
{id:'legend',name:'Legend Pack',subtitle:'Chasing the big one.',price:0.4,accent:'#f6ca70',odds:{Common:20,Rare:35,Epic:32,Legendary:13}}
];