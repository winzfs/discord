import type { Container } from "pixi.js";

export function shouldClearSelectionFromStagePointer(stage: Container, event: { target?: unknown }) {
  return event.target === stage;
}
