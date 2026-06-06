import { Link } from "react-router-dom";
import { LobbyHeroPortrait } from "./LobbyHeroPortrait";
import {
  getArtifactUpgradeRequirement,
  getHeroUpgradeRequirement,
  quests,
  shopItems,
  type Detail,
  type LobbyArtifact,
  type LobbyHero,
} from "../../game-lobby/lobbyData";
import {
  getAccountExpRequirement,
  getAccountProgressPercent,
  getPassExpRequirement,
  getPassProgressPercent,
  type LobbyAccountProgress,
} from "../../game-lobby/lobbyAccountProgress";

type ShopViewProps = {
  onPick: (name: string, price: string) => void;
};

type HeroesViewProps = {
  heroes: LobbyHero[];
  onDetail: (detail: Detail) => void;
  createDetail: (hero: LobbyHero) => Detail;
  gradeLabel: (grade: string) => string;
  roleLabel: (role: string) => string;
};

type BattleViewProps = {
  difficulty: number;
  accountProgress: LobbyAccountProgress;
};

type ArtifactsViewProps = {
  artifacts: LobbyArtifact[];
  onDetail: (detail: Detail) => void;
  createDetail: (artifact: LobbyArtifact) => Detail;
  categoryLabel: (category: string) => string;
};

export function ShopView({ onPick }: ShopViewProps) {
  return (
    <section className="lobby-panel">
      <h2>상점</h2>
      <div className="shop-grid">
        {shopItems.map((item) => (
          <button className="shop-card" key={item.name} type="button" onClick={() => onPick(item.name, item.price)}>
            <b>{item.tag}</b>
            <h3>{item.name}</h3>
            <div className="shop-icon">{item.amount}</div>
            <strong className="price">{item.price}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

export function HeroesView({ heroes, onDetail, createDetail, gradeLabel, roleLabel }: HeroesViewProps) {
  return (
    <section className="lobby-panel">
      <div className="panel-tabs"><b>영웅</b><span>전체 {heroes.length}</span></div>
      <div className="hero-grid collection-grid">
        {heroes.map((hero) => {
          const detail = createDetail(hero);
          const required = getHeroUpgradeRequirement(Math.max(1, hero.level));
          return (
            <button
              className={`hero-card collection-card grade-${hero.grade}${hero.owned ? "" : " locked"}`}
              key={hero.id}
              type="button"
              disabled={!hero.owned}
              onClick={() => onDetail(detail)}
            >
              <em>{gradeLabel(hero.grade)}</em>
              <LobbyHeroPortrait hero={hero} />
              <strong>{hero.displayName}</strong>
              <small>{hero.owned ? `Lv.${hero.level} · ${roleLabel(hero.role)}` : "미보유"}</small>
              <span>{hero.owned ? `${hero.shards}/${required}` : "비활성"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProgressCard({ title, level, exp, required, percent, caption }: { title: string; level: number; exp: number; required: number; percent: number; caption: string }) {
  return (
    <div className="progression-card">
      <div>
        <b>{title} Lv.{level}</b>
        <span>{caption}</span>
      </div>
      <progress value={percent} max="100" />
      <small>{exp}/{required} EXP</small>
    </div>
  );
}

export function BattleView({ difficulty, accountProgress }: BattleViewProps) {
  return (
    <section className="lobby-panel battle-panel">
      <h2>전투</h2>
      <div className="battle-road"><span>20</span><div className="road-monster">슬라임</div><span>10</span></div>
      <div className="battle-actions"><button type="button">친구랑 하기</button><Link to={`/play?difficulty=${difficulty}`}>빠른 시작</Link></div>
      <div className="progression-grid">
        <ProgressCard
          title="계정"
          level={accountProgress.accountLevel}
          exp={accountProgress.accountExp}
          required={getAccountExpRequirement(accountProgress.accountLevel)}
          percent={getAccountProgressPercent(accountProgress)}
          caption="플레이 누적 성장"
        />
        <ProgressCard
          title="패스"
          level={accountProgress.passLevel}
          exp={accountProgress.passExp}
          required={getPassExpRequirement(accountProgress.passLevel)}
          percent={getPassProgressPercent(accountProgress)}
          caption={accountProgress.passSeasonId}
        />
      </div>
      <div className="quest-mini">
        <h3>퀘스트</h3>
        {quests.map((quest) => <label key={quest.title}><span>{quest.title}</span><progress value={quest.progress} max="100" /></label>)}
      </div>
    </section>
  );
}

export function ArtifactsView({ artifacts, onDetail, createDetail, categoryLabel }: ArtifactsViewProps) {
  return (
    <section className="lobby-panel">
      <h2>유물</h2>
      <div className="artifact-grid collection-grid">
        {artifacts.map((artifact) => {
          const detail = createDetail(artifact);
          const required = getArtifactUpgradeRequirement(Math.max(1, artifact.level));
          return (
            <button
              className={`artifact-card collection-card${artifact.owned ? "" : " locked"}`}
              key={artifact.id}
              type="button"
              disabled={!artifact.owned}
              onClick={() => onDetail(detail)}
            >
              <em>{categoryLabel(artifact.category)}</em>
              <div className="artifact-icon">{artifact.owned ? `Lv.${artifact.level}` : "?"}</div>
              <strong>{artifact.displayName}</strong>
              <small>{artifact.owned ? artifact.description : "미보유 유물"}</small>
              <span>{artifact.owned ? `${artifact.pieces}/${required}` : "비활성"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
