import { Container, Graphics } from "pixi.js";
import type { GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";
import { makePixiText } from "./pixiSharedView";
import { calculateLobbyBattleReward } from "./pixiLobbyBattleRewards";

function createButton(label: string, x: number, y: number, width: number, fill: number, onTap: () => void) {
  const root = new Container();
  const bg = new Graphics();
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
  root.on("pointertap", onTap);
  return root;
}

export function showFinalResultPanel(refs: GameRefs) {
  if (refs.state.status !== "failed" && refs.state.status !== "cleared") return;

  refs.menu?.destroy({ children: true });

  const reward = calculateLobbyBattleReward(refs.state);
  const width = Math.min(360, refs.app.renderer.width - 36);
  const height = 310;
  const x = refs.app.renderer.width / 2 - width / 2;
  const y = refs.app.renderer.height / 2 - height / 2;
  const panel = new Container();
  const dim = new Graphics();
  dim.rect(0, 0, refs.app.renderer.width, refs.app.renderer.height);
  dim.fill({ color: 0x000000, alpha: 0.42 });

  const bg = new Graphics();
  bg.roundRect(0, 0, width, height, 26);
  bg.fill({ color: refs.state.status === "cleared" ? 0x815b35 : 0x63333a, alpha: 0.98 });
  bg.stroke({ color: 0x261713, width: 5, alpha: 0.95 });

  const title = makePixiText(refs.state.status === "cleared" ? "클리어!" : "전투 종료", 30, refs.state.status === "cleared" ? colors.yellow : 0xff9aa5);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 22;

  const wave = makePixiText(`도달 웨이브 ${refs.state.currentWave} / 처치 ${refs.state.defeatedEnemies}`, 17, colors.white);
  wave.anchor.set(0.5, 0);
  wave.x = width / 2;
  wave.y = 78;

  const boss = makePixiText(`보스 처치 ${refs.state.defeatedBosses} · 점수 ${refs.state.score}`, 16, 0xffeed2);
  boss.anchor.set(0.5, 0);
  boss.x = width / 2;
  boss.y = 106;

  const rewardTitle = makePixiText("로비 보상", 18, colors.yellow);
  rewardTitle.anchor.set(0.5, 0);
  rewardTitle.x = width / 2;
  rewardTitle.y = 148;

  const rewardText = makePixiText(`골드 +${reward.gold}   보석 +${reward.crystals}`, 20, colors.green);
  rewardText.anchor.set(0.5, 0);
  rewardText.x = width / 2;
  rewardText.y = 176;

  const retryButton = createButton("다시 도전", 24, height - 66, Math.floor((width - 60) / 2), 0xf2a12b, () => {
    window.location.reload();
  });
  const lobbyButton = createButton("로비로", width / 2 + 6, height - 66, Math.floor((width - 60) / 2), 0x39a3b5, () => {
    window.location.href = "/lobby";
  });

  panel.x = x;
  panel.y = y;
  panel.addChild(bg, title, wave, boss, rewardTitle, rewardText, retryButton, lobbyButton);

  const root = new Container();
  root.addChild(dim, panel);
  refs.menuLayer.addChild(root);
  refs.menu = root;
}
