import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/pages/LobbyPage.tsx";
let source = readFileSync(path, "utf8");

function patch(before, after, label) {
  if (!source.includes(before)) {
    console.log("skip " + label);
    return;
  }
  source = source.replace(before, after);
  console.log("ok " + label);
}

patch(
  "  const [detail, setDetail] = useState<Detail | null>(null);",
  "  const [detail, setDetail] = useState<Detail | null>(null);\n  const [upgradeNotice, setUpgradeNotice] = useState(\"영웅이나 유물을 선택해보세요.\");",
  "notice state",
);

patch(
  "function DetailPanel({ detail, onClose }: { detail: Detail; onClose: () => void }) {",
  "function DetailPanel({ detail, onClose, onUpgrade }: { detail: Detail; onClose: () => void; onUpgrade: () => void }) {",
  "detail prop",
);

patch(
  "<button className=\"lobby-upgrade\" type=\"button\">업그레이드</button>",
  "<button className=\"lobby-upgrade\" type=\"button\" onClick={onUpgrade}>업그레이드</button>",
  "button click",
);

patch(
  "      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} />}",
  "      <p className=\"lobby-notice\">{upgradeNotice}</p>\n      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} onUpgrade={() => setUpgradeNotice(detail.title + \" 업그레이드 예약됨\")} />}",
  "notice view",
);

writeFileSync(path, source);
