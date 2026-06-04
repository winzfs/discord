import { Link } from "react-router-dom";
import "../styles/lobby.css";

const shopItems = [
  { name: "무료 보석", amount: "30", price: "무료", tag: "AD" },
  { name: "초대장", amount: "30", price: "960", tag: "20% 할인" },
  { name: "광산 열쇠", amount: "1", price: "8400", tag: "30% 할인" },
  { name: "폭풍거인", amount: "10", price: "3600", tag: "10% 할인" },
];

const heroes = [
  { name: "오크주술사", level: 1, shard: "207/5", role: "원거리" },
  { name: "필스생성기", level: 1, shard: "207/5", role: "지원" },
  { name: "발바", level: 1, shard: "207/5", role: "근거리" },
  { name: "울티", level: 1, shard: "207/5", role: "원거리" },
  { name: "닌자", level: 2, shard: "207/10", role: "암살" },
  { name: "드래곤", level: 6, shard: "207/70", role: "광역" },
];

const artifacts = [
  { name: "강화 장갑", level: 1, progress: "0/2" },
  { name: "비전서", level: 1, progress: "1/2" },
  { name: "빙결봉", level: 1, progress: "1/2" },
  { name: "왕의 깃발", level: 1, progress: "0/2" },
  { name: "나팔", level: 1, progress: "0/2" },
  { name: "황금 곡괭이", level: 2, progress: "0/4" },
];

const quests = [
  { title: "영웅 30회 모집", progress: 78 },
  { title: "몬스터 처치", progress: 100 },
  { title: "미션 달성", progress: 62 },
  { title: "공격력 업그레이드", progress: 18 },
];

function LobbyTopBar() {
  return (
    <header className="lobby-topbar">
      <div className="lobby-profile">
        <div className="lobby-avatar">오</div>
        <div>
          <strong>오파후</strong>
          <span>Lv.12</span>
        </div>
      </div>
      <div className="lobby-currencies">
        <span>⚡ 30/30</span>
        <span>🪙 13580</span>
        <span>💧 4550</span>
      </div>
    </header>
  );
}

function LobbyStage() {
  return (
    <section className="lobby-stage">
      <div className="stage-character stage-left">상인</div>
      <div className="stage-character stage-boss">거인</div>
      <div className="stage-character stage-right">검사</div>
      <div className="stage-speech">난이도 변경?</div>
      <Link className="battle-start" to="/play">빠른 시작</Link>
    </section>
  );
}

function ShopView() {
  return (
    <section className="lobby-panel">
      <h2>상점</h2>
      <div className="shop-grid">
        {shopItems.map((item) => (
          <article className="shop-card" key={item.name}>
            <b>{item.tag}</b>
            <h3>{item.name}</h3>
            <div className="shop-icon">{item.amount}</div>
            <strong className="price">{item.price}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroesView() {
  return (
    <section className="lobby-panel">
      <div className="panel-tabs"><b>영웅</b><span>신화</span></div>
      <div className="hero-grid">
        {heroes.map((hero) => (
          <article className="hero-card" key={hero.name}>
            <div className="hero-portrait">{hero.name.slice(0, 2)}</div>
            <strong>Lv.{hero.level}</strong>
            <span>{hero.shard}</span>
            <small>{hero.role}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function BattleView() {
  return (
    <section className="lobby-panel battle-panel">
      <h2>전투</h2>
      <div className="battle-road">
        <span>20</span>
        <div className="road-monster">슬라임</div>
        <span>10</span>
      </div>
      <div className="battle-actions">
        <button type="button">친구랑 하기</button>
        <Link to="/play">빠른 시작</Link>
      </div>
      <div className="quest-mini">
        <h3>퀘스트</h3>
        {quests.map((quest) => (
          <label key={quest.title}>
            <span>{quest.title}</span>
            <progress value={quest.progress} max="100" />
          </label>
        ))}
      </div>
    </section>
  );
}

function ArtifactsView() {
  return (
    <section className="lobby-panel">
      <h2>유물</h2>
      <div className="artifact-grid">
        {artifacts.map((item) => (
          <article className="artifact-card" key={item.name}>
            <div className="artifact-icon">Lv.{item.level}</div>
            <strong>{item.name}</strong>
            <span>{item.progress}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LobbyPage() {
  return (
    <main className="lobby-shell">
      <LobbyTopBar />
      <LobbyStage />
      <ShopView />
      <HeroesView />
      <BattleView />
      <ArtifactsView />
      <nav className="lobby-bottom-nav">
        <a href="#shop">상점</a>
        <a href="#heroes">영웅</a>
        <a href="#battle">전투</a>
        <a href="#artifacts">유물</a>
      </nav>
    </main>
  );
}
