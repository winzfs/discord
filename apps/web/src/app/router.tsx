import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { AdminPage } from "../pages/AdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GamePage } from "../pages/GamePage";
import { GameStartPage } from "../pages/GameStartPage";
import { HeroStrikePage } from "../pages/HeroStrikePage";
import { HomePage } from "../pages/HomePage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { LoginPage } from "../pages/LoginPage";
import { LobbyPage } from "../pages/LobbyPage";
import { ProfilePage } from "../pages/ProfilePage";
import { PuzzleBubblePage } from "../pages/PuzzleBubblePage";
import { ReactionLabPage } from "../pages/ReactionLabPage";
import { TrainingLabPage } from "../pages/TrainingLabPage";
import { WidowHoldShotPage } from "../pages/WidowHoldShotPage";

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
    path: "/hero-strike",
    element: <HeroStrikePage />,
  },
  {
    path: "/training-lab",
    element: <TrainingLabPage />,
  },
  {
    path: "/reaction-lab",
    element: <ReactionLabPage />,
  },
  {
    path: "/widow-hold-shot",
    element: <WidowHoldShotPage />,
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
