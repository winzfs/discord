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

type Animation = {
  age: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
};

type GameRefs = {
  app: Application;
  stage: Container;
  background: Container;
  hud: Container;
  lane: Container;
  board: Container;
  controls: Container;
  effects: Container;
  messageText: Text;
  state: GameState;
  random: ReturnType<typeof createSeededRandom>;
  animations: Animation[];
  lastSummonedIndex: number | null;
  flashBoard: boolean;
};

const palette = {
  bg: 0x050816,
  panel: 0x101b31,
  panelLight: 0x1f3358,
  blue: 0x38bdf8,
  orange: 0xf97316,
  yellow: 0xfbbf24,
  green: 0x86efac,
  red: 0xfb7185,
  purple: 0xc084fc,
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

function roundedRect(width: number, height: number, color: number, alpha = 1, strokeColor = 0x263955, radius = 18) {
  const graphics = new Graphics();
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color, alpha });
  graphics.stroke({ color: strokeColor, alpha: 0.85, width: 2 });
  return graphics;
}

function clear(container: Container) {
  container.removeChildren();
}

function addAnimation(refs: GameRefs, animation: Omit<Animation, "age">) {
  refs.animations.push({ ...animation, age: 0 });
}

function getGradeColor(grade?: string) {
  if (grade === "legendary") return palette.yellow;
  if (grade === "epic") return palette.purple;
  if (grade === "rare") return palette.blue;
  return 0x94a3b8;
}

function createButton(label: string, subLabel: string, width: number, height: number, color: number, onTap: () => void) {
  const button = new Container();
  button.eventMode = "static";
  button.cursor = "pointer";

  const bg = roundedRect(width, height, color, 1, 0xffffff, 16);
  button.addChild(bg);

  const top = makeText(subLabel, 10, color === palette.orange ? 0x7c2d12 : palette.blue, "bold");
  top.x = 12;
  top.y = 8;
  button.addChild(top);

  const text = makeText(label, 15, color === palette.orange ? 0x111827 : palette.white, "bold");
  text.x = 12;
  text.y = 25;
  button.addChild(text);

  button.on("pointertap", () => {
    button.scale.set(0.96);
    window.setTimeout(() => button.scale.set(1), 80);
    onTap();
  });

  return button;
}

function drawBackground(refs: GameRefs, width: number, height: number) {
  clear(refs.background);
  const bg = new Graphics();
  bg.rect(0, 0, width, height);
  bg.fill({ color: palette.bg, alpha: 1 });
  refs.background.addChild(bg);

  for (let x = 0; x < width; x += 32) {
    const line = new Graphics();
    line.moveTo(x, 0);
    line.lineTo(x, height);
    line.stroke({ color: 0x1e3a5f, alpha: 0.16, width: 1 });
    refs.background.addChild(line);
  }

  for (let y = 0; y < height; y += 32) {
    const line = new Graphics();
    line.moveTo(0, y);
    line.lineTo(width, y);
    line.stroke({ color: 0x1e3a5f, alpha: 0.12, width: 1 });
    refs.background.addChild(line);
  }
}

function drawHud(refs: GameRefs, width: number) {
  clear(refs.hud);
  const state = refs.state;
  const itemWidth = Math.max(64, (width - 24) / 5);
  const labels = [
    ["WAVE", `${state.currentWave}/30`, palette.blue],
    ["CORE", `${state.lives}`, palette.red],
    ["COIN", `${state.resources}`, palette.yellow],
    ["SCORE", `${state.score}`, palette.green],
    ["STATE", state.status.toUpperCase(), palette.white],
  ] as const;

  labels.forEach(([label, value, valueColor], index) => {
    const box = roundedRect(itemWidth - 6, 58, palette.panel, 0.96, 0x2b4264, 15);
    box.x = 12 + index * itemWidth;
    box.y = 10;
    refs.hud.addChild(box);

    const labelText = makeText(label, 10, palette.muted, "bold");
    labelText.x = box.x + 10;
    labelText.y = 18;
    refs.hud.addChild(labelText);

    const valueText = makeText(value, index === 3 ? 13 : 17, valueColor, "bold");
    valueText.x = box.x + 10;
    valueText.y = 34;
    refs.hud.addChild(valueText);
  });
}

