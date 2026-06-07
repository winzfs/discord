import { Container, Graphics, Text } from "pixi.js";
import type { BoardHero, HeroGrade } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { getCellCenter } from "./pixiBoardRuntime";
import { colors } from "./gameTheme";
import { addPixiAnimation } from "./animation/animationManager";

export type UnitRevealFxKind = "summon" | "gamble" | "merge" | "mythic";

const gradeColors: Record<HeroGrade, number> = {
  common: 0xffffff,
  rare: 0x64c7ff,
  epic: 0xb778ff,
  legendary: 0xffd34d,
  mythic: 0xff5fd2,
};

const gradeLabels: Record<HeroGrade, string> = {
  common: "일반",
  rare: "희귀",
  epic: "영웅",
  legendary: "전설",
  mythic: "신화",
};

function makeFxText(value: string, fill: number) {
  const text = new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: 16,
      fontWeight: "900",
      stroke: { color: colors.black, width: 4 },
    },
  });
  text.anchor.set(0.5);
  return text;
}

function kindLabel(kind: UnitRevealFxKind, grade: HeroGrade) {
  if (kind === "mythic") return "신화 조합!";
  if (kind === "merge") return `${gradeLabels[grade]} 승급!`;
  if (kind === "gamble") return `${gradeLabels[grade]} 획득!`;
  return `${gradeLabels[grade]} 소환!`;
}

export function showUnitRevealFx(refs: GameRefs, hero: BoardHero | null | undefined, kind: UnitRevealFxKind) {
  if (!hero) return;
  const cellIndex = hero.position.row * refs.state.boardSize.columns + hero.position.column;
  const center = getCellCenter(refs, cellIndex);
  const tint = gradeColors[hero.grade] ?? colors.yellow;
  const root = new Container();
  const ring = new Graphics();
  const burst = new Graphics();
  const text = makeFxText(kindLabel(kind, hero.grade), tint);
  const baseRadius = Math.max(20, center.cell * 0.43);
  const duration = kind === "summon" ? 620 : kind === "gamble" ? 760 : 920;

  root.x = center.x;
  root.y = center.y;
  text.y = -baseRadius - 18;
  root.addChild(burst, ring, text);
  refs.effects.addChild(root);

  addPixiAnimation(refs.animations, {
    duration,
    update: (progress) => {
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const pulse = Math.sin(progress * Math.PI);
      const radius = baseRadius * (0.58 + easeOut * (kind === "summon" ? 0.78 : 1.12));
      const alpha = Math.max(0, 1 - progress);

      ring.clear();
      ring.circle(0, 0, radius);
      ring.stroke({ color: tint, width: 5 + pulse * 4, alpha: 0.9 * alpha });
      ring.circle(0, 0, radius * 0.58);
      ring.stroke({ color: 0xffffff, width: 2, alpha: 0.65 * alpha });

      burst.clear();
      burst.circle(0, 0, radius * 0.7);
      burst.fill({ color: tint, alpha: 0.18 * alpha });
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        const inner = radius * 0.34;
        const outer = radius * (0.86 + pulse * 0.18);
        burst.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        burst.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      }
      burst.stroke({ color: tint, width: 3, alpha: 0.55 * alpha });

      root.scale.set(0.84 + pulse * 0.18);
      text.alpha = Math.min(1, alpha * 1.4);
      text.y = -baseRadius - 18 - easeOut * 18;
    },
    done: () => root.destroy({ children: true }),
  });
}
