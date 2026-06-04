import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";
import {
  calculateBoardPower,
  canMergeStackCell,
  completeCurrentWave,
  craftMythicHero,
  createInitialGameState,
  createSeededRandom,
  getAllBoardHeroes,
  getBoardCapacity,
  getBoardUnitCount,
  getHeroById,
  getMythicCraftAvailability,
  getPowerUpgradeCost,
  getSummonCost,
  getWaveByNumber,
  isBoardFull,
  mergeStackedCell,
  startWave,
  summonHero,
  upgradeAttack,
} from "@discord-random-defense/game";
import type { BoardHero, GameState, HeroRole, WaveProgressResult } from "@discord-random-defense/game";
import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { colors, gradeColor } from "./gameTheme";

export type PixiGameHandle = { cleanup: () => void };

type Animation = { age: number; duration: number; update: (progress: number) => void; done?: () => void };
type Phase = "countdown" | "combat" | "result";
type Refs = {
  app: Application;
  stage: Container;
  world: Container;
  board: Container;
  hud: Container;
  controls: Container;
  effects: Container;
  menuLayer: Container;
  state: GameState;
  random: ReturnType<typeof createSeededRandom>;
  animations: Animation[];
  phase: Phase;
  nextWaveTimer: number;
  combatTimer: number;
  fireTimer: number;
  resultTimer: number;
  lastSummonedIndex: number | null;
  menu: Container | null;
};

const WAVE_COUNTDOWN = 6;
const COMBAT_TIME = 5;
const RESULT_TIME = 1.4;

function text(value: string, size = 18, fill: number = colors.white) {
  return new Text({ text: value, style: { fill, fontFamily: "Arial, sans-serif", fontSize: size, fontWeight: "bold", stroke: { color: colors.black, width: size > 18 ? 4 : 2 } } });
}

function panel(w: number, h: number, fill: number, stroke: number = colors.panelDark, radius = 16) {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, radius);
  g.fill({ color: fill, alpha: 1 });
  g.stroke({ color: stroke, width: 3, alpha: 0.9 });
  return g;
}

function clear(c: Container) { c.removeChildren(); }
function done(state: GameState) { return state.status === "failed" || state.status === "cleared"; }
function bossWave(state: GameState) { return state.currentWave % 5 === 0; }
function addAnim(refs: Refs, anim: Omit<Animation, "age">) { refs.animations.push({ ...anim, age: 0 }); }
function clearMenu(refs: Refs) { if (refs.menu) refs.menu.destroy({ children: true }); refs.menu = null; }

function metrics(refs: Refs, layout: GameLayout) {
  const gap = 7;
  const cols = refs.state.boardSize.columns;
  const rows = refs.state.boardSize.rows;
  const cell = Math.min((layout.boardWidth - 34 - gap * (cols - 1)) / cols, (layout.boardHeight - 32 - gap * (rows - 1)) / rows);
  return { cols, rows, cell, gap, startX: layout.boardX + (layout.boardWidth - cell * cols - gap * (cols - 1)) / 2, startY: layout.boardY + 16 };
}

function cellCenter(refs: Refs, index: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const m = metrics(refs, layout);
  const row = Math.floor(index / m.cols);
  const col = index % m.cols;
  return { x: m.startX + col * (m.cell + m.gap) + m.cell / 2, y: m.startY + row * (m.cell + m.gap) + m.cell * 0.48, cell: m.cell };
}

function indexFromHero(state: GameState, hero: BoardHero | null) {
  return hero ? hero.position.row * state.boardSize.columns + hero.position.column : null;
}

function roleColor(role?: HeroRole) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

