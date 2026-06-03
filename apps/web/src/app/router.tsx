import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { AdminPage } from "../pages/AdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GamePage } from "../pages/GamePage";
import { HomePage } from "../pages/HomePage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "game", element: <GamePage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
]);
