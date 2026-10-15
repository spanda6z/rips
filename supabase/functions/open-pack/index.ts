// RIPS LAB — Phase 3: server-authoritative pack open
// Deploy: supabase functions deploy open-pack
// JWT is validated inside via supabase.auth.getUser
// Never put the service-role key in VITE_* or browser code.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
type Token = {
  id: string;
  ticker: string;
  name: string;
  rarity: Rarity;
  color: string;
  icon: string;
  demoValue: number;
};
type PackOdds = Record<Rarity, number>;
type PackRow = {
  id: string;
  name: string;
  subtitle: string;
  demo_price: number;
  accent: string;
  odds: PackOdds;
  featured?: boolean;
  enabled?: boolean;
};

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];
const MIN_OPEN_INTERVAL_MS = 800;
const MAX_ACTIVITY = 200;

const DEFAULT_TOKENS: Token[] = [
  { id: 'sol', ticker: 'SOL', name: 'Solana', rarity: 'Common', color: '#7c6cff', icon: '◎', demoValue: 0.12 },
  { id: 'bonk', ticker: 'BONK', name: 'Bonk', rarity: 'Common', color: '#f5a623', icon: '🐕', demoValue: 0.08 },
  { id: 'usdc', ticker: 'USDC', name: 'USD Coin', rarity: 'Common', color: '#2775ca', icon: '$', demoValue: 0.05 },
  { id: 'mngo', ticker: 'MNGO', name: 'Mango', rarity: 'Common', color: '#f2c94c', icon: '🥭', demoValue: 0.09 },
  { id: 'wif', ticker: 'WIF', name: 'dogwifhat', rarity: 'Rare', color: '#d58cff', icon: '🐶', demoValue: 0.28 },
  { id: 'jup', ticker: 'JUP', name: 'Jupiter', rarity: 'Rare', color: '#c5f467', icon: '🪐', demoValue: 0.36 },
  { id: 'orca', ticker: 'ORCA', name: 'Orca', rarity: 'Rare', color: '#00d1c1', icon: '🐋', demoValue: 0.31 },
  { id: 'render', ticker: 'RENDER', name: 'Render', rarity: 'Rare', color: '#6c5ce7', icon: '🖥', demoValue: 0.42 },
  { id: 'pyth', ticker: 'PYTH', name: 'Pyth Network', rarity: 'Epic', color: '#8ce7ff', icon: '✦', demoValue: 0.75 },
  { id: 'ray', ticker: 'RAY', name: 'Raydium', rarity: 'Epic', color: '#ff7cba', icon: '☼', demoValue: 0.92 },
  { id: 'jito', ticker: 'JITO', name: 'Jito', rarity: 'Epic', color: '#00ffa3', icon: '⚡', demoValue: 1.15 },
  { id: 'tensor', ticker: 'TNSR', name: 'Tensor', rarity: 'Epic', color: '#a78bfa', icon: '📦', demoValue: 0.88 },
  { id: 'mythic', ticker: 'MYTH', name: 'Mythic Drop', rarity: 'Legendary', color: '#ffe07a', icon: '✹', demoValue: 2.5 },
  { id: 'genesis', ticker: 'GEN', name: 'Genesis Relic', rarity: 'Legendary', color: '#ff9c6e', icon: '◈', demoValue: 4.2 },
  { id: 'alpha', ticker: 'ALPHA', name: 'Alpha Core', rarity: 'Legendary', color: '#ff6b6b', icon: '▲', demoValue: 3.8 },
];

const DEFAULT_PACKS: PackRow[] = [
  { id: 'starter', name: 'Starter Pack', subtitle: 'Your first rip starts here.', demo_price: 0.05, accent: '#8b7cff', odds: { Common: 65, Rare: 25, Epic: 8, Legendary: 2 } },
  { id: 'degen', name: 'Degen Pack', subtitle: 'Higher stakes. Spicier pulls.', demo_price: 0.15, accent: '#ff7cba', odds: { Common: 45, Rare: 32, Epic: 18, Legendary: 5 }, featured: true },
  { id: 'legend', name: 'Legend Pack', subtitle: 'Chasing the big one.', demo_price: 0.4, accent: '#f6ca70', odds: { Common: 20, Rare: 35, Epic: 32, Legendary: 13 } },
  { id: 'alpha', name: 'Alpha Pack', subtitle: 'For the true collectors.', demo_price: 0.75, accent: '#ff6b6b', odds: { Common: 10, Rare: 30, Epic: 40, Legendary: 20 } },
];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validateOdds(odds: PackOdds): string | null {
  const values = RARITY_ORDER.map((r) => odds[r]);
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return 'invalid rarity odds';
  const total = values.reduce((s, v) => s + v, 0);
  if (Math.abs(total - 100) > 0.0001) return `odds must add up to 100% (got ${total})`;
  return null;
}