function drawHero(target: Container, hero: BoardHero, cell: number, scale = 1) {
  const def = getHeroById(hero.heroId);
  const role = def?.role ?? "damage";
  const accent = roleColor(role);
  const shadow = new Graphics();
  shadow.ellipse(0, cell * 0.25 * scale, cell * 0.22 * scale, cell * 0.06 * scale);
  shadow.fill({ color: 0x244f1e, alpha: 0.28 });
  target.addChild(shadow);

  if (role === "support") {
    const aura = new Graphics();
    aura.circle(0, 0, cell * 0.31 * scale);
    aura.stroke({ color: accent, width: 3 * scale, alpha: 0.58 });
    target.addChild(aura);
  }

  const body = new Graphics();
  if (role === "tank") body.roundRect(-cell * 0.24 * scale, -cell * 0.1 * scale, cell * 0.48 * scale, cell * 0.42 * scale, cell * 0.12 * scale);
  else if (role === "support") body.circle(0, cell * 0.02 * scale, cell * 0.2 * scale);
  else body.moveTo(0, -cell * 0.24 * scale).lineTo(cell * 0.24 * scale, cell * 0.2 * scale).lineTo(-cell * 0.24 * scale, cell * 0.2 * scale).lineTo(0, -cell * 0.24 * scale);
  body.fill({ color: gradeColor(hero.grade), alpha: 1 });
  body.stroke({ color: colors.black, width: 3 * scale, alpha: 0.64 });
  target.addChild(body);

  const head = new Graphics();
  head.circle(0, -cell * 0.2 * scale, cell * 0.13 * scale);
  head.fill({ color: 0xffd0a6, alpha: 1 });
  head.stroke({ color: colors.black, width: 2 * scale, alpha: 0.58 });
  target.addChild(head);

  if (role === "damage") {
    const mark = new Graphics();
    mark.roundRect(cell * 0.08 * scale, -cell * 0.02 * scale, cell * 0.25 * scale, cell * 0.07 * scale, cell * 0.03 * scale);
    mark.fill({ color: 0x2f2f35, alpha: 1 });
    target.addChild(mark);
  }

  if (hero.grade === "mythic") {
    const halo = new Graphics();
    halo.circle(0, -cell * 0.04 * scale, cell * 0.36 * scale);
    halo.stroke({ color: colors.yellow, width: 4 * scale, alpha: 0.8 });
    target.addChild(halo);
  }
}

function pathPoint(layout: GameLayout, progress: number) {
  const left = 36;
  const right = layout.width - 36;
  const y1 = layout.mapTop + 110;
  const y2 = layout.mapTop + 110 + layout.mapHeight * 0.44;
  const y3 = layout.mapTop + layout.mapHeight - 118;
  const phase = Math.max(0, Math.min(1, progress)) * 5;
  if (phase < 1) return { x: right - (right - left) * phase, y: y1 };
  if (phase < 2) return { x: left, y: y1 + (y2 - y1) * (phase - 1) };
  if (phase < 3) return { x: left + (right - left) * (phase - 2), y: y2 };
  if (phase < 4) return { x: right, y: y2 + (y3 - y2) * (phase - 3) };
  return { x: right - (right - left) * (phase - 4), y: y3 };
}

function drawBackground(refs: Refs, layout: GameLayout) {
  clear(refs.world);
  const bg = new Graphics();
  bg.rect(0, 0, layout.width, layout.height);
  bg.fill(colors.sky);
  refs.world.addChild(bg);

  for (let i = 0; i < 34; i += 1) {
    const tree = new Graphics();
    const x = (i * 53) % layout.width;
    const y = 36 + ((i * 31) % Math.max(80, layout.height - 190));
    tree.circle(x, y, 20 + (i % 3) * 4);
    tree.fill({ color: i % 2 ? colors.forest : colors.forestDark, alpha: 0.88 });
    refs.world.addChild(tree);
  }

  const road = new Graphics();
  const first = pathPoint(layout, 0);
  road.moveTo(first.x, first.y);
  for (let i = 1; i <= 80; i += 1) {
    const p = pathPoint(layout, i / 80);
    road.lineTo(p.x, p.y);
  }
  road.stroke({ color: colors.dirtDark, width: 44, alpha: 1 });
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
}

