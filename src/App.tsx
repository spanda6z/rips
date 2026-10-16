import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  BarChart3,
  Check,
  Coins,
  Home,
  Search,
  Sparkles,
  Trophy,
  Wallet,
  X,
} from 'lucide-react';
import AccountPanel from './components/AccountPanel';
import Achievements from './components/Achievements';
import LeaderboardPage from './components/LeaderboardPage';
import WalletBar from './components/WalletBar';
import { packs as defaultPacks } from './data/packs';
import { tokens } from './data/tokens';
import { useDemoInventory } from './hooks/useDemoInventory';
import { linkWalletToProfile } from './lib/linkWallet';
import { openPackServer } from './lib/openPackServer';
import { openPackWithSol } from './lib/openPackSolana';
import { chooseReward, createRipId, validatePack } from './lib/packEngine';
import { isSolanaConfigured } from './lib/solanaConfig';
import { supabase } from './lib/supabaseClient';
import type { Pack, Rip } from './types';

type Page = 'shop' | 'inventory' | 'leaderboard' | 'how';

const DOCK: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'shop', label: 'Shop', icon: Home },
  { id: 'inventory', label: 'Vault', icon: Coins },
  { id: 'leaderboard', label: 'Ranks', icon: BarChart3 },
  { id: 'how', label: 'Guide', icon: Trophy },
];

const SOL = '\u25ce';
const DOT = '\u00b7';
const ELLIPSIS = '\u2026';
const CLOSE = '\u00d7';

