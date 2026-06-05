import type { LobbyHero } from "../../game-lobby/lobbyData";

const MYTHIC_HERO_IDLE_SPRITES: Record<string, string> = {
  tracer: "/assets/heroes/tracer.png?v=20260605-tracer1",
  kiriko: "/assets/heroes/kiriko.png?v=20260605-kiriko1",
  dva: "/assets/heroes/d.va.png?v=20260605-dva1",
  zarya: "/assets/heroes/zarya.png?v=20260605-zarya1",
  cassidy: "/assets/heroes/cassidy.png?v=20260605-cassidy1",
  winston: "/assets/heroes/winston.png?v=20260606-winston1",
  genji: "/assets/heroes/genji.png?v=20260606-genji1",
};

type LobbyHeroPortraitProps = {
  hero: LobbyHero;
};

export function LobbyHeroPortrait({ hero }: LobbyHeroPortraitProps) {
  const spriteUrl = hero.grade === "mythic" ? MYTHIC_HERO_IDLE_SPRITES[hero.id] : undefined;

  if (!hero.owned) {
    return <div className="hero-portrait">?</div>;
  }

  if (!spriteUrl) {
    return <div className="hero-portrait">{hero.displayName.slice(0, 2)}</div>;
  }

  return (
    <div className="hero-portrait mythic-hero-portrait" aria-label={`${hero.displayName} 대기 이미지`}>
      <span
        className="mythic-hero-idle-sprite"
        style={{ backgroundImage: `url(${spriteUrl})` }}
      />
    </div>
  );
}
