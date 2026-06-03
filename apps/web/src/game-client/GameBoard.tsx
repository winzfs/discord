import { heroes } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import { AssetImage } from "../components/common/AssetImage";

type GameBoardProps = {
  board: Array<BoardHero | null>;
  columns: number;
};

function getHeroName(heroId: string): string {
  return heroes.find((hero) => hero.id === heroId)?.displayName ?? "알 수 없는 영웅";
}

function getHeroAssetKey(heroId: string): string {
  return heroes.find((hero) => hero.id === heroId)?.assetKey ?? "hero.placeholder";
}

export function GameBoard({ board, columns }: GameBoardProps) {
  return (
    <div className="game-board" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {board.map((slot, index) => (
        <div className={`board-slot ${slot ? `grade-${slot.grade}` : "is-empty"}`} key={slot?.instanceId ?? `empty-${index}`}>
          {slot ? (
            <>
              <AssetImage className="board-hero-image" assetKey={getHeroAssetKey(slot.heroId)} />
              <strong>{getHeroName(slot.heroId)}</strong>
              <span>{slot.grade}</span>
            </>
          ) : (
            <span className="empty-slot-label">빈 슬롯</span>
          )}
        </div>
      ))}
    </div>
  );
}
