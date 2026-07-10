import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { AdminPage } from "../pages/AdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GamePage } from "../pages/GamePage";
import { GameStartPage } from "../pages/GameStartPage";
import { HomePage } from "../pages/HomePage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { LoginPage } from "../pages/LoginPage";
import { LobbyPage } from "../pages/LobbyPage";
import { ProfilePage } from "../pages/ProfilePage";
import { PuzzleBubblePage } from "../pages/PuzzleBubblePage";

export const router = createBrowserRouter([
  {
    path: "/play",
    element: <GamePage />,
  },
  {
    path: "/play-test",
    element: <GamePage testMode />,
  },
  {
    path: "/puzzle-bubble",
    element: <PuzzleBubblePage />,
  },
  {
    path: "/lobby",
    element: <LobbyPage />,
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "game", element: <GameStartPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
]);
