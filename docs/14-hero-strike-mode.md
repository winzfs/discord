# 14. 히어로 스트라이크 슈팅 모드

## 목적

기존 랜덤 디펜스와 퍼즐 모드에서 분리된 모바일 세로형 아케이드 슈팅게임입니다.

- 경로: `/hero-strike`
- 렌더링: React에서 호스팅하는 고해상도 Canvas 2D
- 조작: 화면 드래그 이동, 기본 공격 자동 발사
- 한 판 구성: 60초 생존 후 보스전
- 저장: 브라우저 `localStorage` 최고 점수

## 핵심 플레이

1. 화면을 끌어 트레이서를 이동합니다.
2. 기본 공격은 자동 발사됩니다.
3. 적이 떨어뜨린 경험치를 모으면 레벨이 오릅니다.
4. 레벨업 때 세 가지 강화 중 하나를 선택합니다.
5. 적 탄환을 가까이 스치면 `GRAZE` 보너스와 궁극기 게이지를 얻습니다.
6. 25콤보 이상이면 오버드라이브가 발동합니다.
7. 60초 뒤 등장하는 널섹터 보스를 처치하면 승리합니다.

## 구현 기능

- 트레이서 기존 스프라이트 시트 재사용
- 자동사격과 다중 탄환
- 러너, 드론, 탱커 적 3종
- 조준탄, 부채꼴 탄막, 회전형 보스 탄막
- 체력 3칸과 무적 시간
- 보호막 강화
- 경험치 드롭과 자석 흡수
- 3택 레벨업 강화 8종
- 콤보 점수 배율
- 그레이즈 판정
- 오버드라이브
- 펄스 폭탄 궁극기
- 보스 경고와 보스 HP 바
- 시작, 일시정지, 게임오버, 승리, 재시작 화면
- 파티클, 화면 흔들림, 플래시, 부유 점수 연출
- 최대 3배 `devicePixelRatio` 렌더링
- 모바일 세이프 에어리어와 화면 비율 대응

## 강화 목록

- 속사 모듈: 공격 속도 증가
- 펄스 확장: 탄환 수 증가
- 고출력 코어: 공격력 증가
- 관통 탄환: 관통 횟수 증가
- 회수 자석: 경험치 흡수 범위 증가
- 시간 방벽: 보호막 획득
- 펄스 드라이브: 궁극기 충전
- 오버클럭: 오버드라이브 화력 강화

## 파일 구조

```text
apps/web/src/pages/HeroStrikePage.tsx
apps/web/src/features/hero-strike/
  HeroStrikeCanvas.tsx
  useHeroStrikeGame.ts
  heroStrikeConfig.ts
  heroStrikeTypes.ts
  heroStrikeState.ts
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

페이지, 입력, 상태, 스폰, 무기, 플레이어 충돌, 강화, 렌더링을 분리해 한 파일에 기능을 몰아넣지 않습니다.

## 리소스 원칙

새 캐릭터 이미지를 추가하지 않고 기존 트레이서 스프라이트를 사용합니다.

```text
/assets/heroes/tracer.png
```

일반 적과 보스는 기존 랜덤 디펜스의 드론·슬라임형 도형 디자인을 Canvas 2D로 재해석합니다.

## 배포 후 점검 항목

- 실제 스마트폰에서 드래그 지연과 플레이어 추종 속도
- 짧은 화면에서 캔버스가 잘리지 않는지 확인
- 적 탄환 밀도와 피격 판정 체감
- 레벨업 카드 터치 범위
- 궁극기 버튼과 이동 입력 충돌 여부
- 60초까지 프레임 유지 여부
- 보스 HP와 강화 조합별 클리어 시간
- 홈 화면 전환 후 자동 일시정지와 복귀
