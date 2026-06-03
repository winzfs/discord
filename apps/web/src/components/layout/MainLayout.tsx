import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { to: "/", label: "홈" },
  { to: "/login", label: "로그인" },
  { to: "/dashboard", label: "대시보드" },
  { to: "/game", label: "게임" },
  { to: "/leaderboard", label: "랭킹" },
  { to: "/profile", label: "프로필" },
  { to: "/admin", label: "관리자" },
];

export function MainLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Discord Community Fan Game</p>
          <h1>싱글 랜덤 디펜스</h1>
        </div>
        <nav className="site-nav" aria-label="주요 메뉴">
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : undefined)} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
      <footer className="site-footer">비상업 팬게임입니다. Blizzard Entertainment와 공식 관련이 없습니다.</footer>
    </div>
  );
}
