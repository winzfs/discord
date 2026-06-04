import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

if (!s.includes('import { submitGameRun } from "../submitGameRun";')) {
  s = s.replace(
    'import { colors } from "./gameTheme";',
    'import { submitGameRun } from "../submitGameRun";\nimport { colors } from "./gameTheme";',
  );
}

if (!s.includes("resultSubmitted: boolean;")) {
  s = s.replace(
    `  lastWaveSummary: WaveSummary | null;\n};`,
    `  lastWaveSummary: WaveSummary | null;\n  resultSubmitted: boolean;\n};`,
  );
}

if (!s.includes("function submitFinalResultOnce(refs: GameRefs)")) {
  s = s.replace(
    `function showWaveResult(refs: GameRefs, summary: WaveSummary) {`,
    `function submitFinalResultOnce(refs: GameRefs) {\n  if (refs.resultSubmitted || (refs.state.status !== "failed" && refs.state.status !== "cleared")) return;\n  refs.resultSubmitted = true;\n\n  void submitGameRun(refs.state)\n    .then(() => {\n      floatText(refs, "기록 저장 완료", refs.app.renderer.width / 2, refs.app.renderer.height * 0.3, colors.green);\n    })\n    .catch(() => {\n      floatText(refs, "로그인하면 기록 저장", refs.app.renderer.width / 2, refs.app.renderer.height * 0.3, colors.orange);\n    });\n}\n\nfunction showWaveResult(refs: GameRefs, summary: WaveSummary) {`,
  );
}

if (!s.includes("submitFinalResultOnce(refs);")) {
  s = s.replace(
    `  render(refs);\n  showWaveResult(refs, refs.lastWaveSummary);\n}`,
    `  render(refs);\n  showWaveResult(refs, refs.lastWaveSummary);\n  submitFinalResultOnce(refs);\n}`,
  );
}

if (!s.includes("    resultSubmitted: false,")) {
  s = s.replace(
    `    lastWaveSummary: null,\n  };`,
    `    lastWaveSummary: null,\n    resultSubmitted: false,\n  };`,
  );
}

writeFileSync(path, s);
console.log(`Added game run submission patch to ${path}`);
