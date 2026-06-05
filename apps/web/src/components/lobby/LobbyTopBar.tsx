type LobbyTopBarProps = {
  gold: number;
  crystals: number;
};

export function LobbyTopBar({ gold, crystals }: LobbyTopBarProps) {
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
        <span>30/30</span>
        <span>{gold}</span>
        <span>{crystals}</span>
      </div>
    </header>
  );
}