export default function App() {
  const [page, setPage] = useState<Page>('shop');
  const [activePackIdx, setActivePackIdx] = useState(0);
  const [opening, setOpening] = useState<Pack | null>(null);
  const [reward, setReward] = useState<Rip | null>(null);
  const [error, setError] = useState('');
  const [payStatus, setPayStatus] = useState('');
  const [selectedRip, setSelectedRip] = useState<Rip | null>(null);
  const [rarityFilter, setRarityFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogPacks, setCatalogPacks] = useState<Pack[]>(defaultPacks);

  const demo = useDemoInventory();
  const { publicKey, sendTransaction, connected } = useWallet();

  useEffect(() => {
    if (publicKey && demo.cloudUser) {
      linkWalletToProfile(publicKey.toBase58());
    }
  }, [publicKey, demo.cloudUser]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from('pack_catalog')
      .select('id,name,subtitle,demo_price,accent,odds,featured')
      .eq('enabled', true)
      .then(({ data, error: err }) => {
        if (!active || err || !data?.length) return;
        const loaded: Pack[] = [];
        for (const row of data) {
          const odds = row.odds as Record<string, unknown> | null;
          if (
            !row.id ||
            typeof row.name !== 'string' ||
            typeof row.subtitle !== 'string' ||
            typeof row.accent !== 'string' ||
            !/^#[0-9a-fA-F]{3,8}$/.test(row.accent) ||
            typeof row.demo_price !== 'number' ||
            !odds ||
            typeof odds !== 'object'
          ) {
            continue;
          }
          const mapped = {
            Common: Number(odds.Common),
            Rare: Number(odds.Rare),
            Epic: Number(odds.Epic),
            Legendary: Number(odds.Legendary),
          };
          if ([mapped.Common, mapped.Rare, mapped.Epic, mapped.Legendary].some((n) => !Number.isFinite(n))) {
            continue;
          }
          loaded.push({
            id: row.id,
            name: row.name,
            subtitle: row.subtitle,
            price: row.demo_price,
            accent: row.accent,
            odds: mapped,
            featured: !!row.featured,
          });
        }
        if (loaded.length) {
          const featuredIdx = loaded.findIndex((p) => p.featured);
          setCatalogPacks(loaded);
          if (featuredIdx >= 0) setActivePackIdx(featuredIdx);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const activePack = catalogPacks[Math.min(activePackIdx, catalogPacks.length - 1)] ?? catalogPacks[0];

  const visibleInventory = useMemo(
    () =>
      demo.inventory
        .filter(
          (r) =>
            (rarityFilter === 'All' || r.token.rarity === rarityFilter) &&
            `${r.token.name} ${r.token.ticker} ${r.packName}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        )
        .sort((a, b) =>
          sortOrder === 'value-high'
            ? b.token.demoValue - a.token.demoValue
            : sortOrder === 'value-low'
              ? a.token.demoValue - b.token.demoValue
              : sortOrder === 'name'
                ? a.token.name.localeCompare(b.token.name)
                : new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
        ),
    [demo.inventory, rarityFilter, sortOrder, searchTerm],
  );

  const total = useMemo(
    () => demo.inventory.reduce((s, r) => s + r.token.demoValue, 0),
    [demo.inventory],
  );

  function exportCsv() {
    const header = ['id', 'name', 'ticker', 'rarity', 'demoValue', 'packName', 'openedAt'];
    const rows = demo.inventory.map((r) =>
      [r.id, r.token.name, r.token.ticker, r.token.rarity, r.token.demoValue, r.packName, r.openedAt]
        .map((v) => {
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rips-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function rip(pack: Pack) {
    setError('');
    const invalid = validatePack(pack);
    if (invalid) {
      setError(invalid);
      return;
    }
    try {
      if (isSolanaConfigured) {
        if (!connected || !publicKey) {
          setError('Connect a Solana wallet to buy this pack.');
          return;
        }
        if (!demo.cloudUser) {
          setError('Sign in so your collection can be saved after payment.');
          return;
        }
        setPayStatus('Preparing' + ELLIPSIS);
        const result = await openPackWithSol({
          packId: pack.id,
          priceSol: pack.price,
          publicKey,
          sendTransaction,
          onStatus: setPayStatus,
        });
        setPayStatus('');
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (typeof demo.applyServerOpen === 'function') {
          demo.applyServerOpen(result.rip, demo.balance);
        } else {
          demo.addRip(result.rip);
        }
        setReward(result.rip);
        setOpening(null);
        return;
      }
      if (demo.useServerOpen) {
        const result = await openPackServer(pack.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        demo.applyServerOpen(result.rip, result.balance);
        setReward(result.rip);
        setOpening(null);
        return;
      }
      if (demo.balance < pack.price) {
        setError('Not enough balance.');
        return;
      }
      const token = chooseReward(pack, tokens);
      const item = {
        id: createRipId(),
        token,
        packName: pack.name,
        openedAt: new Date().toISOString(),
      };
      demo.openRip(pack.price, item);
      setReward(item);
      setOpening(null);
    } catch (e) {
      setPayStatus('');
      setError(e instanceof Error ? e.message : 'Could not open this pack.');
    }
  }

  function ctaLabel() {
    if (payStatus) return 'Working' + ELLIPSIS;
    if (isSolanaConfigured && !connected) return 'Connect wallet to rip';
    if (isSolanaConfigured && !demo.cloudUser) return 'Sign in to rip';
    return `Rip ${DOT} ${SOL} ${activePack?.price.toFixed(2) ?? '-'}`;
  }

  function onCta() {
    if (!activePack) return;
    if (isSolanaConfigured && !connected) {
      setError('Use Connect in the top bar to link Phantom or Solflare.');
      return;
    }
    if (isSolanaConfigured && !demo.cloudUser) {
      setError('Sign in with email so we can save your pulls.');
      return;
    }
    setOpening(activePack);
  }

  return (
    <div className="rips-app">
      <header className="rips-top">
        <a
          className="rips-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage('shop');
          }}
        >
          <span className="rips-mark">R</span>
          <span>
            <b>RIPS</b>
            <small>Solana packs</small>
          </span>
        </a>
        <div className="rips-top-actions">
          <WalletBar />
          <AccountPanel />
        </div>
      </header>

      {payStatus && (
        <div className="banner info" role="status">
          {payStatus}
        </div>
      )}
      {error && (
        <div className="banner error" role="alert">
          {error}
          <button aria-label="Dismiss" onClick={() => setError('')}>
            {CLOSE}
          </button>
        </div>
      )}

      {page === 'shop' && activePack && (
        <section className="shop-stage">
          <div className="pack-carousel">
            <div className="pack-art" style={{ ['--pack-accent' as string]: activePack.accent }}>
              <div className="pack-art-brand">RIPS {DOT} SOLANA</div>
              <div className="pack-art-title">{activePack.name.replace(/ Pack$/i, '')}</div>
              <div className="pack-art-glyph">
                <Sparkles size={28} />
              </div>
              <div className="pack-art-label">{activePack.name.toUpperCase()}</div>
            </div>
          </div>

          <div className="pack-nav" aria-hidden>
            {catalogPacks.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={'pack-dot' + (i === activePackIdx ? ' on' : '')}
                onClick={() => setActivePackIdx(i)}
              />
            ))}
          </div>

          <div className="pack-meta">
            <h1>{activePack.name}</h1>
            <p>{activePack.subtitle}</p>
            <div className="odds-chip">
              {(['Common', 'Rare', 'Epic', 'Legendary'] as const).map((r) => (
                <span key={r}>
                  {r}
                  <b>{activePack.odds[r]}%</b>
                </span>
              ))}
            </div>
            <div className="prize-row">
              <span>
                Price
                <br />
                <strong>
                  {SOL} {activePack.price.toFixed(2)}
                </strong>
              </span>
              <span style={{ textAlign: 'right' }}>
                Network
                <br />
                <strong>Solana</strong>
              </span>
            </div>
            <button className="cta-primary" disabled={Boolean(payStatus)} onClick={onCta}>
              <Wallet size={18} />
              {ctaLabel()}
            </button>
            <button className="cta-secondary" type="button" onClick={() => setPage('how')}>
              How ripping works
            </button>
          </div>

          <div className="pack-switcher" role="tablist" aria-label="Packs">
            {catalogPacks.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === activePackIdx}
                className={'pack-pill' + (i === activePackIdx ? ' on' : '')}
                onClick={() => setActivePackIdx(i)}
              >
                {p.name.replace(/ Pack$/i, '')} {DOT} {SOL}
                {p.price}
              </button>
            ))}
          </div>
        </section>
      )}

      {page === 'inventory' && (
        <div className="page">
          <div className="page-title">
            <h1>Your vault</h1>
            <p>Pulls saved after verified SOL payments.</p>
          </div>
          <div className="stats-row">
            <div className="stat-card">
              <small>ITEMS</small>
              <strong>{demo.inventory.length}</strong>
            </div>
            <div className="stat-card">
              <small>UNIQUE</small>
              <strong>{new Set(demo.inventory.map((r) => r.token.ticker)).size}</strong>
            </div>
            <div className="stat-card">
              <small>EST. VALUE</small>
              <strong>
                {SOL} {total.toFixed(2)}
              </strong>
            </div>
            <div className="stat-card">
              <small>LEGENDARY</small>
              <strong>{demo.inventory.filter((r) => r.token.rarity === 'Legendary').length}</strong>
            </div>
          </div>
          <Achievements inventory={demo.inventory} history={demo.history} />
          {demo.inventory.length === 0 ? (
            <div className="empty">
              <Coins size={28} />
              <h2>Vault is empty</h2>
              <p>Rip a pack to start your collection.</p>
              <button className="cta-primary" style={{ marginTop: 16, maxWidth: 240 }} onClick={() => setPage('shop')}>
                Open shop
              </button>
            </div>
          ) : (
            <>
              <div className="inventory-toolbar">
                <button type="button" className="btn-ghost" onClick={exportCsv}>
                  Export CSV
                </button>
                <label className="search-field">
                  <Search size={14} />
                  <input
                    placeholder={'Search' + ELLIPSIS}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button type="button" aria-label="Clear" onClick={() => setSearchTerm('')}>
                      <X size={14} />
                    </button>
                  )}
                </label>
                <label className="filter-field">
                  <select
                    aria-label="Filter by rarity"
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Common</option>
                    <option>Rare</option>
                    <option>Epic</option>
                    <option>Legendary</option>
                  </select>
                </label>
                <label className="filter-field">
                  <select
                    aria-label="Sort"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="value-high">Value high</option>
                    <option value="value-low">Value low</option>
                    <option value="name">Name</option>
                  </select>
                </label>
              </div>
              <div className="collection">
                {visibleInventory.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="token-card-button"
                    onClick={() => setSelectedRip(r)}
                  >
                    <div
                      className="token-art"
                      style={{ ['--token-color' as string]: r.token.color }}
                    >
                      {r.token.icon}
                    </div>
                    <div className="token-info">
                      <small className="rarity">{r.token.rarity}</small>
                      <h3>{r.token.name}</h3>
                      <p>
                        ${r.token.ticker} {DOT} {r.packName}
                      </p>
                      <strong>
                        {SOL} {r.token.demoValue.toFixed(2)}
                      </strong>
                    </div>
                  </button>
                ))}
              </div>
              <h2 style={{ fontSize: 15, marginTop: 24 }}>Activity</h2>
              {demo.history.map((r) => (
                <div className="history" key={r.id}>
                  <span>{r.token.icon}</span>
                  <div>
                    <b>{r.packName}</b>
                    <div style={{ color: 'var(--dim)', fontSize: 12 }}>
                      {r.token.name} {DOT} {new Date(r.openedAt).toLocaleString()}
                    </div>
                  </div>
                  <strong>
                    +{SOL} {r.token.demoValue.toFixed(2)}
                  </strong>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {page === 'leaderboard' && (
        <div className="page">
          <LeaderboardPage
            rips={demo.history.length}
            value={total}
            signedIn={Boolean(demo.cloudUser)}
          />
        </div>
      )}

      {page === 'how' && (
        <div className="page">
          <div className="page-title">
            <h1>How it works</h1>
            <p>Real SOL on Solana - no fake balances.</p>
          </div>
          <div className="how-grid">
            <article>
              <Check size={18} color="#22d3ee" />
              <h3>1. Sign in + connect</h3>
              <p>Magic link saves your vault. Wallet pays for packs.</p>
            </article>
            <article>
              <Check size={18} color="#22d3ee" />
              <h3>2. Pay in SOL</h3>
              <p>Ripping sends SOL to the treasury. You approve in your wallet.</p>
            </article>
            <article>
              <Check size={18} color="#22d3ee" />
              <h3>3. Server verifies</h3>
              <p>We confirm the transfer on-chain, then roll rarity into your vault.</p>
            </article>
            <article>
              <Check size={18} color="#22d3ee" />
              <h3>4. Collect</h3>
              <p>Items live in your account. On-chain mint can land in a later drop.</p>
            </article>
          </div>
        </div>
      )}

      <nav className="rips-dock" aria-label="Primary">
        {DOCK.map((d) => (
          <button
            key={d.id}
            type="button"
            className={'dock-item' + (page === d.id ? ' on' : '')}
            onClick={() => setPage(d.id)}
          >
            <d.icon size={20} />
            {d.label}
          </button>
        ))}
      </nav>

      {opening && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpening(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <button className="close" aria-label="Close" onClick={() => setOpening(null)}>
              {CLOSE}
            </button>
            <small className="rarity">Open pack</small>
            <h2>{opening.name}</h2>
            <p>{opening.subtitle}</p>
            <ul className="odds dense">
              {(['Common', 'Rare', 'Epic', 'Legendary'] as const).map((r) => (
                <li key={r}>
                  <span>{r}</span>
                  <b>{opening.odds[r]}%</b>
                </li>
              ))}
            </ul>
            <p className="cost">
              Cost{' '}
              <strong>
                {SOL} {opening.price.toFixed(2)} SOL
              </strong>
            </p>
            <div className="actions">
              <button className="secondary" type="button" onClick={() => setOpening(null)}>
                Cancel
              </button>
              <button
                className="primary"
                type="button"
                disabled={Boolean(payStatus)}
                onClick={() => rip(opening)}
              >
                {payStatus ? 'Working' + ELLIPSIS : 'Pay & rip'}
              </button>
            </div>
          </section>
        </div>
      )}

      {reward && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReward(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <button className="close" aria-label="Close" onClick={() => setReward(null)}>
              {CLOSE}
            </button>
            <small className="rarity">You pulled</small>
            <div
              className="reward-art"
              style={{ ['--token-color' as string]: reward.token.color }}
            >
              {reward.token.icon}
            </div>
            <small className="rarity">{reward.token.rarity}</small>
            <h2>{reward.token.name}</h2>
            <p>
              ${reward.token.ticker} {DOT} {reward.packName}
            </p>
            <button className="cta-primary" style={{ marginTop: 16 }} onClick={() => setReward(null)}>
              Nice
            </button>
          </section>
        </div>
      )}

      {selectedRip && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRip(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <button className="close" aria-label="Close" onClick={() => setSelectedRip(null)}>
              {CLOSE}
            </button>
            <div
              className="reward-art"
              style={{ ['--token-color' as string]: selectedRip.token.color }}
            >
              {selectedRip.token.icon}
            </div>
            <small className="rarity">{selectedRip.token.rarity}</small>
            <h2>{selectedRip.token.name}</h2>
            <p>${selectedRip.token.ticker}</p>
            <button
              className="cta-primary"
              style={{ marginTop: 16 }}
              onClick={() => setSelectedRip(null)}
            >
              Done
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
