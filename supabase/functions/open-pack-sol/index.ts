// RIPS — verify on-chain SOL payment, then open pack (server roll + inventory).
// Deploy: supabase functions deploy open-pack-sol
// Secrets: SOLANA_RPC_URL, TREASURY_WALLET (same pubkey as VITE_TREASURY_WALLET)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from 'https://esm.sh/@solana/web3.js@1.98.4';

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

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];
const MAX_ACTIVITY = 200;

const PACK_PRICE_SOL: Record<string, number> = {
  starter: 0.05,
  degen: 0.15,
  legend: 0.4,
  alpha: 0.75,
};

const DEFAULT_TOKENS: Token[] = [
  { id: 'sol', ticker: 'SOL', name: 'Solana', rarity: 'Common', color: '#7c6cff', icon: '◎', demoValue: 0.12 },
  { id: 'bonk', ticker: 'BONK', name: 'Bonk', rarity: 'Common', color: '#f5a623', icon: '🐕', demoValue: 0.08 },
  { id: 'usdc', ticker: 'USDC', name: 'USD Coin', rarity: 'Common', color: '#2775ca', icon: '$', demoValue: 0.05 },
  { id: 'mngo', ticker: 'MNGO', name: 'Mango', rarity: 'Common', color: '#f2c94c', icon: '🥭', demoValue: 0.09 },
  { id: 'wif', ticker: 'WIF', name: 'dogwifhat', rarity: 'Rare', color: '#d58cff', icon: '🐶', demoValue: 0.28 },
  { id: 'jup', ticker: 'JUP', name: 'Jupiter', rarity: 'Rare', color: '#c5f467', icon: '🚀', demoValue: 0.36 },
  { id: 'orca', ticker: 'ORCA', name: 'Orca', rarity: 'Rare', color: '#00d1c1', icon: '🐋', demoValue: 0.31 },
  { id: 'render', ticker: 'RENDER', name: 'Render', rarity: 'Rare', color: '#6c5ce7', icon: '🖥', demoValue: 0.42 },
  { id: 'pyth', ticker: 'PYTH', name: 'Pyth Network', rarity: 'Epic', color: '#8ce7ff', icon: '✦', demoValue: 0.75 },
  { id: 'ray', ticker: 'RAY', name: 'Raydium', rarity: 'Epic', color: '#ff7cba', icon: '☉', demoValue: 0.92 },
  { id: 'jito', ticker: 'JITO', name: 'Jito', rarity: 'Epic', color: '#00ffa3', icon: '⚡', demoValue: 1.15 },
  { id: 'tensor', ticker: 'TNSR', name: 'Tensor', rarity: 'Epic', color: '#a78bfa', icon: '📦', demoValue: 0.88 },
  { id: 'mythic', ticker: 'MYTH', name: 'Mythic Drop', rarity: 'Legendary', color: '#ffe07a', icon: '✹', demoValue: 2.5 },
  { id: 'genesis', ticker: 'GEN', name: 'Genesis Relic', rarity: 'Legendary', color: '#ff9c6e', icon: '◈', demoValue: 4.2 },
  { id: 'alpha', ticker: 'ALPHA', name: 'Alpha Core', rarity: 'Legendary', color: '#ff6b6b', icon: '▲', demoValue: 3.8 },
];

