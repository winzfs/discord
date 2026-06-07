type LobbyTopBarProps = {
  gold: number;
  crystals: number;
};

type ResourcePillProps = {
  label: string;
  value: string | number;
};

function ResourcePill({ label, value }: ResourcePillProps) {
  return (
    <span className="lobby-resource-pill">
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

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
      <div className="lobby-currencies" aria-label="보유 자원">
        <ResourcePill label="에너지" value="30/30" />
        <ResourcePill label="골드" value={gold} />
        <ResourcePill label="보석" value={crystals} />
      </div>
    </header>
  );
}
