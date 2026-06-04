export type LobbyTabId = "shop" | "heroes" | "battle" | "artifacts";

export type Detail = {
  title: string;
  subtitle: string;
  stats: string[];
};

export const shopItems = [
  { name: "무료 보석", amount: "30", price: "무료", tag: "AD" },
  { name: "초대장", amount: "30", price: "960", tag: "20% 할인" },
  { name: "광산 열쇠", amount: "1", price: "8400", tag: "30% 할인" },
  { name: "폭풍거인", amount: "10", price: "3600", tag: "10% 할인" },
];

export const initialHeroes = [
  { name: "오크주술사", level: 1, shard: "207/5", role: "원거리", attack: "9.3K", speed: "2" },
  { name: "필스생성기", level: 1, shard: "207/5", role: "지원", attack: "7.8K", speed: "1.6" },
  { name: "발바", level: 1, shard: "207/5", role: "근거리", attack: "8.8K", speed: "1.4" },
  { name: "울티", level: 1, shard: "207/5", role: "원거리", attack: "9.3K", speed: "2" },
  { name: "닌자", level: 2, shard: "207/10", role: "암살", attack: "5.1K", speed: "2.6" },
  { name: "드래곤", level: 6, shard: "207/70", role: "광역", attack: "8.9K", speed: "1.1" },
];

export const initialArtifacts = [
  { name: "강화 장갑", level: 1, progress: "0/2", effect: "치명타 피해 증가" },
  { name: "비전서", level: 1, progress: "1/2", effect: "스킬 피해 증가" },
  { name: "빙결봉", level: 1, progress: "1/2", effect: "빙결 확률 증가" },
  { name: "왕의 깃발", level: 1, progress: "0/2", effect: "소환 비용 감소" },
  { name: "나팔", level: 1, progress: "0/2", effect: "웨이브 보상 증가" },
  { name: "황금 곡괭이", level: 2, progress: "0/4", effect: "골드 획득 증가" },
];

export const quests = [
  { title: "영웅 30회 모집", progress: 78 },
  { title: "몬스터 처치", progress: 100 },
  { title: "미션 달성", progress: 62 },
  { title: "공격력 업그레이드", progress: 18 },
];

export const tabs: { id: LobbyTabId; label: string }[] = [
  { id: "shop", label: "상점" },
  { id: "heroes", label: "영웅" },
  { id: "battle", label: "전투" },
  { id: "artifacts", label: "유물" },
];
