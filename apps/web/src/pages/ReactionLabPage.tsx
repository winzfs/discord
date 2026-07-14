import { Link } from "react-router-dom";
import { ReactionLabGame } from "../features/reaction-lab/ReactionLabGame";
import "../styles/reaction-lab.css";
import "../styles/reaction-lab-v2.css";

type ReactionLabPageProps = {
  activityMode?: boolean;
  onBack?: () => void;
};

export function ReactionLabPage({ activityMode = false, onBack }: ReactionLabPageProps) {
  return (
    <main className="reaction-lab-shell">
      <section className="reaction-lab-stage" aria-label="반응속도 에임 연습 게임">
        <header className="reaction-lab-topbar">
          {onBack ? (
            <button type="button" className="reaction-lab-back" onClick={onBack} aria-label="훈련소로 돌아가기">←</button>
          ) : activityMode ? (
            <span aria-hidden="true" />
          ) : (
            <Link to="/training-lab" aria-label="훈련소로 돌아가기">←</Link>
          )}
          <div className="reaction-lab-brand">
            <p>TACTICAL AIM NETWORK</p>
            <h1>반응속도 연습</h1>
          </div>
          <div className="reaction-lab-status" aria-label="훈련 시스템 온라인">
            <i aria-hidden="true" />
            <span>READY</span>
          </div>
        </header>
        <ReactionLabGame />
        <p className="reaction-lab-help">마우스·터치 조준 지원 · 표적 식별과 빠른 에임 전환을 훈련합니다</p>
        <p className="reaction-lab-disclaimer">비상업 팬게임 훈련 콘텐츠 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
