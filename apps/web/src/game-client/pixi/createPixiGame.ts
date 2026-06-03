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

type Layout = {
  width: number;
  height: number;
  topHudY: number;
  mapTop: number;
  mapHeight: number;
  boardX: number;
  boardY: number;
  boardWidth: number;
  boardHeight: number;
  bottomY: number;
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
  message: string;
};

const colors = {
  sky: 0x7bbf43,
  forestDark: 0x3f7d2c,
  forest: 0x5f9f38,
  grass: 0x6fbf45,
  grassLight: 0x87d957,
  field: 0x5dae36,
  fieldLight: 0x72c84a,
  dirt: 0xe7c46b,
  dirtDark: 0xae7d38,
  wood: 0x6e4a2f,
  panel: 0x604a3d,
  panelDark: 0x3f302a,
  white: 0xffffff,
  black: 0x1c1a16,
  red: 0xd94b4b,
  blue: 0x2f7fd5,
  yellow: 0xffd84a,
  orange: 0xff9f1c,
  green: 0x45b85f,
  purple: 0x9b5de5,
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

function layout(width: number, height: number): Layout {
  const safeTop = 10;
  const bottomY = height - 132;
  const mapTop = 82;
  const mapHeight = Math.max(510, bottomY - mapTop - 8);
  const boardWidth = width - 76;
  const boardHeight = Math.min(370, mapHeight * 0.52);
  const boardX = 38;
  const boardY = mapTop + Math.max(142, mapHeight * 0.28);
  return { width, height, topHudY: safeTop, mapTop, mapHeight, boardX, boardY, boardWidth, boardHeight, bottomY };
}

function addAnim(refs: GameRefs, anim: Omit<Animation, "age">) {
  refs.animations.push({ ...anim, age: 0 });
}

function gradeColor(grade?: string) {
  if (grade === "legendary") return colors.yellow;
  if (grade === "epic") return colors.purple;
  if (grade === "rare") return colors.blue;
  return colors.white;
}

function drawBackground(refs: GameRefs, l: Layout) {
  clear(refs.world);

  const bg = new Graphics();
  bg.rect(0, 0, l.width, l.height);
  bg.fill(colors.sky);
  refs.world.addChild(bg);

  for (let i = 0; i < 42; i += 1) {
    const x = (i * 47) % l.width;
    const y = 34 + ((i * 29) % Math.max(80, l.height - 170));
    const tree = new Graphics();
    tree.circle(x, y, 22 + (i % 3) * 4);
    tree.fill({ color: i % 2 ? colors.forest : colors.forestDark, alpha: 0.9 });
    tree.circle(x + 16, y + 9, 18);
    tree.fill({ color: colors.forest, alpha: 0.9 });
    refs.world.addChild(tree);
  }

  const road = new Graphics();
  const left = 18;
  const right = l.width - 18;
  const top = l.mapTop + 100;
  const middle = l.mapTop + l.mapHeight * 0.47;
  const bottom = l.mapTop + l.mapHeight - 118;
  road.moveTo(right, top);
  road.lineTo(left, top);
  road.lineTo(left, middle);
  road.lineTo(right, middle);
  road.lineTo(right, bottom);
  road.lineTo(left, bottom);
  road.stroke({ color: colors.dirtDark, width: 42, alpha: 1 });
  road.stroke({ color: colors.dirt, width: 34, alpha: 1 });
  refs.world.addChild(road);

  const boardShadow = panel(l.boardWidth + 14, l.boardHeight + 14, colors.wood, 0x4f3424, 18);
  boardShadow.x = l.boardX - 7;
  boardShadow.y = l.boardY - 7;
  refs.world.addChild(boardShadow);

  const field = panel(l.boardWidth, l.boardHeight, colors.field, 0x4f7d2a, 16);
  field.x = l.boardX;
  field.y = l.boardY;
  refs.world.addChild(field);

  const fieldGlow = new Graphics();
  fieldGlow.roundRect(l.boardX + 8, l.boardY + 8, l.boardWidth - 16, l.boardHeight - 16, 12);
  fieldGlow.fill({ color: colors.fieldLight, alpha: 0.18 });
  refs.world.addChild(fieldGlow);
}

function drawTopHud(refs: GameRefs, l: Layout) {
  clear(refs.hud);

  const waveBox = panel(150, 58, colors.panel, 0x3b2d26, 12);
  waveBox.x = l.width / 2 - 75;
  waveBox.y = l.topHudY;
  refs.hud.addChild(waveBox);
  const wave = text(`WAVE ${refs.state.currentWave}`, 18, colors.white);
  wave.anchor.set(0.5, 0);
  wave.x = l.width / 2;
  wave.y = l.topHudY + 7;
  refs.hud.addChild(wave);
  const timer = text(refs.state.currentWave % 5 === 0 ? "BOSS" : "00:30", 20, refs.state.currentWave % 5 === 0 ? colors.red : colors.white);
  timer.anchor.set(0.5, 0);
  timer.x = l.width / 2;
  timer.y = l.topHudY + 30;
  refs.hud.addChild(timer);

  const hpBg = panel(l.width - 92, 24, 0x4d2228, 0x2f1519, 12);
  hpBg.x = 46;
  hpBg.y = l.topHudY + 66;
  refs.hud.addChild(hpBg);
  const hpRatio = Math.max(0, Math.min(1, refs.state.lives / 20));
  const hp = new Graphics();
  hp.roundRect(50, l.topHudY + 70, (l.width - 100) * hpRatio, 16, 8);
  hp.fill({ color: colors.red, alpha: 1 });
  refs.hud.addChild(hp);
  const hpText = text(`${refs.state.lives} / 20`, 16, colors.white);
  hpText.anchor.set(0.5, 0);
  hpText.x = l.width / 2;
  hpText.y = l.topHudY + 67;
  refs.hud.addChild(hpText);

  const coin = text(`${refs.state.resources}`, 22, colors.yellow);
  coin.x = 24;
  coin.y = l.bottomY - 32;
  refs.hud.addChild(coin);
  const score = text(`${refs.state.score}`, 18, colors.white);
  score.x = l.width - 132;
  score.y = l.bottomY - 30;
  refs.hud.addChild(score);
}

function drawBoard(refs: GameRefs, l: Layout) {
  clear(refs.board);
  const gap = 8;
  const cols = 4;
  const rows = 4;
  const cell = Math.min((l.boardWidth - 34 - gap * (cols - 1)) / cols, (l.boardHeight - 32 - gap * (rows - 1)) / rows);
  const startX = l.boardX + (l.boardWidth - cell * cols - gap * (cols - 1)) / 2;
  const startY = l.boardY + 18;

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

function button(label: string, sub: string, w: number, h: number, color: number, onTap: () => void) {
  const c = new Container();
  c.eventMode = "static";
  c.cursor = "pointer";
  const bg = panel(w, h, color, 0x51351e, 14);
  c.addChild(bg);
  const s = text(sub, 12, colors.black);
  s.x = 16;
  s.y = 9;
  c.addChild(s);
  const t = text(label, 22, colors.white);
  t.anchor.set(0.5, 0);
  t.x = w / 2;
  t.y = 31;
  c.addChild(t);
  c.on("pointertap", () => {
    c.scale.set(0.96);
    window.setTimeout(() => c.scale.set(1), 80);
    onTap();
  });
  return c;
}

function drawControls(refs: GameRefs, l: Layout) {
  clear(refs.controls);

  const summonW = l.width * 0.54;
  const summon = button("소환", `${Math.max(10, 10 + refs.state.summonCount * 2)}`, summonW, 82, colors.yellow, () => summonAction(refs));
  summon.x = (l.width - summonW) / 2;
  summon.y = l.height - 108;
  refs.controls.addChild(summon);

  const left = button("일반", "합성", 96, 64, 0x516478, () => mergeByGrade(refs, "normal"));
  left.x = 20;
  left.y = l.height - 100;
  refs.controls.addChild(left);

  const right = button("희귀", "합성", 96, 64, 0x516478, () => mergeByGrade(refs, "rare"));
  right.x = l.width - 116;
  right.y = l.height - 100;
  refs.controls.addChild(right);

  const wave = button("웨이브", "START", 104, 48, colors.orange, () => waveAction(refs));
  wave.x = l.width - 124;
  wave.y = l.mapTop + 105;
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

function spawnMonsters(refs: GameRefs) {
  const l = layout(refs.app.renderer.width, refs.app.renderer.height);
  const count = refs.state.currentWave % 5 === 0 ? 1 : 7;
  for (let i = 0; i < count; i += 1) {
    const monster = new Graphics();
    const boss = refs.state.currentWave % 5 === 0;
    const size = boss ? 22 : 12;
    monster.roundRect(-size, -size, size * 2, size * 1.8, size * 0.4);
    monster.fill({ color: boss ? 0x8b5e34 : 0x54b336, alpha: 1 });
    monster.stroke({ color: 0x2b331d, width: 2 });
    monster.x = l.width - 36 - i * 18;
    monster.y = l.mapTop + 110;
    refs.effects.addChild(monster);

    addAnim(refs, {
      duration: 900 + i * 90,
      update: (p) => {
        const phase = p * 3;
        if (phase < 1) {
          monster.x = l.width - 36 - (l.width - 72) * phase;
          monster.y = l.mapTop + 110;
        } else if (phase < 2) {
          monster.x = 36;
          monster.y = l.mapTop + 110 + (l.mapHeight * 0.44) * (phase - 1);
        } else {
          monster.x = 36 + (l.width - 72) * (phase - 2);
          monster.y = l.mapTop + 110 + l.mapHeight * 0.44;
        }
        monster.rotation = Math.sin(p * 24) * 0.08;
      },
      done: () => monster.destroy(),
    });
  }
}

function summonAction(refs: GameRefs) {
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
        drawBoard(refs, layout(refs.app.renderer.width, refs.app.renderer.height));
      },
    });
  }
}

