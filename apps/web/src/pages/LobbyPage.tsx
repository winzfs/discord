import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/lobby.css";

type TabId = "shop" | "heroes" | "battle" | "artifacts";

type Detail = {
  title: string;
  subtitle: string;
  stats: string[];
};

const shopItems = [
  { name: "무료 보석", amount: "30", price: "무료", tag: "AD" },
  { name: "초대장", amount: "30", price: "960", tag: "20% 할인" },
  { name: "광산 열쇠", amount: "1", price: "8400", tag: "30% 할인" },
  { name: "폭풍거인", amount: "10", price: "3600", tag: "10% 할인" },
];

const heroes = [
  { name: "오크주술사", level: 1, shard: "207/5", role: "원거리", attack: "9.3K", speed: "2" },
  { name: "필스생성기", level: 1, shard: "207/5", role: "지원", attack: "7.8K", speed: "1.6" },
  { name: "발바", level: 1, shard: "207/5", role: "근거리", attack: "8.8K", speed: "1.4" },
  { name: "울티", level: 1, shard: "207/5", role: "원거리", attack: "9.3K", speed: "2" },
  { name: "닌자", level: 2, shard: "207/10", role: "암살", attack: "5.1K", speed: "2.6" },
  { name: "드래곤", level: 6, shard: "207/70", role: "광역", attack: "8.9K", speed: "1.1" },
];

const artifacts = [
  { name: "강화 장갑", level: 1, progress: "0/2", effect: "치명타 피해 증가" },
  { name: "비전서", level: 1, progress: "1/2", effect: "스킬 피해 증가" },
  { name: "빙결봉", level: 1, progress: "1/2", effect: "빙결 확률 증가" },
  { name: "왕의 깃발", level: 1, progress: "0/2", effect: "소환 비용 감소" },
  { name: "나팔", level: 1, progress: "0/2", effect: "웨이브 보상 증가" },
  { name: "황금 곡괭이", level: 2, progress: "0/4", effect: "골드 획득 증가" },
];

const quests = [
  { title: "영웅 30회 모집", progress: 78 },
  { title: "몬스터 처치", progress: 100 },
  { title: "미션 달성", progress: 62 },
  { title: "공격력 업그레이드", progress: 18 },
];

const tabs: { id: TabId; label: string }[] = [
  { id: "shop", label: "상점" },
  { id: "heroes", label: "영웅" },
  { id: "battle", label: "전투" },
  { id: "artifacts", label: "유물" },
];

function LobbyTopBar() {
  return (
    <header className="lobby-topbar">
      <div className="lobby-profile">
        <div className="lobby-avatar">오</div>
        <div><strong>오파후</strong><span>Lv.12</span></div>
      </div>
      <div className="lobby-currencies"><span>30/30</span><span>13580</span><span>4550</span></div>
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

function ShopView() {
  return (
    <section className="lobby-panel">
      <h2>상점</h2>
      <div className="shop-grid">
        {shopItems.map((item) => (
          <article className="shop-card" key={item.name}><b>{item.tag}</b><h3>{item.name}</h3><div className="shop-icon">{item.amount}</div><strong className="price">{item.price}</strong></article>
        ))}
      </div>
    </section>
  );
}

function HeroesView({ onDetail }: { onDetail: (detail: Detail) => void }) {
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

function ArtifactsView({ onDetail }: { onDetail: (detail: Detail) => void }) {
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

function DetailPanel({ detail, onClose }: { detail: Detail; onClose: () => void }) {
  return (
    <div className="detail-drawer">
      <button type="button" onClick={onClose}>닫기</button>
      <div className="hero-portrait">{detail.title.slice(0, 2)}</div>
      <h2>{detail.title}</h2>
      <p>{detail.subtitle}</p>
      {detail.stats.map((stat) => <strong key={stat}>{stat}</strong>)}
      <button className="lobby-upgrade" type="button">업그레이드</button>
    </div>
  );
}

export function LobbyPage() {
  const [activeTab, setActiveTab] = useState<TabId>("battle");
  const [difficulty, setDifficulty] = useState(3);
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <main className="lobby-shell">
      <LobbyTopBar />
      <LobbyStage difficulty={difficulty} onDifficulty={() => setDifficulty((value) => (value >= 5 ? 1 : value + 1))} />
      {activeTab === "shop" && <ShopView />}
      {activeTab === "heroes" && <HeroesView onDetail={setDetail} />}
      {activeTab === "battle" && <BattleView difficulty={difficulty} />}
      {activeTab === "artifacts" && <ArtifactsView onDetail={setDetail} />}
      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} />}
      <nav className="lobby-bottom-nav">
        {tabs.map((tab) => <button className={activeTab === tab.id ? "active" : ""} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </nav>
    </main>
  );
}
