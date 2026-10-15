import { clusterApiUrl, PublicKey, type Cluster } from '@solana/web3.js';

const networkEnv = (import.meta.env.VITE_SOLANA_NETWORK as string | undefined)?.trim() || 'devnet';
const rpcOverride = (import.meta.env.VITE_SOLANA_RPC_URL as string | undefined)?.trim();
const treasuryEnv = (import.meta.env.VITE_TREASURY_WALLET as string | undefined)?.trim();

export const SOLANA_NETWORK: Cluster =
  networkEnv === 'mainnet-beta' || networkEnv === 'testnet' || networkEnv === 'devnet'
    ? networkEnv
    : 'devnet';

export const SOLANA_RPC =
  rpcOverride || clusterApiUrl(SOLANA_NETWORK);

export const TREASURY_WALLET: PublicKey | null = (() => {
  if (!treasuryEnv) return null;
  try {
    return new PublicKey(treasuryEnv);
  } catch {
    console.warn('VITE_TREASURY_WALLET is not a valid public key');
    return null;
  }
})();

export const isSolanaConfigured = Boolean(TREASURY_WALLET);

/** Pack prices in SOL (real). Must match on-chain payment checks. */
export const PACK_PRICE_SOL: Record<string, number> = {
  starter: 0.05,
  degen: 0.15,
  legend: 0.4,
  alpha: 0.75,
};

export function packPriceSol(packId: string, fallback: number): number {
  return PACK_PRICE_SOL[packId] ?? fallback;
}
