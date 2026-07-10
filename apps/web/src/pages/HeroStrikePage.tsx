import { Link } from "react-router-dom";
import { HeroStrikeCanvas } from "../features/hero-strike/HeroStrikeCanvas";
import "../styles/hero-strike.css";

export function HeroStrikePage() {
  return (
    <main className="hero-strike-shell">
      <section className="hero-strike-stage" aria-label="히어로 스트라이크 게임 화면">
        <header className="hero-strike-topbar">
          <Link to="/game" aria-label="게임 선택 화면으로 돌아가기">←</Link>
          <div>
            <p>ARCADE SHOOTER</p>
            <h1>HERO STRIKE</h1>
          </div>
          <span>LIVE</span>
        </header>
        <HeroStrikeCanvas />
        <p className="hero-strike-help">화면을 끌어 이동 · 공격은 자동 · 오른쪽 아래 펄스 버튼으로 궁극기</p>
        <p className="hero-strike-disclaimer">비상업 오버워치 팬게임 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
