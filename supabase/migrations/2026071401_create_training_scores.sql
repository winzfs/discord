create table if not exists public.training_scores (
  player_id uuid not null,
  device_secret_hash text not null,
  nickname varchar(16) not null,
  game_key text not null check (game_key in ('reaction', 'widow')),
  score integer not null check (score between 0 and 1000000),
  accuracy smallint not null check (accuracy between 0 and 100),
  avg_reaction_ms integer null check (avg_reaction_ms is null or avg_reaction_ms between 50 and 10000),
  headshot_rate smallint null check (headshot_rate is null or headshot_rate between 0 and 100),
  max_combo integer not null default 0 check (max_combo between 0 and 9999),
  updated_at timestamptz not null default now(),
  primary key (player_id, game_key)
);

create index if not exists training_scores_game_rank_idx
  on public.training_scores (game_key, score desc, updated_at asc);

alter table public.training_scores enable row level security;
revoke all on table public.training_scores from anon, authenticated;

comment on table public.training_scores is
  'Best score per local training identity and game. Writes are handled only by the training-leaderboard Edge Function.';
