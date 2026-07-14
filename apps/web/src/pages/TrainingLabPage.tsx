import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrainingLeaderboard } from "../features/training/TrainingLeaderboard";
import {
  ensureDiscordTrainingIdentity,
  retryDiscordTrainingIdentity,
  useDiscordTrainingIdentity,
} from "../features/training/discordIdentity";
import { ReactionLabPage } from "./ReactionLabPage";
import { WidowHoldShotPage } from "./WidowHoldShotPage";
import "../styles/training-lab.css";
import "../styles/training-leaderboard.css";
import "../styles/training-db-ranking.css";
import "../styles/training-discord-identity.css";

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
  const identityState = useDiscordTrainingIdentity();

  useEffect(() => {
    if (!activityMode || identityState.status !== "idle") return;

    // 랭킹은 연결 없이 DB에서 읽고, 기록 저장용 Discord 인증만 조용히 준비한다.
    void ensureDiscordTrainingIdentity().catch(() => undefined);
  }, [activityMode, identityState.status]);

  if (game === "reaction") {
    return <ReactionLabPage activityMode onBack={() => setGame("menu")} />;
  }

  if (game === "widow") {
    return <WidowHoldShotPage onBack={() => setGame("menu")} />;
  }

  const reactionBest = readBestScore("discord-random-defense:reaction-lab:best");
  const widowBest = readBestScore("discord-random-defense:widow-hold-shot:best");
  const identity = identityState.identity;

  const connectDiscord = () => {
    if (identityState.status === "error") {
      retryDiscordTrainingIdentity();
      return;
    }
    void ensureDiscordTrainingIdentity().catch(() => undefined);
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

        <section className={`training-profile training-profile--${identityState.status}`} aria-label="Discord 서버 계정 연결 상태">
          <span className="training-profile-avatar" aria-hidden="true">
            {identity?.avatarUrl ? <img src={identity.avatarUrl} alt="" /> : identity?.displayName.slice(0, 1) ?? "D"}
          </span>
          <div>
            <small>DISCORD SCORE IDENTITY</small>
            <strong>{identity
              ? `${identity.displayName} 님으로 기록 저장 연결됨`
              : identityState.status === "loading"
                ? "Discord 기록 저장 연결 중…"
                : identityState.status === "error"
                  ? "기록 저장 연결이 잠시 끊겼어요"
                  : "Discord 계정을 연결하면 기록이 저장됩니다"}</strong>
            <span>{identity
              ? "게임이 끝나면 현재 서버 DB에 최고 기록이 자동 저장됩니다."
              : identityState.status === "loading"
                ? "랭킹은 이미 DB에서 불러오고 있으며, 저장용 인증만 준비하고 있습니다."
                : identityState.status === "error"
                  ? `${identityState.message} 랭킹 조회와 훈련은 계속 사용할 수 있어요.`
                  : "서버 랭킹은 연결 없이 볼 수 있고, 연결 후에는 최고 기록도 저장됩니다."}</span>
          </div>
          {identity ? (
            <b className="training-profile-connected">CONNECTED</b>
          ) : activityMode ? (
            <button
              type="button"
              className="training-connect-button"
              onClick={connectDiscord}
              disabled={identityState.status === "loading"}
            >
              {identityState.status === "loading"
                ? "자동 연결 중…"
                : identityState.status === "error"
                  ? "기록 저장 다시 연결"
                  : "Discord 기록 저장 연결"}
            </button>
          ) : null}
        </section>

        <section className="training-lab-intro">
          <div>
            <h2>짧게 반복하고, 실전 감각을 끌어올리세요.</h2>
            <p>서버 랭킹은 DB에서 바로 확인하고, 연결된 계정의 최고 기록만 안전하게 갱신합니다.</p>
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
              <small>인지 · 탐색 · 에임 전환</small>
              <h2>반응속도 에임 트레이너</h2>
              <p>상단에 표시되는 레드·그린·블루를 확인하고, 움직이는 표적 사이에서 같은 색을 빠르게 찾아 사격하세요.</p>
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
          <span>서버 랭킹과 최고 기록은 DB에 저장됩니다</span>
        </footer>
      </section>
    </main>
  );
}
