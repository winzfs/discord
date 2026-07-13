import { Link } from "react-router-dom";
import { ReactionLabGame } from "../features/reaction-lab/ReactionLabGame";
import "../styles/reaction-lab.css";

export function ReactionLabPage() {
  return (
    <main className="reaction-lab-shell">
      <section className="reaction-lab-stage" aria-label="옴닉 반응 훈련 게임">
        <header className="reaction-lab-topbar">
          <Link to="/game" aria-label="게임 선택 화면으로 돌아가기">←</Link>
          <div className="reaction-lab-brand">
            <p>OMNIC TACTICAL NETWORK</p>
            <h1>REACTION LAB</h1>
          </div>
          <div className="reaction-lab-status" aria-label="훈련 시스템 온라인">
            <i aria-hidden="true" />
            <span>READY</span>
          </div>
        </header>
        <ReactionLabGame />
        <p className="reaction-lab-help">터치와 마우스 지원 · 최고 기록은 이 기기에 저장됩니다</p>
        <p className="reaction-lab-disclaimer">비상업 오버워치 팬게임 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
