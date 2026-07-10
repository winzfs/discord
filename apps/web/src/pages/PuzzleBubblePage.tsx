import { Link } from "react-router-dom";
import { PuzzleBubbleCanvas } from "../features/puzzle-bubble/PuzzleBubbleCanvas";
import "../styles/puzzle-bubble.css";

export function PuzzleBubblePage() {
  return (
    <main className="puzzle-bubble-shell">
      <div className="puzzle-bubble-stage">
        <header className="puzzle-bubble-topbar">
          <Link to="/lobby" className="puzzle-bubble-back" aria-label="로비로 돌아가기">
            ←
          </Link>
          <div>
            <p>ARCADE MODE</p>
            <h1>HERO POP</h1>
          </div>
          <span className="puzzle-bubble-live">LIVE</span>
        </header>

        <section className="puzzle-bubble-board" aria-label="히어로 팝 게임 화면">
          <PuzzleBubbleCanvas />
        </section>

        <p className="puzzle-bubble-help">끌어서 조준하고 손을 떼어 발사 · 같은 영웅 3개를 연결하세요</p>
        <p className="puzzle-bubble-disclaimer">비상업 오버워치 팬게임 · Blizzard Entertainment와 공식 관련 없음</p>
      </div>
    </main>
  );
}
