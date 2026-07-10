import type { HeroStrikeState } from "./heroStrikeTypes";

export function addBurst(
  state: HeroStrikeState,
  x: number,
  y: number,
  color: string,
  count = 10,
  speed = 130,
  size = 3,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.35 + Math.random() * 0.9);
    state.particles.push({
      id: state.nextId++,
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.38 + Math.random() * 0.35,
      maxLife: 0.73,
      size: size * (0.55 + Math.random()),
      color,
      alpha: 1,
    });
  }
}

export function addRing(state: HeroStrikeState, x: number, y: number, color: string, size = 22) {
  state.particles.push({
    id: state.nextId++,
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.45,
    maxLife: 0.45,
    size,
    color,
    alpha: 0.9,
    ring: true,
  });
}

export function addFloatingText(
  state: HeroStrikeState,
  x: number,
  y: number,
  text: string,
  color: string,
  size = 16,
) {
  state.texts.push({
    id: state.nextId++,
    x,
    y,
    text,
    color,
    life: 0.85,
    maxLife: 0.85,
    size,
  });
}