function mergeByGrade(refs: GameRefs, grade: HeroGrade) {
  const result = mergeHeroes(refs.state, grade, refs.random);
  refs.state = result.state;
  refs.flashBoard = Boolean(result.mergedHero);
  render(refs);
  floatText(refs, result.mergedHero ? "합성!" : "3명 필요", refs.app.renderer.width / 2, refs.app.renderer.height * 0.55, result.mergedHero ? colors.yellow : colors.red);
  if (result.mergedHero) {
    addAnim(refs, {
      duration: 520,
      update: (p) => {
        if (p > 0.65) refs.flashBoard = false;
        drawBoard(refs, layout(refs.app.renderer.width, refs.app.renderer.height));
      },
    });
  }
}

function waveAction(refs: GameRefs) {
  spawnMonsters(refs);
  const result = completeCurrentWave(startWave(refs.state));
  window.setTimeout(() => {
    refs.state = result.state;
    render(refs);
    floatText(refs, `+${result.reward}`, refs.app.renderer.width / 2, refs.app.renderer.height - 132, colors.green);
  }, 620);
}

function render(refs: GameRefs) {
  const l = layout(refs.app.renderer.width, refs.app.renderer.height);
  drawBackground(refs, l);
  drawTopHud(refs, l);
  drawBoard(refs, l);
  drawControls(refs, l);
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
    message: "",
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
