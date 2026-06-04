import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let source = readFileSync(path, "utf8");

const before = `function ingredientText(grade: string, role: string | undefined, count: number) {
  const gradeLabel = grade === "legendary" ? "전설" : grade === "epic" ? "영웅" : grade === "rare" ? "희귀" : grade === "common" ? "일반" : "신화";`;

const after = `function ingredientText(grade: string | undefined, role: string | undefined, count: number) {
  const gradeLabel = grade === "legendary" ? "전설" : grade === "epic" ? "영웅" : grade === "rare" ? "희귀" : grade === "common" ? "일반" : grade === "mythic" ? "신화" : "등급무관";`;

if (source.includes(before)) {
  source = source.replace(before, after);
  writeFileSync(path, source);
  console.log(`Updated ${path} mythic ingredient type`);
} else if (source.includes("function ingredientText(grade: string | undefined")) {
  console.log("Mythic ingredient type already fixed");
} else {
  throw new Error("ingredientText block not found");
}
