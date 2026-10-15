import { useEffect, useState } from 'react';
import { loadLeaderboard, type LeaderboardEntry } from '../lib/leaderboard';

type Props = {
  rips: number;
  value: number;
  signedIn: boolean;
};

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="page-title">
      <span className="eyebrow">YOUR WORKSPACE</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </section>
  );
}

export default function LeaderboardPage({ rips, value, signedIn }: Props) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [source, setSource] = useState<'live' | 'demo'>('demo');

  useEffect(() => {
    let active = true;
    const name = signedIn ? 'You' : 'You (local)';
    loadLeaderboard({ name, rips, value }).then((r) => {
      if (!active) return;
      setBoard(r.entries);
      setSource(r.source);
    });
    return () => {
      active = false;
    };
  }, [rips, value, signedIn]);

  return (
    <>
      <PageTitle
        title="Leaderboard."
        subtitle={
          source === 'live'
            ? 'Wallet-session collection ranks (simulated value only).'
            : 'Demo board with sample collectors — live ranks appear after the leaderboard migration is applied.'
        }
      />
      <p className="muted-copy">
        {source === 'live'
          ? 'Live demo aggregates · no real money.'
          : 'Sample demo data · live wallet rankings are not enabled yet.'}
      </p>
      <div className="leaderboard">
        {(board.length ? board : [{ rank: 1, name: '—', rips: 0, value: 0 }]).map((x) => (
          <div
            className={'leader' + (x.isYou ? ' you' : '')}
            style={
              x.isYou
                ? { outline: '1px solid rgba(139,124,255,0.55)', background: 'rgba(139,124,255,0.12)' }
                : undefined
            }
            key={x.name + x.rank}
          >
            <b className="rank">#{x.rank}</b>
            <span className="avatar">{x.name.slice(0, 1)}</span>
            <div>
              <b>
                {x.name}
                {x.isYou ? ' (you)' : ''}
              </b>
              <small>{x.rips} rips</small>
            </div>
            <strong>◎ {Number(x.value).toFixed(2)}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
