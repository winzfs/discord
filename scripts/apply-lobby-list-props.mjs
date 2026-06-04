import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");

text = text.replace(
  "function HeroesView({ onDetail }: { onDetail: (detail: Detail) => void }) {",
  "function HeroesView({ heroes, onDetail }: { heroes: typeof initialHeroes; onDetail: (detail: Detail) => void }) {",
);

text = text.replace(
  "function ArtifactsView({ onDetail }: { onDetail: (detail: Detail) => void }) {",
  "function ArtifactsView({ artifacts, onDetail }: { artifacts: typeof initialArtifacts; onDetail: (detail: Detail) => void }) {",
);

text = text.replace(
  "{activeTab === \"heroes\" && <HeroesView onDetail={setDetail} />}",
  "{activeTab === \"heroes\" && <HeroesView heroes={heroes} onDetail={setDetail} />}",
);

text = text.replace(
  "{activeTab === \"artifacts\" && <ArtifactsView onDetail={setDetail} />}",
  "{activeTab === \"artifacts\" && <ArtifactsView artifacts={artifacts} onDetail={setDetail} />}",
);

writeFileSync(path, text);
