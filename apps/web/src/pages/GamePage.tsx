import { useEffect, useRef } from "react";
import { createPixiGame } from "../game-client/pixi/createPixiGame";

export function GamePage() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const pixiGame = createPixiGame(host);

    return () => {
      pixiGame.cleanup();
    };
  }, []);

  return (
    <main className="play-shell">
      <div className="play-canvas-root" ref={hostRef} />
    </main>
  );
}
