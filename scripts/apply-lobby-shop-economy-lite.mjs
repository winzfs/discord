import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let text = readFileSync(path, "utf8");

text = text.replaceAll("onPick: (name: string) => void", "onPick: (name: string, price: string) => void");
text = text.replaceAll("onClick={() => onPick(item.name)}", "onClick={() => onPick(item.name, item.price)}");
text = text.replace("const [gold] = useState(13580);", "const [gold, setGold] = useState(13580);");
text = text.replace("const [crystals] = useState(4550);", "const [crystals, setCrystals] = useState(4550);");

const noticeLine = "  const [notice, setNotice] = useState(\"상점, 영웅, 전투, 유물을 확인해보세요.\");";
const buyFn = `${noticeLine}\n  const buyShopItem = (name: string, price: string) => {\n    const cost = Number(price);\n    if (Number.isNaN(cost)) {\n      setCrystals((value) => value + 30);\n      setNotice(name + \" 수령 완료\");\n      return;\n    }\n    if (gold < cost) {\n      setNotice(\"골드 부족\");\n      return;\n    }\n    setGold((value) => value - cost);\n    setNotice(name + \" 구매 완료\");\n  };`;
text = text.replace(noticeLine, buyFn);
text = text.replace("<ShopView onPick={(name) => setNotice(`${name} 선택됨`)} />", "<ShopView onPick={buyShopItem} />");

writeFileSync(path, text);
