import type { RecruitResult } from "../../game-lobby/lobbyRecruit";
import { formatRecruitRateText, recruitCosts } from "../../game-lobby/lobbyRecruit";

function gradeLabel(grade: string) {
  if (grade === "mythic") return "신화";
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  return "일반";
}

export function LobbyRecruitPanel({
  crystals,
  lastResults,
  onRecruitSingle,
  onRecruitTen,
}: {
  crystals: number;
  lastResults: RecruitResult[];
  onRecruitSingle: () => void;
  onRecruitTen: () => void;
}) {
  return (
    <section className="lobby-recruit-panel" aria-label="영웅 모집">
      <div className="lobby-recruit-header">
        <div>
          <p className="lobby-recruit-kicker">영웅 모집</p>
          <h2>오파후 영웅단 모집소</h2>
        </div>
        <span className="lobby-recruit-currency">보석 {crystals}</span>
      </div>
      <p className="lobby-recruit-desc">
        영웅을 모집하면 보유 영웅은 조각으로 누적되고, 미보유 영웅은 즉시 해금됩니다.
        10회 모집의 마지막 1회는 일반 등급을 제외합니다.
      </p>
      <div className="lobby-recruit-actions">
        <button type="button" onClick={onRecruitSingle}>
          <strong>1회 모집</strong>
          <span>{recruitCosts.singleCrystal} 보석</span>
        </button>
        <button type="button" className="primary" onClick={onRecruitTen}>
          <strong>10회 모집</strong>
          <span>{recruitCosts.tenCrystal} 보석 · 일반 제외 보너스</span>
        </button>
      </div>
      <p className="lobby-recruit-rates">확률 {formatRecruitRateText()}</p>
      {lastResults.length > 0 && (
        <div className="lobby-recruit-results">
          <h3>모집 결과</h3>
          <div className="lobby-recruit-result-grid">
            {lastResults.map((result, index) => (
              <div key={`${result.heroId}-${index}`} className={`lobby-recruit-card grade-${result.grade}`}>
                <span className="result-grade">{gradeLabel(result.grade)}</span>
                <strong>{result.displayName}</strong>
                <span>{result.wasNew ? "신규 해금" : `조각 +${result.shards}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
