import { compactInPlace, removeOldestInPlace } from "./heroStrikeArrayUtils";
import {
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_BULLETS,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function updateHeroStrikeBullets(state: HeroStrikeState, dt: number) {
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }

  compactInPlace(
    state.bullets,
    (bullet) => bullet.life > 0
      && bullet.x > -40
      && bullet.x < HERO_STRIKE_WIDTH + 40
      && bullet.y > -60
      && bullet.y < HERO_STRIKE_HEIGHT + 60,
  );

  const overflow = state.bullets.length - HERO_STRIKE_MAX_BULLETS;
  if (overflow > 0) removeOldestInPlace(state.bullets, overflow);
}
