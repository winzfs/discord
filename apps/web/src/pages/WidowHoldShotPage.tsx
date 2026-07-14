import { WidowHoldShotGame } from "../features/widow-hold-shot/WidowHoldShotGame";
import "../styles/widow-hold-shot.css";
import "../styles/widow-hold-shot-target.css";
import "../styles/widow-hold-shot-v2.css";
import "../styles/training-performance.css";
import "../styles/widow-hold-shot-performance-v2.css";
import "../styles/training-leaderboard.css";

type WidowHoldShotPageProps = {
  onBack?: () => void;
};

export function WidowHoldShotPage({ onBack }: WidowHoldShotPageProps) {
  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    window.location.assign("/training-lab");
  };

  return (
    <main className="widow-page-shell">
      <section className="widow-page-stage" aria-label="위도우 대기샷 훈련">
        <header className="widow-page-topbar">
          <button type="button" onClick={goBack} aria-label="훈련소로 돌아가기">←</button>
          <div>
            <p>SNIPER CALIBRATION RANGE</p>
            <h1>위도우 대기샷 연습</h1>
          </div>
          <span><i aria-hidden="true" />READY</span>
        </header>
        <WidowHoldShotGame />
        <p className="widow-page-help">고정 조준선 · 캐릭터 무빙을 읽고 머리가 중앙을 통과하는 순간 발사하세요</p>
        <p className="widow-page-disclaimer">비상업 팬게임 훈련 콘텐츠 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
