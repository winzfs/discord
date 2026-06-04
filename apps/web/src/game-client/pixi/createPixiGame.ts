import { Application, Container, Graphics, Text } from "pixi.js";
import {
  calculateBoardPower,
  completeCurrentWave,
  createInitialGameState,
  createSeededRandom,
  getSummonCost,
  startWave,
  summonHero,
} from "@discord-random-defense/game";
import type { GameState } from "@discord-random-defense/game";
import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { colors, gradeColor } from "./gameTheme";

export type PixiGameHandle = {
  cleanup: () => void;
};

type Animation = {
  age: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
};

type ButtonOptions = {
  disabled?: boolean;
  subFill?: number;
};

type GameRefs = {
  app: Application;
  stage: Container;
  world: Container;
  board: Container;
  hud: Container;
  controls: Container;
  effects: Container;
  state: GameState;
  random: ReturnType<typeof createSeededRandom>;
  animations: Animation[];
  lastSummonedIndex: number | null;
  flashBoard: boolean;
};

function text(value: string, size = 18, fill = colors.white, weight: "normal" | "bold" = "bold") {
  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: weight,
      stroke: { color: colors.black, width: size > 18 ? 4 : 2 },
    },
  });
}

function panel(w: number, h: number, fill: number, stroke = colors.panelDark, radius = 16) {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, radius);
  g.fill({ color: fill, alpha: 1 });
  g.stroke({ color: stroke, width: 3, alpha: 0.9 });
  return g;
}

function clear(c: Container) {
  c.removeChildren();
}

function addAnim(refs: GameRefs, anim: Omit<Animation, "age">) {
  refs.animations.push({ ...anim, age: 0 });
}

function isFinished(state: GameState) {
  return state.status === "failed" || state.status === "cleared";
}

function drawBackground(refs: GameRefs, layout: GameLayout) {
  clear(refs.world);

  const bg = new Graphics();
  bg.rect(0, 0, layout.width, layout.height);
  bg.fill(colors.sky);
  refs.world.addChild(bg);

  for (let i = 0; i < 42; i += 1) {
    const x = (i * 47) % layout.width;
    const y = 34 + ((i * 29) % Math.max(80, layout.height - 170));
    const tree = new Graphics();
    tree.circle(x, y, 22 + (i % 3) * 4);
    tree.fill({ color: i % 2 ? colors.forest : colors.forestDark, alpha: 0.9 });
    tree.circle(x + 16, y + 9, 18);
    tree.fill({ color: colors.forest, alpha: 0.9 });
    refs.world.addChild(tree);
  }

  const road = new Graphics();
  const left = 18;
  const right = layout.width - 18;
  const top = layout.mapTop + 100;
  const middle = layout.mapTop + layout.mapHeight * 0.47;
  const bottom = layout.mapTop + layout.mapHeight - 118;
  road.moveTo(right, top);
  road.lineTo(left, top);
  road.lineTo(left, middle);
  road.lineTo(right, middle);
  road.lineTo(right, bottom);
  road.lineTo(left, bottom);
  road.stroke({ color: colors.dirtDark, width: 42, alpha: 1 });
  road.stroke({ color: colors.dirt, width: 34, alpha: 1 });
  refs.world.addChild(road);

  const boardShadow = panel(layout.boardWidth + 14, layout.boardHeight + 14, colors.wood, 0x4f3424, 18);
  boardShadow.x = layout.boardX - 7;
  boardShadow.y = layout.boardY - 7;
  refs.world.addChild(boardShadow);

  const field = panel(layout.boardWidth, layout.boardHeight, colors.field, 0x4f7d2a, 16);
  field.x = layout.boardX;
  field.y = layout.boardY;
  refs.world.addChild(field);

  const fieldGlow = new Graphics();
  fieldGlow.roundRect(layout.boardX + 8, layout.boardY + 8, layout.boardWidth - 16, layout.boardHeight - 16, 12);
  fieldGlow.fill({ color: colors.fieldLight, alpha: 0.18 });
  refs.world.addChild(fieldGlow);
}

