import { execFileSync } from "node:child_process";

const patchScripts = [
  "scripts/fix-floating-text-lifetime.mjs",
  "scripts/add-unit-info-panel.mjs",
  "scripts/fix-mythic-recipe-display.mjs",
  "scripts/add-game-run-submission.mjs",
];

for (const script of patchScripts) {
  console.log(`Running ${script}`);
  execFileSync(process.execPath, [script], { stdio: "inherit" });
}

console.log("Applied Pixi build patches");
