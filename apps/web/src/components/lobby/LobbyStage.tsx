import { Link } from "react-router-dom";

type LobbyStageProps = {
  onOpenShop: () => void;
  onOpenHeroes: () => void;
  onOpenArtifacts: () => void;
};

export function LobbyStage({ onOpenShop, onOpenHeroes, onOpenArtifacts }: LobbyStageProps) {
  return (
    <section className="lobby-stage">
      <div className="stage-backdrop" aria-hidden="true" />
      <div className="stage-floor" aria-hidden="true" />

      <button className="stage-node stage-node-shop" type="button" onClick={onOpenShop}>
        <span className="stage-node-icon">상</span>
        <strong>상점</strong>
        <small>상품 보기</small>
      </button>

      <div className="stage-hero-showcase">
        <span className="stage-boss-aura" aria-hidden="true" />
        <div className="stage-character stage-boss">
          <span>거인</span>
        </div>
        <strong>전투 준비</strong>
        <small>웨이브를 돌파하세요</small>
      </div>

      <button className="stage-node stage-node-hero" type="button" onClick={onOpenHeroes}>
        <span className="stage-node-icon">검</span>
        <strong>영웅</strong>
        <small>편성 강화</small>
      </button>

      <div className="stage-cta-stack">
        <Link className="battle-start" to="/play">
          빠른 시작
        </Link>
        <button className="stage-speech" type="button" onClick={onOpenArtifacts}>
          유물 강화
        </button>
      </div>
    </section>
  );
}