function drawLane(refs: GameRefs, width: number, height: number) {
  clear(refs.lane);
  const top = 82;
  const laneHeight = Math.max(172, Math.min(235, height * 0.27));
  const bg = roundedRect(width - 24, laneHeight, 0x0b1426, 0.98, 0x244466, 24);
  bg.x = 12;
  bg.y = top;
  refs.lane.addChild(bg);

  const title = makeText(refs.state.currentWave % 5 === 0 ? "BOSS WAVE" : "BUG WAVE", 22, refs.state.currentWave % 5 === 0 ? palette.red : palette.blue, "bold");
  title.x = 28;
  title.y = top + 18;
  refs.lane.addChild(title);

  const gate = roundedRect(78, 42, 0x2a0f1a, 0.9, palette.red, 14);
  gate.x = 26;
  gate.y = top + 68;
  refs.lane.addChild(gate);
  const gateText = makeText("GATE", 12, palette.red, "bold");
  gateText.x = gate.x + 20;
  gateText.y = gate.y + 13;
  refs.lane.addChild(gateText);

  const core = roundedRect(88, 52, 0x082f49, 1, palette.blue, 14);
  core.x = width - 116;
  core.y = top + 62;
  refs.lane.addChild(core);
  const coreText = makeText("CORE", 14, palette.blue, "bold");
  coreText.x = core.x + 22;
  coreText.y = core.y + 16;
  refs.lane.addChild(coreText);

  const trackY = top + 136;
  const track = new Graphics();
  track.roundRect(28, trackY, width - 56, 30, 16);
  track.fill({ color: 0x050816, alpha: 0.86 });
  track.stroke({ color: 0x385d8f, alpha: 0.9, width: 2 });
  refs.lane.addChild(track);

  const progress = Math.min(0.88, Math.max(0.08, refs.state.currentWave / 30));
  const marker = new Graphics();
  marker.circle(0, 0, 9);
  marker.fill({ color: palette.orange, alpha: 0.85 });
  marker.x = 28 + (width - 56) * progress;
  marker.y = trackY + 15;
  refs.lane.addChild(marker);

  refs.messageText.x = 28;
  refs.messageText.y = top + laneHeight - 44;
  refs.messageText.style.fontSize = 14;
  refs.messageText.style.wordWrap = true;
  refs.messageText.style.wordWrapWidth = width - 56;
  refs.lane.addChild(refs.messageText);
}

function drawBoard(refs: GameRefs, width: number, height: number) {
  clear(refs.board);
  const boardSize = Math.min(width - 28, height * 0.47);
  const startX = (width - boardSize) / 2;
  const startY = Math.max(280, height * 0.39);
  const gap = 8;
  const cell = (boardSize - gap * 3) / 4;

  const title = makeText("SQUAD BOARD", 14, palette.muted, "bold");
  title.x = startX;
  title.y = startY - 34;
  refs.board.addChild(title);

  refs.state.board.forEach((slot, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const x = startX + col * (cell + gap);
    const y = startY + row * (cell + gap);
    const stroke = getGradeColor(slot?.grade);
    const isNew = refs.lastSummonedIndex === index;
    const scale = isNew ? 1.08 : 1;
    const inset = (cell * (scale - 1)) / 2;

    const cellBg = new Graphics();
    cellBg.roundRect(x - inset, y - inset, cell * scale, cell * scale, 16);
    cellBg.fill({ color: slot ? 0x17223a : 0x0b1222, alpha: 0.98 });
    cellBg.stroke({ color: refs.flashBoard && slot ? palette.white : stroke, alpha: slot ? 0.96 : 0.45, width: slot ? 3 : 2 });
    refs.board.addChild(cellBg);

    if (slot) {
      const glow = new Graphics();
      glow.circle(x + cell / 2, y + cell * 0.39, cell * 0.27);
      glow.fill({ color: stroke, alpha: 0.24 });
      refs.board.addChild(glow);

      const hero = new Graphics();
      hero.circle(x + cell / 2, y + cell * 0.39, cell * 0.2);
      hero.fill({ color: stroke, alpha: 1 });
      hero.stroke({ color: palette.white, alpha: 0.42, width: 2 });
      refs.board.addChild(hero);

      const label = makeText(slot.grade.toUpperCase(), 10, palette.white, "bold");
      label.anchor.set(0.5);
      label.x = x + cell / 2;
      label.y = y + cell * 0.76;
      refs.board.addChild(label);
    } else {
      const empty = makeText("+", 28, 0x475569, "bold");
      empty.anchor.set(0.5);
      empty.x = x + cell / 2;
      empty.y = y + cell / 2;
      refs.board.addChild(empty);
    }
  });
}

function drawControls(refs: GameRefs, width: number, height: number) {
  clear(refs.controls);
  const bottom = height - 86;
  const gap = 7;
  const buttonWidth = (width - 24 - gap * 3) / 4;
  const buttonHeight = 62;

  const actions = [
    ["호출", "CALL", palette.orange, () => summonAction(refs)],
    ["일반", "MERGE", palette.panelLight, () => mergeByGrade(refs, "normal")],
    ["희귀", "MERGE", palette.panelLight, () => mergeByGrade(refs, "rare")],
    ["방어", "WAVE", palette.blue, () => waveAction(refs)],
  ] as const;

  actions.forEach(([label, sub, color, action], index) => {
    const button = createButton(label, sub, buttonWidth, buttonHeight, color, action);
    button.x = 12 + index * (buttonWidth + gap);
    button.y = bottom;
    refs.controls.addChild(button);
  });
}

