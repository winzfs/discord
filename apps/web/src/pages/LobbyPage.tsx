import { useState } from "react";
import { LobbyBottomNav } from "../components/lobby/LobbyBottomNav";
import { LobbyDetailPanel } from "../components/lobby/LobbyDetailPanel";
import { LobbyRecruitPanel } from "../components/lobby/LobbyRecruitPanel";
import { LobbyRecruitReveal } from "../components/lobby/LobbyRecruitReveal";
import { LobbyStage } from "../components/lobby/LobbyStage";
import { LobbyTopBar } from "../components/lobby/LobbyTopBar";
import { ArtifactsView, BattleView, HeroesView, ShopView } from "../components/lobby/LobbyViews";
import { getLobbyHeroSkillDetails } from "../components/lobby/lobbyHeroSkillDetails";
import {
  formatPercent,
  getArtifactEffectAtLevel,
  getArtifactUpgradeRequirement,
  getCollectionUpgradeCost,
  getHeroPowerAtLevel,
  getHeroUpgradeRequirement,
  tabs,
  type Detail,
  type LobbyArtifact,
  type LobbyHero,
  type LobbyTabId,
} from "../game-lobby/lobbyData";
import { claimLobbyPassReward } from "../game-lobby/lobbyPassRewardClaim";
import { recruitCosts, recruitHeroes, type RecruitPullMode, type RecruitResult } from "../game-lobby/lobbyRecruit";
import { defaultLobbyLineupSize, loadLobbyProgress, saveLobbyProgress } from "../game-lobby/lobbyProgressStorage";
import type { LobbyAccountProgress, LobbyPassReward } from "../game-lobby/lobbyAccountProgress";
import "../styles/lobby.css";
import "../styles/lobby-polish.css";
import "../styles/lobby-detail-drawer.css";
import "../styles/lobby-pass.css";
import "../styles/lobby-recruit-reveal.css";
import "../styles/lobby-stage-polish.css";

type RewardPopupData = {
  title: string;
  detail: string;
  icon: string;
};

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

function rewardIcon(kind: LobbyPassReward["kind"]) {
  if (kind === "gold") return "🪙";
  if (kind === "crystals") return "💎";
  if (kind === "hero-shards") return "🧩";
  if (kind === "mythic-shards") return "🌟";
  if (kind === "artifact-pieces") return "🏺";
  return "🎁";
}

