import type { HeroGrade, SummonResult, MergeResult, WaveProgressResult } from "@discord-random-defense/game";

type GameControlsProps = {
  canInteract: boolean;
  onSummon: () => SummonResult;
  onMerge: (grade: HeroGrade) => MergeResult;
  onClearWave: () => WaveProgressResult;
  onLeakWave: () => WaveProgressResult;
  onReset: () => void;
  onMessage: (message: string) => void;
};

function describeSummonResult(result: SummonResult): string {
  if (result.summonedHero) return "지원 영웅 호출 완료! 조합을 굴려보자.";
  if (result.reason === "board_full") return "배치판이 꽉 찼어. 합성으로 자리를 만들어야 해.";
  if (result.reason === "not_enough_resources") return "코인이 부족해. 웨이브를 막고 보상을 챙기자.";
  if (result.reason === "no_hero_for_grade") return "해당 등급 영웅 풀이 비어 있어.";
  return "호출 실패. 다시 눌러보자.";
}

function describeMergeResult(result: MergeResult): string {
  if (result.mergedHero) return "팀합 성공! 상위 등급 영웅이 합류했어.";
  if (result.reason === "not_enough_same_grade") return "같은 등급 영웅 3명이 필요해.";
  if (result.reason === "max_grade") return "전설 등급은 현재 최고 등급이야.";
  if (result.reason === "no_hero_for_next_grade") return "다음 등급 영웅 풀이 비어 있어.";
  return "합성 실패. 조합을 다시 확인해줘.";
}

function describeWaveResult(result: WaveProgressResult): string {
  if (result.reason === "already_finished") return "이미 작전이 종료됐어.";
  if (result.reason === "missing_wave") return "웨이브 데이터를 찾지 못했어.";
  if (result.state.status === "cleared") return "30웨이브 클리어! 서버 코어 방어 성공!";
  if (result.state.status === "failed") return "서버 코어가 무너졌어. 다음 판에 다시 가자.";
  return `${result.wave?.waveNumber ?? "?"}웨이브 방어 성공. ${result.reward}코인 확보!`;
}

export function GameControls({ canInteract, onSummon, onMerge, onClearWave, onLeakWave, onReset, onMessage }: GameControlsProps) {
  return (
    <footer className="action-bar">
      <button
        className="action-button primary-action"
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onSummon();
          onMessage(describeSummonResult(result));
        }}
      >
        <span>CALL</span>
        랜덤 호출
      </button>
      <button
        className="action-button"
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onMerge("normal");
          onMessage(describeMergeResult(result));
        }}
      >
        <span>MERGE</span>
        일반 합성
      </button>
      <button
        className="action-button"
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onMerge("rare");
          onMessage(describeMergeResult(result));
        }}
      >
        <span>MERGE</span>
        희귀 합성
      </button>
      <button
        className="action-button"
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onMerge("epic");
          onMessage(describeMergeResult(result));
        }}
      >
        <span>MERGE</span>
        영웅 합성
      </button>
      <button
        className="action-button wave-action"
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onClearWave();
          onMessage(describeWaveResult(result));
        }}
      >
        <span>WAVE</span>
        방어 성공
      </button>
      <button
        className="action-button danger-action"
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onLeakWave();
          onMessage(`${describeWaveResult(result)} 일부 적이 코어에 도달했어.`);
        }}
      >
        <span>LEAK</span>
        누수 처리
      </button>
      <button className="action-button reset-action" type="button" onClick={onReset}>
        <span>RESET</span>
        새 작전
      </button>
    </footer>
  );
}
