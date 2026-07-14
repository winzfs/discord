export const WIDOW_CROSSHAIR_X = 50;

export type WidowDirection = 1 | -1;

export type WidowMotionState = {
  x: number;
  velocity: number;
  desiredVelocity: number;
  acceleration: number;
  difficulty: number;
  minX: number;
  maxX: number;
  nextDecisionAt: number;
  expiresAt: number;
  forcedDirection: WidowDirection | 0;
  jitterPhase: number;
  accelerationPhase: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function getWidowDifficulty(elapsedRatio: number, combo: number): number {
  const timePressure = clamp(elapsedRatio, 0, 1) * 0.84;
  const comboPressure = Math.min(0.16, combo * 0.012);
  return clamp(timePressure + comboPressure, 0, 1);
}

export function getWidowTargetScale(difficulty: number): number {
  const baseScale = lerp(1, 0.52, difficulty);
  const variance = lerp(0.05, 0.02, difficulty);
  return clamp(baseScale + randomBetween(-variance, variance), 0.5, 1.05);
}

export function getWidowSpawnDelay(difficulty: number): number {
  return randomBetween(lerp(420, 170, difficulty), lerp(900, 390, difficulty));
}

export function getWidowHeadWindow(scale: number, difficulty: number): number {
  return Math.max(1, 2.25 * scale - difficulty * 0.28);
}

export function getWidowBodyWindow(scale: number, difficulty: number): number {
  return Math.max(2.3, 4.9 * scale - difficulty * 0.8);
}

export function createWidowMotion(now: number, difficulty: number): WidowMotionState {
  const radius = lerp(18, 10.5, difficulty);
  const direction: WidowDirection = Math.random() < 0.5 ? 1 : -1;
  const speed = randomBetween(lerp(14, 39, difficulty), lerp(22, 67, difficulty));
  const x = randomBetween(
    WIDOW_CROSSHAIR_X - radius * 0.78,
    WIDOW_CROSSHAIR_X + radius * 0.78,
  );

  return {
    x,
    velocity: direction * speed * randomBetween(0.42, 0.72),
    desiredVelocity: direction * speed,
    acceleration: lerp(58, 310, difficulty),
    difficulty,
    minX: WIDOW_CROSSHAIR_X - radius,
    maxX: WIDOW_CROSSHAIR_X + radius,
    nextDecisionAt: now + randomBetween(lerp(360, 85, difficulty), lerp(720, 245, difficulty)),
    expiresAt: now + randomBetween(lerp(5_200, 3_250, difficulty), lerp(6_100, 4_050, difficulty)),
    forcedDirection: 0,
    jitterPhase: Math.random() * Math.PI * 2,
    accelerationPhase: Math.random() * Math.PI * 2,
  };
}

function currentDirection(state: WidowMotionState): WidowDirection {
  if (Math.abs(state.velocity) > 0.8) return state.velocity >= 0 ? 1 : -1;
  return state.desiredVelocity >= 0 ? 1 : -1;
}

function planNextSegment(state: WidowMotionState, now: number): void {
  const difficulty = state.difficulty;
  const current = currentDirection(state);
  const distanceFromCenter = state.x - WIDOW_CROSSHAIR_X;
  const radius = (state.maxX - state.minX) / 2;
  const nearCrosshair = Math.abs(distanceFromCenter) <= lerp(7.5, 2.8, difficulty);
  const nearBoundary = Math.abs(distanceFromCenter) >= radius * 0.72;
  const inwardDirection: WidowDirection = distanceFromCenter >= 0 ? -1 : 1;
  const baseSpeed = randomBetween(lerp(14, 38, difficulty), lerp(23, 70, difficulty));

  if (state.forcedDirection !== 0) {
    state.desiredVelocity = state.forcedDirection * baseSpeed * randomBetween(0.9, 1.18);
    state.forcedDirection = 0;
    state.nextDecisionAt = now + randomBetween(lerp(240, 60, difficulty), lerp(460, 145, difficulty));
    return;
  }

  if (nearBoundary) {
    state.desiredVelocity = inwardDirection * baseSpeed * randomBetween(0.82, 1.16);
    state.nextDecisionAt = now + randomBetween(lerp(300, 95, difficulty), lerp(560, 210, difficulty));
    return;
  }

  const roll = Math.random();
  const pauseChance = lerp(0.08, 0.17, difficulty);
  const doubleBackChance = lerp(0.08, 0.28, difficulty);
  const stutterChance = lerp(0.08, 0.24, difficulty);
  const evilCrosshairReverseChance = nearCrosshair ? lerp(0.04, 0.48, difficulty) : 0;

  if (Math.random() < evilCrosshairReverseChance) {
    state.desiredVelocity = -current * baseSpeed * randomBetween(1.02, 1.28);
    state.forcedDirection = Math.random() < 0.62 ? current : 0;
    state.nextDecisionAt = now + randomBetween(lerp(180, 45, difficulty), lerp(320, 115, difficulty));
    return;
  }

  if (roll < pauseChance) {
    state.desiredVelocity = 0;
    state.forcedDirection = Math.random() < 0.62 + difficulty * 0.2
      ? ((-current) as WidowDirection)
      : current;
    state.nextDecisionAt = now + randomBetween(lerp(190, 55, difficulty), lerp(390, 145, difficulty));
    return;
  }

  if (roll < pauseChance + doubleBackChance) {
    const fakeDirection: WidowDirection = Math.random() < 0.76 ? ((-current) as WidowDirection) : inwardDirection;
    state.desiredVelocity = fakeDirection * baseSpeed * randomBetween(1, 1.3);
    state.forcedDirection = (-fakeDirection) as WidowDirection;
    state.nextDecisionAt = now + randomBetween(lerp(230, 55, difficulty), lerp(430, 135, difficulty));
    return;
  }

  if (roll < pauseChance + doubleBackChance + stutterChance) {
    const microDirection: WidowDirection = Math.random() < 0.5 ? 1 : -1;
    state.desiredVelocity = microDirection * baseSpeed * randomBetween(1.08, 1.38);
    state.forcedDirection = Math.random() < 0.7 ? ((-microDirection) as WidowDirection) : 0;
    state.nextDecisionAt = now + randomBetween(lerp(210, 42, difficulty), lerp(360, 105, difficulty));
    return;
  }

  const reverseChance = lerp(0.38, 0.69, difficulty);
  const direction: WidowDirection = Math.random() < reverseChance ? ((-current) as WidowDirection) : current;
  state.desiredVelocity = direction * baseSpeed * randomBetween(0.82, 1.15);
  state.nextDecisionAt = now + randomBetween(lerp(350, 85, difficulty), lerp(720, 235, difficulty));
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(target, current + maxDelta);
  if (current > target) return Math.max(target, current - maxDelta);
  return current;
}

function advanceStep(state: WidowMotionState, simulationTimeMs: number, deltaSeconds: number): void {
  const accelerationPulse = 0.965 + Math.sin(simulationTimeMs * 0.0042 + state.accelerationPhase) * 0.035;
  state.velocity = approach(
    state.velocity,
    state.desiredVelocity,
    state.acceleration * accelerationPulse * deltaSeconds,
  );

  const jitterAmplitude = lerp(0.15, 6.8, state.difficulty);
  const jitterFrequency = lerp(0.007, 0.031, state.difficulty);
  const jitterVelocity = Math.sin(simulationTimeMs * jitterFrequency + state.jitterPhase) * jitterAmplitude;
  state.x += (state.velocity + jitterVelocity) * deltaSeconds;

  if (state.x <= state.minX) {
    state.x = state.minX;
    state.velocity = Math.abs(state.velocity) * 0.72;
    state.desiredVelocity = Math.abs(state.desiredVelocity || 1);
    state.nextDecisionAt = Math.min(state.nextDecisionAt, simulationTimeMs + 35);
  } else if (state.x >= state.maxX) {
    state.x = state.maxX;
    state.velocity = -Math.abs(state.velocity) * 0.72;
    state.desiredVelocity = -Math.abs(state.desiredVelocity || 1);
    state.nextDecisionAt = Math.min(state.nextDecisionAt, simulationTimeMs + 35);
  }
}

export function advanceWidowMotion(state: WidowMotionState, now: number, deltaSeconds: number): void {
  if (now >= state.nextDecisionAt) planNextSegment(state, now);

  let remaining = Math.min(0.05, Math.max(0, deltaSeconds));
  const maxStep = 1 / 120;
  let simulationTimeMs = now - remaining * 1000;

  while (remaining > 0.00001) {
    const step = Math.min(maxStep, remaining);
    simulationTimeMs += step * 1000;
    advanceStep(state, simulationTimeMs, step);
    remaining -= step;
  }
}

export function getWidowDirection(state: WidowMotionState): WidowDirection {
  return currentDirection(state);
}