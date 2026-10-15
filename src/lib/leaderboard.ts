import { supabase } from './supabaseClient';

export type LeaderboardEntry = {
  rank: number;
  name: string;
  rips: number;
  value: number;
  isYou?: boolean;
};

const FICTIONAL: LeaderboardEntry[] = [
  { rank: 1, name: 'SolSurfer', rips: 28, value: 12.4 },
  { rank: 2, name: 'PixelDegen', rips: 21, value: 9.85 },
  { rank: 3, name: 'MoonScout', rips: 13, value: 4.12 },
  { rank: 4, name: 'LilBagholder', rips: 8, value: 2.6 },
  { rank: 5, name: 'PackRat', rips: 5, value: 1.1 },
];

/**
 * Load demo leaderboard. Prefers server aggregates when available;
 * always merges the current user and falls back to fictional rows.
 */
export async function loadLeaderboard(you?: {
  name: string;
  rips: number;
  value: number;
}): Promise<{ entries: LeaderboardEntry[]; source: 'live' | 'demo' }> {
  let live: LeaderboardEntry[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('demo_leaderboard', { limit_n: 10 });
      if (!error && Array.isArray(data) && data.length > 0) {
        live = data.map((row: Record<string, unknown>, i: number) => ({
          rank: typeof row.rank === 'number' ? row.rank : i + 1,
          name: typeof row.display_name === 'string' && row.display_name ? row.display_name : 'Ripper',
          rips: typeof row.rips_count === 'number' ? row.rips_count : Number(row.rips_count) || 0,
          value: typeof row.demo_value === 'number' ? row.demo_value : Number(row.demo_value) || 0,
        }));
      }
    } catch {
      // Fall through to fictional board.
    }
  }

  const base = live.length ? live : FICTIONAL.map((e) => ({ ...e }));
  const source = live.length ? 'live' : 'demo';

  if (you && (you.rips > 0 || you.value > 0)) {
    const withoutYou = base.filter(
      (e) => e.name.toLowerCase() !== you.name.toLowerCase() || e.isYou,
    );
    const merged = [
      ...withoutYou,
      { rank: 0, name: you.name, rips: you.rips, value: you.value, isYou: true },
    ]
      .sort((a, b) => b.value - a.value || b.rips - a.rips)
      .slice(0, 10)
      .map((e, i) => ({ ...e, rank: i + 1 }));
    return { entries: merged, source };
  }

  return {
    entries: base.map((e, i) => ({ ...e, rank: i + 1 })),
    source,
  };
}
