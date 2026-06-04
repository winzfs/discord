import { readFileSync, writeFileSync } from "node:fs";

const filePath = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(filePath, "utf8");

const pairs = [
  ["function LobbyTopBar() {", "function LobbyTopBar({ gold, crystals }: { gold: number; crystals: number }) {"],
  ["<span>13580</span><span>4550</span>", "<span>{gold}</span><span>{crystals}</span>"],
  ["const [difficulty, setDifficulty] = useState(3);", "const [difficulty, setDifficulty] = useState(3);\n  const [gold] = useState(13580);\n  const [crystals] = useState(4550);"],
  ["<LobbyTopBar />", "<LobbyTopBar gold={gold} crystals={crystals} />"],
];

for (const [from, to] of pairs) {
  if (text.includes(from)) text = text.replace(from, to);
}

writeFileSync(filePath, text);
