import { Link } from "react-router-dom";
import { PageSection } from "../components/common/PageSection";
import { MVP_MODE_NAME } from "../lib/constants";

export function GameStartPage() {
  return (
    <PageSection
      title="게임 시작"
      description="/lobby는 모바일 로비, /play는 랜덤 디펜스, /puzzle-bubble은 캐주얼 퍼즐, /hero-strike는 세로형 슈팅, /training-lab은 짧은 실전 훈련 모음입니다."
    >
      <div className="hero-panel">
        <p>현재 모드: {MVP_MODE_NAME}</p>
        <h3>영웅 성장형 랜덤 디펜스와 퍼즐, 슈팅 캠페인, 짧은 실전 훈련을 선택할 수 있습니다.</h3>
        <ul className="feature-list">
          <li>모바일형 로비 화면</li>
          <li>PixiJS 랜덤 디펜스</li>
          <li>같은 영웅 3개를 연결하는 버블 퍼즐</li>
          <li>4웨이브·엘리트·무기 진화·연구 성장이 있는 세로형 슈팅</li>
          <li>반응속도와 대기샷 타이밍을 연습하는 전술 훈련소</li>
        </ul>
        <p className="notice-text">비상업 팬게임 프로토타입이며 Blizzard Entertainment와 공식 관련이 없습니다.</p>
        <div className="game-start-actions">
          <Link className="primary-link" to="/lobby">로비로 이동</Link>
          <Link className="primary-link secondary-link" to="/play">랜덤 디펜스</Link>
          <Link className="primary-link secondary-link" to="/puzzle-bubble">히어로 팝</Link>
          <Link className="primary-link secondary-link" to="/hero-strike">히어로 스트라이크</Link>
          <Link className="primary-link secondary-link" to="/training-lab">훈련소</Link>
        </div>
      </div>
    </PageSection>
  );
}
