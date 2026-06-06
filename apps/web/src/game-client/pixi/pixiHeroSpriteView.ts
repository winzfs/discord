import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { HeroSpriteAttackState } from "./pixiGameTypes";

const HERO_TEXTURE_PATHS: Record<string, string> = {
  tracer: "/assets/heroes/tracer.png?v=20260605-tracer1",
  kiriko: "/assets/heroes/kiriko.png?v=20260605-kiriko1",
  dva: "/assets/heroes/d.va.png?v=20260605-dva1",
  zarya: "/assets/heroes/zarya.png?v=20260605-zarya1",
  cassidy: "/assets/heroes/cassidy.png?v=20260605-cassidy1",
  winston: "/assets/heroes/winston.png?v=20260606-winston1",
  genji: "/assets/heroes/genji.png?v=20260606-genji1",
  ana: "/assets/heroes/ana.png?v=20260606-ana1",
};

const HERO_FRAME_ROWS = {
  idleLeft: 0,
  idleRight: 1,
  attackLeft: 2,
  attackRight: 3,
} as const;

const HERO_FRAME_ROW_COUNT = 4;

const SPRITE_HERO_IDS = new Set(["tracer", "kiriko", "dva", "zarya", "cassidy", "winston", "genji", "ana"]);

const HERO_SPRITE_SCALE: Record<string, number> = {
  tracer: 1.1,
  kiriko: 1.31,
  dva: 1.47,
  zarya: 1.32,
  cassidy: 1.38,
  winston: 1.43,
  genji: 1.18,
  ana: 1.22,
};

let textureCache = new Map<string, Texture>();
let frameTextureCache = new Map<string, Texture[]>();
let loadingCache = new Set<string>();

function createHeroFrameTextures(texture: Texture) {
  const frameWidth = texture.width;
  const frameHeight = texture.height / HERO_FRAME_ROW_COUNT;

  return Array.from({ length: HERO_FRAME_ROW_COUNT }, (_, row) =>
    new Texture({
      source: texture.source,
      frame: new Rectangle(0, frameHeight * row, frameWidth, frameHeight),
    }),
  );
}

async function loadHeroTexture(heroId: string) {
  const path = HERO_TEXTURE_PATHS[heroId];
  if (!path || textureCache.has(heroId)) return;

  loadingCache.add(heroId);
  try {
    const texture = await Assets.load<Texture>(path);
    textureCache.set(heroId, texture);
    frameTextureCache.set(heroId, createHeroFrameTextures(texture));
  } finally {
    loadingCache.delete(heroId);
  }
}

function requestHeroTexture(heroId: string) {
  if (loadingCache.has(heroId)) return;
  void loadHeroTexture(heroId).catch(() => undefined);
}

export async function preloadHeroSpriteTextures() {
  await Promise.all(Object.keys(HERO_TEXTURE_PATHS).map((heroId) => loadHeroTexture(heroId).catch(() => undefined)));
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
    const frameRow = pickHeroSpriteFrameRow(attackState, now);
    const frameTexture = frameTextureCache.get(hero.heroId)?.[frameRow];
    if (!frameTexture) return false;

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
