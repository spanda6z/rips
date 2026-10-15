import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import SolanaWalletProvider from './components/SolanaWalletProvider';
import './styles.css';
import './styles.wallet.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </React.StrictMode>,
);