function drawHud(refs: Refs, layout: GameLayout) {
  clear(refs.hud);
  const waveBox = panel(164, 62, bossWave(refs.state) ? 0x5a2327 : colors.panel, bossWave(refs.state) ? colors.red : 0x3b2d26, 12);
  waveBox.x = layout.width / 2 - 82;
  waveBox.y = layout.topHudY;
  refs.hud.addChild(waveBox);
  const wave = text(`WAVE ${refs.state.currentWave}`, 18, colors.white);
  wave.anchor.set(0.5, 0);
  wave.x = layout.width / 2;
  wave.y = layout.topHudY + 7;
  refs.hud.addChild(wave);
  const timerLabel = refs.phase === "combat" ? `${Math.ceil(refs.combatTimer)}s` : refs.phase === "result" ? "RESULT" : `${Math.ceil(refs.nextWaveTimer)}s`;
  const timer = text(bossWave(refs.state) ? `BOSS ${timerLabel}` : `AUTO ${timerLabel}`, 19, bossWave(refs.state) ? colors.red : colors.white);
  timer.anchor.set(0.5, 0);
  timer.x = layout.width / 2;
  timer.y = layout.topHudY + 32;
  refs.hud.addChild(timer);

  const hpBg = panel(layout.width - 92, 24, 0x4d2228, 0x2f1519, 12);
  hpBg.x = 46;
  hpBg.y = layout.topHudY + 68;
  refs.hud.addChild(hpBg);
  const hpRatio = Math.max(0, Math.min(1, refs.state.lives / 100));
  const hp = new Graphics();
  hp.roundRect(50, layout.topHudY + 72, (layout.width - 100) * hpRatio, 16, 8);
  hp.fill({ color: colors.red, alpha: 1 });
  refs.hud.addChild(hp);
  const hpText = text(`${refs.state.lives} / 100`, 15, colors.white);
  hpText.anchor.set(0.5, 0);
  hpText.x = layout.width / 2;
  hpText.y = layout.topHudY + 69;
  refs.hud.addChild(hpText);

  const power = text(`전투력 ${calculateBoardPower(refs.state).totalPower}`, 15, colors.white);
  power.x = 22;
  power.y = layout.topHudY + 100;
  refs.hud.addChild(power);
  const units = text(`${getBoardUnitCount(refs.state.board)} / ${getBoardCapacity(refs.state.board)}`, 15, colors.white);
  units.x = layout.width - 96;
  units.y = layout.topHudY + 100;
  refs.hud.addChild(units);
  const coin = text(`코인 ${refs.state.resources}`, 18, colors.yellow);
  coin.x = 24;
  coin.y = layout.bottomY - 34;
  refs.hud.addChild(coin);
  const luck = text(`행운석 ${refs.state.luckStones}`, 16, colors.blue);
  luck.x = 24;
  luck.y = layout.bottomY - 58;
  refs.hud.addChild(luck);
  const score = text(`${refs.state.score}`, 18, colors.white);
  score.x = layout.width - 132;
  score.y = layout.bottomY - 30;
  refs.hud.addChild(score);
}

