import type { GameLayout } from "./gameLayout";

const FIELD_SOURCE_WIDTH = 864;
const FIELD_SOURCE_HEIGHT = 1536;

const FIELD_PATH_POINTS = [
  { x: 0.115, y: 0.805 },
  { x: 0.115, y: 0.395 },
  { x: 0.235, y: 0.27 },
  { x: 0.765, y: 0.27 },
  { x: 0.885, y: 0.395 },
  { x: 0.885, y: 0.805 },
  { x: 0.765, y: 0.875 },
  { x: 0.235, y: 0.875 },
  { x: 0.115, y: 0.805 },
];

function getFieldFrame(layout: GameLayout) {
  const scale = Math.max(layout.width / FIELD_SOURCE_WIDTH, layout.height / FIELD_SOURCE_HEIGHT);
  const width = FIELD_SOURCE_WIDTH * scale;
  const height = FIELD_SOURCE_HEIGHT * scale;

  return {
    x: (layout.width - width) / 2,
    y: (layout.height - height) / 2,
    width,
    height,
  };
}

function toScreenPoint(layout: GameLayout, point: { x: number; y: number }) {
  const frame = getFieldFrame(layout);
  return {
    x: frame.x + frame.width * point.x,
    y: frame.y + frame.height * point.y,
  };
}

function segmentLength(layout: GameLayout, from: { x: number; y: number }, to: { x: number; y: number }) {
  const a = toScreenPoint(layout, from);
  const b = toScreenPoint(layout, to);
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function getPixiPathPoint(layout: GameLayout, progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  const lengths = FIELD_PATH_POINTS.slice(0, -1).map((point, index) =>
    segmentLength(layout, point, FIELD_PATH_POINTS[index + 1]),
  );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let target = clamped * total;

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (target > length) {
      target -= length;
      continue;
    }

    const from = toScreenPoint(layout, FIELD_PATH_POINTS[index]);
    const to = toScreenPoint(layout, FIELD_PATH_POINTS[index + 1]);
    const ratio = length <= 0 ? 0 : target / length;

    return {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
    };
  }

  return toScreenPoint(layout, FIELD_PATH_POINTS[FIELD_PATH_POINTS.length - 1]);
}
