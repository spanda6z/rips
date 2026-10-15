import { Award, Crown, Package, Sparkles, Star } from 'lucide-react';
import type { Rip } from '../types';

type Props = { inventory: Rip[]; history: Rip[] };

export default function Achievements({ inventory, history }: Props) {
  const rareFind = inventory.some((r) => r.token.rarity !== 'Common');
  const legendaryFind = inventory.some((r) => r.token.rarity === 'Legendary');
  const packsExplored = new Set(history.map((r) => r.packName)).size;
  const items = [
    {
      title: 'First Rip',
      description: 'Open your first demo pack',
      progress: Math.min(history.length, 1),
      goal: 1,
      icon: Package,
      unlocked: history.length >= 1,
    },
    {
      title: 'Collector',
      description: 'Collect 5 demo tokens',
      progress: Math.min(inventory.length, 5),
      goal: 5,
      icon: Award,
      unlocked: inventory.length >= 5,
    },
    {
      title: 'Rare Find',
      description: 'Pull anything above Common',
      progress: rareFind ? 1 : 0,
      goal: 1,
      icon: Star,
      unlocked: rareFind,
    },
    {
      title: 'Legendary Luck',
      description: 'Find a Legendary token',
      progress: legendaryFind ? 1 : 0,
      goal: 1,
      icon: Crown,
      unlocked: legendaryFind,
    },
    {
      title: 'Pack Explorer',
      description: 'Try all 4 demo packs',
      progress: Math.min(packsExplored, 4),
      goal: 4,
      icon: Sparkles,
      unlocked: packsExplored >= 4,
    },
  ];
  const unlocked = items.filter((item) => item.unlocked).length;

  return (
    <section className="achievements" aria-labelledby="achievements-title">
      <div className="achievement-heading">
        <div>
          <span className="eyebrow">YOUR MILESTONES</span>
          <h2 id="achievements-title">
            Achievements<span>.</span>
          </h2>
        </div>
        <small>
          {unlocked} / {items.length} UNLOCKED
        </small>
      </div>
      <div className="achievement-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              className={'achievement-card' + (item.unlocked ? ' unlocked' : '')}
              key={item.title}
            >
              <span className="achievement-icon">
                <Icon size={18} />
              </span>
              <div className="achievement-copy">
                <b>{item.title}</b>
                <p>{item.description}</p>
                <div
                  className="achievement-progress"
                  role="progressbar"
                  aria-label={item.title + ' progress'}
                  aria-valuemin={0}
                  aria-valuemax={item.goal}
                  aria-valuenow={item.progress}
                >
                  <span style={{ width: (item.progress / item.goal) * 100 + '%' }} />
                </div>
              </div>
              <span
                className="achievement-state"
                aria-label={item.unlocked ? 'Unlocked' : 'Locked'}
              >
                {item.unlocked ? '✓' : '·'}
              </span>
            </article>
          );
        })}
      </div>
      <p className="achievement-note">
        Milestones are for fun and only use your simulated demo collection.
      </p>
    </section>
  );
}