function drawBoard(refs: Refs, layout: GameLayout) {
  clear(refs.board);
  const m = metrics(refs, layout);
  refs.state.board.forEach((boardCell, index) => {
    const row = Math.floor(index / m.cols);
    const col = index % m.cols;
    const x = m.startX + col * (m.cell + m.gap);
    const y = m.startY + row * (m.cell + m.gap);
    const units = boardCell.units;
    const canMerge = canMergeStackCell(refs.state, index);
    const pulse = refs.lastSummonedIndex === index ? 1.08 : 1;
    const inset = (m.cell * (pulse - 1)) / 2;
    const g = new Graphics();
    g.roundRect(x - inset, y - inset, m.cell * pulse, m.cell * pulse, 12);
    g.fill({ color: units.length > 0 ? 0x6ac144 : 0x539832, alpha: units.length > 0 ? 0.96 : 0.45 });
    g.stroke({ color: canMerge ? colors.yellow : units[0] ? gradeColor(units[0].grade) : 0x3e7629, width: canMerge ? 4 : units.length > 0 ? 3 : 2, alpha: 0.92 });
    refs.board.addChild(g);

    units.forEach((unit, unitIndex) => {
      const offsets = [{ x: 0, y: units.length === 3 ? -m.cell * 0.15 : 0, s: units.length === 1 ? 1 : 0.76 }, { x: -m.cell * 0.17, y: m.cell * 0.13, s: 0.76 }, { x: m.cell * 0.17, y: m.cell * 0.13, s: 0.76 }];
      const offset = offsets[unitIndex] ?? offsets[0];
      const marker = new Container();
      marker.x = x + m.cell / 2 + offset.x;
      marker.y = y + m.cell * 0.48 + offset.y;
      drawHero(marker, unit, m.cell, offset.s);
      refs.board.addChild(marker);
    });

    const hit = new Graphics();
    hit.roundRect(x, y, m.cell, m.cell, 12);
    hit.fill({ color: 0xffffff, alpha: 0.001 });
    hit.eventMode = units.length > 0 ? "static" : "none";
    hit.cursor = units.length > 0 ? "pointer" : "default";
    hit.on("pointertap", () => showUnitMenu(refs, index));
    refs.board.addChild(hit);
  });
}

function makeButton(label: string, sub: string, w: number, h: number, color: number, onTap: () => void, disabled = false) {
  const c = new Container();
  c.eventMode = disabled ? "none" : "static";
  c.cursor = disabled ? "default" : "pointer";
  c.addChild(panel(w, h, disabled ? 0x6f6259 : color, disabled ? 0x3d332e : 0x51351e, 14));
  const s = text(sub, 12, disabled ? 0x2d2825 : colors.black);
  s.x = 14;
  s.y = 8;
  c.addChild(s);
  const t = text(label, 21, disabled ? 0xd0c6bc : colors.white);
  t.anchor.set(0.5, 0);
  t.x = w / 2;
  t.y = 30;
  c.addChild(t);
  if (!disabled) c.on("pointertap", () => { c.scale.set(0.96); window.setTimeout(() => c.scale.set(1), 80); onTap(); });
  return c;
}

function drawControls(refs: Refs, layout: GameLayout) {
  clear(refs.controls);
  const cost = getSummonCost(refs.state.summonCount);
  const summonDisabled = done(refs.state) || isBoardFull(refs.state.board) || refs.state.resources < cost;
  const summon = makeButton("소환", summonDisabled ? "불가" : `${cost}`, layout.width * 0.52, 82, colors.yellow, () => summonAction(refs), summonDisabled);
  summon.x = (layout.width - layout.width * 0.52) / 2;
  summon.y = layout.height - 108;
  refs.controls.addChild(summon);

  const craftable = getMythicCraftAvailability(refs.state).some((item) => item.canCraft);
  const mythic = makeButton("신화", craftable ? "가능" : "조합", 92, 68, colors.orange, () => showMythicMenu(refs), done(refs.state));
  mythic.x = 18;
  mythic.y = layout.height - 104;
  refs.controls.addChild(mythic);

  const upgradeCost = getPowerUpgradeCost(refs.state.powerUpgradeLevel);
  const upgrade = makeButton("공격력 강화", `Lv.${refs.state.powerUpgradeLevel} / ${upgradeCost}`, 174, 42, 0x47584a, () => upgradeAction(refs), done(refs.state) || refs.state.resources < upgradeCost);
  upgrade.x = (layout.width - 174) / 2;
  upgrade.y = layout.height - 154;
  refs.controls.addChild(upgrade);
}

function floatText(refs: Refs, value: string, x: number, y: number, color: number) {
  const t = text(value, 22, color);
  t.anchor.set(0.5);
  t.x = x;
  t.y = y;
  refs.effects.addChild(t);
  addAnim(refs, { duration: 720, update: (p) => { t.y = y - p * 46; t.alpha = 1 - p; t.scale.set(1 + p * 0.2); }, done: () => t.destroy() });
}

