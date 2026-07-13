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
}

export const REACTION_ROLES: readonly ReactionRoleDefinition[] = [
  { key: "tank", label: "돌격", symbol: "◆", instruction: "돌격 신호를 타격하세요" },
  { key: "damage", label: "공격", symbol: "✦", instruction: "공격 신호를 타격하세요" },
  { key: "support", label: "지원", symbol: "✚", instruction: "지원 신호를 타격하세요" },
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
  const targetCount = Math.min(5, 3 + Math.floor(round / 6));
  const decoys = REACTION_ROLES.filter((role) => role.key !== correctRole);
  const roles: ReactionRole[] = [correctRole];

  while (roles.length < targetCount) {
    roles.push(decoys[(roles.length - 1) % decoys.length]?.key ?? "damage");
  }

  const positions = shuffled([
    { x: 20, y: 29 },
    { x: 50, y: 25 },
    { x: 80, y: 31 },
    { x: 29, y: 68 },
    { x: 70, y: 66 },
  ]);

  return shuffled(roles).map((role, index) => ({
    id: `${round}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    x: (positions[index]?.x ?? 50) + randomBetween(-3, 3),
    y: (positions[index]?.y ?? 50) + randomBetween(-3, 3),
    size: randomBetween(66, 92),
    tilt: randomBetween(-12, 12),
  }));
}

export function getRoundLifetime(round: number): number {
  return Math.max(650, 1500 - round * 32);
}

export function scoreReaction(reactionMs: number, combo: number): number {
  const speedScore = Math.max(45, 150 - Math.floor(reactionMs / 12));
  const comboMultiplier = 1 + Math.min(combo, 12) * 0.055;
  return Math.round(speedScore * comboMultiplier);
}

export function rankReactionScore(score: number): { grade: string; title: string } {
  if (score >= 4200) return { grade: "S", title: "오버클럭 에이스" };
  if (score >= 3200) return { grade: "A", title: "정예 요원" };
  if (score >= 2200) return { grade: "B", title: "전술 요원" };
  if (score >= 1200) return { grade: "C", title: "훈련 통과" };
  return { grade: "D", title: "재보정 필요" };
}
