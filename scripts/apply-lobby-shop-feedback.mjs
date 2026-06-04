import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let source = readFileSync(path, "utf8");

function replaceOnce(before, after, label) {
  if (!source.includes(before)) {
    console.log(`[skip] ${label}`);
    return;
  }
  source = source.replace(before, after);
  console.log(`[ok] ${label}`);
}

replaceOnce(
  `function ShopView() {\n  return (`,
  `function ShopView({ onPick }: { onPick: (name: string) => void }) {\n  return (`,
  "add shop callback prop",
);

replaceOnce(
  `<article className="shop-card" key={item.name}><b>{item.tag}</b><h3>{item.name}</h3><div className="shop-icon">{item.amount}</div><strong className="price">{item.price}</strong></article>`,
  `<button className="shop-card" key={item.name} type="button" onClick={() => onPick(item.name)}><b>{item.tag}</b><h3>{item.name}</h3><div className="shop-icon">{item.amount}</div><strong className="price">{item.price}</strong></button>`,
  "make shop cards clickable",
);

replaceOnce(
  `  const [detail, setDetail] = useState<Detail | null>(null);`,
  `  const [detail, setDetail] = useState<Detail | null>(null);\n  const [notice, setNotice] = useState("상점, 영웅, 전투, 유물을 확인해보세요.");`,
  "add lobby notice state",
);

replaceOnce(
  `      {activeTab === "shop" && <ShopView />}`,
  `      <p className="lobby-notice">{notice}</p>\n      {activeTab === "shop" && <ShopView onPick={(name) => setNotice(name + " 선택됨")} />}`,
  "show lobby notice",
);

writeFileSync(path, source);
console.log(`Updated ${path}`);
