import { useCallback, useEffect, useRef, useState } from "react";
import {
  createReactionTargets,
  getRole,
  getRoundLifetime,
  pickNextRole,
  rankReactionScore,
  REACTION_ROLES,
  scoreReaction,
  type ReactionRoleDefinition,
  type ReactionTarget,
} from "./game";

const GAME_DURATION_MS = 30_000;
const BEST_SCORE_KEY = "discord-random-defense:reaction-lab:best";

type GamePhase = "idle" | "playing" | "result";
type Feedback = { kind: "hit" | "miss"; text: string } | null;

function readBestScore(): number {
  const value = Number(window.localStorage.getItem(BEST_SCORE_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function ReactionLabGame() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(readBestScore);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);
  const [prompt, setPrompt] = useState<ReactionRoleDefinition>(REACTION_ROLES[0]);
  const [targets, setTargets] = useState<ReactionTarget[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const phaseRef = useRef<GamePhase>("idle");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const roundRef = useRef(0);
  const promptRef = useRef<ReactionRoleDefinition>(REACTION_ROLES[0]);
  const gameEndsAtRef = useRef(0);
  const roundStartedAtRef = useRef(0);
  const roundExpiresAtRef = useRef(Number.POSITIVE_INFINITY);
  const lockedRef = useRef(true);
  const transitionTimerRef = useRef<number | null>(null);

  const spawnRound = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    roundRef.current += 1;
    const nextPrompt = pickNextRole(promptRef.current.key);
    promptRef.current = nextPrompt;
    setPrompt(nextPrompt);
    setTargets(createReactionTargets(nextPrompt.key, roundRef.current));
    setFeedback(null);
    lockedRef.current = false;
    roundStartedAtRef.current = performance.now();
    roundExpiresAtRef.current = roundStartedAtRef.current + getRoundLifetime(roundRef.current);
  }, []);

  const queueNextRound = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      spawnRound();
    }, 160);
  }, [spawnRound]);

  const finishGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "result";
    lockedRef.current = true;
    roundExpiresAtRef.current = Number.POSITIVE_INFINITY;
    setPhase("result");
    setTargets([]);
    setTimeLeft(0);

    const finalScore = scoreRef.current;
    setBestScore((currentBest) => {
      const nextBest = Math.max(currentBest, finalScore);
      window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
      return nextBest;
    });
  }, []);

  const registerMiss = useCallback((text: string) => {
    if (phaseRef.current !== "playing" || lockedRef.current) return;
    lockedRef.current = true;
    roundExpiresAtRef.current = Number.POSITIVE_INFINITY;
    comboRef.current = 0;
    missesRef.current += 1;
    scoreRef.current = Math.max(0, scoreRef.current - 35);
    setCombo(0);
    setMisses(missesRef.current);
    setScore(scoreRef.current);
    setFeedback({ kind: "miss", text });
    queueNextRound();
  }, [queueNextRound]);

  useEffect(() => {
    if (phase !== "playing") return undefined;

    let animationFrame = 0;
    const tick = () => {
      const now = performance.now();
      const remaining = Math.max(0, gameEndsAtRef.current - now);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        finishGame();
        return;
      }

      if (!lockedRef.current && now >= roundExpiresAtRef.current) {
        registerMiss("신호를 놓쳤습니다");
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [finishGame, phase, registerMiss]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
  }, []);

  const startGame = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    phaseRef.current = "playing";
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    hitsRef.current = 0;
    missesRef.current = 0;
    roundRef.current = 0;
    gameEndsAtRef.current = performance.now() + GAME_DURATION_MS;
    roundExpiresAtRef.current = Number.POSITIVE_INFINITY;
    lockedRef.current = true;
    setPhase("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(GAME_DURATION_MS);
    setFeedback(null);
    spawnRound();
  };

  const handleTarget = (target: ReactionTarget) => {
    if (phaseRef.current !== "playing" || lockedRef.current) return;
    if (target.role !== promptRef.current.key) {
      registerMiss("잘못된 역할을 선택했습니다");
      return;
    }

    lockedRef.current = true;
    roundExpiresAtRef.current = Number.POSITIVE_INFINITY;
    const reactionMs = performance.now() - roundStartedAtRef.current;
    comboRef.current += 1;
    hitsRef.current += 1;
    maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    const gained = scoreReaction(reactionMs, comboRef.current);
    scoreRef.current += gained;

    setCombo(comboRef.current);
    setMaxCombo(maxComboRef.current);
    setHits(hitsRef.current);
    setScore(scoreRef.current);
    setFeedback({ kind: "hit", text: `+${gained} · ${Math.round(reactionMs)}ms` });
    queueNextRound();
  };

  const secondsLeft = (timeLeft / 1000).toFixed(1);
  const result = rankReactionScore(score);
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <section className={`reaction-lab-game reaction-lab-game--${phase}`}>
      <div className="reaction-lab-hud" aria-label="현재 게임 기록">
        <div><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
        <div><span>COMBO</span><strong>{combo}x</strong></div>
        <div><span>TIME</span><strong>{secondsLeft}</strong></div>
        <div><span>BEST</span><strong>{bestScore.toLocaleString()}</strong></div>
      </div>

      <div className="reaction-lab-board">
        <div className="reaction-lab-scanline" aria-hidden="true" />

        {phase === "idle" ? (
          <div className="reaction-lab-overlay">
            <div className="reaction-lab-core reaction-lab-core--idle" aria-hidden="true"><span /></div>
            <p className="reaction-lab-kicker">30 SECOND CALIBRATION</p>
            <h2>역할 신호를 빠르게 식별하세요</h2>
            <p>상단 지시에 맞는 표식을 누르세요. 연속 정답은 점수 배율을 올리고, 오답은 점수를 깎습니다.</p>
            <div className="reaction-lab-role-guide">
              {REACTION_ROLES.map((role) => (
                <span key={role.key} className={`reaction-lab-role-guide__${role.key}`}>
                  <b>{role.symbol}</b>{role.label}
                </span>
              ))}
            </div>
            <button type="button" className="reaction-lab-primary" onClick={startGame}>훈련 시작</button>
          </div>
        ) : null}

        {phase === "playing" ? (
          <>
            <div className={`reaction-lab-prompt reaction-lab-prompt--${prompt.key}`}>
              <span>{prompt.symbol}</span>
              <div><small>TARGET ROLE</small><strong>{prompt.instruction}</strong></div>
            </div>
            <div className={`reaction-lab-timer-bar ${timeLeft < 5000 ? "is-critical" : ""}`}>
              <i style={{ transform: `scaleX(${timeLeft / GAME_DURATION_MS})` }} />
            </div>
            <div className="reaction-lab-target-field" aria-live="polite">
              {targets.map((target) => {
                const role = getRole(target.role);
                return (
                  <button
                    key={target.id}
                    type="button"
                    className={`reaction-lab-target reaction-lab-target--${target.role}`}
                    style={{
                      left: `${target.x}%`,
                      top: `${target.y}%`,
                      width: `${target.size}px`,
                      height: `${target.size}px`,
                      transform: `translate(-50%, -50%) rotate(${target.tilt}deg)`,
                    }}
                    onPointerDown={() => handleTarget(target)}
                    aria-label={`${role.label} 표식`}
                  >
                    <span>{role.symbol}</span>
                  </button>
                );
              })}
            </div>
            {feedback ? <p className={`reaction-lab-feedback is-${feedback.kind}`}>{feedback.text}</p> : null}
          </>
        ) : null}

        {phase === "result" ? (
          <div className="reaction-lab-overlay reaction-lab-result">
            <div className={`reaction-lab-grade reaction-lab-grade--${result.grade.toLowerCase()}`}>{result.grade}</div>
            <p className="reaction-lab-kicker">CALIBRATION COMPLETE</p>
            <h2>{result.title}</h2>
            <strong className="reaction-lab-final-score">{score.toLocaleString()}</strong>
            <div className="reaction-lab-result-grid">
              <div><span>명중</span><b>{hits}</b></div>
              <div><span>실수</span><b>{misses}</b></div>
              <div><span>정확도</span><b>{accuracy}%</b></div>
              <div><span>최대 콤보</span><b>{maxCombo}x</b></div>
            </div>
            <button type="button" className="reaction-lab-primary" onClick={startGame}>다시 도전</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
