import { Link } from "react-router-dom";
import { ReactionLabGame } from "../features/reaction-lab/ReactionLabGame";
import "../styles/reaction-lab.css";
import "../styles/reaction-lab-v2.css";
import "../styles/reaction-lab-v3.css";
import "../styles/reaction-lab-v4.css";
import "../styles/reaction-lab-v5.css";
import "../styles/reaction-lab-v6.css";
import "../styles/training-leaderboard.css";

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
            <h1>반응속도 에임 트레이너</h1>
          </div>
          <div className="reaction-lab-status" aria-label="훈련 시스템 온라인">
            <i aria-hidden="true" />
            <span>READY</span>
          </div>
        </header>
        <ReactionLabGame />
        <p className="reaction-lab-help">상단 색상 확인 → 같은 색 훈련봇 탐색 → 조준 전환 → 사격</p>
        <p className="reaction-lab-disclaimer">비상업 팬게임 훈련 콘텐츠 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
