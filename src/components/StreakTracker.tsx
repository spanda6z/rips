import { CalendarCheck, Flame, Trophy } from 'lucide-react';
import type { Rip } from '../types';

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shiftDay(key: string, amount: number) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day + amount);
  return dayKey(date.toISOString());
}

export default function StreakTracker({ history }: { history: Rip[] }) {
  const today = dayKey(new Date().toISOString());
  const activeDays = new Set(history.map((rip) => dayKey(rip.openedAt)));
  let streak = 0;
  let cursor = activeDays.has(today) ? today : shiftDay(today, -1);
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  const sorted = [...activeDays].sort();
  for (let i = 0; i < sorted.length; i += 1) {
    run = i > 0 && sorted[i] === shiftDay(sorted[i - 1], 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const key = shiftDay(today, index - 6);
    return { key, label: new Date(key + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1), active: activeDays.has(key), isToday: key === today };
  });

  return (
    <section className="streak-panel" aria-labelledby="streak-title">
      <div className="streak-main">
        <span className="streak-icon"><Flame size={21} /></span>
        <div>
          <span className="eyebrow">KEEP THE LAB HOT</span>
          <h2 id="streak-title">{streak} day{streak === 1 ? '' : 's'} <span>in a row.</span></h2>
          <p>{activeDays.has(today) ? 'You have ripped today. Come back tomorrow to keep it going.' : streak > 0 ? 'Your streak is alive. Make a rip today to keep it going.' : 'Open a pack today to start your collector streak.'}</p>
        </div>
      </div>
      <div className="streak-week" aria-label="Activity over the last seven days">
        {recentDays.map((day) => (
          <div className={'streak-day' + (day.active ? ' active' : '') + (day.isToday ? ' today' : '')} key={day.key}>
            <span>{day.label}</span>
            <i>{day.active ? <CalendarCheck size={13} /> : <span />}</i>
          </div>
        ))}
      </div>
      <div className="streak-best"><Trophy size={14} /><span>BEST STREAK</span><strong>{longest} day{longest === 1 ? '' : 's'}</strong></div>
    </section>
  );
}