const DEFAULT_PACKS: Record<string, { name: string; odds: PackOdds }> = {
  starter: { name: 'Starter Pack', odds: { Common: 65, Rare: 25, Epic: 8, Legendary: 2 } },
  degen: { name: 'Degen Pack', odds: { Common: 45, Rare: 32, Epic: 18, Legendary: 5 } },
  legend: { name: 'Legend Pack', odds: { Common: 20, Rare: 35, Epic: 32, Legendary: 13 } },
  alpha: { name: 'Alpha Pack', odds: { Common: 10, Rare: 30, Epic: 40, Legendary: 20 } },
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function chooseReward(odds: PackOdds): Token {
  const roll = Math.random() * 100;
  let cumulative = 0;
  let rarity: Rarity = 'Common';
  for (const r of RARITY_ORDER) {
    cumulative += odds[r] ?? 0;
    if (roll < cumulative) {
      rarity = r;
      break;
    }
  }
  const pool = DEFAULT_TOKENS.filter((t) => t.rarity === rarity);
  if (!pool.length) throw new Error(`No tokens for ${rarity}`);
  return pool[Math.floor(Math.random() * pool.length)];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(401, { error: 'Missing authorization' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const rpc = Deno.env.get('SOLANA_RPC_URL') ?? '';
    const treasuryStr = Deno.env.get('TREASURY_WALLET') ?? '';
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !rpc || !treasuryStr) {
      return json(500, { error: 'Server misconfigured. Set Supabase keys, SOLANA_RPC_URL (mainnet), and TREASURY_WALLET.' });
    }
    let treasury: PublicKey;
    try {
      treasury = new PublicKey(treasuryStr);
    } catch {
      return json(500, { error: 'Invalid TREASURY_WALLET' });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json(401, { error: 'Unauthorized' });

    const body = await req.json().catch(() => ({}));
    const packId = typeof body.packId === 'string' ? body.packId.trim() : '';
    const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
    const buyerStr = typeof body.buyer === 'string' ? body.buyer.trim() : '';
    if (!packId || !signature || !buyerStr) {
      return json(400, { error: 'packId, signature, and buyer required' });
    }

    const pack = DEFAULT_PACKS[packId];
    const priceSol = PACK_PRICE_SOL[packId];
    if (!pack || !priceSol) return json(404, { error: 'Unknown pack' });

    let buyer: PublicKey;
    try {
      buyer = new PublicKey(buyerStr);
    } catch {
      return json(400, { error: 'Invalid buyer pubkey' });
    }

    const { data: existingPay } = await supabase
      .from('pack_payments')
      .select('id')
      .eq('signature', signature)
      .maybeSingle();
    if (existingPay) {
      return json(409, { error: 'Payment signature already used' });
    }

    const connection = new Connection(rpc, 'confirmed');
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (!tx || !tx.meta || tx.meta.err) {
      return json(402, { error: 'Transaction not found or failed on-chain' });
    }

    const pre = tx.meta.preBalances;
    const post = tx.meta.postBalances;
    const message = tx.transaction.message;
    const messageKeys =
      typeof message.getAccountKeys === 'function'
        ? message.getAccountKeys({ accountKeysFromLookups: tx.meta.loadedAddresses })
        : null;
    const keyStrs = messageKeys
      ? Array.from({ length: pre.length }, (_, i) => {
          const key = messageKeys.get(i);
          return key ? key.toBase58() : '';
        })
      : ((message as { accountKeys?: PublicKey[] }).accountKeys ?? []).map((k: PublicKey) => k.toBase58());

    const buyerAddress = buyer.toBase58();
    const buyerIdx = keyStrs.indexOf(buyerAddress);
    const treasuryIdx = keyStrs.indexOf(treasury.toBase58());
    // The buyer must be the transaction fee payer, not merely an account mentioned by someone else's payment.
    if (buyerIdx !== 0 || treasuryIdx < 0) {
      return json(402, { error: 'Payment must be signed and paid by the connected buyer to the treasury' });
    }
    const received =
      (pre[treasuryIdx] ?? 0) < (post[treasuryIdx] ?? 0)
        ? post[treasuryIdx] - pre[treasuryIdx]
        : 0;
    const minLamports = Math.round(priceSol * LAMPORTS_PER_SOL * 0.99);
    if (received < minLamports) {
      return json(402, {
        error: 'Insufficient SOL transferred to treasury',
        received,
        required: minLamports,
      });
    }

    const logs = tx.meta.logMessages ?? [];
    const expectedMemo = `rips:v1:${packId}:${buyerAddress}`;
    const memoOk = logs.some((line: string) => line.includes(expectedMemo));
    if (!memoOk) {
      return json(402, { error: 'Payment memo does not match this buyer and pack' });
    }

    const token = chooseReward(pack.odds);
    const rip = {
      id: crypto.randomUUID(),
      token,
      packName: pack.name,
      openedAt: new Date().toISOString(),
      paymentSignature: signature,
      buyer: buyer.toBase58(),
    };

    // A privileged RPC atomically claims the unique signature and updates inventory.
    const { data: redemption, error: redemptionError } = await admin.rpc('redeem_pack_payment', {
      p_user_id: user.id,
      p_signature: signature,
      p_pack_id: packId,
      p_buyer: buyerAddress,
      p_lamports: received,
      p_rip: rip,
      p_max_activity: MAX_ACTIVITY,
    });
    if (redemptionError) {
      console.error('Atomic payment redemption failed', redemptionError);
      const duplicate = redemptionError.code === '23505';
      return json(duplicate ? 409 : 500, {
        error: duplicate
          ? 'This payment signature has already been redeemed. If SOL left your wallet and no collectible appeared, contact support with your transaction signature.'
          : 'Payment was verified but the collectible could not be saved. The database transaction was rolled back; retry safely or contact support with your transaction signature.',
        signature,
      });
    }

    return json(200, {
      ok: true,
      rip,
      signature,
      paidLamports: received,
      inventoryCount: redemption?.inventoryCount ?? null,
    });
  } catch (err) {
    console.error('open-pack-sol', err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
