import { useState } from "react";
import { Link } from "react-router-dom";
import { LobbyBottomNav } from "../components/lobby/LobbyBottomNav";
import { LobbyDetailPanel } from "../components/lobby/LobbyDetailPanel";
import { LobbyHeroPortrait } from "../components/lobby/LobbyHeroPortrait";
import { LobbyStage } from "../components/lobby/LobbyStage";
import { LobbyTopBar } from "../components/lobby/LobbyTopBar";
import { getLobbyHeroSkillDetails } from "../components/lobby/lobbyHeroSkillDetails";
import {
  formatPercent,
  getArtifactEffectAtLevel,
  getArtifactUpgradeRequirement,
  getCollectionUpgradeCost,
  getHeroPowerAtLevel,
  getHeroUpgradeRequirement,
  quests,
  shopItems,
  tabs,
  type Detail,
  type LobbyArtifact,
  type LobbyHero,
  type LobbyTabId,
} from "../game-lobby/lobbyData";
import { loadLobbyProgress, saveLobbyProgress } from "../game-lobby/lobbyProgressStorage";
import "../styles/lobby.css";
import "../styles/lobby-polish.css";

function roleLabel(role: string) {
  if (role === "tank") return "탱커";
  if (role === "support") return "지원";
  return "딜러";
}

function gradeLabel(grade: string) {
  if (grade === "mythic") return "신화";
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  return "일반";
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    attack: "공격",
    economy: "경제",
    luck: "행운",
    summon: "소환",
    defense: "방어",
    control: "제어",
    gamble: "도박",
  };
  return labels[category] ?? category;
}

function createHeroDetail(hero: LobbyHero): Detail {
  const required = getHeroUpgradeRequirement(Math.max(1, hero.level));
  const power = hero.owned ? getHeroPowerAtLevel(hero, hero.level) : hero.power;
  return {
    kind: "hero",
    id: hero.id,
    title: hero.displayName,
    subtitle: `${gradeLabel(hero.grade)} · ${roleLabel(hero.role)} · ${hero.attackType}`,
    stats: [
      `전투력 ${power}`,
      `공격속도 ${hero.attackSpeed}`,
      `사거리 ${hero.range}`,
      `태그 ${hero.tags.join(" / ")}`,
    ],
    skills: getLobbyHeroSkillDetails(hero.id),
    owned: hero.owned,
    level: hero.level,
    progressText: hero.owned ? `조각 ${hero.shards}/${required}` : "미보유",
    upgradeCost: getCollectionUpgradeCost("hero", Math.max(1, hero.level)),
    canUpgrade: hero.owned && hero.shards >= required,
    lockedText: hero.owned ? undefined : "영웅 조각을 획득하면 활성화됩니다.",
  };
}

function createArtifactDetail(artifact: LobbyArtifact): Detail {
  const required = getArtifactUpgradeRequirement(Math.max(1, artifact.level));
  const effect = artifact.owned ? getArtifactEffectAtLevel(artifact, artifact.level) : artifact.baseEffect;
  return {
    kind: "artifact",
    id: artifact.id,
    title: artifact.displayName,
    subtitle: `${categoryLabel(artifact.category)} · 최대 Lv.${artifact.maxLevel}`,
    stats: [
      artifact.description,
      `현재 효과 ${formatPercent(effect)}`,
      `레벨당 증가 ${formatPercent(artifact.effectPerLevel)}`,
    ],
    owned: artifact.owned,
    level: artifact.level,
    progressText: artifact.owned ? `조각 ${artifact.pieces}/${required}` : "미보유",
    upgradeCost: getCollectionUpgradeCost("artifact", Math.max(1, artifact.level)),
    canUpgrade: artifact.owned && artifact.pieces >= required && artifact.level < artifact.maxLevel,
    lockedText: artifact.owned ? undefined : "유물 조각을 획득하면 활성화됩니다.",
  };
}

