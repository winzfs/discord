import { Link } from "react-router-dom";
import { HeroStrikeCanvas } from "../features/hero-strike/HeroStrikeCanvas";
import "../styles/hero-strike.css";

export function HeroStrikePage() {
  return (
    <main className="hero-strike-shell">
      <section className="hero-strike-stage" aria-label="히어로 스트라이크 게임 화면">
        <header className="hero-strike-topbar">
          <Link to="/game" aria-label="게임 선택 화면으로 돌아가기">←</Link>
          <div className="hero-strike-brand">
            <p>OMNIC TACTICAL NETWORK</p>
            <h1>HERO STRIKE</h1>
          </div>
          <div className="hero-strike-status" aria-label="네트워크 온라인">
            <i aria-hidden="true" />
            <span>ONLINE</span>
          </div>
        </header>
        <div className="hero-strike-frame">
          <span className="hero-strike-corner hero-strike-corner--tl" aria-hidden="true" />
          <span className="hero-strike-corner hero-strike-corner--tr" aria-hidden="true" />
          <span className="hero-strike-corner hero-strike-corner--bl" aria-hidden="true" />
          <span className="hero-strike-corner hero-strike-corner--br" aria-hidden="true" />
          <HeroStrikeCanvas />
        </div>
        <p className="hero-strike-help">COMMAND DECK에서 장비 구성 · 전투 중 드래그 DRIVE · 손을 떼면 FOCUS</p>
        <p className="hero-strike-disclaimer">비상업 오버워치 팬게임 · Blizzard Entertainment와 공식 관련 없음</p>
      </section>
    </main>
  );
}
