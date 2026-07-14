import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  playTrainingHit,
  playTrainingMiss,
  playTrainingShot,
  prepareTrainingAudio,
} from "../training/audio";
import { submitTrainingScore } from "../training/leaderboard";
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
const HUD_REFRESH_MS = 50;
const BEST_SCORE_KEY = "discord-random-defense:reaction-lab:best";

type GamePhase = "idle" | "playing" | "result";
type Feedback = { kind: "hit" | "miss"; text: string } | null;
type HitMarker = { x: number; y: number; kind: "hit" | "miss"; id: number } | null;
type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  rank?: number;
  improved?: boolean;
};

function readBestScore(): number {
  try {
    const value = Number(window.localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
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
  const [hitMarker, setHitMarker] = useState<HitMarker>(null);
  const [shotFlash, setShotFlash] = useState(false);
  const [totalReactionMs, setTotalReactionMs] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  const boardRef = useRef<HTMLDivElement | null>(null);
  const crosshairRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<GamePhase>("idle");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const totalReactionMsRef = useRef(0);
  const roundRef = useRef(0);
  const promptRef = useRef<ReactionRoleDefinition>(REACTION_ROLES[0]);
  const gameEndsAtRef = useRef(0);
  const roundStartedAtRef = useRef(0);
  const roundExpiresAtRef = useRef(Number.POSITIVE_INFINITY);
  const lastHudAtRef = useRef(0);
  const lockedRef = useRef(true);
  const transitionTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const markerTimerRef = useRef<number | null>(null);
  const markerIdRef = useRef(0);

  const showFeedback = useCallback((next: Feedback) => {
    setFeedback(next);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null;
      setFeedback(null);
    }, 620);
  }, []);

  const showShot = useCallback((x: number, y: number, kind: "hit" | "miss") => {
    markerIdRef.current += 1;
    setShotFlash(true);
    setHitMarker({ x, y, kind, id: markerIdRef.current });

    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setShotFlash(false);
    }, 78);

    if (markerTimerRef.current !== null) window.clearTimeout(markerTimerRef.current);
    markerTimerRef.current = window.setTimeout(() => {
      markerTimerRef.current = null;
      setHitMarker(null);
    }, 260);
  }, []);

  const hideCrosshair = useCallback(() => {
    crosshairRef.current?.classList.remove("is-visible");
  }, []);

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
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      spawnRound();
    }, 210);
  }, [spawnRound]);

  const finishGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "result";
    lockedRef.current = true;
    roundExpiresAtRef.current = Number.POSITIVE_INFINITY;
    setPhase("result");
    setTargets([]);
    setTimeLeft(0);
    hideCrosshair();

    const finalScore = scoreRef.current;
    const attempts = hitsRef.current + missesRef.current;
    const finalAccuracy = attempts > 0 ? Math.round((hitsRef.current / attempts) * 100) : 0;
    const finalAverageReaction = hitsRef.current > 0
      ? Math.round(totalReactionMsRef.current / hitsRef.current)
      : null;

    setBestScore((currentBest) => {
      const nextBest = Math.max(currentBest, finalScore);
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
      } catch {
        // 저장소가 막힌 환경에서는 현재 세션 기록만 유지한다.
      }
      return nextBest;
    });

    setSaveState({ status: "saving" });
    void submitTrainingScore({
      gameKey: "reaction",
      score: finalScore,
      accuracy: finalAccuracy,
      avgReactionMs: finalAverageReaction,
      maxCombo: maxComboRef.current,
    }).then((result) => {
      setSaveState({ status: "saved", rank: result.rank, improved: result.improved });
    }).catch(() => {
      setSaveState({ status: "error" });
    });
  }, [hideCrosshair]);

  const registerMiss = useCallback((text: string, playSound = true) => {
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
    if (playSound) playTrainingMiss();
    queueNextRound();
  }, [queueNextRound]);

  useEffect(() => {
    if (phase !== "playing") return undefined;

    let animationFrame = 0;
    lastHudAtRef.current = 0;
    const tick = (now: number) => {
      const remaining = Math.max(0, gameEndsAtRef.current - now);
      if (now - lastHudAtRef.current >= HUD_REFRESH_MS || remaining <= 0) {
        lastHudAtRef.current = now;
        setTimeLeft(remaining);
      }

      if (remaining <= 0) {
        finishGame();
        return;
      }

      if (!lockedRef.current && now >= roundExpiresAtRef.current) {
        registerMiss("표적 획득 실패");
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [finishGame, phase, registerMiss]);

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    if (markerTimerRef.current !== null) window.clearTimeout(markerTimerRef.current);
  }, []);

  const startGame = useCallback(() => {
    prepareTrainingAudio();
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
    totalReactionMsRef.current = 0;
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
    setTotalReactionMs(0);
    setTimeLeft(GAME_DURATION_MS);
    setFeedback(null);
    setHitMarker(null);
    setShotFlash(false);
    setSaveState({ status: "idle" });
    hideCrosshair();
    spawnRound();
  }, [hideCrosshair, spawnRound]);

  const aimAtPointer = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const board = boardRef.current;
    if (board === null) return { x: 50, y: 50 };
    const rect = board.getBoundingClientRect();
    const xPx = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const yPx = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const x = rect.width > 0 ? (xPx / rect.width) * 100 : 50;
    const y = rect.height > 0 ? (yPx / rect.height) * 100 : 50;
    const crosshair = crosshairRef.current;
    if (crosshair !== null) {
      crosshair.style.transform = `translate3d(${xPx.toFixed(1)}px, ${yPx.toFixed(1)}px, 0) translate(-50%, -50%)`;
      crosshair.classList.add("is-visible");
    }
    return { x, y };
  }, []);

  const handleTarget = useCallback((target: ReactionTarget, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (phaseRef.current !== "playing" || lockedRef.current) return;

    const point = aimAtPointer(event);
    playTrainingShot();

    if (target.role !== promptRef.current.key) {
      showShot(point.x, point.y, "miss");
      registerMiss("아군 식별 오류", false);
      playTrainingMiss();
      return;
    }

    lockedRef.current = true;
    roundExpiresAtRef.current = Number.POSITIVE_INFINITY;
    const reactionMs = performance.now() - roundStartedAtRef.current;
    comboRef.current += 1;
    hitsRef.current += 1;
    totalReactionMsRef.current += reactionMs;
    maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    const gained = scoreReaction(reactionMs, comboRef.current);
    scoreRef.current += gained;

    setCombo(comboRef.current);
    setMaxCombo(maxComboRef.current);
    setHits(hitsRef.current);
    setTotalReactionMs(totalReactionMsRef.current);
    setScore(scoreRef.current);
    showFeedback({ kind: "hit", text: `명중 +${gained} · ${Math.round(reactionMs)}ms` });
    showShot(point.x, point.y, "hit");
    playTrainingHit(reactionMs < 420);
    queueNextRound();
  }, [aimAtPointer, queueNextRound, registerMiss, showFeedback, showShot]);

  const handleBoardShot = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "playing" || lockedRef.current) return;
    event.preventDefault();
    const point = aimAtPointer(event);
    playTrainingShot();
    showShot(point.x, point.y, "miss");
    registerMiss("빗나감", false);
    playTrainingMiss();
  }, [aimAtPointer, registerMiss, showShot]);

  const secondsLeft = (timeLeft / 1000).toFixed(1);
  const result = rankReactionScore(score);
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
  const averageReaction = hits > 0 ? Math.round(totalReactionMs / hits) : 0;
  const promptColor = prompt.key === "tank" ? "파란색" : prompt.key === "damage" ? "빨간색" : "초록색";

  return (
    <section className={`reaction-lab-game reaction-lab-game--${phase}`}>
      <div className="reaction-lab-hud" aria-label="현재 게임 기록">
        <div><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
        <div><span>COMBO</span><strong>{combo}x</strong></div>
        <div><span>ACCURACY</span><strong>{accuracy}%</strong></div>
        <div><span>TIME</span><strong>{secondsLeft}</strong></div>
      </div>

      <div
        ref={boardRef}
        className={`reaction-lab-board ${shotFlash ? "is-firing" : ""}`}
        onPointerMove={phase === "playing" ? aimAtPointer : undefined}
        onPointerEnter={phase === "playing" ? aimAtPointer : undefined}
        onPointerLeave={hideCrosshair}
        onPointerDown={phase === "playing" ? handleBoardShot : undefined}
      >
        <div className="reaction-range-depth" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="reaction-range-floor" aria-hidden="true" />
        <div className="reaction-range-beacon reaction-range-beacon--left" aria-hidden="true" />
        <div className="reaction-range-beacon reaction-range-beacon--right" aria-hidden="true" />
        <div className="reaction-lab-scanline" aria-hidden="true" />

        {phase === "idle" ? (
          <div className="reaction-lab-overlay">
            <div className="reaction-lab-core reaction-lab-core--idle" aria-hidden="true"><span /></div>
            <p className="reaction-lab-kicker">30 SECOND AIM CALIBRATION</p>
            <h2>표적을 식별하고 직접 조준해 사격하세요</h2>
            <p>마우스나 터치로 조준점을 움직인 뒤 지시된 역할의 훈련봇을 쏘세요. 빠른 명중과 연속 처치가 점수를 높입니다.</p>
            <div className="reaction-lab-role-guide">
              {REACTION_ROLES.map((role) => (
                <span key={role.key} className={`reaction-lab-role-guide__${role.key}`}><b>{role.symbol}</b>{role.label}</span>
              ))}
            </div>
            <button type="button" className="reaction-lab-primary" onClick={startGame}>사격 훈련 시작</button>
          </div>
        ) : null}

        {phase === "playing" ? (
          <>
            <div className={`reaction-lab-prompt reaction-lab-prompt--${prompt.key}`}>
              <span className="reaction-prompt-icon">{prompt.symbol}</span>
              <div className="reaction-prompt-copy">
                <small>지금 맞혀야 할 표적</small>
                <strong>{prompt.label}</strong>
                <em>{promptColor} 훈련봇만 사격하세요</em>
              </div>
              <b className="reaction-prompt-command">사격</b>
            </div>
            <div className={`reaction-lab-timer-bar ${timeLeft < 5000 ? "is-critical" : ""}`}>
              <i style={{ transform: `scaleX(${timeLeft / GAME_DURATION_MS})` }} />
            </div>
            <div className="reaction-lab-target-field" aria-live="polite">
              {targets.map((target) => {
                const role = getRole(target.role);
                const style = {
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  width: `${target.size * 0.58}px`,
                  height: `${target.size}px`,
                  transform: `translate(-50%, -50%) rotate(${target.tilt}deg)`,
                  "--reaction-drift-x": `${target.driftX}%`,
                  "--reaction-drift-y": `${target.driftY}%`,
                  "--reaction-motion-duration": `${target.motionDuration}s`,
                  "--reaction-motion-delay": `${target.motionDelay}s`,
                  "--reaction-facing": target.facing,
                } as CSSProperties;
                return (
                  <button
                    key={target.id}
                    type="button"
                    className={`reaction-lab-target reaction-lab-target--${target.role}`}
                    style={style}
                    onPointerDown={(event) => handleTarget(target, event)}
                    aria-label={`${role.label} 훈련봇`}
                  >
                    <span className="reaction-agent">
                      <span className="reaction-agent__shadow" />
                      <span className="reaction-agent__character">
                        <span className="reaction-agent__head"><i /></span>
                        <span className="reaction-agent__neck" />
                        <span className="reaction-agent__torso"><i /><b>{role.symbol}</b></span>
                        <span className="reaction-agent__arm reaction-agent__arm--left"><i /></span>
                        <span className="reaction-agent__arm reaction-agent__arm--right"><i /></span>
                        <span className="reaction-agent__hips" />
                        <span className="reaction-agent__leg reaction-agent__leg--left"><i /></span>
                        <span className="reaction-agent__leg reaction-agent__leg--right"><i /></span>
                      </span>
                      <span className="reaction-agent__label">{role.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div ref={crosshairRef} className="reaction-crosshair reaction-crosshair--gpu" aria-hidden="true"><i /><b /></div>
            {hitMarker ? (
              <div
                key={hitMarker.id}
                className={`reaction-hit-marker is-${hitMarker.kind}`}
                style={{ left: `${hitMarker.x}%`, top: `${hitMarker.y}%` }}
                aria-hidden="true"
              ><i /><i /><i /><i /></div>
            ) : null}
            <div className="reaction-weapon-hud" aria-hidden="true"><span>∞</span><b>CALIBRATED</b></div>
            {feedback ? <p className={`reaction-lab-feedback is-${feedback.kind}`}>{feedback.text}</p> : null}
            {shotFlash ? <div className="reaction-shot-flash" aria-hidden="true" /> : null}
          </>
        ) : null}

        {phase === "result" ? (
          <div className="reaction-lab-overlay reaction-lab-result">
            <div className={`reaction-lab-grade reaction-lab-grade--${result.grade.toLowerCase()}`}>{result.grade}</div>
            <p className="reaction-lab-kicker">AIM CALIBRATION COMPLETE</p>
            <h2>{result.title}</h2>
            <strong className="reaction-lab-final-score">{score.toLocaleString()}</strong>
            <div className="reaction-lab-result-grid">
              <div><span>명중</span><b>{hits}</b></div>
              <div><span>정확도</span><b>{accuracy}%</b></div>
              <div><span>평균 반응</span><b>{averageReaction}ms</b></div>
              <div><span>최대 콤보</span><b>{maxCombo}x</b></div>
            </div>
            <small className="reaction-result-best">최고 점수 {bestScore.toLocaleString()} · 실수 {misses}</small>
            {saveState.status === "saving" ? <small className="training-score-save-state is-saving">랭킹 기록 저장 중…</small> : null}
            {saveState.status === "saved" ? (
              <small className="training-score-save-state">DB 저장 완료 · 현재 {saveState.rank}위{saveState.improved ? " · 최고 기록 갱신" : ""}</small>
            ) : null}
            {saveState.status === "error" ? <small className="training-score-save-state is-error">DB 저장 실패 · 기기 기록은 유지됐습니다</small> : null}
            <button type="button" className="reaction-lab-primary" onClick={startGame}>다시 도전</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}