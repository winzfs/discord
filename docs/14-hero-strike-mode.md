# 14. 히어로 스트라이크 슈팅 모드

## 목적

기존 랜덤 디펜스와 퍼즐 모드에서 분리된 모바일 세로형 아케이드 슈팅게임입니다.

- 경로: `/hero-strike`
- 렌더링: React에서 호스팅하는 Canvas 2D
- 조작: 화면 상대 드래그 이동, 기본 공격 자동 발사
- 구성: 3개 독립 스테이지와 스테이지별 보스전
- 저장: 브라우저 `localStorage` 최고 점수

## 핵심 플레이

1. 화면을 끌어 트레이서를 이동합니다.
2. 기본 공격은 자동 발사됩니다.
3. 적이 떨어뜨린 경험치를 모으면 레벨이 오릅니다.
4. 레벨업 때 세 가지 강화 중 하나를 선택합니다.
5. 적 탄환을 가까이 스치면 `GRAZE` 보너스와 궁극기 게이지를 얻습니다.
6. 각 스테이지 제한 시간이 지나면 보스가 등장합니다.
7. 보스를 격파하면 `STAGE CLEAR` 화면이 열립니다.
8. 다음 스테이지 버튼을 누르면 회복과 보상을 받고 다음 지역으로 이동합니다.
9. 3스테이지 보스를 격파하면 전체 승리합니다.

## 스테이지 구성

### Stage 1 — KING'S ROW

- 도시 상공 방어선
- 러너 중심의 입문 스테이지
- 단일 조준탄 패턴
- 보스: `SENTRY PRIME`

### Stage 2 — NULL SECTOR FACTORY

- 생산 구역 돌파
- 드론 비중 증가
- 좌우 분열탄 패턴
- 보스: `FACTORY WARDEN`

### Stage 3 — GIBRALTAR ORBIT

- 궤도 방어망 최종전
- 탱커와 고밀도 적 편성
- 다중 부채꼴 탄막
- 보스: `ORBIT OVERSEER`

스테이지 보스 처치 후 다음 스테이지로 바로 넘어가지 않습니다. 별도 클리어 화면에서 점수와 보상을 확인한 뒤 사용자가 화면을 눌러 진행합니다.

다음 스테이지 기본 보상:

- 체력 1 회복
- 보호막 1 획득
- 궁극기 게이지 25% 획득
- 스테이지별 보너스 아이템

## 아이템 종류

- 경험치 조각: 레벨업 경험치
- 회복 팩: 체력 1 회복
- 궁극기 코어: 궁극기 게이지 충전
- 방벽 코어: 보호막 1 획득
- 폭발 코어: 적탄 제거와 화면 전체 피해
- 오버드라이브 코어: 일정 시간 화력 강화

## 시인성 원칙

적 탄환과 보상 아이템은 색상에만 의존하지 않습니다.

- 적 탄환: 분홍·빨강 원형, 검은 외곽선, 흰색 중심점
- 경험치: 청록색 다이아 형태와 아래쪽 빛 꼬리
- 회복: 녹색 십자
- 궁극기: 금색 번개
- 보호막: 파란 방패
- 폭탄: 주황 폭탄
- 오버드라이브: 보라색 별

색각 차이가 있거나 화면 밝기가 낮아도 형태만으로 종류를 구분할 수 있도록 구성합니다.

## 구현 기능

- 트레이서 기존 스프라이트 시트 재사용
- 자동사격과 다중 탄환
- 러너, 드론, 탱커 적 3종
- 스테이지별 적 편성, 배경, 탄막 속도와 패턴
- 스테이지별 보스 체력과 보스 명칭
- 스테이지 클리어와 다음 스테이지 화면
- 체력 4칸과 시작 보호막
- 경험치 드롭과 자석 흡수
- 특수 아이템 5종
- 3택 레벨업 강화 8종
- 콤보 점수 배율
- 그레이즈 판정
- 오버드라이브
- 펄스 폭탄 궁극기
- 보스 경고와 보스 HP 바
- 시작, 일시정지, 스테이지 클리어, 게임오버, 승리, 재시작 화면
- 파티클, 화면 흔들림, 플래시, 부유 점수 연출
- 최대 1.5배 `devicePixelRatio` 렌더링
- 모바일 세이프 에어리어와 화면 비율 대응

## 모바일 성능 기준

- 스테이지별 정적 배경은 캔버스에 미리 그린 뒤 재사용합니다.
- 탄환과 아이템은 고비용 `shadowBlur` 대신 단순한 2중 발광 도형으로 표시합니다.
- 탄환은 최대 220개, 파티클은 최대 140개, 부유 텍스트는 최대 10개로 제한합니다.
- 별 배경 개수는 42개로 제한합니다.
- 드래그는 손가락이 움직인 거리만큼 상대 이동합니다.
- 브라우저가 묶어서 전달한 포인터 이벤트에서는 가장 최신 좌표를 사용합니다.

## 파일 구조

```text
apps/web/src/pages/HeroStrikePage.tsx
apps/web/src/features/hero-strike/
  HeroStrikeCanvas.tsx
  useHeroStrikeGame.ts
  heroStrikeConfig.ts
  heroStrikeTypes.ts
  heroStrikeState.ts
  heroStrikeStages.ts
  heroStrikeStageRuntime.ts
  heroStrikePickups.ts
  heroStrikeSpawner.ts
  heroStrikeWeaponRuntime.ts
  heroStrikePlayerRuntime.ts
  heroStrikeRuntime.ts
  heroStrikeInput.ts
  heroStrikeUpgrades.ts
  heroStrikeEffects.ts
  heroStrikeAssets.ts
  heroStrikeCanvasResolution.ts
  heroStrikeBackdropRenderer.ts
  heroStrikeEntityRenderer.ts
  heroStrikeHudRenderer.ts
  heroStrikeOverlayRenderer.ts
  heroStrikeRenderer.ts
apps/web/src/styles/hero-strike.css
```

페이지, 입력, 상태, 스테이지, 아이템, 스폰, 무기, 플레이어 충돌, 강화, 렌더링을 분리합니다.

## 리소스 원칙

새 캐릭터 이미지를 추가하지 않고 기존 트레이서 스프라이트를 사용합니다.

```text
/assets/heroes/tracer.png
```

일반 적과 보스, 아이템은 기존 게임과 같은 도형 기반 아트 방향으로 Canvas 2D에서 표현합니다.

## 배포 후 점검 항목

- 스테이지 1 보스가 제한 시간 후 정상 등장하는지
- 각 보스 처치 후 클리어 화면이 열리는지
- 다음 스테이지에서 시간과 보스 상태가 초기화되는지
- 최종 보스만 전체 승리로 연결되는지
- 특수 아이템별 효과와 수집 표시
- 적 탄환과 경험치가 작은 화면에서도 즉시 구별되는지
- 3스테이지 후반까지 프레임이 유지되는지
- 레벨업 직후 스테이지 흐름이 멈추거나 중복되지 않는지