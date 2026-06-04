import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");
text = text.replace("const heroes = [", "const initialHeroes = [");
text = text.replace("const [detail, setDetail] = useState<Detail | null>(null);", "const [detail, setDetail] = useState<Detail | null>(null);\n  const [heroes, setHeroes] = useState(initialHeroes);");
text = text.replace("setUpgradeNotice(detail.title + \" 업그레이드 완료\")", "setHeroes((list) => list.map((hero) => hero.name === detail.title ? { ...hero, level: hero.level + 1 } : hero)); setUpgradeNotice(detail.title + \" 업그레이드 완료\")");
writeFileSync(path, text);
