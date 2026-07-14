export type ReactionRole = "tank" | "damage" | "support";

export interface ReactionRoleDefinition {
  key: ReactionRole;
  label: string;
  symbol: string;
  instruction: string;
}

export interface ReactionTarget {
  id: string;
  role: ReactionRole;
  x: number;
  y: number;
  size: number;
  tilt: number;
  driftX: number;
  driftY: number;
  motionDuration: number;
  motionDelay: number;
  facing: 1 | -1;
}

export const REACTION_ROLES: readonly ReactionRoleDefinition[] = [
  { key: "tank", label: "돌격", symbol: "◆", instruction: "파란 돌격 훈련봇을 사격하세요" },
  { key: "damage", label: "공격", symbol: "✦", instruction: "붉은 공격 훈련봇을 사격하세요" },
  { key: "support", label: "지원", symbol: "✚", instruction: "초록 지원 훈련봇을 사격하세요" },
] as const;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function getRole(role: ReactionRole): ReactionRoleDefinition {
  return REACTION_ROLES.find((item) => item.key === role) ?? REACTION_ROLES[0];
}

export function pickNextRole(previous?: ReactionRole): ReactionRoleDefinition {
  const candidates = previous
    ? REACTION_ROLES.filter((item) => item.key !== previous)
    : [...REACTION_ROLES];
  return candidates[Math.floor(Math.random() * candidates.length)] ?? REACTION_ROLES[0];
}

export function createReactionTargets(
  correctRole: ReactionRole,
  round: number,
): ReactionTarget[] {
  const targetCount = Math.min(6, 3 + Math.floor(round / 5));
  const decoys = REACTION_ROLES.filter((role) => role.key !== correctRole);
  const roles: ReactionRole[] = [correctRole];

  while (roles.length < targetCount) {
    roles.push(decoys[(roles.length - 1) % decoys.length]?.key ?? "damage");
  }

  const positions = shuffled([
    { x: 17, y: 34 },
    { x: 39, y: 27 },
    { x: 63, y: 29 },
    { x: 84, y: 38 },
    { x: 29, y: 69 },
    { x: 70, y: 67 },
  ]);
  const difficulty = Math.min(1, round / 24);

  return shuffled(roles).map((role, index) => {
    const base = positions[index] ?? { x: 50, y: 50 };
    const facing: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    return {
      id: `${round}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      x: base.x + randomBetween(-2.5, 2.5),
      y: base.y + randomBetween(-2.5, 2.5),
      size: randomBetween(88 - difficulty * 14, 112 - difficulty * 18),
      tilt: randomBetween(-3, 3),
      driftX: facing * randomBetween(5 + difficulty * 3, 10 + difficulty * 8),
      driftY: randomBetween(-2.2, 2.2),
      motionDuration: randomBetween(0.82 - difficulty * 0.24, 1.45 - difficulty * 0.3),
      motionDelay: randomBetween(-0.9, 0),
      facing,
    };
  });
}

export function getRoundLifetime(round: number): number {
  return Math.max(680, 1_650 - round * 34);
}

export function scoreReaction(reactionMs: number, combo: number): number {
  const speedScore = Math.max(45, 170 - Math.floor(reactionMs / 11));
  const comboMultiplier = 1 + Math.min(combo, 12) * 0.06;
  return Math.round(speedScore * comboMultiplier);
}

export function rankReactionScore(score: number): { grade: string; title: string } {
  if (score >= 4_800) return { grade: "S", title: "에임 네트워크 에이스" };
  if (score >= 3_600) return { grade: "A", title: "정예 사격 요원" };
  if (score >= 2_450) return { grade: "B", title: "전술 사격 요원" };
  if (score >= 1_300) return { grade: "C", title: "훈련 통과" };
  return { grade: "D", title: "조준 재보정 필요" };
}
