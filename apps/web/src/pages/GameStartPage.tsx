import { Link } from "react-router-dom";
import { PageSection } from "../components/common/PageSection";
import { MVP_MODE_NAME } from "../lib/constants";

export function GameStartPage() {
  return (
    <PageSection
      title="게임 시작"
      description="/lobby는 모바일 로비, /play는 랜덤 디펜스, /puzzle-bubble은 독립 캐주얼 퍼즐 화면입니다."
    >
      <div className="hero-panel">
        <p>현재 모드: {MVP_MODE_NAME}</p>
        <h3>로비에서 영웅을 성장시키거나, 랜덤 디펜스와 간단한 히어로 버블 퍼즐을 바로 플레이할 수 있습니다.</h3>
        <ul className="feature-list">
          <li>모바일형 로비 화면</li>
          <li>PixiJS 랜덤 디펜스</li>
          <li>같은 영웅 3개를 연결하는 버블 퍼즐</li>
          <li>기존 영웅 스프라이트 리소스 재사용</li>
        </ul>
        <p className="notice-text">비상업 팬게임 프로토타입이며 Blizzard Entertainment와 공식 관련이 없습니다.</p>
        <div className="game-start-actions">
          <Link className="primary-link" to="/lobby">로비로 이동</Link>
          <Link className="primary-link secondary-link" to="/play">랜덤 디펜스</Link>
          <Link className="primary-link secondary-link" to="/puzzle-bubble">히어로 팝</Link>
        </div>
      </div>
    </PageSection>
  );
}
