import { Text } from "pixi.js";
import { colors } from "./gameTheme";

type GameTextOptions = {
  size?: number;
  fill?: number;
  stroke?: number;
  strokeWidth?: number;
  shadow?: boolean;
};

export function makeGameText(value: string, options: GameTextOptions = {}) {
  const size = options.size ?? 18;
  const fill = options.fill ?? colors.white;
  const stroke = options.stroke ?? colors.black;
  const strokeWidth = options.strokeWidth ?? Math.max(2, Math.round(size * 0.16));

  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, Pretendard, system-ui, sans-serif",
      fontSize: size,
      fontWeight: "900",
      lineJoin: "round",
      stroke: { color: stroke, width: strokeWidth },
      dropShadow: options.shadow === false
        ? undefined
        : {
            color: 0x000000,
            alpha: 0.35,
            blur: 0,
            distance: 2,
            angle: Math.PI / 2,
          },
    },
  });
}
