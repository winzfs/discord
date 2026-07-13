import { RouterProvider } from "react-router-dom";
import { isEmbeddedActivity } from "../lib/activityMode";
import { TrainingLabPage } from "../pages/TrainingLabPage";
import { AppProviders } from "./providers";
import { router } from "./router";

export function App() {
  return (
    <AppProviders>
      {isEmbeddedActivity() ? <TrainingLabPage activityMode /> : <RouterProvider router={router} />}
    </AppProviders>
  );
}
