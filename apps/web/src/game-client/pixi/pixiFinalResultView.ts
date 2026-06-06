import { Container, Graphics } from "pixi.js";
import { initialBalance } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";
import { makePixiText } from "./pixiSharedView";
import { calculateLobbyBattleReward } from "./pixiLobbyBattleRewards";

function createButton(label: string, x: number, y: number, width: number, fill: number, onTap: () => void) {
  const root = new Container();
  const bg = new Graphics();
  bg.roundRect(2, 5, width, 46, 16);
  bg.fill({ color: 0x000000, alpha: 0.22 });
  bg.roundRect(0, 0, width, 46, 16);
  bg.fill({ color: fill, alpha: 1 });
  bg.stroke({ color: 0x261713, width: 3, alpha: 0.9 });

  const text = makePixiText(label, 17, colors.white);
  text.anchor.set(0.5, 0.5);
  text.x = width / 2;
  text.y = 23;

  root.addChild(bg, text);
  root.x = x;
  root.y = y;
  root.eventMode = "static";
  root.cursor = "pointer";
  root.on("pointerdown", (event) => event.stopPropagation());
  root.on("pointertap", (event) => {
    event.stopPropagation();
    onTap();
  });
  return root;
}

function createStatCard(label: string, value: string, x: number, y: number, width: number) {
  const root = new Container();
  const bg = new Graphics();
  bg.roundRect(0, 0, width, 58, 14);
  bg.fill({ color: 0x3b251f, alpha: 0.72 });
  bg.stroke({ color: 0xffe1a0, width: 2, alpha: 0.14 });

  const labelText = makePixiText(label, 12, 0xffdfad);
  labelText.anchor.set(0.5, 0);
  labelText.x = width / 2;
  labelText.y = 8;

  const valueText = makePixiText(value, 18, colors.white);
  valueText.anchor.set(0.5, 0);
  valueText.x = width / 2;
  valueText.y = 28;

  root.x = x;
  root.y = y;
  root.addChild(bg, labelText, valueText);
  return root;
}

function createRewardCard(label: string, value: string, x: number, y: number, width: number, fill: number) {
  const root = new Container();
  const bg = new Graphics();
  bg.roundRect(2, 4, width, 54, 16);
  bg.fill({ color: 0x000000, alpha: 0.2 });
  bg.roundRect(0, 0, width, 54, 16);
  bg.fill({ color: fill, alpha: 0.95 });
  bg.stroke({ color: 0x2b1a15, width: 3, alpha: 0.86 });

  const labelText = makePixiText(label, 12, 0xfff1d0);
  labelText.anchor.set(0.5, 0);
  labelText.x = width / 2;
  labelText.y = 7;

  const valueText = makePixiText(value, 20, colors.white);
  valueText.anchor.set(0.5, 0);
  valueText.x = width / 2;
  valueText.y = 26;

  root.x = x;
  root.y = y;
  root.addChild(bg, labelText, valueText);
  return root;
}

function getResultGrade(refs: GameRefs) {
  if (refs.state.status !== "cleared") return { label: "C", color: 0xff8d9b, message: "다음엔 더 멀리 갈 수 있어!" };
  if (refs.state.lives >= initialBalance.startingLives) return { label: "S", color: colors.yellow, message: "완벽 방어! 최고의 전투였어" };
  if (refs.state.clearedWaves >= initialBalance.maxWave) return { label: "A", color: 0x8dffbf, message: "작전 성공! 모든 웨이브 클리어" };
  return { label: "B", color: 0x9ed8ff, message: "좋은 전투였어" };
}

function getStars(refs: GameRefs) {
  if (refs.state.status === "failed") return "★☆☆";
  if (refs.state.lives >= initialBalance.startingLives) return "★★★";
  return refs.state.lives >= Math.ceil(initialBalance.startingLives * 0.5) ? "★★☆" : "★☆☆";
}

