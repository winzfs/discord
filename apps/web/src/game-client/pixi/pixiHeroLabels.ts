export function getGradeLabel(grade: string) {
  if (grade === "common") return "일반";
  if (grade === "rare") return "희귀";
  if (grade === "epic") return "영웅";
  if (grade === "legendary") return "전설";
  if (grade === "mythic") return "신화";
  return grade;
}

export function getRoleLabel(role: string | undefined) {
  if (role === "damage") return "딜러";
  if (role === "tank") return "탱커";
  if (role === "support") return "지원";
  return "무관";
}

export function getAttackTypeLabel(type: string | undefined) {
  if (type === "single") return "단일";
  if (type === "area") return "광역";
  if (type === "control") return "제어";
  if (type === "support") return "지원";
  return "기본";
}

export function getIngredientLabel(ingredient: { grade?: string; role?: string; count: number }) {
  return `${getGradeLabel(ingredient.grade ?? "any")} ${getRoleLabel(ingredient.role)}x${ingredient.count}`;
}
