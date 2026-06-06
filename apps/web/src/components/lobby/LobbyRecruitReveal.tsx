import { useEffect, useState } from "react";
import type { RecruitResult } from "../../game-lobby/lobbyRecruit";

function gradeLabel(grade: string) {
  if (grade === "mythic") return "신화";
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  return "일반";
}

function getHighestGrade(results: RecruitResult[]) {
  const order = ["common", "rare", "epic", "legendary", "mythic"];
  return results.reduce((highest, result) => {
    return order.indexOf(result.grade) > order.indexOf(highest) ? result.grade : highest;
  }, "common");
}

export function LobbyRecruitReveal({ results, onClose }: { results: RecruitResult[]; onClose: () => void }) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
    const timer = window.setTimeout(() => setIsRevealed(true), 920);
    return () => window.clearTimeout(timer);
  }, [results]);

  if (results.length === 0) return null;

  const highestGrade = getHighestGrade(results);
  const featured = results.find((result) => result.grade === highestGrade) ?? results[0];

  return (
    <div className={`recruit-reveal grade-${highestGrade} ${isRevealed ? "is-revealed" : "is-charging"}`} role="dialog" aria-modal="true" aria-label="영웅 모집 결과">
      <div className="recruit-reveal-flash" />
      <div className="recruit-reveal-rays" />
      <section className="recruit-reveal-card">
        <p className="recruit-reveal-kicker">영웅 모집</p>
        <div className="recruit-reveal-orb" aria-hidden="true">
          <span>{isRevealed ? gradeLabel(featured.grade) : "?"}</span>
        </div>
        {!isRevealed && (
          <div className="recruit-reveal-charge">
            <strong>소환 에너지 응축 중...</strong>
            <span>빛이 강해질수록 높은 등급의 기운이 느껴집니다.</span>
          </div>
        )}
        {isRevealed && (
          <>
            <h2>{featured.displayName}</h2>
            <p className="recruit-reveal-featured">
              {featured.wasNew ? "신규 영웅 해금!" : `대표 보상 · 조각 +${featured.shards}`}
            </p>
            <div className="recruit-reveal-grid">
              {results.map((result, index) => (
                <div key={`${result.heroId}-${index}`} className={`recruit-reveal-result grade-${result.grade}`}>
                  <span>{gradeLabel(result.grade)}</span>
                  <strong>{result.displayName}</strong>
                  <em>{result.wasNew ? "NEW" : `+${result.shards}`}</em>
                </div>
              ))}
            </div>
            <button type="button" onClick={onClose}>확인</button>
          </>
        )}
      </section>
    </div>
  );
}