function drawTopHud(refs: GameRefs, layout: GameLayout) {
  clear(refs.hud);

  const waveBox = panel(150, 58, colors.panel, 0x3b2d26, 12);
  waveBox.x = layout.width / 2 - 75;
  waveBox.y = layout.topHudY;
  refs.hud.addChild(waveBox);

  const wave = text(`WAVE ${refs.state.currentWave}`, 18, colors.white);
  wave.anchor.set(0.5, 0);
  wave.x = layout.width / 2;
  wave.y = layout.topHudY + 7;
  refs.hud.addChild(wave);

  const isBossWave = refs.state.currentWave % 5 === 0;
  const timer = text(isBossWave ? "BOSS" : "00:30", 20, isBossWave ? colors.red : colors.white);
  timer.anchor.set(0.5, 0);
  timer.x = layout.width / 2;
  timer.y = layout.topHudY + 30;
  refs.hud.addChild(timer);

  const hpBg = panel(layout.width - 92, 24, 0x4d2228, 0x2f1519, 12);
  hpBg.x = 46;
  hpBg.y = layout.topHudY + 66;
  refs.hud.addChild(hpBg);

  const hpRatio = Math.max(0, Math.min(1, refs.state.lives / 100));
  const hp = new Graphics();
  hp.roundRect(50, layout.topHudY + 70, (layout.width - 100) * hpRatio, 16, 8);
  hp.fill({ color: colors.red, alpha: 1 });
  refs.hud.addChild(hp);

  const hpText = text(`${refs.state.lives} / 100`, 16, colors.white);
  hpText.anchor.set(0.5, 0);
  hpText.x = layout.width / 2;
  hpText.y = layout.topHudY + 67;
  refs.hud.addChild(hpText);

  const boardPower = calculateBoardPower(refs.state);
  const unitCount = refs.state.board.filter(Boolean).length;

  const power = text(`전투력 ${boardPower.totalPower}`, 15, colors.white);
  power.x = 22;
  power.y = layout.topHudY + 98;
  refs.hud.addChild(power);

  const units = text(`${unitCount} / ${refs.state.board.length}`, 15, colors.white);
  units.x = layout.width - 82;
  units.y = layout.topHudY + 98;
  refs.hud.addChild(units);

  const coin = text(`${refs.state.resources}`, 22, colors.yellow);
  coin.x = 24;
  coin.y = layout.bottomY - 32;
  refs.hud.addChild(coin);

  const score = text(`${refs.state.score}`, 18, colors.white);
  score.x = layout.width - 132;
  score.y = layout.bottomY - 30;
  refs.hud.addChild(score);
}

function drawBoard(refs: GameRefs, layout: GameLayout) {
  clear(refs.board);
  const gap = 7;
  const cols = refs.state.boardSize.columns;
  const rows = refs.state.boardSize.rows;
  const cell = Math.min((layout.boardWidth - 34 - gap * (cols - 1)) / cols, (layout.boardHeight - 32 - gap * (rows - 1)) / rows);
  const startX = layout.boardX + (layout.boardWidth - cell * cols - gap * (cols - 1)) / 2;
  const startY = layout.boardY + 16;

  refs.state.board.forEach((slot, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = startX + col * (cell + gap);
    const y = startY + row * (cell + gap);
    const isNew = refs.lastSummonedIndex === index;
    const pulse = isNew ? 1.08 : 1;
    const inset = (cell * (pulse - 1)) / 2;
    const g = new Graphics();
    g.roundRect(x - inset, y - inset, cell * pulse, cell * pulse, 12);
    g.fill({ color: slot ? 0x6ac144 : 0x539832, alpha: slot ? 0.96 : 0.45 });
    g.stroke({ color: slot ? gradeColor(slot.grade) : 0x3e7629, width: slot ? 3 : 2, alpha: refs.flashBoard && slot ? 1 : 0.85 });
    refs.board.addChild(g);

    if (!slot) return;

    const shadow = new Graphics();
    shadow.ellipse(x + cell / 2, y + cell * 0.74, cell * 0.24, cell * 0.08);
    shadow.fill({ color: 0x244f1e, alpha: 0.35 });
    refs.board.addChild(shadow);

    const body = new Graphics();
    body.circle(x + cell / 2, y + cell * 0.46, cell * 0.22);
    body.fill({ color: gradeColor(slot.grade), alpha: 1 });
    body.stroke({ color: colors.black, width: 3, alpha: 0.5 });
    refs.board.addChild(body);

    const head = new Graphics();
    head.circle(x + cell / 2, y + cell * 0.28, cell * 0.16);
    head.fill({ color: 0xffd0a6, alpha: 1 });
    head.stroke({ color: colors.black, width: 2, alpha: 0.5 });
    refs.board.addChild(head);

    const label = text(slot.grade[0].toUpperCase(), 13, colors.white);
    label.anchor.set(0.5);
    label.x = x + cell / 2;
    label.y = y + cell * 0.88;
    refs.board.addChild(label);
  });
}

