import { Link } from "react-router-dom";
import { PageSection } from "../components/common/PageSection";
import { MVP_MODE_NAME } from "../lib/constants";

export function HomePage() {
  return (
    <PageSection title="디스코드 커뮤니티용 미니게임" description="문서 기준으로 준비한 싱글플레이 랜덤 디펜스 MVP 초기 구조입니다.">
      <div className="hero-panel">
        <p>현재 모드: {MVP_MODE_NAME}</p>
        <h3>랜덤 영웅 소환, 합성, 웨이브 방어를 위한 기반을 준비 중입니다.</h3>
        <Link className="primary-link" to="/game">게임 준비 화면 보기</Link>
      </div>
    </PageSection>
  );
}