function ShopView({ onPick }: { onPick: (name: string, price: string) => void }) {
  return (
    <section className="lobby-panel">
      <h2>상점</h2>
      <div className="shop-grid">
        {shopItems.map((item) => (
          <button className="shop-card" key={item.name} type="button" onClick={() => onPick(item.name, item.price)}>
            <b>{item.tag}</b><h3>{item.name}</h3><div className="shop-icon">{item.amount}</div><strong className="price">{item.price}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function HeroesView({ heroes, onDetail }: { heroes: LobbyHero[]; onDetail: (detail: Detail) => void }) {
  return (
    <section className="lobby-panel">
      <div className="panel-tabs"><b>영웅</b><span>전체 {heroes.length}</span></div>
      <div className="hero-grid collection-grid">
        {heroes.map((hero) => {
          const detail = createHeroDetail(hero);
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

function BattleView({ difficulty }: { difficulty: number }) {
  return (
    <section className="lobby-panel battle-panel">
      <h2>전투</h2>
      <div className="battle-road"><span>20</span><div className="road-monster">슬라임</div><span>10</span></div>
      <div className="battle-actions"><button type="button">친구랑 하기</button><Link to={`/play?difficulty=${difficulty}`}>빠른 시작</Link></div>
      <div className="quest-mini"><h3>퀘스트</h3>{quests.map((quest) => <label key={quest.title}><span>{quest.title}</span><progress value={quest.progress} max="100" /></label>)}</div>
    </section>
  );
}

function ArtifactsView({ artifacts, onDetail }: { artifacts: LobbyArtifact[]; onDetail: (detail: Detail) => void }) {
  return (
    <section className="lobby-panel">
      <h2>유물</h2>
      <div className="artifact-grid collection-grid">
        {artifacts.map((artifact) => {
          const detail = createArtifactDetail(artifact);
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

export function LobbyPage() {
  const savedProgress = loadLobbyProgress();
  const [activeTab, setActiveTab] = useState<LobbyTabId>("battle");
  const [difficulty, setDifficulty] = useState(3);
  const [gold, setGold] = useState(13580);
  const [crystals, setCrystals] = useState(4550);
  const [heroes, setHeroes] = useState(savedProgress.heroes);
  const [artifacts, setArtifacts] = useState(savedProgress.artifacts);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notice, setNotice] = useState("상점, 영웅, 전투, 유물을 확인해보세요.");

  const buyShopItem = (name: string, price: string) => {
    const cost = Number(price);
    if (Number.isNaN(cost)) {
      setCrystals((value) => value + 30);
      setNotice(name + " 수령 완료");
      return;
    }
    if (gold < cost) {
      setNotice("골드 부족");
      return;
    }
    setGold((value) => value - cost);
    setNotice(name + " 구매 완료");
  };

  const refreshDetail = (kind: Detail["kind"], id: string, nextHeroes: LobbyHero[], nextArtifacts: LobbyArtifact[]) => {
    if (kind === "hero") {
      const nextHero = nextHeroes.find((hero) => hero.id === id);
      if (nextHero) setDetail(createHeroDetail(nextHero));
      return;
    }
    const nextArtifact = nextArtifacts.find((artifact) => artifact.id === id);
    if (nextArtifact) setDetail(createArtifactDetail(nextArtifact));
  };

  const persistProgress = (nextHeroes: LobbyHero[], nextArtifacts: LobbyArtifact[]) => {
    saveLobbyProgress({ heroes: nextHeroes, artifacts: nextArtifacts });
  };

  const upgradeSelected = () => {
    if (!detail) return;
    if (!detail.owned) {
      setNotice("아직 보유하지 않은 항목입니다.");
      return;
    }
    if (!detail.canUpgrade) {
      setNotice("업그레이드 조각이 부족합니다.");
      return;
    }
    if (gold < detail.upgradeCost) {
      setNotice("골드 부족");
      return;
    }

    setGold((value) => value - detail.upgradeCost);
    if (detail.kind === "hero") {
      const nextHeroes = heroes.map((hero) => {
        if (hero.id !== detail.id) return hero;
        const required = getHeroUpgradeRequirement(Math.max(1, hero.level));
        return { ...hero, level: hero.level + 1, shards: Math.max(0, hero.shards - required) };
      });
      setHeroes(nextHeroes);
      persistProgress(nextHeroes, artifacts);
      refreshDetail(detail.kind, detail.id, nextHeroes, artifacts);
    } else {
      const nextArtifacts = artifacts.map((artifact) => {
        if (artifact.id !== detail.id) return artifact;
        const required = getArtifactUpgradeRequirement(Math.max(1, artifact.level));
        return { ...artifact, level: Math.min(artifact.maxLevel, artifact.level + 1), pieces: Math.max(0, artifact.pieces - required) };
      });
      setArtifacts(nextArtifacts);
      persistProgress(heroes, nextArtifacts);
      refreshDetail(detail.kind, detail.id, heroes, nextArtifacts);
    }
    setNotice(detail.title + " 업그레이드 완료");
  };

  return (
    <main className="lobby-shell">
      <LobbyTopBar gold={gold} crystals={crystals} />
      <LobbyStage difficulty={difficulty} onDifficulty={() => setDifficulty((value) => (value >= 5 ? 1 : value + 1))} />
      <p className="lobby-notice">{notice}</p>
      {activeTab === "shop" && <ShopView onPick={buyShopItem} />}
      {activeTab === "heroes" && <HeroesView heroes={heroes} onDetail={setDetail} />}
      {activeTab === "battle" && <BattleView difficulty={difficulty} />}
      {activeTab === "artifacts" && <ArtifactsView artifacts={artifacts} onDetail={setDetail} />}
      {detail && <LobbyDetailPanel detail={detail} gold={gold} onClose={() => setDetail(null)} onUpgrade={upgradeSelected} />}
      <LobbyBottomNav
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setDetail(null);
        }}
      />
    </main>
  );
}