function resultPanel(refs: Refs, result: WaveProgressResult) {
  const w = Math.min(330, refs.app.renderer.width - 36);
  const h = 134;
  const x = refs.app.renderer.width / 2 - w / 2;
  const y = refs.app.renderer.height * 0.34;
  const c = new Container();
  c.x = x;
  c.y = y;
  const lost = result.lostLives > 0;
  const failed = result.state.status === "failed";
  c.addChild(panel(w, h, failed ? 0x5a2226 : lost ? 0x5b3b20 : 0x244c31, failed ? colors.red : lost ? colors.orange : colors.green, 18));
  const title = text(failed ? "패배..." : lost ? "누수 발생!" : "완벽 방어!", 24, failed ? colors.red : lost ? colors.orange : colors.green);
  title.anchor.set(0.5, 0);
  title.x = w / 2;
  title.y = 12;
  c.addChild(title);
  const detail = text(`전투력 ${result.boardPower} / 위협도 ${result.waveThreat}`, 16, colors.white);
  detail.anchor.set(0.5, 0);
  detail.x = w / 2;
  detail.y = 50;
  c.addChild(detail);
  const reward = text(`코인 +${result.reward}   행운석 +${result.luckStoneReward}`, 16, colors.yellow);
  reward.anchor.set(0.5, 0);
  reward.x = w / 2;
  reward.y = 76;
  c.addChild(reward);
  const hp = text(result.lostLives > 0 ? `코어 HP -${result.lostLives}` : "코어 피해 없음", 15, colors.white);
  hp.anchor.set(0.5, 0);
  hp.x = w / 2;
  hp.y = 102;
  c.addChild(hp);
  refs.effects.addChild(c);
  addAnim(refs, { duration: 1300, update: (p) => { c.alpha = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25; c.scale.set(0.96 + Math.min(p, 0.25) * 0.16); }, done: () => c.destroy({ children: true }) });
}

