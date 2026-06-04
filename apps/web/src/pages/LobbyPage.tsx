import { useState } from "react";
import { Link } from "react-router-dom";
import { initialArtifacts, initialHeroes, quests, shopItems, tabs, type Detail, type LobbyTabId } from "../game-lobby/lobbyData";
import "../styles/lobby.css";

function LobbyTopBar({ gold, crystals }: { gold: number; crystals: number }) {
  return (
    <header className="lobby-topbar">
      <div className="lobby-profile">
        <div className="lobby-avatar">오</div>
        <div><strong>오파후</strong><span>Lv.12</span></div>
      </div>
      <div className="lobby-currencies"><span>30/30</span><span>{gold}</span><span>{crystals}</span></div>
    </header>
  );
}

function LobbyStage({ difficulty, onDifficulty }: { difficulty: number; onDifficulty: () => void }) {
  return (
    <section className="lobby-stage">
      <div className="stage-character stage-left">상인</div>
      <div className="stage-character stage-boss">거인</div>
      <div className="stage-character stage-right">검사</div>
      <button className="stage-speech" type="button" onClick={onDifficulty}>난이도 {difficulty}</button>
      <Link className="battle-start" to={`/play?difficulty=${difficulty}`}>빠른 시작</Link>
    </section>
  );
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

function HeroesView({ heroes, onDetail }: { heroes: typeof initialHeroes; onDetail: (detail: Detail) => void }) {
  return (
    <section className="lobby-panel">
      <div className="panel-tabs"><b>영웅</b><span>신화</span></div>
      <div className="hero-grid">
        {heroes.map((hero) => (
          <button className="hero-card" key={hero.name} type="button" onClick={() => onDetail({ title: hero.name, subtitle: hero.role, stats: [`공격력 ${hero.attack}`, `공격속도 ${hero.speed}`, `조각 ${hero.shard}`] })}>
            <div className="hero-portrait">{hero.name.slice(0, 2)}</div><strong>Lv.{hero.level}</strong><span>{hero.shard}</span><small>{hero.role}</small>
          </button>
        ))}
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

function ArtifactsView({ artifacts, onDetail }: { artifacts: typeof initialArtifacts; onDetail: (detail: Detail) => void }) {
  return (
    <section className="lobby-panel">
      <h2>유물</h2>
      <div className="artifact-grid">
        {artifacts.map((item) => (
          <button className="artifact-card" key={item.name} type="button" onClick={() => onDetail({ title: item.name, subtitle: item.effect, stats: [`Lv.${item.level}`, `진행도 ${item.progress}`] })}>
            <div className="artifact-icon">Lv.{item.level}</div><strong>{item.name}</strong><span>{item.progress}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DetailPanel({ detail, onClose, onUpgrade }: { detail: Detail; onClose: () => void; onUpgrade: () => void }) {
  return (
    <div className="detail-drawer">
      <button type="button" onClick={onClose}>닫기</button>
      <div className="hero-portrait">{detail.title.slice(0, 2)}</div>
      <h2>{detail.title}</h2>
      <p>{detail.subtitle}</p>
      {detail.stats.map((stat) => <strong key={stat}>{stat}</strong>)}
      <button className="lobby-upgrade" type="button" onClick={onUpgrade}>업그레이드</button>
    </div>
  );
}

export function LobbyPage() {
  const [activeTab, setActiveTab] = useState<LobbyTabId>("battle");
  const [difficulty, setDifficulty] = useState(3);
  const [gold, setGold] = useState(13580);
  const [crystals, setCrystals] = useState(4550);
  const [heroes, setHeroes] = useState(initialHeroes);
  const [artifacts, setArtifacts] = useState(initialArtifacts);
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

  const upgradeSelected = () => {
    if (!detail) return;
    if (gold < 1000) {
      setNotice("골드 부족");
      return;
    }
    setGold((value) => value - 1000);
    setHeroes((list) => list.map((hero) => hero.name === detail.title ? { ...hero, level: hero.level + 1 } : hero));
    setArtifacts((list) => list.map((item) => item.name === detail.title ? { ...item, level: item.level + 1 } : item));
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
      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} onUpgrade={upgradeSelected} />}
      <nav className="lobby-bottom-nav">
        {tabs.map((tab) => <button className={activeTab === tab.id ? "active" : ""} key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); setDetail(null); }}>{tab.label}</button>)}
      </nav>
    </main>
  );
}