function RewardPopup({ reward, onClose }: { reward: RewardPopupData; onClose: () => void }) {
  return (
    <div className="reward-popup-backdrop" onClick={onClose}>
      <section className="reward-popup-card" onClick={(event) => event.stopPropagation()}>
        <span className="reward-popup-badge">보상 획득</span>
        <div className="reward-popup-icon">{reward.icon}</div>
        <h2>{reward.title}</h2>
        <p>{reward.detail}</p>
        <button type="button" onClick={onClose}>확인</button>
      </section>
    </div>
  );
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
      hero.description,
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

function syncLineupWithHeroes(lineupHeroIds: string[], heroes: LobbyHero[]) {
  const ownedIds = new Set(heroes.filter((hero) => hero.owned).map((hero) => hero.id));
  const nextLineup = lineupHeroIds.filter((id) => ownedIds.has(id));

  for (const hero of heroes) {
    if (nextLineup.length >= defaultLobbyLineupSize) break;
    if (!hero.owned || nextLineup.includes(hero.id)) continue;
    nextLineup.push(hero.id);
  }

  return nextLineup;
}

export function LobbyPage() {
  const savedProgress = loadLobbyProgress();
  const [activeTab, setActiveTab] = useState<LobbyTabId>("battle");
  const [gold, setGold] = useState(savedProgress.gold);
  const [crystals, setCrystals] = useState(savedProgress.crystals);
  const [heroes, setHeroes] = useState(savedProgress.heroes);
  const [artifacts, setArtifacts] = useState(savedProgress.artifacts);
  const [lineupHeroIds, setLineupHeroIds] = useState(savedProgress.lineupHeroIds);
  const [accountProgress, setAccountProgress] = useState<LobbyAccountProgress>(savedProgress.accountProgress);
  const [lastRecruitResults, setLastRecruitResults] = useState<RecruitResult[]>([]);
  const [revealResults, setRevealResults] = useState<RecruitResult[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notice, setNotice] = useState("상점, 영웅, 전투, 유물을 확인해보세요.");
  const [rewardPopup, setRewardPopup] = useState<RewardPopupData | null>(null);

  const openLobbyTab = (tabId: LobbyTabId, nextNotice: string) => {
    setActiveTab(tabId);
    setDetail(null);
    setNotice(nextNotice);
  };

  const persistProgress = (
    nextHeroes: LobbyHero[],
    nextArtifacts: LobbyArtifact[],
    nextGold = gold,
    nextCrystals = crystals,
    nextLineupHeroIds = lineupHeroIds,
    nextAccountProgress = accountProgress,
  ) => {
    saveLobbyProgress({
      heroes: nextHeroes,
      artifacts: nextArtifacts,
      gold: nextGold,
      crystals: nextCrystals,
      lineupHeroIds: nextLineupHeroIds,
      accountProgress: nextAccountProgress,
    });
  };

  const buyShopItem = (name: string, price: string) => {
    const cost = Number(price);
    if (Number.isNaN(cost)) {
      const nextCrystals = crystals + 30;
      setCrystals(nextCrystals);
      persistProgress(heroes, artifacts, gold, nextCrystals);
      setNotice(name + " 수령 완료");
      return;
    }
    if (gold < cost) {
      setNotice("골드 부족");
      return;
    }
    const nextGold = gold - cost;
    setGold(nextGold);
    persistProgress(heroes, artifacts, nextGold, crystals);
    setNotice(name + " 구매 완료");
  };

  const claimPassReward = (reward: LobbyPassReward) => {
    const result = claimLobbyPassReward(reward, {
      gold,
      crystals,
      heroes,
      artifacts,
      accountProgress,
    });

    if (!result) {
      setNotice("아직 수령할 수 없는 보상입니다.");
      return;
    }

    setGold(result.gold);
    setCrystals(result.crystals);
    setHeroes(result.heroes);
    setArtifacts(result.artifacts);
    setAccountProgress(result.accountProgress);
    persistProgress(result.heroes, result.artifacts, result.gold, result.crystals, lineupHeroIds, result.accountProgress);
    setNotice(result.message);
    setRewardPopup({
      title: `패스 Lv.${reward.level} 보상`,
      detail: result.message.replace(`패스 Lv.${reward.level} 보상 수령: `, ""),
      icon: rewardIcon(reward.kind),
    });
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

  const recruit = (mode: RecruitPullMode) => {
    const cost = mode === "ten" ? recruitCosts.tenCrystal : recruitCosts.singleCrystal;
    if (crystals < cost) {
      setNotice("보석이 부족합니다.");
      return;
    }
    const summary = recruitHeroes(heroes, mode);
    const nextCrystals = crystals - cost;
    const nextLineupHeroIds = syncLineupWithHeroes(lineupHeroIds, summary.nextHeroes);
    setCrystals(nextCrystals);
    setHeroes(summary.nextHeroes);
    setLineupHeroIds(nextLineupHeroIds);
    setLastRecruitResults(summary.results);
    setRevealResults(summary.results);
    persistProgress(summary.nextHeroes, artifacts, gold, nextCrystals, nextLineupHeroIds);
    setActiveTab("heroes");
    setDetail(null);
    setNotice(`영웅 모집 완료 · 신규 ${summary.newHeroCount}명 · 조각 ${summary.totalShards}개 획득`);
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

    const nextGold = gold - detail.upgradeCost;
    setGold(nextGold);
    if (detail.kind === "hero") {
      const nextHeroes = heroes.map((hero) => {
        if (hero.id !== detail.id) return hero;
        const required = getHeroUpgradeRequirement(Math.max(1, hero.level));
        return { ...hero, level: hero.level + 1, shards: Math.max(0, hero.shards - required) };
      });
      const nextLineupHeroIds = syncLineupWithHeroes(lineupHeroIds, nextHeroes);
      setHeroes(nextHeroes);
      setLineupHeroIds(nextLineupHeroIds);
      persistProgress(nextHeroes, artifacts, nextGold, crystals, nextLineupHeroIds);
      refreshDetail(detail.kind, detail.id, nextHeroes, artifacts);
    } else {
      const nextArtifacts = artifacts.map((artifact) => {
        if (artifact.id !== detail.id) return artifact;
        const required = getArtifactUpgradeRequirement(Math.max(1, artifact.level));
        return { ...artifact, level: Math.min(artifact.maxLevel, artifact.level + 1), pieces: Math.max(0, artifact.pieces - required) };
      });
      setArtifacts(nextArtifacts);
      persistProgress(heroes, nextArtifacts, nextGold, crystals);
      refreshDetail(detail.kind, detail.id, heroes, nextArtifacts);
    }
    setNotice(detail.title + " 업그레이드 완료");
  };

  return (
    <main className="lobby-shell">
      <LobbyTopBar gold={gold} crystals={crystals} />
      <LobbyStage
        onOpenShop={() => openLobbyTab("shop", "상점에서 보상을 확인해보세요.")}
        onOpenHeroes={() => openLobbyTab("heroes", "영웅 편성과 강화를 확인해보세요.")}
        onOpenArtifacts={() => openLobbyTab("artifacts", "유물 강화로 전투 보너스를 올려보세요.")}
      />
      <p className="lobby-notice">{notice}</p>
      {activeTab === "shop" && <ShopView onPick={buyShopItem} />}
      {activeTab === "heroes" && (
        <>
          <LobbyRecruitPanel
            crystals={crystals}
            lastResults={lastRecruitResults}
            onRecruitSingle={() => recruit("single")}
            onRecruitTen={() => recruit("ten")}
          />
          <HeroesView
            heroes={heroes}
            onDetail={setDetail}
            createDetail={createHeroDetail}
            gradeLabel={gradeLabel}
            roleLabel={roleLabel}
          />
        </>
      )}
      {activeTab === "battle" && <BattleView accountProgress={accountProgress} onClaimPassReward={claimPassReward} />}
      {activeTab === "artifacts" && (
        <ArtifactsView
          artifacts={artifacts}
          onDetail={setDetail}
          createDetail={createArtifactDetail}
          categoryLabel={categoryLabel}
        />
      )}
      {detail && <LobbyDetailPanel detail={detail} gold={gold} onClose={() => setDetail(null)} onUpgrade={upgradeSelected} />}
      {revealResults.length > 0 && <LobbyRecruitReveal results={revealResults} onClose={() => setRevealResults([])} />}
      {rewardPopup && <RewardPopup reward={rewardPopup} onClose={() => setRewardPopup(null)} />}
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
