import type { LobbyTabId } from "../../game-lobby/lobbyData";

type LobbyBottomNavProps = {
  activeTab: LobbyTabId;
  tabs: { id: LobbyTabId; label: string }[];
  onTabChange: (tabId: LobbyTabId) => void;
};

export function LobbyBottomNav({ activeTab, tabs, onTabChange }: LobbyBottomNavProps) {
  return (
    <nav className="lobby-bottom-nav">
      {tabs.map((tab) => (
        <button
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