function button(label: string, sub: string, w: number, h: number, color: number, onTap: () => void, options: ButtonOptions = {}) {
  const disabled = Boolean(options.disabled);
  const c = new Container();
  c.eventMode = disabled ? "none" : "static";
  c.cursor = disabled ? "default" : "pointer";

  const bg = panel(w, h, disabled ? 0x6f6259 : color, disabled ? 0x3d332e : 0x51351e, 14);
  bg.alpha = disabled ? 0.72 : 1;
  c.addChild(bg);

  const s = text(sub, 12, options.subFill ?? (disabled ? 0x2d2825 : colors.black));
  s.x = 16;
  s.y = 9;
  s.alpha = disabled ? 0.75 : 1;
  c.addChild(s);

  const t = text(label, 22, disabled ? 0xd0c6bc : colors.white);
  t.anchor.set(0.5, 0);
  t.x = w / 2;
  t.y = 31;
  t.alpha = disabled ? 0.78 : 1;
  c.addChild(t);

  if (!disabled) {
    c.on("pointertap", () => {
      c.scale.set(0.96);
      window.setTimeout(() => c.scale.set(1), 80);
      onTap();
    });
  }

  return c;
}

function getSummonButtonState(state: GameState) {
  const cost = getSummonCost(state.summonCount);
  const boardFull = state.board.every(Boolean);
  const disabled = isFinished(state) || boardFull || state.resources < cost;

  if (state.status === "failed") return { cost, disabled, sub: "게임 오버" };
  if (state.status === "cleared") return { cost, disabled, sub: "클리어" };
  if (boardFull) return { cost, disabled, sub: "보드 가득" };
  if (state.resources < cost) return { cost, disabled, sub: `부족 ${cost}` };
  return { cost, disabled, sub: `${cost}` };
}

function drawControls(refs: GameRefs, layout: GameLayout) {
  clear(refs.controls);

  const summonState = getSummonButtonState(refs.state);
  const summonW = layout.width * 0.52;
  const summon = button("소환", summonState.sub, summonW, 82, colors.yellow, () => summonAction(refs), {
    disabled: summonState.disabled,
    subFill: summonState.disabled ? 0x3b3127 : colors.black,
  });
  summon.x = (layout.width - summonW) / 2;
  summon.y = layout.height - 108;
  refs.controls.addChild(summon);

  const mythic = button("신화", "조합", 92, 68, colors.orange, () => featureAction(refs, "신화 조합은 다음 단계에서 열려요"), {
    disabled: isFinished(refs.state),
  });
  mythic.x = 18;
  mythic.y = layout.height - 104;
  refs.controls.addChild(mythic);

  const gamble = button("도박", "1회", 92, 68, colors.blue, () => featureAction(refs, "도박 소환은 다음 단계에서 열려요"), {
    disabled: isFinished(refs.state),
  });
  gamble.x = layout.width - 110;
  gamble.y = layout.height - 104;
  refs.controls.addChild(gamble);

  const upgrade = button("강화", "공격력", 148, 42, 0x47584a, () => featureAction(refs, "공격력 강화는 다음 단계에서 열려요"), {
    disabled: isFinished(refs.state),
  });
  upgrade.x = (layout.width - 148) / 2;
  upgrade.y = layout.height - 154;
  refs.controls.addChild(upgrade);

  const wave = button("웨이브", "START", 104, 48, colors.orange, () => waveAction(refs), {
    disabled: isFinished(refs.state),
  });
  wave.x = layout.width - 124;
  wave.y = layout.mapTop + 105;
  refs.controls.addChild(wave);
}

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const t = text(value, 22, color);
  t.anchor.set(0.5);
  t.x = x;
  t.y = y;
  refs.effects.addChild(t);
  addAnim(refs, {
    duration: 700,
    update: (p) => {
      t.y = y - p * 46;
      t.alpha = 1 - p;
      t.scale.set(1 + p * 0.2);
    },
    done: () => t.destroy(),
  });
}

function featureAction(refs: GameRefs, message: string) {
  floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.white);
}