export function showFinalResultPanel(refs: GameRefs) {
  if (refs.state.status !== "failed" && refs.state.status !== "cleared") return;

  refs.menu?.destroy({ children: true });

  const reward = calculateLobbyBattleReward(refs.state);
  const resultGrade = getResultGrade(refs);
  const width = Math.min(390, refs.app.renderer.width - 28);
  const height = 430;
  const x = refs.app.renderer.width / 2 - width / 2;
  const y = refs.app.renderer.height / 2 - height / 2;
  const panel = new Container();
  const dim = new Graphics();
  dim.rect(0, 0, refs.app.renderer.width, refs.app.renderer.height);
  dim.fill({ color: 0x000000, alpha: 0.5 });

  const glow = new Graphics();
  glow.circle(width / 2, 72, 128);
  glow.fill({ color: resultGrade.color, alpha: 0.18 });

  const bg = new Graphics();
  bg.roundRect(3, 8, width, height, 28);
  bg.fill({ color: 0x000000, alpha: 0.24 });
  bg.roundRect(0, 0, width, height, 28);
  bg.fill({ color: refs.state.status === "cleared" ? 0x835936 : 0x65343d, alpha: 0.98 });
  bg.stroke({ color: 0x261713, width: 5, alpha: 0.95 });
  bg.roundRect(12, 12, width - 24, 84, 22);
  bg.fill({ color: 0xffe7a8, alpha: refs.state.status === "cleared" ? 0.12 : 0.07 });

  const title = makePixiText(refs.state.status === "cleared" ? "작전 성공" : "전투 종료", 28, refs.state.status === "cleared" ? colors.yellow : 0xff9aa5);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 20;

  const gradeBadge = new Graphics();
  gradeBadge.circle(0, 0, 35);
  gradeBadge.fill({ color: resultGrade.color, alpha: 0.92 });
  gradeBadge.stroke({ color: 0x2b1a15, width: 4, alpha: 0.92 });
  gradeBadge.x = width / 2;
  gradeBadge.y = 89;

  const gradeText = makePixiText(resultGrade.label, 36, 0xffffff);
  gradeText.anchor.set(0.5, 0.5);
  gradeText.x = width / 2;
  gradeText.y = 88;

  const stars = makePixiText(getStars(refs), 22, colors.yellow);
  stars.anchor.set(0.5, 0);
  stars.x = width / 2;
  stars.y = 126;

  const message = makePixiText(resultGrade.message, 15, 0xfff1d0);
  message.anchor.set(0.5, 0);
  message.x = width / 2;
  message.y = 156;

  const statWidth = Math.floor((width - 52) / 3);
  const waveCard = createStatCard("웨이브", `${refs.state.clearedWaves}`, 18, 194, statWidth);
  const killCard = createStatCard("처치", `${refs.state.defeatedEnemies}`, 26 + statWidth, 194, statWidth);
  const scoreCard = createStatCard("점수", `${refs.state.score}`, 34 + statWidth * 2, 194, statWidth);

  const rewardTitle = makePixiText("획득 보상", 18, colors.yellow);
  rewardTitle.anchor.set(0.5, 0);
  rewardTitle.x = width / 2;
  rewardTitle.y = 268;

  const rewardWidth = Math.floor((width - 48) / 2);
  const goldCard = createRewardCard("골드", `+${reward.gold}`, 18, 300, rewardWidth, 0x9d6a28);
  const crystalCard = createRewardCard("보석", `+${reward.crystals}`, 30 + rewardWidth, 300, rewardWidth, 0x287f9d);

  const retryButton = createButton("다시 도전", 24, height - 62, Math.floor((width - 60) / 2), 0xf2a12b, () => {
    window.location.reload();
  });
  const lobbyButton = createButton("로비로", width / 2 + 6, height - 62, Math.floor((width - 60) / 2), 0x39a3b5, () => {
    window.location.href = "/lobby";
  });

  panel.x = x;
  panel.y = y;
  panel.eventMode = "static";
  panel.on("pointerdown", (event) => event.stopPropagation());
  panel.addChild(
    bg,
    glow,
    title,
    gradeBadge,
    gradeText,
    stars,
    message,
    waveCard,
    killCard,
    scoreCard,
    rewardTitle,
    goldCard,
    crystalCard,
    retryButton,
    lobbyButton,
  );

  const root = new Container();
  root.eventMode = "static";
  root.on("pointerdown", (event) => event.stopPropagation());
  root.addChild(dim, panel);
  refs.menuLayer.addChild(root);
  refs.menu = root;
}
