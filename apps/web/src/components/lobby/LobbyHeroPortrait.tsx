import type { LobbyHero } from "../../game-lobby/lobbyData";

const HERO_IDLE_SPRITES: Record<string, string> = {
  "spark-runner": "/assets/heroes/private.png?v=20260607-private1",
  "rookie-guard": "/assets/heroes/helixsecurity.png?v=20260607-helixsecurity1",
  "mini-mender": "/assets/heroes/medic.png?v=20260607-medic1",
  "scrap-gunner": "/assets/heroes/junkgunner.png?v=20260607-junkgunner1",
  "slow-bot": "/assets/heroes/nullslow.png?v=20260607-nullslow1",
  "charge-helper": "/assets/heroes/volskayarepair.png?v=20260607-volskayarepair1",
  "pulse-ranger": "/assets/heroes/talonchaser.png?v=20260607-talonchaser1",
  "barrier-guard": "/assets/heroes/crusaderprivate.png?v=20260607-crusaderprivate1",
  tracer: "/assets/heroes/tracer.png?v=20260605-tracer1",
  kiriko: "/assets/heroes/kiriko.png?v=20260605-kiriko1",
  dva: "/assets/heroes/d.va.png?v=20260605-dva1",
  zarya: "/assets/heroes/zarya.png?v=20260605-zarya1",
  cassidy: "/assets/heroes/cassidy.png?v=20260605-cassidy1",
  winston: "/assets/heroes/winston.png?v=20260606-winston1",
  genji: "/assets/heroes/genji.png?v=20260606-genji1",
  ana: "/assets/heroes/ana.png?v=20260606-ana1",
  illari: "/assets/heroes/illari.png?v=20260606-illari1",
};

const SPRITE_PORTRAIT_IDS = new Set([
  "spark-runner",
  "rookie-guard",
  "mini-mender",
  "scrap-gunner",
  "slow-bot",
  "charge-helper",
  "pulse-ranger",
  "barrier-guard",
  "tracer",
  "kiriko",
  "dva",
  "zarya",
  "cassidy",
  "winston",
  "genji",
  "ana",
  "illari",
]);

type LobbyHeroPortraitProps = {
  hero: LobbyHero;
};

export function LobbyHeroPortrait({ hero }: LobbyHeroPortraitProps) {
  const spriteUrl = SPRITE_PORTRAIT_IDS.has(hero.id) ? HERO_IDLE_SPRITES[hero.id] : undefined;

  if (!hero.owned) {
    return <div className="hero-portrait">?</div>;
  }

  if (!spriteUrl) {
    return <div className="hero-portrait">{hero.displayName.slice(0, 2)}</div>;
  }

  return (
    <div className="hero-portrait hero-sprite-portrait" aria-label={`${hero.displayName} 대기 이미지`}>
      <img className="hero-idle-sprite" src={spriteUrl} alt="" loading="lazy" draggable={false} />
    </div>
  );
}