function spawnMonsters(refs: GameRefs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const count = refs.state.currentWave % 5 === 0 ? 1 : 7;
  for (let i = 0; i < count; i += 1) {
    const monster = new Graphics();
    const boss = refs.state.currentWave % 5 === 0;
    const size = boss ? 22 : 12;
    monster.roundRect(-size, -size, size * 2, size * 1.8, size * 0.4);
    monster.fill({ color: boss ? 0x8b5e34 : 0x54b336, alpha: 1 });
    monster.stroke({ color: 0x2b331d, width: 2 });
    monster.x = layout.width - 36 - i * 18;
    monster.y = layout.mapTop + 110;
    refs.effects.addChild(monster);

    addAnim(refs, {
      duration: 900 + i * 90,
      update: (p) => {
        const phase = p * 3;
        if (phase < 1) {
          monster.x = layout.width - 36 - (layout.width - 72) * phase;
          monster.y = layout.mapTop + 110;
        } else if (phase < 2) {
          monster.x = 36;
          monster.y = layout.mapTop + 110 + layout.mapHeight * 0.44 * (phase - 1);
        } else {
          monster.x = 36 + (layout.width - 72) * (phase - 2);
          monster.y = layout.mapTop + 110 + layout.mapHeight * 0.44;
        }
        monster.rotation = Math.sin(p * 24) * 0.08;
      },
      done: () => monster.destroy(),
    });
  }
}

function summonAction(refs: GameRefs) {
  const summonState = getSummonButtonState(refs.state);
  if (summonState.disabled) {
    floatText(refs, summonState.sub, refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.red);
    return;
  }

  const index = refs.state.board.findIndex((slot) => slot === null);
  const result = summonHero(refs.state, refs.random);
  refs.state = result.state;
  refs.lastSummonedIndex = result.summonedHero ? index : null;
  render(refs);
  floatText(refs, result.summonedHero ? "소환!" : "실패", refs.app.renderer.width / 2, refs.app.renderer.height - 140, result.summonedHero ? colors.yellow : colors.red);
  if (result.summonedHero) {
    addAnim(refs, {
      duration: 420,
      update: (p) => {
        if (p > 0.8) refs.lastSummonedIndex = null;
        drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
      },
    });
  }
}

function getWaveResultMessage(result: ReturnType<typeof completeCurrentWave>): { label: string; color: number } {
  if (result.state.status === "failed") {
    return { label: `패배... -${result.lostLives} HP`, color: colors.red };
  }

  if (result.lostLives > 0) {
    const leakedCount = result.leakedEnemies.reduce((sum, group) => sum + group.count, 0);
    return { label: `누수 ${leakedCount}마리  -${result.lostLives} HP`, color: colors.orange };
  }

  return { label: "완벽 방어!", color: colors.green };
}

function waveAction(refs: GameRefs) {
  if (isFinished(refs.state)) {
    floatText(refs, refs.state.status === "cleared" ? "이미 클리어!" : "게임 오버", refs.app.renderer.width / 2, refs.app.renderer.height * 0.42, refs.state.status === "cleared" ? colors.green : colors.red);
    return;
  }

  spawnMonsters(refs);
  const result = completeCurrentWave(startWave(refs.state));
  window.setTimeout(() => {
    refs.state = result.state;
    render(refs);
    const waveMessage = getWaveResultMessage(result);
    floatText(refs, waveMessage.label, refs.app.renderer.width / 2, refs.app.renderer.height * 0.38, waveMessage.color);
    floatText(refs, `전투력 ${result.boardPower} / 위협도 ${result.waveThreat}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.46, colors.white);
    floatText(refs, `+${result.reward}`, refs.app.renderer.width / 2, refs.app.renderer.height - 132, colors.green);
  }, 620);
}

function render(refs: GameRefs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  drawBackground(refs, layout);
  drawTopHud(refs, layout);
  drawBoard(refs, layout);
  drawControls(refs, layout);
}

function tick(refs: GameRefs, deltaMs: number) {
  refs.animations = refs.animations.filter((a) => {
    a.age += deltaMs;
    const p = Math.min(1, a.age / a.duration);
    a.update(p);
    if (p >= 1) {
      a.done?.();
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
    world: new Container(),
    board: new Container(),
    hud: new Container(),
    controls: new Container(),
    effects: new Container(),
    state: createInitialGameState(seed),
    random: createSeededRandom(seed),
    animations: [],
    lastSummonedIndex: null,
    flashBoard: false,
  } satisfies GameRefs;

  let destroyed = false;

  async function init() {
    await app.init({
      background: colors.sky,
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
    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects);
    render(refs);
    app.renderer.on("resize", () => render(refs));
    app.ticker.add((ticker) => tick(refs, ticker.deltaMS));
  }

  void init();

  return {
    cleanup: () => {
      destroyed = true;
      app.destroy(true, { children: true });
    },
  };
}
