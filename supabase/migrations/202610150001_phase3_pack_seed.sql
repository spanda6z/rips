-- RIPS LAB Phase 3: seed default pack catalog (idempotent).
-- Safe to re-run. Does not touch user collections.

insert into public.pack_catalog (id, name, subtitle, demo_price, accent, odds, featured, enabled)
values
  (
    'starter',
    'Starter Pack',
    'Your first rip starts here.',
    0.05,
    '#8b7cff',
    '{"Common":65,"Rare":25,"Epic":8,"Legendary":2}'::jsonb,
    false,
    true
  ),
  (
    'degen',
    'Degen Pack',
    'Higher stakes. Spicier pulls.',
    0.15,
    '#ff7cba',
    '{"Common":45,"Rare":32,"Epic":18,"Legendary":5}'::jsonb,
    true,
    true
  ),
  (
    'legend',
    'Legend Pack',
    'Chasing the big one.',
    0.4,
    '#f6ca70',
    '{"Common":20,"Rare":35,"Epic":32,"Legendary":13}'::jsonb,
    false,
    true
  ),
  (
    'alpha',
    'Alpha Pack',
    'For the true collectors.',
    0.75,
    '#ff6b6b',
    '{"Common":10,"Rare":30,"Epic":40,"Legendary":20}'::jsonb,
    false,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  demo_price = excluded.demo_price,
  accent = excluded.accent,
  odds = excluded.odds,
  featured = excluded.featured,
  enabled = excluded.enabled,
  updated_at = now();
