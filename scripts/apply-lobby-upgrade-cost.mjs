import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");
const from = "onUpgrade={() => setUpgradeNotice(detail.title + \" 업그레이드 예약됨\")}";
const to = "onUpgrade={() => { if (gold < 1000) { setUpgradeNotice(\"골드 부족\"); return; } setGold((value) => value - 1000); setUpgradeNotice(detail.title + \" 업그레이드 예약됨\"); }}";
text = text.replace(from, to);
writeFileSync(path, text);