function drawMonster(target: Container, boss: boolean, size: number) {
  const body = new Graphics();
  body.roundRect(-size * (boss ? 1.25 : 1), -size * 0.8, size * (boss ? 2.5 : 2), size * (boss ? 2.1 : 1.5), size * 0.35);
  body.fill({ color: boss ? 0x8b3d34 : 0x54b336, alpha: 1 });
  body.stroke({ color: 0x2b331d, width: boss ? 4 : 2 });
  target.addChild(body);
  const eye = new Graphics();
  eye.circle(-size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eye.circle(size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eye.fill({ color: boss ? colors.yellow : colors.white, alpha: 1 });
  target.addChild(eye);
}

function bossWarning(refs: Refs) {
  const warning = text("⚠ BOSS WAVE ⚠", 32, colors.red);
  warning.anchor.set(0.5);
  warning.x = refs.app.renderer.width / 2;
  warning.y = refs.app.renderer.height * 0.26;
  refs.effects.addChild(warning);
  addAnim(refs, { duration: 1350, update: (p) => { warning.alpha = Math.sin(p * Math.PI * 6) > 0 ? 1 : 0.35; warning.scale.set(1 + Math.sin(p * Math.PI) * 0.28); }, done: () => warning.destroy() });
}

function spawnMonsters(refs: Refs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const wave = getWaveByNumber(refs.state.currentWave);
  const boss = Boolean(wave?.isBossWave);
  const count = boss ? 1 : Math.min(12, wave?.enemyGroups.reduce((sum, group) => sum + group.count, 0) ?? 7);
  if (boss) bossWarning(refs);
  for (let i = 0; i < count; i += 1) {
    const monster = new Container();
    drawMonster(monster, boss, boss ? 24 : 12);
    refs.effects.addChild(monster);
    addAnim(refs, { duration: COMBAT_TIME * 1000 + i * 90, update: (p) => { const point = pathPoint(layout, Math.max(0, Math.min(1, p - i * 0.012))); monster.x = point.x; monster.y = point.y; monster.rotation = Math.sin(p * 26) * (boss ? 0.04 : 0.1); }, done: () => monster.destroy({ children: true }) });
  }
}

function spawnShots(refs: Refs) {
  const heroes = getAllBoardHeroes(refs.state.board);
  if (heroes.length === 0) return;
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const target = pathPoint(layout, 0.38 + refs.random() * 0.28);
  heroes.slice(0, Math.min(heroes.length, 6)).forEach((hero, i) => {
    const from = cellCenter(refs, hero.position.row * refs.state.boardSize.columns + hero.position.column);
    const shot = new Graphics();
    shot.circle(0, 0, hero.grade === "mythic" ? 5 : 3.5);
    shot.fill({ color: roleColor(getHeroById(hero.heroId)?.role), alpha: 1 });
    shot.x = from.x;
    shot.y = from.y;
    refs.effects.addChild(shot);
    addAnim(refs, { duration: 360 + i * 25, update: (p) => { const eased = 1 - Math.pow(1 - p, 2); shot.x = from.x + (target.x - from.x) * eased; shot.y = from.y + (target.y - from.y) * eased; shot.alpha = 1 - p * 0.25; }, done: () => { shot.destroy(); if (i === 0) floatText(refs, `${Math.floor(calculateBoardPower(refs.state).totalPower / 9)}`, target.x, target.y - 20, colors.yellow); } });
  });
}

function startWaveAuto(refs: Refs) {
  if (done(refs.state) || refs.phase === "combat") return;
  refs.phase = "combat";
  refs.combatTimer = COMBAT_TIME;
  refs.fireTimer = 0.25;
  refs.state = startWave(refs.state);
  render(refs);
  spawnMonsters(refs);
}

function finishWaveAuto(refs: Refs) {
  const result = completeCurrentWave(refs.state);
  refs.state = result.state;
  refs.phase = "result";
  refs.resultTimer = RESULT_TIME;
  resultPanel(refs, result);
  render(refs);
}

function showUnitMenu(refs: Refs, cellIndex: number) {
  const cell = refs.state.board[cellIndex];
  if (!cell || cell.units.length === 0) return;
  clearMenu(refs);
  const center = cellCenter(refs, cellIndex);
  const canMerge = canMergeStackCell(refs.state, cellIndex);
  const menu = new Container();
  menu.x = Math.max(8, Math.min(refs.app.renderer.width - 74, center.x - 37));
  menu.y = Math.max(8, center.y - center.cell * 0.95 - 38);
  menu.addChild(panel(74, 42, 0x2d2925, 0x1d1714, 12));
  const merge = makeButton("합성", "", 62, 34, colors.panel, () => mergeAction(refs, cellIndex), !canMerge);
  merge.x = 6;
  merge.y = 4;
  menu.addChild(merge);
  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

function showMythicMenu(refs: Refs) {
  clearMenu(refs);
  const list = getMythicCraftAvailability(refs.state);
  const w = Math.min(344, refs.app.renderer.width - 24);
  const h = 62 + list.length * 48;
  const menu = new Container();
  menu.x = refs.app.renderer.width / 2 - w / 2;
  menu.y = Math.max(18, refs.app.renderer.height * 0.18);
  menu.addChild(panel(w, h, 0x2d2925, colors.orange, 16));
  const title = text("신화 / 오버드라이브 조합", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = w / 2;
  title.y = 14;
  menu.addChild(title);
  list.forEach((item, i) => {
    const y = 52 + i * 48;
    const row = makeButton(item.recipe.displayName, `행운석 ${item.recipe.luckStoneCost}${item.canCraft ? "" : " / 재료 부족"}`, w - 24, 40, colors.orange, () => mythicAction(refs, item.recipe.id), !item.canCraft);
    row.x = 12;
    row.y = y;
    menu.addChild(row);
  });
  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

function mythicAction(refs: Refs, recipeId: string) {
  clearMenu(refs);
  const result = craftMythicHero(refs.state, recipeId);
  if (!result.craftedHero) {
    floatText(refs, result.reason === "not_enough_luck_stones" ? "행운석 부족" : "조합 재료 부족", refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.red);
    return;
  }
  refs.state = result.state;
  refs.lastSummonedIndex = indexFromHero(refs.state, result.craftedHero);
  render(refs);
  floatText(refs, "오버드라이브 완성!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.yellow);
}

function mergeAction(refs: Refs, cellIndex: number) {
  clearMenu(refs);
  const result = mergeStackedCell(refs.state, cellIndex, refs.random);
  if (!result.mergedHero) {
    floatText(refs, result.reason === "max_grade" ? "최고 등급" : "3마리 필요", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.red);
    return;
  }
  refs.state = result.state;
  refs.lastSummonedIndex = cellIndex;
  render(refs);
  floatText(refs, "합성!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.yellow);
}

function summonAction(refs: Refs) {
  clearMenu(refs);
  const result = summonHero(refs.state, refs.random);
  if (!result.summonedHero) {
    floatText(refs, result.reason === "not_enough_resources" ? "코인 부족" : "소환 실패", refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.red);
    return;
  }
  refs.state = result.state;
  refs.lastSummonedIndex = indexFromHero(refs.state, result.summonedHero);
  render(refs);
  floatText(refs, "소환!", refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.yellow);
}

function upgradeAction(refs: Refs) {
  clearMenu(refs);
  const result = upgradeAttack(refs.state);
  refs.state = result.state;
  render(refs);
  floatText(refs, result.upgraded ? `공격력 강화 +${refs.state.powerUpgradeLevel}` : `코인 부족 ${result.cost}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, result.upgraded ? colors.yellow : colors.red);
}

function render(refs: Refs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  drawBackground(refs, layout);
  drawHud(refs, layout);
  drawBoard(refs, layout);
  drawControls(refs, layout);
}

function tick(refs: Refs, deltaMs: number) {
  const delta = deltaMs / 1000;
  refs.animations = refs.animations.filter((a) => { a.age += deltaMs; const p = Math.min(1, a.age / a.duration); a.update(p); if (p >= 1) { a.done?.(); return false; } return true; });
  if (done(refs.state)) return;
  if (refs.phase === "countdown") {
    refs.nextWaveTimer -= delta;
    if (refs.nextWaveTimer <= 0) startWaveAuto(refs);
    else drawHud(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
  } else if (refs.phase === "combat") {
    refs.combatTimer -= delta;
    refs.fireTimer -= delta;
    if (refs.fireTimer <= 0) { refs.fireTimer = bossWave(refs.state) ? 0.34 : 0.48; spawnShots(refs); }
    drawHud(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
    if (refs.combatTimer <= 0) finishWaveAuto(refs);
  } else if (refs.phase === "result") {
    refs.resultTimer -= delta;
    if (refs.resultTimer <= 0) { refs.phase = "countdown"; refs.nextWaveTimer = WAVE_COUNTDOWN; render(refs); }
  }
}

export function createPixiGame(parent: HTMLElement): PixiGameHandle {
  const app = new Application();
  const stage = new Container();
  const seed = `pixi-${Date.now()}`;
  const refs = { app, stage, world: new Container(), board: new Container(), hud: new Container(), controls: new Container(), effects: new Container(), menuLayer: new Container(), state: createInitialGameState(seed), random: createSeededRandom(seed), animations: [], phase: "countdown", nextWaveTimer: WAVE_COUNTDOWN, combatTimer: 0, fireTimer: 0, resultTimer: 0, lastSummonedIndex: null, menu: null } satisfies Refs;
  let destroyed = false;
  async function init() {
    await app.init({ background: colors.sky, resizeTo: parent, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
    if (destroyed) { app.destroy(true); return; }
    parent.appendChild(app.canvas);
    app.stage.addChild(stage);
    stage.eventMode = "static";
    stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height);
    stage.on("pointertap", () => clearMenu(refs));
    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);
    render(refs);
    app.renderer.on("resize", () => { stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height); clearMenu(refs); render(refs); });
    app.ticker.add((ticker) => tick(refs, ticker.deltaMS));
  }
  void init();
  return { cleanup: () => { destroyed = true; clearMenu(refs); app.destroy(true, { children: true }); } };
}
