import type { Token } from '../types';

export const tokens: Token[] = [
  // Common
  { id: 'sol', ticker: 'SOL', name: 'Solana', rarity: 'Common', color: '#7c6cff', icon: '◎', demoValue: 0.12 },
  { id: 'bonk', ticker: 'BONK', name: 'Bonk', rarity: 'Common', color: '#f5a623', icon: '🐕', demoValue: 0.08 },
  { id: 'usdc', ticker: 'USDC', name: 'USD Coin', rarity: 'Common', color: '#2775ca', icon: '$', demoValue: 0.05 },
  { id: 'mngo', ticker: 'MNGO', name: 'Mango', rarity: 'Common', color: '#f2c94c', icon: '🥭', demoValue: 0.09 },

  // Rare
  { id: 'wif', ticker: 'WIF', name: 'dogwifhat', rarity: 'Rare', color: '#d58cff', icon: '🐶', demoValue: 0.28 },
  { id: 'jup', ticker: 'JUP', name: 'Jupiter', rarity: 'Rare', color: '#c5f467', icon: '🚀', demoValue: 0.36 },
  { id: 'orca', ticker: 'ORCA', name: 'Orca', rarity: 'Rare', color: '#00d1c1', icon: '🐋', demoValue: 0.31 },
  { id: 'render', ticker: 'RENDER', name: 'Render', rarity: 'Rare', color: '#6c5ce7', icon: '🖥', demoValue: 0.42 },

  // Epic
  { id: 'pyth', ticker: 'PYTH', name: 'Pyth Network', rarity: 'Epic', color: '#8ce7ff', icon: '✦', demoValue: 0.75 },
  { id: 'ray', ticker: 'RAY', name: 'Raydium', rarity: 'Epic', color: '#ff7cba', icon: '☉', demoValue: 0.92 },
  { id: 'jito', ticker: 'JITO', name: 'Jito', rarity: 'Epic', color: '#00ffa3', icon: '⚡', demoValue: 1.15 },
  { id: 'tensor', ticker: 'TNSR', name: 'Tensor', rarity: 'Epic', color: '#a78bfa', icon: '📦', demoValue: 0.88 },

  // Legendary
  { id: 'mythic', ticker: 'MYTH', name: 'Mythic Drop', rarity: 'Legendary', color: '#ffe07a', icon: '✹', demoValue: 2.5 },
  { id: 'genesis', ticker: 'GEN', name: 'Genesis Relic', rarity: 'Legendary', color: '#ff9c6e', icon: '◈', demoValue: 4.2 },
  { id: 'alpha', ticker: 'ALPHA', name: 'Alpha Core', rarity: 'Legendary', color: '#ff6b6b', icon: '▲', demoValue: 3.8 },
];
