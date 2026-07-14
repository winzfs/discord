import { useState } from "react";
import { Link } from "react-router-dom";
import { TrainingLeaderboard } from "../features/training/TrainingLeaderboard";
import {
  getTrainingProfile,
  updateTrainingNickname,
  type TrainingProfile,
} from "../features/training/leaderboard";
import { ReactionLabPage } from "./ReactionLabPage";
import { WidowHoldShotPage } from "./WidowHoldShotPage";
import "../styles/training-lab.css";
import "../styles/training-leaderboard.css";

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
  const [profile, setProfile] = useState<TrainingProfile>(getTrainingProfile);
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname);

  if (game === "reaction") {
    return <ReactionLabPage activityMode onBack={() => setGame("menu")} />;
  }

  if (game === "widow") {
    return <WidowHoldShotPage onBack={() => setGame("menu")} />;
  }

  const reactionBest = readBestScore("discord-random-defense:reaction-lab:best");
  const widowBest = readBestScore("discord-random-defense:widow-hold-shot:best");

  const saveNickname = () => {
    const next = updateTrainingNickname(nicknameDraft);
    setProfile(next);
    setNicknameDraft(next.nickname);
  };

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
            <p>게임이 끝나면 최고 기록이 자동으로 랭킹 서버에 저장됩니다.</p>
          </div>
          <div className="training-lab-count"><strong>2</strong><span>TRAINING MODES</span></div>
        </section>

        <section className="training-profile" aria-label="훈련소 호출명 설정">
          <div>
            <small>PLAYER CALLSIGN</small>
            <strong>{profile.nickname}</strong>
            <span>이 이름으로 훈련소 랭킹에 표시됩니다.</span>
          </div>
          <label>
            <span>호출명</span>
            <input
              value={nicknameDraft}
              maxLength={16}
              autoComplete="off"
              onChange={(event) => setNicknameDraft(event.target.value)}
              onBlur={saveNickname}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
          </label>
          <button type="button" onClick={saveNickname}>저장</button>
        </section>

        <div className="training-lab-grid">
          <article className="training-card training-card--reaction">
            <div className="training-card-number">01</div>
            <div className="training-card-icon training-card-icon--reaction" aria-hidden="true">
              <span /><i /><b />
            </div>
            <div className="training-card-copy">
              <small>인지 · 탐색 · 에임 전환</small>
              <h2>반응속도 에임 트레이너</h2>
              <p>상단에 지정된 역할을 확인하고, 움직이는 사람형 표적 사이에서 빠르게 찾아 조준해 사격하세요.</p>
            </div>
            <div className="training-card-footer">
              <div><span>DEVICE BEST</span><strong>{reactionBest.toLocaleString()}</strong></div>
              <button type="button" onClick={() => setGame("reaction")}>훈련 시작</button>
            </div>
          </article>

          <article className="training-card training-card--widow">
            <div className="training-card-number">02</div>
            <div className="training-card-icon training-card-icon--widow" aria-hidden="true">
              <span /><i /><b />
            </div>
            <div className="training-card-copy">
              <small>조준 · 타이밍 · 무빙 예측</small>
              <h2>위도우 대기샷 연습</h2>
              <p>조준점을 고정한 채 괴랄하게 스트레이프하는 표적의 머리가 중앙을 통과하는 순간 발사하세요.</p>
            </div>
            <div className="training-card-footer">
              <div><span>DEVICE BEST</span><strong>{widowBest.toLocaleString()}</strong></div>
              <button type="button" onClick={() => setGame("widow")}>훈련 시작</button>
            </div>
          </article>
        </div>

        <TrainingLeaderboard />

        <footer className="training-lab-footer">
          <span>마우스 · 터치 · 키보드 지원</span>
          <span>최고 기록은 DB와 현재 기기에 함께 저장됩니다</span>
        </footer>
      </section>
    </main>
  );
}
