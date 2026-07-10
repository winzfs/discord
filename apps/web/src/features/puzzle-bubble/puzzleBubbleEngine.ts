import {
  BUBBLE_RADIUS,
  GRID_COLUMNS,
  GRID_TOP,
  HERO_KINDS,
  PUZZLE_WIDTH,
  randomHeroKind,
  type PuzzleHeroKind,
} from "./puzzleBubbleConfig";

export type Bubble = {
  id: number;
  row: number;
  col: number;
  kind: PuzzleHeroKind;
  falling?: boolean;
  x?: number;
  y?: number;
  vy?: number;
  alpha?: number;
};

export type Shot = {
  kind: PuzzleHeroKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

let nextId = 1;

export function getCellPosition(row: number, col: number) {
  const diameter = BUBBLE_RADIUS * 2;
  const rowHeight = diameter * 0.866;
  const offset = row % 2 === 0 ? 0 : BUBBLE_RADIUS;
  return {
    x: BUBBLE_RADIUS + 8 + col * diameter + offset,
    y: GRID_TOP + BUBBLE_RADIUS + row * rowHeight,
  };
}

export function createInitialBubbles(rows = 6): Bubble[] {
  const bubbles: Bubble[] = [];
  for (let row = 0; row < rows; row += 1) {
    const columns = row % 2 === 0 ? GRID_COLUMNS : GRID_COLUMNS - 1;
    for (let col = 0; col < columns; col += 1) {
      bubbles.push({ id: nextId++, row, col, kind: randomHeroKind() });
    }
  }
  return bubbles;
}

function getNeighbors(target: Bubble, bubbles: Bubble[]) {
  const offsets = target.row % 2 === 0
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  return offsets
    .map(([dr, dc]) => bubbles.find((bubble) => bubble.row === target.row + dr && bubble.col === target.col + dc))
    .filter((bubble): bubble is Bubble => Boolean(bubble));
}

export function snapShotToGrid(shot: Shot, bubbles: Bubble[]): Bubble {
  let best = { row: 0, col: 0, distance: Number.POSITIVE_INFINITY };
  for (let row = 0; row < 18; row += 1) {
    const columns = row % 2 === 0 ? GRID_COLUMNS : GRID_COLUMNS - 1;
    for (let col = 0; col < columns; col += 1) {
      if (bubbles.some((bubble) => bubble.row === row && bubble.col === col)) continue;
      const position = getCellPosition(row, col);
      const distance = Math.hypot(position.x - shot.x, position.y - shot.y);
      if (distance < best.distance) best = { row, col, distance };
    }
  }
  return { id: nextId++, row: best.row, col: best.col, kind: shot.kind };
}

export function findMatchingCluster(start: Bubble, bubbles: Bubble[]) {
  const visited = new Set<number>();
  const queue = [start];
  const cluster: Bubble[] = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current.id) || current.kind !== start.kind) continue;
    visited.add(current.id);
    cluster.push(current);
    getNeighbors(current, bubbles).forEach((neighbor) => queue.push(neighbor));
  }
  return cluster;
}

export function findDetachedBubbles(bubbles: Bubble[]) {
  const connected = new Set<number>();
  const queue = bubbles.filter((bubble) => bubble.row === 0);
  while (queue.length) {
    const current = queue.shift();
    if (!current || connected.has(current.id)) continue;
    connected.add(current.id);
    getNeighbors(current, bubbles).forEach((neighbor) => queue.push(neighbor));
  }
  return bubbles.filter((bubble) => !connected.has(bubble.id));
}

export function addPressureRow(bubbles: Bubble[]) {
  const shifted = bubbles.map((bubble) => ({ ...bubble, row: bubble.row + 1 }));
  const columns = GRID_COLUMNS;
  const activeKinds = HERO_KINDS.slice(0, 4);
  const added = Array.from({ length: columns }, (_, col) => ({
    id: nextId++,
    row: 0,
    col,
    kind: activeKinds[Math.floor(Math.random() * activeKinds.length)],
  }));
  return [...added, ...shifted];
}

export function hasShotCollision(shot: Shot, bubbles: Bubble[]) {
  if (shot.y <= GRID_TOP + BUBBLE_RADIUS) return true;
  return bubbles.some((bubble) => {
    const position = getCellPosition(bubble.row, bubble.col);
    return Math.hypot(position.x - shot.x, position.y - shot.y) <= BUBBLE_RADIUS * 1.92;
  });
}

export function isInsideHorizontalBounds(x: number) {
  return x >= BUBBLE_RADIUS + 7 && x <= PUZZLE_WIDTH - BUBBLE_RADIUS - 7;
}
