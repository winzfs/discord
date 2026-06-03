import { Application, Container, Graphics, Text } from "pixi.js";
import {
  completeCurrentWave,
  createInitialGameState,
  createSeededRandom,
  mergeHeroes,
  startWave,
  summonHero,
} from "@discord-random-defense/game";
import type { GameState, HeroGrade } from "@discord-random-defense/game";

export type PixiGameHandle = {
  cleanup: () => void;
};

type GameRefs = {
  app: Application;
  stage: Container;
  hud: Container;
  lane: Container;
  board: Container;
  controls: Container;
  messageText: Text;
  state: GameState;
  random: ReturnType<typeof createSeededRandom>;
};

const palette = {
  bg: 0x08111f,
  panel: 0x101b31,
  panelLight: 0x1f3358,
  blue: 0x38bdf8,
  orange: 0xf97316,
  yellow: 0xfbbf24,
  green: 0x86efac,
  red: 0xfb7185,
  white: 0xf8fafc,
  muted: 0x94a3b8,
};

function makeText(text: string, size = 18, color = palette.white, weight: "normal" | "bold" = "bold") {
  return new Text({
    text,
    style: {
      fill: color,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: weight,
    },
  });
}

function roundedRect(width: number, height: number, color: number, alpha = 1, strokeColor = 0x263955) {
  const graphics = new Graphics();
  graphics.roundRect(0, 0, width, height, 18);
  graphics.fill({ color, alpha });
  graphics.stroke({ color: strokeColor, alpha: 0.8, width: 2 });
  return graphics;
}

function clear(container: Container) {
  container.removeChildren();
}

function createButton(label: string, subLabel: string, width: number, height: number, color: number, onTap: () => void) {
  const button = new Container();
  button.eventMode = "static";
  button.cursor = "pointer";

  const bg = roundedRect(width, height, color, 1, 0xffffff);
  button.addChild(bg);

  const top = makeText(subLabel, 11, color === palette.orange ? 0x7c2d12 : palette.blue, "bold");
  top.x = 12;
  top.y = 8;
  button.addChild(top);

  const text = makeText(label, 16, color === palette.orange ? 0x111827 : palette.white, "bold");
  text.x = 12;
  text.y = 25;
  button.addChild(text);

  button.on("pointertap", onTap);
  return button;
}

function drawHud(refs: GameRefs, width: number) {
  clear(refs.hud);
  const state = refs.state;
  const itemWidth = Math.max(68, (width - 24) / 5);
  const labels = [
    ["WAVE", `${state.currentWave}/30`, palette.blue],
    ["CORE", `${state.lives}`, palette.red],
    ["COIN", `${state.resources}`, palette.yellow],
    ["SCORE", `${state.score}`, palette.green],
    ["STATE", state.status.toUpperCase(), palette.white],
  ] as const;

  labels.forEach(([label, value, valueColor], index) => {
    const box = roundedRect(itemWidth - 6, 58, palette.panel, 0.96, 0x2b4264);
    box.x = 12 + index * itemWidth;
    box.y = 10;
    refs.hud.addChild(box);

    const labelText = makeText(label, 10, palette.muted, "bold");
    labelText.x = box.x + 10;
    labelText.y = 18;
    refs.hud.addChild(labelText);

    const valueText = makeText(value, index === 3 ? 14 : 18, valueColor, "bold");
    valueText.x = box.x + 10;
    valueText.y = 34;
    refs.hud.addChild(valueText);
  });
}

function drawLane(refs: GameRefs, width: number, height: number) {
  clear(refs.lane);
  const top = 82;
  const laneHeight = Math.max(170, height * 0.26);
  const bg = roundedRect(width - 24, laneHeight, 0x0b1426, 0.98, 0x244466);
  bg.x = 12;
  bg.y = top;
  refs.lane.addChild(bg);

  const title = makeText(refs.state.currentWave % 5 === 0 ? "BOSS WAVE" : "BUG WAVE", 22, refs.state.currentWave % 5 === 0 ? palette.red : palette.blue, "bold");
  title.x = 28;
  title.y = top + 18;
  refs.lane.addChild(title);

  const track = new Graphics();
  track.roundRect(28, top + 80, width - 56, 34, 18);
  track.fill({ color: 0x050816, alpha: 0.86 });
  track.stroke({ color: 0x385d8f, alpha: 0.9, width: 2 });
  refs.lane.addChild(track);

  const progress = Math.min(0.88, Math.max(0.08, refs.state.currentWave / 30));
  const enemy = new Graphics();
  enemy.circle(0, 0, refs.state.currentWave % 5 === 0 ? 24 : 18);
  enemy.fill({ color: refs.state.currentWave % 5 === 0 ? palette.red : palette.orange, alpha: 1 });
  enemy.stroke({ color: palette.white, alpha: 0.35, width: 2 });
  enemy.x = 28 + (width - 56) * progress;
  enemy.y = top + 97;
  refs.lane.addChild(enemy);

  const core = roundedRect(92, 58, 0x082f49, 1, palette.blue);
  core.x = width - 122;
  core.y = top + laneHeight - 76;
  refs.lane.addChild(core);

  const coreText = makeText("CORE", 16, palette.blue, "bold");
  coreText.x = core.x + 20;
  coreText.y = core.y + 18;
  refs.lane.addChild(coreText);

  refs.messageText.text = refs.messageText.text || "랜덤 호출로 서버 코어를 방어해.";
  refs.messageText.x = 28;
  refs.messageText.y = top + laneHeight - 62;
  refs.messageText.style.fontSize = 15;
  refs.messageText.style.wordWrap = true;
  refs.messageText.style.wordWrapWidth = width - 170;
  refs.lane.addChild(refs.messageText);
}

