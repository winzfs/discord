create table if not exists public.training_discord_scores (
  guild_id text not null check (guild_id ~ '^[0-9]{17,20}$'),
  discord_user_id text not null check (discord_user_id ~ '^[0-9]{17,20}$'),
  username varchar(32) not null,
  display_name varchar(64) not null,
  avatar_url text,
  game_key text not null check (game_key in ('reaction', 'widow')),
  score integer not null check (score between 0 and 1000000),
  accuracy smallint not null check (accuracy between 0 and 100),
  avg_reaction_ms integer check (avg_reaction_ms is null or avg_reaction_ms between 50 and 10000),
  headshot_rate smallint check (headshot_rate is null or headshot_rate between 0 and 100),
  max_combo integer not null default 0 check (max_combo between 0 and 9999),
  updated_at timestamptz not null default now(),
  primary key (guild_id, discord_user_id, game_key)
);

alter table public.training_discord_scores enable row level security;

create index if not exists training_discord_scores_rank_idx
  on public.training_discord_scores (guild_id, game_key, score desc, updated_at asc);
