-- BananaScreener DB-first data store.
-- Every visitor read is served from these tables (stale-while-revalidate);
-- GeckoTerminal is only contacted by background refreshes and the daily cron.
--
-- Columns shared by all tables:
--   updated_at         when the cached payload was last written (data freshness)
--   refresh_started_at cooldown marker: a background refresh claims a row by
--                      setting this; claims are refused while it is younger
--                      than the row's TTL, so a hot row refreshes at most once
--                      per TTL window across all server instances.
-- Payload columns are nullable: a row with a NULL payload is a pending
-- placeholder created when a cold miss claims its first refresh.

create table if not exists public.tokens (
  network text not null,
  address text not null,
  name text,
  symbol text,
  logo_url text,
  info jsonb, -- raw GT /tokens/{addr}/info response (description, socials, gt_score)
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (network, address)
);

create table if not exists public.token_stats (
  network text not null,
  address text not null,
  price_usd numeric,
  market_cap_usd numeric,
  volume_24h_usd numeric,
  raw jsonb, -- raw GT /tokens/{addr} response
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (network, address)
);

create table if not exists public.trending_snapshots (
  network text not null, -- '' = all networks
  page int not null default 1,
  snapshot jsonb, -- raw GT trending_pools response (data + included)
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (network, page)
);

create table if not exists public.pairs (
  network text not null,
  token_address text not null,
  pools jsonb, -- raw GT /tokens/{addr}/pools response (data + included)
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (network, token_address)
);

create table if not exists public.ohlcv_candles (
  network text not null,
  pool_address text not null,
  timeframe text not null,
  aggregate text not null,
  candles jsonb, -- raw GT ohlcv response
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (network, pool_address, timeframe, aggregate)
);

-- Not named in the original architecture but required so the Transactions tab
-- and search stay browsable when GeckoTerminal is unreachable.
create table if not exists public.pair_trades (
  network text not null,
  pool_address text not null,
  trades jsonb, -- raw GT /pools/{addr}/trades response
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (network, pool_address)
);

create table if not exists public.search_cache (
  query text not null,
  page int not null default 1,
  results jsonb, -- raw GT /search/pools response
  updated_at timestamptz not null default now(),
  refresh_started_at timestamptz,
  primary key (query, page)
);

-- RLS: same pattern as bananamaps' token_graphs — public read, writes allowed
-- (writes only ever arrive from our own API routes holding the anon/service key).
do $$
declare t text;
begin
  foreach t in array array['tokens','token_stats','trending_snapshots','pairs','ohlcv_candles','pair_trades','search_cache']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format('create policy "%s_read" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format('create policy "%s_insert" on public.%I for insert with check (true)', t, t);
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format('create policy "%s_update" on public.%I for update using (true)', t, t);
  end loop;
end $$;
