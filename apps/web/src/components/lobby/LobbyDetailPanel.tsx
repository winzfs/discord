import type { Detail } from "../../game-lobby/lobbyData";

function DetailSkillSection({ detail }: { detail: Detail }) {
  if (!detail.skills?.length) return null;

  return (
    <section className="detail-skill-section">
      <h3>스킬 / 궁극기</h3>
      <div className="detail-skill-list">
        {detail.skills.map((skill) => (
          <article className={`detail-skill-card ${skill.type === "궁극기" ? "ultimate" : ""}`} key={skill.id}>
            <header>
              <b>{skill.name}</b>
              <span>{skill.type} · {skill.condition}</span>
            </header>
            <p>{skill.summary}</p>
            <ul>
              {skill.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

type LobbyDetailPanelProps = {
  detail: Detail;
  gold: number;
  onClose: () => void;
  onUpgrade: () => void;
};

export function LobbyDetailPanel({ detail, gold, onClose, onUpgrade }: LobbyDetailPanelProps) {
  const disabled = !detail.canUpgrade || gold < detail.upgradeCost;
  const buttonText = !detail.owned
    ? "미보유"
    : detail.level <= 0
      ? "활성화 필요"
      : disabled
        ? `업그레이드 불가 · ${detail.upgradeCost}G`
        : `업그레이드 · ${detail.upgradeCost}G`;

  return (
    <div className="detail-drawer detail-drawer-expanded">
      <button type="button" onClick={onClose}>닫기</button>
      <div className="detail-scroll-area">
        <header className="detail-hero-header">
          <div className="hero-portrait">{detail.owned ? detail.title.slice(0, 2) : "?"}</div>
          <div>
            <h2>{detail.title}</h2>
            <p>{detail.subtitle}</p>
          </div>
        </header>
        <div className="detail-badges">
          <b className={detail.owned ? "owned-badge" : "locked-badge"}>
            {detail.owned ? `보유 · Lv.${detail.level}` : "미보유"}
          </b>
          <b>{detail.progressText}</b>
        </div>
        <section className="detail-stat-grid">
          {detail.stats.map((stat) => <strong key={stat}>{stat}</strong>)}
        </section>
        <DetailSkillSection detail={detail} />
        {detail.lockedText && <p>{detail.lockedText}</p>}
      </div>
      <button className="lobby-upgrade" type="button" disabled={disabled} onClick={onUpgrade}>
        {buttonText}
      </button>
    </div>
  );
}
