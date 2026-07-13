import { useState } from "react";
import { Link } from "react-router-dom";
import { ReactionLabPage } from "./ReactionLabPage";
import { WidowHoldShotPage } from "./WidowHoldShotPage";
import "../styles/training-lab.css";

type TrainingGame = "menu" | "reaction" | "widow";

type TrainingLabPageProps = {
  activityMode?: boolean;
};

function readBestScore(key: string): number {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function TrainingLabPage({ activityMode = false }: TrainingLabPageProps) {
  const [game, setGame] = useState<TrainingGame>("menu");

  if (game === "reaction") {
    return <ReactionLabPage activityMode onBack={() => setGame("menu")} />;
  }

  if (game === "widow") {
    return <WidowHoldShotPage onBack={() => setGame("menu")} />;
  }

  const reactionBest = readBestScore("discord-random-defense:reaction-lab:best");
  const widowBest = readBestScore("discord-random-defense:widow-hold-shot:best");

  return (
    <main className="training-lab-shell">
      <section className="training-lab-stage" aria-label="전술 훈련소 게임 선택">
        <header className="training-lab-header">
          {activityMode ? <span aria-hidden="true" /> : <Link to="/game" aria-label="게임 선택 화면으로 돌아가기">←</Link>}
          <div>
            <p>TACTICAL TRAINING NETWORK</p>
            <h1>훈련소</h1>
          </div>
          <span className="training-lab-online"><i aria-hidden="true" />ONLINE</span>
        </header>

        <section className="training-lab-intro">
          <div>
            <h2>짧게 반복하고, 실전 감각을 끌어올리세요.</h2>
            <p>원하는 훈련을 선택하면 Activity 창 안에서 바로 시작됩니다.</p>
          </div>
          <div className="training-lab-count"><strong>2</strong><span>TRAINING MODES</span></div>
        </section>

        <div className="training-lab-grid">
          <article className="training-card training-card--reaction">
            <div className="training-card-number">01</div>
            <div className="training-card-icon training-card-icon--reaction" aria-hidden="true">
              <span /><i /><b />
            </div>
            <div className="training-card-copy">
              <small>인지 · 반응</small>
              <h2>반응속도 연습</h2>
              <p>지시된 역할 표식을 빠르게 찾아 누르고 연속 정답 콤보를 이어가세요.</p>
            </div>
            <div className="training-card-footer">
              <div><span>BEST SCORE</span><strong>{reactionBest.toLocaleString()}</strong></div>
              <button type="button" onClick={() => setGame("reaction")}>훈련 시작</button>
            </div>
          </article>

          <article className="training-card training-card--widow">
            <div className="training-card-number">02</div>
            <div className="training-card-icon training-card-icon--widow" aria-hidden="true">
              <span /><i /><b />
            </div>
            <div className="training-card-copy">
              <small>조준 · 타이밍</small>
              <h2>위도우 대기샷 연습</h2>
              <p>조준점을 고정한 채 움직이는 표적의 머리가 중앙을 통과하는 순간 발사하세요.</p>
            </div>
            <div className="training-card-footer">
              <div><span>BEST SCORE</span><strong>{widowBest.toLocaleString()}</strong></div>
              <button type="button" onClick={() => setGame("widow")}>훈련 시작</button>
            </div>
          </article>
        </div>

        <footer className="training-lab-footer">
          <span>마우스 · 터치 · 키보드 지원</span>
          <span>기록은 현재 기기에 저장됩니다</span>
        </footer>
      </section>
    </main>
  );
}
