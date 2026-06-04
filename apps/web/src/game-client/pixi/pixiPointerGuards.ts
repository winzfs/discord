import { Container, Rectangle } from "pixi.js";

export function stopPixiPropagation(event: any) {
  event?.stopPropagation?.();
}

export function makePixiTouchBoundary(target: Container, width: number, height: number) {
  target.eventMode = "static";
  target.hitArea = new Rectangle(0, 0, width, height);
  target.on("pointerdown", stopPixiPropagation);
  target.on("pointerup", stopPixiPropagation);
  target.on("pointertap", stopPixiPropagation);
}
