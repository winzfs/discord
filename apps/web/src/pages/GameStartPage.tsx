import { Link } from "react-router-dom";
import { PageSection } from "../components/common/PageSection";
import { MVP_MODE_NAME } from "../lib/constants";

export function GameStartPage() {
  return (
    <PageSection
      title="게임 시작"
      description="/lobby는 모바일 로비와 메뉴 화면이고, /play는 헤더와 푸터가 없는 독립 PixiJS 전체화면 게임입니다."
    >
      <div className="hero-panel">
        <p>현재 모드: {MVP_MODE_NAME}</p>
        <h3>로비에서 상점, 영웅, 전투, 유물 화면을 둘러본 뒤 빠른 시작으로 전투에 진입할 수 있습니다.</h3>
        <ul className="feature-list">
          <li>모바일형 로비 화면</li>
          <li>상점 카드와 할인 뱃지</li>
          <li>영웅 목록과 조각 진행도</li>
          <li>전투 진입 화면과 퀘스트 미리보기</li>
          <li>유물 목록과 강화 진행도</li>
        </ul>
        <p className="notice-text">비상업 팬게임 프로토타입이며 Blizzard Entertainment와 공식 관련이 없습니다.</p>
        <div className="game-start-actions">
          <Link className="primary-link" to="/lobby">로비로 이동</Link>
          <Link className="primary-link secondary-link" to="/play">바로 플레이</Link>
        </div>
      </div>
    </PageSection>
  );
}
