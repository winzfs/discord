import { useEffect, useRef } from "react";
import { createPixiGame } from "../game-client/pixi/createPixiGame";

type GamePageProps = {
  testMode?: boolean;
};

export function GamePage({ testMode = false }: GamePageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const pixiGame = createPixiGame(host, { testMode });

    return () => {
      pixiGame.cleanup();
    };
  }, [testMode]);

  return (
    <main className="play-shell">
      <div className="play-canvas-root" ref={hostRef} />
    </main>
  );
}
