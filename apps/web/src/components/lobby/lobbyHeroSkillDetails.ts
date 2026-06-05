export type LobbyHeroSkillDetail = {
  id: string;
  name: string;
  type: "공격" | "제어" | "지원" | "궁극기";
  condition: string;
  summary: string;
  lines: string[];
};

const heroSkillDetails: Record<string, LobbyHeroSkillDetail[]> = {
  dva: [
    { id: "dva-fusion-cannons", name: "융합포", type: "공격", condition: "42%", summary: "가까운 적을 함께 갈아버리는 산탄 공격", lines: ["주 대상에게 104% 피해", "주변 최대 4명에게 24% 추가 피해", "근거리 다수 정리에 강함"] },
    { id: "dva-defense-matrix", name: "방어 매트릭스", type: "제어", condition: "30%", summary: "선두나 보스의 움직임을 억제", lines: ["보스 우선, 없으면 선두 대상", "이동속도를 62% 수준으로 감소", "위험한 누수 상황을 늦춤"] },
    { id: "dva-self-destruct", name: "자폭", type: "궁극기", condition: "게이지 100%", summary: "영웅 위치 기준 넓은 범위 폭발", lines: ["넓은 범위에 공격력 450% 피해", "적이 많이 모였을 때 효율 극대화", "탱커지만 강력한 광역 마무리 가능"] },
  ],
  zarya: [
    { id: "zarya-particle-cannon", name: "입자포", type: "공격", condition: "항상", summary: "같은 대상을 계속 공격할수록 강해지는 빔", lines: ["연속 공격 시 차지 상승", "피해 배율 94%에서 최대 174%까지 상승", "보스전과 장기전에 강함"] },
    { id: "zarya-projected-barrier", name: "방벽 충전", type: "지원", condition: "24%, 차지 3+", summary: "차지가 쌓이면 추가 제어와 피해를 부여", lines: ["차지 3 이상일 때 발동 가능", "대상 감속 + 108% 피해", "입자포 유지력이 좋을수록 강력"] },
    { id: "zarya-graviton-surge", name: "중력자탄", type: "궁극기", condition: "게이지 100%", summary: "주변 적을 끌어모아 묶고 폭발 피해", lines: ["3초 동안 흡입/속박", "좁은 범위에 공격력 240% 피해", "광역 영웅과 연계하기 좋음"] },
  ],
  winston: [
    { id: "winston-tesla-cannon", name: "테슬라 캐논", type: "공격", condition: "기본/42%", summary: "좁은 범위를 튀는 전기 공격", lines: ["주 대상에게 안정적인 전기 피해", "확률로 주변 적에게 연쇄 피해", "최대 4명까지 정리 가능"] },
    { id: "winston-jump-pack", name: "점프 팩", type: "제어", condition: "30%", summary: "선두 적에게 충격을 주고 늦춤", lines: ["선두 대상에게 42% 피해", "이동속도 감소 적용", "전선 돌파를 막는 탱커형 제어"] },
    { id: "winston-primal-rage", name: "원시의 분노", type: "궁극기", condition: "게이지 100%", summary: "광역 충격파로 적을 흔드는 궁극기", lines: ["범위 내 적에게 공격력 240% 피해", "광역 감속 적용", "많은 적이 몰릴 때 방어력이 높음"] },
  ],
  tracer: [
    { id: "tracer-pulse-pistols", name: "펄스 쌍권총", type: "공격", condition: "42%", summary: "빠른 연사로 추가타를 넣는 기본 공격", lines: ["18% 추가타 발생", "주 대상 피해는 96%로 빠르게 누적", "공격속도가 높아 발동 기회가 많음"] },
    { id: "tracer-blink", name: "점멸", type: "공격", condition: "42%", summary: "선두 적을 추가로 찌르는 누수 방지기", lines: ["선두 적에게 48% 피해", "현재 대상과 별개로 앞라인 견제", "빠른 적을 놓치지 않게 보조"] },
    { id: "tracer-pulse-bomb", name: "펄스 폭탄", type: "궁극기", condition: "게이지 100%", summary: "대상에게 폭탄을 붙이고 짧은 뒤 폭발", lines: ["부착 후 0.5초 뒤 폭발", "공격력 520% 광역 피해", "단일 강적과 주변 적을 동시에 처리"] },
  ],
  cassidy: [
    { id: "cassidy-peacekeeper", name: "피스키퍼", type: "공격", condition: "42%", summary: "강력한 치명타 한 방", lines: ["피해량 155%", "단일 대상 처리력이 높음", "보스 체력削り에 안정적"] },
    { id: "cassidy-magnetic-grenade", name: "자력 수류탄", type: "제어", condition: "30%", summary: "감속과 취약 피해를 동시에 적용", lines: ["대상 이동속도 64% 수준으로 감소", "일반 적 114%, 보스 124% 피해", "강한 적 하나를 묶고 터뜨림"] },
    { id: "cassidy-deadeye", name: "황야의 무법자", type: "궁극기", condition: "게이지 100%", summary: "3초 동안 락온 후 강력한 사격", lines: ["락온 진행도에 비례해 피해 증가", "충분히 조준하면 보스 킬 능력 상승", "단일 고위험 대상 처리에 특화"] },
  ],
  genji: [
    { id: "genji-shuriken", name: "수리검", type: "공격", condition: "42%", summary: "선두 적 2명에게 수리검 추가타", lines: ["선두 2명에게 각각 32% 추가 피해", "빠른 다중 견제 가능", "질풍참과 함께 저체력 적 마무리 보조"] },
    { id: "genji-swift-strike", name: "질풍참", type: "공격", condition: "22%", summary: "저체력 적을 향해 이동하며 최대 3회 참격", lines: ["체력 비율이 낮은 적 우선", "1초 간격으로 최대 3명 공격", "각 대상에게 108% 이동 참격"] },
    { id: "genji-dragonblade", name: "용검", type: "궁극기", condition: "게이지 100%", summary: "전방의 여러 적을 칼로 베는 궁극기", lines: ["전방 최대 5명에게 210% 피해", "각 적 위에 베기 이펙트 발생", "다수 마무리에 특화"] },
  ],
  ana: [
    { id: "ana-biotic-rifle", name: "생체 소총", type: "지원", condition: "24%", summary: "취약 사격으로 대상 피해를 키움", lines: ["일반 적 122%, 보스 138% 피해", "고체력 대상 견제에 좋음", "지원형이지만 단일 압박 가능"] },
    { id: "ana-sleep-dart", name: "수면총", type: "제어", condition: "30%", summary: "대상을 3초간 재우는 강력한 제어", lines: ["보스에게도 적용 가능", "3초 동안 이동을 크게 지연", "위험한 선두 적 차단에 좋음"] },
    { id: "ana-nano-boost", name: "나노 강화제", type: "궁극기", condition: "게이지 100%", summary: "전체 화력을 끌어올리는 지원 궁극기", lines: ["공격 배율 +12%", "장기 전투에서 누적 효율 높음", "다른 신화 영웅과 시너지"] },
  ],
  kiriko: [
    { id: "kiriko-kunai", name: "쿠나이", type: "공격", condition: "42%", summary: "급소 판정으로 강한 단일 피해", lines: ["일반 102%, 급소 168% 피해", "보스/후반 진행 적에게 유리", "정밀 타격형 딜 지원"] },
    { id: "kiriko-protection-suzu", name: "정화의 방울", type: "지원", condition: "24%", summary: "전투 전체 공격 배율을 조금씩 강화", lines: ["공격 배율 소량 증가", "반복 발동 시 누적 효율 상승", "빠른 공격 영웅과 궁합 좋음"] },
    { id: "kiriko-kitsune-rush", name: "여우길", type: "궁극기", condition: "게이지 100%", summary: "짧은 시간 공격속도를 크게 상승", lines: ["5초 동안 공격속도 200%", "모든 공격/스킬 발동 기회 증가", "웨이브 폭딜 타이밍에 강함"] },
  ],
  illari: [
    { id: "illari-solar-rifle", name: "태양 소총", type: "공격", condition: "42%", summary: "충전 사격으로 강한 폭발 피해", lines: ["일반 134%, 보스 152% 피해", "단일 목표 폭딜에 유리", "충전형 고화력 딜러"] },
    { id: "illari-healing-pylon", name: "치유 파일론", type: "지원", condition: "24%", summary: "주변 적에게 보조 피해를 분산", lines: ["주변 최대 2명에게 26% 피해", "다수 적 정리에 보조 기여", "지원형 광역 보조 화력"] },
    { id: "illari-captive-sun", name: "태양 작렬", type: "궁극기", condition: "게이지 100%", summary: "범위 안 적을 태양 폭발로 정리", lines: ["범위 300% 피해", "표식/폭발 느낌의 광역 궁극기", "몰린 적 처리에 강함"] },
  ],
};

export function getLobbyHeroSkillDetails(heroId: string) {
  return heroSkillDetails[heroId] ?? [];
}
