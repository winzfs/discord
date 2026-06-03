import { AssetImage } from "../components/common/AssetImage";
import { PageSection } from "../components/common/PageSection";

export function GamePage() {
  return (
    <PageSection title="싱글 랜덤 디펜스 준비 중" description="아직 실제 게임 구현은 하지 않고, 4x4 필드와 게임 클라이언트가 들어갈 자리를 분리해 둡니다.">
      <div className="game-placeholder">
        <AssetImage className="placeholder-asset" assetKey="hero.placeholder" />
        <div>
          <h3>싱글 랜덤 디펜스 준비 중</h3>
          <p>게임 로직은 React 컴포넌트가 아니라 packages/game의 순수 함수로 확장합니다.</p>
        </div>
      </div>
    </PageSection>
  );
}
