import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceWidowMotion,
  createWidowMotion,
  getWidowBodyWindow,
  getWidowDifficulty,
  getWidowDirection,
  getWidowHeadWindow,
  getWidowSpawnDelay,
  getWidowTargetScale,
  randomBetween,
  WIDOW_CROSSHAIR_X,
  type WidowMotionState,
} from "./movement";

const GAME_DURATION_MS = 45_000;
const BEST_SCORE_KEY = "discord-random-defense:widow-hold-shot:best";

type GamePhase = "idle" | "playing" | "result";
type FeedbackKind = "headshot" | "body" | "miss" | "escape";
type Feedback = { kind: FeedbackKind; text: string } | null;

function readBestScore(): number {
  try {
    const value = Number(window.localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function getRank(score: number) {
  if (score >= 6_500) return { grade: "S", title: "정밀 저격수" };
  if (score >= 4_500) return { grade: "A", title: "안정적인 대기샷" };
  if (score >= 2_800) return { grade: "B", title: "좋은 타이밍 감각" };
  if (score >= 1_500) return { grade: "C", title: "조준선 적응 중" };
  return { grade: "D", title: "조금 더 기다려 보세요" };
}

export function WidowHoldShotGame() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(readBestScore);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [kills, setKills] = useState(0);
  const [bodyHits, setBodyHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [shots, setShots] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetX, setTargetX] = useState(WIDOW_CROSSHAIR_X);
  const [targetScale, setTargetScale] = useState(1);
  const [targetDirection, setTargetDirection] = useState<1 | -1>(1);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [shotFlash, setShotFlash] = useState(false);

  const phaseRef = useRef<GamePhase>("idle");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const killsRef = useRef(0);
  const bodyHitsRef = useRef(0);
  const missesRef = useRef(0);
  const shotsRef = useRef(0);
  const targetVisibleRef = useRef(false);
  const targetScaleRef = useRef(1);
  const motionRef = useRef<WidowMotionState | null>(null);
  const difficultyRef = useRef(0);
  const spawnAtRef = useRef(Number.POSITIVE_INFINITY);
  const gameStartedAtRef = useRef(0);
  const gameEndsAtRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const lastShotAtRef = useRef(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const showFeedback = useCallback((next: Feedback) => {
    setFeedback(next);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null;
      setFeedback(null);
    }, 620);
  }, []);

  const scheduleTarget = useCallback((delay?: number) => {
    targetVisibleRef.current = false;
    motionRef.current = null;
    setTargetVisible(false);
    spawnAtRef.current = performance.now() + (delay ?? getWidowSpawnDelay(difficultyRef.current));
  }, []);

  const spawnTarget = useCallback(() => {
    const now = performance.now();
    const elapsedRatio = (now - gameStartedAtRef.current) / GAME_DURATION_MS;
    const difficulty = getWidowDifficulty(elapsedRatio, comboRef.current);
    const scale = getWidowTargetScale(difficulty);
    const motion = createWidowMotion(now, difficulty);
    const direction = getWidowDirection(motion);

    difficultyRef.current = difficulty;
    targetScaleRef.current = scale;
    motionRef.current = motion;
    targetVisibleRef.current = true;

    setTargetDirection(direction);
    setTargetScale(scale);
    setTargetX(motion.x);
    setTargetVisible(true);
    spawnAtRef.current = Number.POSITIVE_INFINITY;
  }, []);

  const finishGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "result";
    targetVisibleRef.current = false;
    motionRef.current = null;
    setTargetVisible(false);
    setPhase("result");
    setTimeLeft(0);

    const finalScore = scoreRef.current;
    setBestScore((current) => {
      const next = Math.max(current, finalScore);
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(next));
      } catch {
        // localStorage가 막힌 환경에서는 현재 세션 기록만 유지한다.
      }
      return next;
    });
  }, []);

  const registerEscape = useCallback(() => {
    if (!targetVisibleRef.current || phaseRef.current !== "playing") return;
    missesRef.current += 1;
    comboRef.current = 0;
    setMisses(missesRef.current);
    setCombo(0);
    showFeedback({ kind: "escape", text: "표적 이탈 · 무빙을 읽지 못했습니다" });
    scheduleTarget();
  }, [scheduleTarget, showFeedback]);

  useEffect(() => {
    if (phase !== "playing") return undefined;

    let animationFrame = 0;
    lastFrameAtRef.current = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.05, (now - lastFrameAtRef.current) / 1000);
      lastFrameAtRef.current = now;
      const remaining = Math.max(0, gameEndsAtRef.current - now);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        finishGame();
        return;
      }

      if (!targetVisibleRef.current && now >= spawnAtRef.current) {
        spawnTarget();
      }

      const motion = motionRef.current;
      if (targetVisibleRef.current && motion !== null) {
        advanceWidowMotion(motion, now, deltaSeconds);
        setTargetX(motion.x);
        setTargetDirection(getWidowDirection(motion));
        if (now >= motion.expiresAt) registerEscape();
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [finishGame, phase, registerEscape, spawnTarget]);

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
  }, []);

  const startGame = useCallback(() => {
    const now = performance.now();
    phaseRef.current = "playing";
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    killsRef.current = 0;
    bodyHitsRef.current = 0;
    missesRef.current = 0;
    shotsRef.current = 0;
    targetVisibleRef.current = false;
    motionRef.current = null;
    difficultyRef.current = 0;
    lastShotAtRef.current = 0;
    gameStartedAtRef.current = now;
    gameEndsAtRef.current = now + GAME_DURATION_MS;

    setPhase("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setKills(0);
    setBodyHits(0);
    setMisses(0);
    setShots(0);
    setTimeLeft(GAME_DURATION_MS);
    setFeedback(null);
    setShotFlash(false);
    scheduleTarget(420);
  }, [scheduleTarget]);

  const fire = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const now = performance.now();
    if (now - lastShotAtRef.current < 210) return;
    lastShotAtRef.current = now;

    shotsRef.current += 1;
    setShots(shotsRef.current);
    setShotFlash(true);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => {
      flashTimerRef.current = null;
      setShotFlash(false);
    }, 85);

    const motion = motionRef.current;
    if (!targetVisibleRef.current || motion === null) {
      missesRef.current += 1;
      comboRef.current = 0;
      scoreRef.current = Math.max(0, scoreRef.current - 35);
      setMisses(missesRef.current);
      setCombo(0);
      setScore(scoreRef.current);
      showFeedback({ kind: "miss", text: "빗나감 · 표적을 기다리세요" });
      return;
    }

    const difficulty = difficultyRef.current;
    const distance = Math.abs(motion.x - WIDOW_CROSSHAIR_X);
    const headWindow = getWidowHeadWindow(targetScaleRef.current, difficulty);
    const bodyWindow = getWidowBodyWindow(targetScaleRef.current, difficulty);

    if (distance <= headWindow) {
      comboRef.current += 1;
      killsRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      const precisionBonus = Math.max(0, Math.round((headWindow - distance) * 64));
      const difficultyBonus = Math.round(difficulty * 170);
      const gained = 260 + precisionBonus + difficultyBonus + Math.min(260, comboRef.current * 18);
      scoreRef.current += gained;

      setCombo(comboRef.current);
      setMaxCombo(maxComboRef.current);
      setKills(killsRef.current);
      setScore(scoreRef.current);
      showFeedback({ kind: "headshot", text: `헤드샷 +${gained}` });
      scheduleTarget(getWidowSpawnDelay(difficulty));
      return;
    }

    if (distance <= bodyWindow) {
      bodyHitsRef.current += 1;
      comboRef.current = 0;
      scoreRef.current += 35;
      setBodyHits(bodyHitsRef.current);
      setCombo(0);
      setScore(scoreRef.current);
      showFeedback({ kind: "body", text: "몸샷 +35 · 역무빙에 속았습니다" });
      scheduleTarget(randomBetween(240, 430));
      return;
    }

    missesRef.current += 1;
    comboRef.current = 0;
    scoreRef.current = Math.max(0, scoreRef.current - 25);
    setMisses(missesRef.current);
    setCombo(0);
    setScore(scoreRef.current);
    showFeedback({ kind: "miss", text: "빗나감 -25" });
  }, [scheduleTarget, showFeedback]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || phaseRef.current !== "playing") return;
      event.preventDefault();
      fire();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fire]);

  const accuracy = shots > 0 ? Math.round(((kills + bodyHits) / shots) * 100) : 0;
  const headshotRate = kills + bodyHits > 0 ? Math.round((kills / (kills + bodyHits)) * 100) : 0;
  const rank = getRank(score);
  const secondsLeft = (timeLeft / 1000).toFixed(1);
  const targetTopOffset = 44 * targetScale;

  return (
    <section className={`widow-drill widow-drill--${phase}`}>
      <div className="widow-drill-hud" aria-label="현재 훈련 기록">
        <div><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
        <div><span>HEADSHOT</span><strong>{kills}</strong></div>
        <div><span>COMBO</span><strong>{combo}x</strong></div>
        <div><span>TIME</span><strong>{secondsLeft}</strong></div>
      </div>

      <div
        className={`widow-range ${shotFlash ? "is-firing" : ""}`}
        onPointerDown={phase === "playing" ? fire : undefined}
        role={phase === "playing" ? "button" : undefined}
        tabIndex={phase === "playing" ? 0 : -1}
        aria-label={phase === "playing" ? "화면을 누르거나 스페이스바를 눌러 발사" : undefined}
      >
        <div className="widow-range-light widow-range-light--one" aria-hidden="true" />
        <div className="widow-range-light widow-range-light--two" aria-hidden="true" />
        <div className="widow-range-platform widow-range-platform--left" aria-hidden="true" />
        <div className="widow-range-platform widow-range-platform--right" aria-hidden="true" />
        <div className="widow-range-floor" aria-hidden="true" />

        {targetVisible ? (
          <div
            className={`widow-target widow-target--${targetDirection === 1 ? "right" : "left"}`}
            style={{
              left: `${targetX}%`,
              top: `calc(50% + ${targetTopOffset}px)`,
              transform: `translate(-50%, -50%) scale(${targetScale})`,
            }}
            aria-label="움직이는 훈련 표적"
          >
            <span className="widow-target-head"><i /></span>
            <span className="widow-target-body"><i /><b /></span>
            <span className="widow-target-legs"><i /><b /></span>
          </div>
        ) : null}

        <div className="widow-scope" aria-hidden="true">
          <div className="widow-scope-ring widow-scope-ring--outer" />
          <div className="widow-scope-ring widow-scope-ring--inner" />
          <div className="widow-scope-line widow-scope-line--horizontal" />
          <div className="widow-scope-line widow-scope-line--vertical" />
          <div className="widow-scope-center"><i /></div>
          <div className="widow-scope-charge"><strong>100%</strong><span>위력</span></div>
        </div>

        <div className={`widow-ammo ${shotFlash ? "is-recoiling" : ""}`} aria-hidden="true">
          <strong>∞</strong><span>READY</span>
        </div>

        {feedback ? <p className={`widow-feedback is-${feedback.kind}`}>{feedback.text}</p> : null}
        {shotFlash ? <div className="widow-shot-flash" aria-hidden="true" /> : null}

        {phase === "idle" ? (
          <div className="widow-overlay">
            <div className="widow-overlay-sight" aria-hidden="true"><span /></div>
            <p>HOLD-SHOT CALIBRATION</p>
            <h2>적의 머리가 조준점을 지날 때 쏘세요</h2>
            <span>시간이 지날수록 작아지고, 빨라지고, 무빙이 난폭해집니다</span>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={startGame}>훈련 시작</button>
          </div>
        ) : null}

        {phase === "result" ? (
          <div className="widow-overlay widow-result">
            <div className={`widow-grade widow-grade--${rank.grade.toLowerCase()}`}>{rank.grade}</div>
            <p>TRAINING COMPLETE</p>
            <h2>{rank.title}</h2>
            <strong className="widow-result-score">{score.toLocaleString()}</strong>
            <div className="widow-result-grid">
              <div><span>처치</span><b>{kills}</b></div>
              <div><span>명중률</span><b>{accuracy}%</b></div>
              <div><span>헤드샷률</span><b>{headshotRate}%</b></div>
              <div><span>최대 콤보</span><b>{maxCombo}x</b></div>
            </div>
            <small>최고 점수 {bestScore.toLocaleString()} · 빗나감/통과 {misses}</small>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={startGame}>다시 도전</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
