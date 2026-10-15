import { Buffer } from 'buffer';
if (typeof globalThis !== 'undefined' && !(globalThis as { Buffer?: unknown }).Buffer) {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { SOLANA_RPC, TREASURY_WALLET, packPriceSol } from './solanaConfig';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC, 'confirmed');
}

export async function getSolBalance(pubkey: PublicKey): Promise<number> {
  const lamports = await getConnection().getBalance(pubkey, 'confirmed');
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Build a SOL transfer to the treasury with a memo binding packId + buyer.
 * User must sign and send; server verifies the signature before opening.
 */
export async function buildPackPaymentTx(params: {
  buyer: PublicKey;
  packId: string;
  priceSol: number;
}): Promise<Transaction> {
  if (!TREASURY_WALLET) {
    throw new Error('Treasury wallet is not configured (VITE_TREASURY_WALLET)');
  }
  const price = packPriceSol(params.packId, params.priceSol);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid pack price');
  }

  const lamports = Math.round(price * LAMPORTS_PER_SOL);
  if (lamports <= 0) throw new Error('Pack price too small');

  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const memo = `rips:v1:${params.packId}:${params.buyer.toBase58()}`;
  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: params.buyer, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf8'),
  });

  const tx = new Transaction({
    feePayer: params.buyer,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: params.buyer,
      toPubkey: TREASURY_WALLET,
      lamports,
    }),
    memoIx,
  );

  return tx;
}

export { LAMPORTS_PER_SOL };
