import { HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { NormalEnemyKind } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export type FormationUnit = {
  kind: NormalEnemyKind;
  x: number;
  y: number;
};

type FormationFactory = (stageIndex: number) => FormationUnit[];

const center = HERO_STRIKE_WIDTH / 2;

const FORMATIONS: readonly FormationFactory[] = [
  (stage) => [
    { kind: stage >= 4 ? "weaver" : "runner", x: center, y: -34 },
    { kind: "drone", x: center - 52, y: -58 },
    { kind: "drone", x: center + 52, y: -58 },
    { kind: "runner", x: center - 98, y: -86 },
    { kind: "runner", x: center + 98, y: -86 },
  ],
  (stage) => [
    { kind: stage >= 5 ? "sniper" : "drone", x: 46, y: -44 },
    { kind: "runner", x: 86, y: -78 },
    { kind: stage >= 5 ? "sniper" : "drone", x: HERO_STRIKE_WIDTH - 46, y: -44 },
    { kind: "runner", x: HERO_STRIKE_WIDTH - 86, y: -78 },
  ],
  (stage) => [
    { kind: stage >= 3 ? "tank" : "drone", x: center, y: -36 },
    { kind: "drone", x: center, y: -92 },
    { kind: "runner", x: center, y: -144 },
    { kind: "runner", x: center, y: -192 },
  ],
  (stage) => [
    { kind: stage >= 6 ? "bomber" : "tank", x: center, y: -42 },
    { kind: "weaver", x: center - 60, y: -82 },
    { kind: "weaver", x: center + 60, y: -82 },
    { kind: "runner", x: center - 112, y: -118 },
    { kind: "runner", x: center + 112, y: -118 },
  ],
  (stage) => [
    { kind: stage >= 7 ? "bomber" : "tank", x: center, y: -48 },
    { kind: "drone", x: center - 72, y: -54 },
    { kind: "drone", x: center + 72, y: -54 },
    { kind: "sniper", x: center - 126, y: -94 },
    { kind: "sniper", x: center + 126, y: -94 },
  ],
];

export function getNextFormation(state: HeroStrikeState) {
  const offset = Math.max(0, state.waveIndex - 1) + state.stageIndex;
  const index = (state.formationIndex + offset) % FORMATIONS.length;
  state.formationIndex += 1;
  return FORMATIONS[index](state.stageIndex);
}

export function getFormationInterval(state: HeroStrikeState) {
  const waveReduction = (state.waveIndex - 1) * 0.75;
  const stageReduction = Math.min(1.8, state.stageIndex * 0.16);
  return Math.max(6.8, 10.8 - waveReduction - stageReduction + Math.random() * 1.8);
}
