import { WidowHoldShotGame } from "../features/widow-hold-shot/WidowHoldShotGame";
import "../styles/widow-hold-shot.css";

type WidowHoldShotPageProps = {
  onBack?: () => void;
};

export function WidowHoldShotPage({ onBack }: WidowHoldShotPageProps) {
  return (
    <main className="widow-page-shell">
      <section className="widow-page-stage" aria-label="위도우 대기샷 훈련">
        <header className="widow-page-topbar">
          <button type="button" onClick={onBack} aria-label="훈련소로 돌아가기">←</button>
          <div>
            <p>SNIPER CALIBRATION RANGE</p>
            <h1>위도우 대기샷 연습</h1>
          </div>
          <span><i aria-hidden="true" />READY</span>
        </header>
        <WidowHoldShotGame />
        <p className="widow-page-help">조준점은 고정입니다 · 머리가 중앙을 통과하는 순간 발사하세요</p>
        <p className="widow-page-disclaimer">비상업 팬게임 훈련 콘텐츠 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
