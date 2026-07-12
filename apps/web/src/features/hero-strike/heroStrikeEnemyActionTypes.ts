export type HeroStrikeEnemyActionKind =
  | "runner-dash"
  | "sniper-shot"
  | "bomber-blast";

export type HeroStrikeEnemyActionPhase =
  | "position"
  | "telegraph"
  | "attack"
  | "recover";

export type HeroStrikeEnemyActionRuntime = {
  kind: HeroStrikeEnemyActionKind;
  phase: HeroStrikeEnemyActionPhase;
  timer: number;
  phaseDuration: number;
  targetX: number;
  targetY: number;
  dashVx: number;
  dashVy: number;
  sequence: number;
};
