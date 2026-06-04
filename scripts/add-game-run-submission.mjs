import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

function mustReplace(before, after, label) {
  if (!s.includes(before)) throw new Error(`Missing expected block: ${label}`);
  s = s.replace(before, after);
}

if (!s.includes('import { submitGameRun } from "../submitGameRun";')) {
  const marker = 'import {\n  createUnitGhost as createBoardUnitGhost,\n  drawBoardCells,\n  type BoardMetrics,\n} from "./pixiBoardView";';
  mustReplace(marker, `${marker}\nimport { submitGameRun } from "../submitGameRun";`, "submitGameRun import");
}

if (!s.includes("resultSubmitted: boolean;")) {
  if (s.includes("  selectedHeroInstanceId: string | null;\n};")) {
    mustReplace(
      "  selectedHeroInstanceId: string | null;\n};",
      "  selectedHeroInstanceId: string | null;\n  resultSubmitted: boolean;\n};",
      "GameRefs resultSubmitted after selection",
    );
  } else {
    mustReplace(
      "  lastWaveSummary: WaveSummary | null;\n};",
      "  lastWaveSummary: WaveSummary | null;\n  resultSubmitted: boolean;\n};",
      "GameRefs resultSubmitted",
    );
  }
}

if (!s.includes("function submitFinalResultOnce(refs: GameRefs)")) {
  mustReplace(
    "function showWaveResult(refs: GameRefs, summary: WaveSummary) {",
    `function submitFinalResultOnce(refs: GameRefs) {\n  if (refs.resultSubmitted || (refs.state.status !== "failed" && refs.state.status !== "cleared")) return;\n  refs.resultSubmitted = true;\n\n  void submitGameRun(refs.state)\n    .then(() => {\n      floatText(refs, "기록 저장 완료", refs.app.renderer.width / 2, refs.app.renderer.height * 0.3, colors.green);\n    })\n    .catch(() => {\n      floatText(refs, "로그인하면 기록 저장", refs.app.renderer.width / 2, refs.app.renderer.height * 0.3, colors.orange);\n    });\n}\n\nfunction showWaveResult(refs: GameRefs, summary: WaveSummary) {`,
    "submitFinalResultOnce function",
  );
}

if (!s.includes("submitFinalResultOnce(refs);")) {
  mustReplace(
    "  render(refs);\n  showWaveResult(refs, refs.lastWaveSummary);\n}",
    "  render(refs);\n  showWaveResult(refs, refs.lastWaveSummary);\n  submitFinalResultOnce(refs);\n}",
    "finishAutoWave submit call",
  );
}

if (!s.includes("    resultSubmitted: false,")) {
  if (s.includes("    selectedHeroInstanceId: null,\n  };")) {
    mustReplace(
      "    selectedHeroInstanceId: null,\n  };",
      "    selectedHeroInstanceId: null,\n    resultSubmitted: false,\n  };",
      "refs resultSubmitted after selection",
    );
  } else {
    mustReplace(
      "    lastWaveSummary: null,\n  };",
      "    lastWaveSummary: null,\n    resultSubmitted: false,\n  };",
      "refs resultSubmitted",
    );
  }
}

writeFileSync(path, s);
console.log(`Added game run submission patch to ${path}`);
