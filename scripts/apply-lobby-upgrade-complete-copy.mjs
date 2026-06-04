import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");
text = text.replaceAll(" 업그레이드 예약됨", " 업그레이드 완료");
writeFileSync(path, text);
