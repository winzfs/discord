import { RouterProvider } from "react-router-dom";
import { isEmbeddedActivity } from "../lib/activityMode";
import { ReactionLabPage } from "../pages/ReactionLabPage";
import { AppProviders } from "./providers";
import { router } from "./router";

export function App() {
  return (
    <AppProviders>
      {isEmbeddedActivity() ? <ReactionLabPage activityMode /> : <RouterProvider router={router} />}
    </AppProviders>
  );
}
