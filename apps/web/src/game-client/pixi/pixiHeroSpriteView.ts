import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { HeroSpriteAttackState } from "./pixiGameTypes";

const HERO_TEXTURE_PATHS: Record<string, string> = {
  tracer: "/assets/heroes/tracer.png?v=20260605-tracer1",
  kiriko: "/assets/heroes/kiriko.png?v=20260605-kiriko1",
  dva: "/assets/heroes/d.va.png?v=20260605-dva1",
};

const HERO_FRAME_ROWS = {
  idleLeft: 0,
  idleRight: 1,
  attackLeft: 2,
  attackRight: 3,
} as const;

const SPRITE_HERO_IDS = new Set(["tracer", "kiriko", "dva"]);

const HERO_SPRITE_SCALE: Record<string, number> = {
  kiriko: 1.17,
  dva: 1.2,
};

let textureCache = new Map<string, Texture>();
let loadingCache = new Set<string>();

function requestHeroTexture(heroId: string) {
  const path = HERO_TEXTURE_PATHS[heroId];
  if (!path || textureCache.has(heroId) || loadingCache.has(heroId)) return;

  loadingCache.add(heroId);
  void Assets.load<Texture>(path)
    .then((texture) => {
      textureCache.set(heroId, texture);
      loadingCache.delete(heroId);
    })
    .catch(() => {
      loadingCache.delete(heroId);
    });
}

function createFrameTexture(texture: Texture, row: number, rows: number) {
  const frameWidth = texture.width;
  const frameHeight = texture.height / rows;
  return new Texture({
    source: texture.source,
    frame: new Rectangle(0, frameHeight * row, frameWidth, frameHeight),
  });
}

function pickHeroSpriteFrameRow(attackState: HeroSpriteAttackState | null | undefined, now: number) {
  const isAttacking = attackState && attackState.until > now;
  const direction = attackState?.direction ?? "left";

  if (isAttacking) {
    return direction === "left" ? HERO_FRAME_ROWS.attackLeft : HERO_FRAME_ROWS.attackRight;
  }

  return direction === "left" ? HERO_FRAME_ROWS.idleLeft : HERO_FRAME_ROWS.idleRight;
}

export function canDrawHeroSprite(hero: Pick<BoardHero, "heroId">) {
  return Boolean(HERO_TEXTURE_PATHS[hero.heroId]);
}

export function drawHeroSprite(
  target: Container,
  hero: Pick<BoardHero, "heroId">,
  cell: number,
  scale = 1,
  attackState?: HeroSpriteAttackState | null,
  now = Date.now(),
) {
  const texture = textureCache.get(hero.heroId);

  if (!texture) {
    requestHeroTexture(hero.heroId);
    return false;
  }

  if (SPRITE_HERO_IDS.has(hero.heroId)) {
    const frameTexture = createFrameTexture(texture, pickHeroSpriteFrameRow(attackState, now), 4);
    const sprite = new Sprite(frameTexture);
    const heroScale = HERO_SPRITE_SCALE[hero.heroId] ?? 1;
    const maxWidth = cell * 1.23 * scale * heroScale;
    const maxHeight = cell * 1.47 * scale * heroScale;
    const ratio = Math.min(maxWidth / frameTexture.width, maxHeight / frameTexture.height);

    sprite.anchor.set(0.5, 0.74);
    sprite.width = frameTexture.width * ratio;
    sprite.height = frameTexture.height * ratio;
    sprite.x = 0;
    sprite.y = cell * 0.2 * scale;

    target.addChild(sprite);
    return true;
  }

  return false;
}
