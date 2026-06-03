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
  if (result.summonedHero) return "영웅을 소환했어.";
  if (result.reason === "board_full") return "필드가 가득 찼어. 합성을 먼저 해줘.";
  if (result.reason === "not_enough_resources") return "코인이 부족해.";
  if (result.reason === "no_hero_for_grade") return "해당 등급 영웅 풀이 비어 있어.";
  return "소환하지 못했어.";
}

function describeMergeResult(result: MergeResult): string {
  if (result.mergedHero) return "합성 성공! 상위 등급 영웅이 등장했어.";
  if (result.reason === "not_enough_same_grade") return "같은 등급 영웅이 3명 필요해.";
  if (result.reason === "max_grade") return "전설 등급은 아직 더 합성할 수 없어.";
  if (result.reason === "no_hero_for_next_grade") return "다음 등급 영웅 풀이 비어 있어.";
  return "합성하지 못했어.";
}

function describeWaveResult(result: WaveProgressResult): string {
  if (result.reason === "already_finished") return "이미 게임이 종료됐어.";
  if (result.reason === "missing_wave") return "웨이브 데이터를 찾지 못했어.";
  if (result.state.status === "cleared") return "30웨이브 클리어! 서버를 지켰어.";
  if (result.state.status === "failed") return "서버 코어가 터졌어. 다시 도전해보자.";
  return `${result.wave?.waveNumber ?? "?"}웨이브 클리어! 보상 ${result.reward}코인 획득.`;
}

export function GameControls({ canInteract, onSummon, onMerge, onClearWave, onLeakWave, onReset, onMessage }: GameControlsProps) {
  return (
    <div className="game-controls">
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onSummon();
          onMessage(describeSummonResult(result));
        }}
      >
        랜덤 영웅 소환
      </button>
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onMerge("normal");
          onMessage(describeMergeResult(result));
        }}
      >
        일반 3명 합성
      </button>
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onMerge("rare");
          onMessage(describeMergeResult(result));
        }}
      >
        희귀 3명 합성
      </button>
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onMerge("epic");
          onMessage(describeMergeResult(result));
        }}
      >
        영웅 3명 합성
      </button>
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onClearWave();
          onMessage(describeWaveResult(result));
        }}
      >
        웨이브 클리어 테스트
      </button>
      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          const result = onLeakWave();
          onMessage(`${describeWaveResult(result)} 일부 적이 새어 나갔어.`);
        }}
      >
        적 누수 테스트
      </button>
      <button type="button" onClick={onReset}>
        새 게임
      </button>
    </div>
  );
}