function drawBoard(refs: GameRefs, width: number, height: number) {
  clear(refs.board);
  const boardSize = Math.min(width - 24, height * 0.48);
  const startX = (width - boardSize) / 2;
  const startY = Math.max(260, height * 0.37);
  const gap = 8;
  const cell = (boardSize - gap * 3) / 4;

  const title = makeText("SQUAD BOARD", 15, palette.muted, "bold");
  title.x = startX;
  title.y = startY - 34;
  refs.board.addChild(title);

  refs.state.board.forEach((slot, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const x = startX + col * (cell + gap);
    const y = startY + row * (cell + gap);
    const color = slot ? 0x17223a : 0x0b1222;
    const stroke = slot?.grade === "legendary" ? palette.yellow : slot?.grade === "epic" ? 0xc084fc : slot?.grade === "rare" ? palette.blue : 0x334155;

    const cellBg = new Graphics();
    cellBg.roundRect(x, y, cell, cell, 16);
    cellBg.fill({ color, alpha: 0.96 });
    cellBg.stroke({ color: stroke, alpha: slot ? 0.95 : 0.5, width: slot ? 3 : 2 });
    refs.board.addChild(cellBg);

    if (slot) {
      const orb = new Graphics();
      orb.circle(x + cell / 2, y + cell * 0.42, cell * 0.23);
      orb.fill({ color: stroke, alpha: 0.95 });
      refs.board.addChild(orb);

      const label = makeText(slot.grade.toUpperCase(), 10, palette.white, "bold");
      label.anchor.set(0.5);
      label.x = x + cell / 2;
      label.y = y + cell * 0.76;
      refs.board.addChild(label);
    } else {
      const empty = makeText("+", 30, 0x475569, "bold");
      empty.anchor.set(0.5);
      empty.x = x + cell / 2;
      empty.y = y + cell / 2;
      refs.board.addChild(empty);
    }
  });
}

function drawControls(refs: GameRefs, width: number, height: number) {
  clear(refs.controls);
  const bottom = height - 88;
  const gap = 7;
  const buttonWidth = (width - 24 - gap * 3) / 4;
  const buttonHeight = 64;

  const actions = [
    ["호출", "CALL", palette.orange, () => {
      const result = summonHero(refs.state, refs.random);
      refs.state = result.state;
      refs.messageText.text = result.summonedHero ? "영웅 호출 완료!" : "호출 실패. 코인이나 슬롯을 확인해.";
      render(refs);
    }],
    ["일반", "MERGE", palette.panelLight, () => mergeByGrade(refs, "normal")],
    ["희귀", "MERGE", palette.panelLight, () => mergeByGrade(refs, "rare")],
    ["방어", "WAVE", palette.blue, () => {
      const result = completeCurrentWave(startWave(refs.state));
      refs.state = result.state;
      refs.messageText.text = result.state.status === "cleared" ? "30웨이브 클리어!" : `${result.wave?.waveNumber ?? "?"}웨이브 방어 성공!`;
      render(refs);
    }],
  ] as const;

  actions.forEach(([label, sub, color, action], index) => {
    const button = createButton(label, sub, buttonWidth, buttonHeight, color, action);
    button.x = 12 + index * (buttonWidth + gap);
    button.y = bottom;
    refs.controls.addChild(button);
  });
}

function mergeByGrade(refs: GameRefs, grade: HeroGrade) {
  const result = mergeHeroes(refs.state, grade, refs.random);
  refs.state = result.state;
  refs.messageText.text = result.mergedHero ? "팀합 성공! 상위 영웅 등장." : "같은 등급 3명이 필요해.";
  render(refs);
}

function render(refs: GameRefs) {
  const width = refs.app.renderer.width;
  const height = refs.app.renderer.height;
  drawHud(refs, width);
  drawLane(refs, width, height);
  drawBoard(refs, width, height);
  drawControls(refs, width, height);
}

export function createPixiGame(parent: HTMLElement): PixiGameHandle {
  const app = new Application();
  const stage = new Container();
  const refs = {
    app,
    stage,
    hud: new Container(),
    lane: new Container(),
    board: new Container(),
    controls: new Container(),
    messageText: makeText("랜덤 호출로 서버 코어를 방어해.", 15, palette.white, "bold"),
    state: createInitialGameState(`pixi-${Date.now()}`),
    random: createSeededRandom(`pixi-${Date.now()}`),
  } satisfies GameRefs;

  let destroyed = false;

  async function init() {
    await app.init({
      background: palette.bg,
      resizeTo: parent,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    if (destroyed) {
      app.destroy(true);
      return;
    }

    parent.appendChild(app.canvas);
    app.stage.addChild(stage);
    stage.addChild(refs.hud, refs.lane, refs.board, refs.controls);
    render(refs);
    app.renderer.on("resize", () => render(refs));
  }

  void init();

  return {
    cleanup: () => {
      destroyed = true;
      app.destroy(true, { children: true });
    },
  };
}