function showFloatText(refs: GameRefs, text: string, x: number, y: number, color = palette.white) {
  const label = makeText(text, 20, color, "bold");
  label.anchor.set(0.5);
  label.x = x;
  label.y = y;
  refs.effects.addChild(label);
  addAnimation(refs, {
    duration: 650,
    update: (progress) => {
      label.y = y - progress * 42;
      label.alpha = 1 - progress;
      label.scale.set(1 + progress * 0.25);
    },
    done: () => label.destroy(),
  });
}

function spawnEnemyRun(refs: GameRefs) {
  const width = refs.app.renderer.width;
  const top = 82;
  const y = top + 151;
  const enemy = new Graphics();
  const isBoss = refs.state.currentWave % 5 === 0;
  enemy.circle(0, 0, isBoss ? 25 : 17);
  enemy.fill({ color: isBoss ? palette.red : palette.orange, alpha: 1 });
  enemy.stroke({ color: palette.white, alpha: 0.38, width: 2 });
  enemy.x = 44;
  enemy.y = y;
  refs.effects.addChild(enemy);
  addAnimation(refs, {
    duration: 760,
    update: (progress) => {
      enemy.x = 44 + (width - 118) * progress;
      enemy.rotation += 0.08;
      enemy.scale.set(1 + Math.sin(progress * Math.PI) * 0.22);
    },
    done: () => enemy.destroy(),
  });
}

function summonAction(refs: GameRefs) {
  const before = refs.state.board.findIndex((slot) => slot === null);
  const result = summonHero(refs.state, refs.random);
  refs.state = result.state;
  refs.lastSummonedIndex = result.summonedHero ? before : null;
  refs.messageText.text = result.summonedHero ? "지원 영웅 호출 완료!" : "호출 실패. 코인이나 슬롯을 확인해.";
  render(refs);
  if (result.summonedHero) {
    showFloatText(refs, "CALL!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.38, palette.orange);
    addAnimation(refs, {
      duration: 420,
      update: (progress) => {
        if (progress > 0.85) refs.lastSummonedIndex = null;
        drawBoard(refs, refs.app.renderer.width, refs.app.renderer.height);
      },
    });
  }
}

function mergeByGrade(refs: GameRefs, grade: HeroGrade) {
  const result = mergeHeroes(refs.state, grade, refs.random);
  refs.state = result.state;
  refs.flashBoard = Boolean(result.mergedHero);
  refs.messageText.text = result.mergedHero ? "팀합 성공! 상위 영웅 등장." : "같은 등급 3명이 필요해.";
  render(refs);
  if (result.mergedHero) {
    showFloatText(refs, "MERGE!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.5, palette.yellow);
    addAnimation(refs, {
      duration: 480,
      update: (progress) => {
        if (progress > 0.65) refs.flashBoard = false;
        drawBoard(refs, refs.app.renderer.width, refs.app.renderer.height);
      },
    });
  }
}

function waveAction(refs: GameRefs) {
  spawnEnemyRun(refs);
  const result = completeCurrentWave(startWave(refs.state));
  refs.state = result.state;
  refs.messageText.text = result.state.status === "cleared" ? "30웨이브 클리어!" : `${result.wave?.waveNumber ?? "?"}웨이브 방어 성공!`;
  window.setTimeout(() => {
    render(refs);
    showFloatText(refs, `+${result.reward} COIN`, refs.app.renderer.width * 0.72, 130, palette.green);
  }, 420);
}

function render(refs: GameRefs) {
  const width = refs.app.renderer.width;
  const height = refs.app.renderer.height;
  drawBackground(refs, width, height);
  drawHud(refs, width);
  drawLane(refs, width, height);
  drawBoard(refs, width, height);
  drawControls(refs, width, height);
}

function tickAnimations(refs: GameRefs, deltaMs: number) {
  refs.animations = refs.animations.filter((animation) => {
    animation.age += deltaMs;
    const progress = Math.min(1, animation.age / animation.duration);
    animation.update(progress);
    if (progress >= 1) {
      animation.done?.();
      return false;
    }
    return true;
  });
}

export function createPixiGame(parent: HTMLElement): PixiGameHandle {
  const app = new Application();
  const stage = new Container();
  const seed = `pixi-${Date.now()}`;
  const refs = {
    app,
    stage,
    background: new Container(),
    hud: new Container(),
    lane: new Container(),
    board: new Container(),
    controls: new Container(),
    effects: new Container(),
    messageText: makeText("랜덤 호출로 서버 코어를 방어해.", 15, palette.white, "bold"),
    state: createInitialGameState(seed),
    random: createSeededRandom(seed),
    animations: [],
    lastSummonedIndex: null,
    flashBoard: false,
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
    stage.addChild(refs.background, refs.lane, refs.board, refs.hud, refs.controls, refs.effects);
    render(refs);
    app.renderer.on("resize", () => render(refs));
    app.ticker.add((ticker) => tickAnimations(refs, ticker.deltaMS));
  }

  void init();

  return {
    cleanup: () => {
      destroyed = true;
      app.destroy(true, { children: true });
    },
  };
}
