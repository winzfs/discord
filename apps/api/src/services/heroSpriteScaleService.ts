type HeroSpriteScaleRecord = {
  heroId: string;
  scale: number;
  updatedAt: string;
  updatedBy: string | null;
};

type HeroSpriteScaleInput = {
  heroId?: unknown;
  scale?: unknown;
};

const MIN_SCALE = 0.7;
const MAX_SCALE = 2.2;

function nowIso() {
  return new Date().toISOString();
}

function normalizeHeroId(value: unknown) {
  if (typeof value !== "string") return null;
  const heroId = value.trim();
  if (!/^[a-z0-9-]{2,60}$/.test(heroId)) return null;
  return heroId;
}

function normalizeScale(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
  return Number(clamped.toFixed(2));
}

export async function listHeroSpriteScales(db: D1Database | undefined) {
  if (!db) {
    return {
      scales: {} as Record<string, number>,
      rows: [] as HeroSpriteScaleRecord[],
      status: "memoryless",
    };
  }

  const result = await db
    .prepare(
      `SELECT hero_id AS heroId, scale, updated_at AS updatedAt, updated_by AS updatedBy
       FROM hero_sprite_scales
       ORDER BY hero_id ASC`,
    )
    .all<HeroSpriteScaleRecord>();

  const rows = result.results ?? [];
  return {
    scales: Object.fromEntries(rows.map((row) => [row.heroId, row.scale])),
    rows,
    status: "saved",
  };
}

export async function saveHeroSpriteScale(db: D1Database | undefined, updatedBy: string | null, input: HeroSpriteScaleInput) {
  const heroId = normalizeHeroId(input.heroId);
  const scale = normalizeScale(input.scale);

  if (!heroId) throw new Error("유효하지 않은 영웅 ID입니다.");
  if (scale === null) throw new Error("유효하지 않은 스케일 값입니다.");

  const updatedAt = nowIso();
  const row: HeroSpriteScaleRecord = { heroId, scale, updatedAt, updatedBy };
  if (!db) return row;

  await db
    .prepare(
      `INSERT INTO hero_sprite_scales (hero_id, scale, updated_at, updated_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(hero_id) DO UPDATE SET
         scale = excluded.scale,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(heroId, scale, updatedAt, updatedBy)
    .run();

  return row;
}

export async function resetHeroSpriteScale(db: D1Database | undefined, heroIdValue: unknown) {
  const heroId = normalizeHeroId(heroIdValue);
  if (!heroId) throw new Error("유효하지 않은 영웅 ID입니다.");
  if (!db) return { heroId, status: "memoryless" as const };

  await db.prepare(`DELETE FROM hero_sprite_scales WHERE hero_id = ?`).bind(heroId).run();
  return { heroId, status: "deleted" as const };
}
