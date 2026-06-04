import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");

if (!text.includes("const initialHeroes = [")) {
  text = text.replace("const heroes = [", "const initialHeroes = [");
}

if (!text.includes("const [heroes, setHeroes] = useState(initialHeroes);")) {
  text = text.replace(
    "const [detail, setDetail] = useState<Detail | null>(null);",
    "const [detail, setDetail] = useState<Detail | null>(null);\n  const [heroes, setHeroes] = useState(initialHeroes);",
  );
}

const heroLevelUp = "setHeroes((list) => list.map((hero) => hero.name === detail.title ? { ...hero, level: hero.level + 1 } : hero));";
if (!text.includes(heroLevelUp)) {
  text = text.replace(
    "setUpgradeNotice(detail.title + \" 업그레이드 예약됨\")",
    `${heroLevelUp} setUpgradeNotice(detail.title + " 업그레이드 완료")`,
  );
  text = text.replace(
    "setUpgradeNotice(detail.title + \" 업그레이드 완료\")",
    `${heroLevelUp} setUpgradeNotice(detail.title + " 업그레이드 완료")`,
  );
}

writeFileSync(path, text);
