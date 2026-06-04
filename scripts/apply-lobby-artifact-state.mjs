import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");

if (!text.includes("const initialArtifacts = [")) {
  text = text.replace("const artifacts = [", "const initialArtifacts = [");
}

if (!text.includes("const [artifacts, setArtifacts] = useState(initialArtifacts);")) {
  text = text.replace(
    "const [heroes, setHeroes] = useState(initialHeroes);",
    "const [heroes, setHeroes] = useState(initialHeroes);\n  const [artifacts, setArtifacts] = useState(initialArtifacts);",
  );
}

const artifactLevelUp = "setArtifacts((list) => list.map((item) => item.name === detail.title ? { ...item, level: item.level + 1 } : item));";
if (!text.includes(artifactLevelUp)) {
  text = text.replace(
    "setUpgradeNotice(detail.title + \" 업그레이드 예약됨\")",
    `${artifactLevelUp} setUpgradeNotice(detail.title + " 업그레이드 완료")`,
  );
  text = text.replace(
    "setUpgradeNotice(detail.title + \" 업그레이드 완료\")",
    `${artifactLevelUp} setUpgradeNotice(detail.title + " 업그레이드 완료")`,
  );
}

writeFileSync(path, text);