function chooseReward(odds: PackOdds, tokens: Token[]): Token {
  const err = validateOdds(odds);
  if (err) throw new Error(err);
  const roll = Math.random() * 100;
  let cumulative = 0;
  let rarity: Rarity = 'Common';
  for (const r of RARITY_ORDER) {
    cumulative += odds[r];
    if (roll < cumulative) {
      rarity = r;
      break;
    }
  }
  const pool = tokens.filter((t) => t.rarity === rarity);
  if (!pool.length) throw new Error(`No tokens configured for ${rarity}`);
  return pool[Math.floor(Math.random() * pool.length)];
}

function createRipId(): string {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(401, { error: 'Missing authorization' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    if (!supabaseUrl || !anonKey) {
      return json(500, { error: 'Server misconfigured' });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json(401, { error: 'Unauthorized' });

    const body = await req.json().catch(() => ({}));
    const packId = typeof body.packId === 'string' ? body.packId.trim() : '';
    if (!packId) return json(400, { error: 'packId required' });

    let pack: PackRow | null = null;
    const { data: catalogRow, error: catalogError } = await supabase
      .from('pack_catalog')
      .select('id,name,subtitle,demo_price,accent,odds,featured,enabled')
      .eq('id', packId)
      .eq('enabled', true)
      .maybeSingle();

    if (!catalogError && catalogRow) {
      pack = catalogRow as PackRow;
    } else {
      pack = DEFAULT_PACKS.find((p) => p.id === packId) ?? null;
    }
    if (!pack) return json(404, { error: 'Pack not found or disabled' });

    const price = Number(pack.demo_price);
    if (!Number.isFinite(price) || price < 0) {
      return json(400, { error: 'Invalid pack price' });
    }
    const oddsErr = validateOdds(pack.odds as PackOdds);
    if (oddsErr) return json(400, { error: oddsErr });

    let { data: collection, error: colError } = await supabase
      .from('user_collections')
      .select('id,user_id,demo_balance,items,activity')
      .eq('user_id', user.id)
      .maybeSingle();

    if (colError) {
      console.error('collection read', colError);
      return json(500, { error: 'Could not read collection' });
    }

    if (!collection) {
      const { data: created, error: createError } = await supabase
        .from('user_collections')
        .insert({ user_id: user.id })
        .select('id,user_id,demo_balance,items,activity')
        .single();
      if (createError || !created) {
        console.error('collection create', createError);
        return json(500, { error: 'Could not create collection' });
      }
      collection = created;
    }

    const balance = Number(collection.demo_balance);
    if (!Number.isFinite(balance) || balance < price) {
      return json(402, {
        error: 'Not enough demo SOL',
        balance: Number.isFinite(balance) ? balance : 0,
        price,
      });
    }

    const activity = Array.isArray(collection.activity) ? collection.activity : [];
    if (activity.length > 0) {
      const last = activity[0];
      const lastAt =
        last && typeof last === 'object' && typeof (last as { openedAt?: string }).openedAt === 'string'
          ? Date.parse((last as { openedAt: string }).openedAt)
          : NaN;
      if (Number.isFinite(lastAt) && Date.now() - lastAt < MIN_OPEN_INTERVAL_MS) {
        return json(429, {
          error: 'Too many opens. Wait a moment and try again.',
          retryAfterMs: MIN_OPEN_INTERVAL_MS - (Date.now() - lastAt),
        });
      }
    }

    const token = chooseReward(pack.odds as PackOdds, DEFAULT_TOKENS);
    const rip = {
      id: createRipId(),
      token,
      packName: pack.name,
      openedAt: new Date().toISOString(),
    };

    const newBalance = Number(Math.max(0, balance - price).toFixed(4));
    const items = Array.isArray(collection.items) ? collection.items : [];
    const nextItems = [rip, ...items];
    const nextActivity = [rip, ...activity].slice(0, MAX_ACTIVITY);

    const { data: updated, error: updateError } = await supabase
      .from('user_collections')
      .update({
        demo_balance: newBalance,
        items: nextItems,
        activity: nextActivity,
      })
      .eq('user_id', user.id)
      .eq('demo_balance', collection.demo_balance)
      .select('demo_balance,items,activity')
      .maybeSingle();

    if (updateError) {
      console.error('collection update', updateError);
      return json(500, { error: 'Could not update collection' });
    }
    if (!updated) {
      return json(409, { error: 'Collection changed. Retry the open.' });
    }

    return json(200, {
      ok: true,
      rip,
      balance: Number(updated.demo_balance),
      inventoryCount: Array.isArray(updated.items) ? updated.items.length : nextItems.length,
    });
  } catch (err) {
    console.error('open-pack', err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
