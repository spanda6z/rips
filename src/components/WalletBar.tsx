import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_NETWORK, isSolanaConfigured } from '../lib/solanaConfig';

export default function WalletBar() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    refresh();
    if (!publicKey) return;
    const id = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(id);
  }, [publicKey, refresh]);

  return (
    <div className="wallet-bar">
      <span className="network-chip" title="Solana cluster">
        {SOLANA_NETWORK}
      </span>
      {publicKey && balance !== null && (
        <span className="balance-chip" title="Wallet SOL balance">
          <span>◎</span>
          <b>{balance.toFixed(4)} SOL</b>
        </span>
      )}
      <WalletMultiButton />
      {!isSolanaConfigured && (
        <span className="wallet-warn" title="Set VITE_TREASURY_WALLET">
          Treasury not configured
        </span>
      )}
    </div>
  );
}
