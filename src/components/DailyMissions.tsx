import {CheckCircle2,Flame,Layers3,Sparkles,Target} from 'lucide-react';
import type {Rip} from '../types';

function sameLocalDay(value:string, today:Date){return new Date(value).toDateString()===today.toDateString()}

export default function DailyMissions({inventory,history}:{inventory:Rip[];history:Rip[]}){
  const today=new Date();
  const openedToday=history.filter(r=>sameLocalDay(r.openedAt,today)).length;
  const rareToday=inventory.filter(r=>sameLocalDay(r.openedAt,today)&&['Rare','Epic','Legendary'].includes(r.token.rarity)).length;
  const missions=[
    {title:'Break the seal',description:'Open your first pack today.',progress:openedToday,target:1,icon:Flame},
    {title:'Hunt for heat',description:'Pull a Rare, Epic, or Legendary today.',progress:rareToday,target:1,icon:Sparkles},
    {title:'Build the vault',description:'Collect 5 rips in total.',progress:inventory.length,target:5,icon:Layers3},
  ];
  const completed=missions.filter(m=>m.progress>=m.target).length;
  return <section className="missions-panel" aria-labelledby="missions-title">
    <div className="missions-heading">
      <div><span className="eyebrow"><Target size={12}/> THE DAILY LAB BRIEF</span><h2 id="missions-title">Today's missions<span>.</span></h2><p>Small goals. Big collector energy.</p></div>
      <div className="missions-count"><strong>{completed}<span>/{missions.length}</span></strong><small>COMPLETED</small></div>
    </div>
    <div className="missions-grid">
      {missions.map((mission,index)=>{
        const Icon=mission.icon;
        const done=mission.progress>=mission.target;
        const progress=Math.min(mission.progress,mission.target);
        return <article className={'mission-card'+(done?' mission-done':'')} key={mission.title}>
          <div className="mission-card-top"><span className="mission-icon"><Icon size={17}/></span><span className="mission-number">MISSION 0{index+1}</span>{done&&<CheckCircle2 className="mission-check" size={16}/>}</div>
          <h3>{mission.title}</h3><p>{mission.description}</p>
          <div className="mission-progress-label"><span>{done?'COMPLETE':'PROGRESS'}</span><strong>{progress}/{mission.target}</strong></div>
          <div className="mission-track" role="progressbar" aria-label={mission.title} aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={progress}><span style={{width:(progress/mission.target*100)+'%'}}/></div>
        </article>;
      })}
    </div>
    <p className="missions-footnote">Progress updates from your collection and pack history. No extra purchase is required to track these goals.</p>
  </section>;
}
