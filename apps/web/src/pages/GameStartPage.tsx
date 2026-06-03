import { Link } from "react-router-dom";
import { PageSection } from "../components/common/PageSection";
import { MVP_MODE_NAME } from "../lib/constants";

export function GameStartPage() {
  return (
    <PageSection
      title="게임 시작"
      description="/play는 헤더와 푸터가 없는 독립 PixiJS 전체화면 게임입니다."
    >
      <div className="hero-panel">
        <p>현재 모드: {MVP_MODE_NAME}</p>
        <h3>랜덤 영웅을 소환하고, 같은 등급 3명을 합성하며, 웨이브를 방어하는 싱글플레이 MVP입니다.</h3>
        <ul className="feature-list">
          <li>4x4 영웅 배치판</li>
          <li>코인 기반 랜덤 소환</li>
          <li>일반/희귀 합성 프로토타입</li>
          <li>웨이브 이동 연출과 점수 계산</li>
        </ul>
        <p className="notice-text">비상업 팬게임 프로토타입이며 Blizzard Entertainment와 공식 관련이 없습니다.</p>
        <Link className="primary-link" to="/play">전체화면으로 플레이</Link>
      </div>
    </PageSection>
  );
}
