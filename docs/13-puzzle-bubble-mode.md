# 13. 히어로 팝 퍼즐 모드

## 목적

기존 랜덤 디펜스와 분리된 짧은 플레이용 캐주얼 퍼즐 모드입니다.

- 경로: `/puzzle-bubble`
- 렌더링: React에서 호스팅하는 Canvas 2D
- 조작: 드래그로 조준, 손을 떼어 발사
- 규칙: 같은 영웅 버블 3개 이상 연결 시 제거
- 실패: 버블이 하단 위험선에 도달

## 리소스 원칙

새 이미지 리소스를 추가하지 않습니다.

현재 랜덤 디펜스에서 사용 중인 아래 영웅 스프라이트 시트를 그대로 불러오며, 세로 4프레임 중 첫 번째 대기 프레임만 원형 버블 내부에 클리핑해 표시합니다.

```text
/assets/heroes/tracer.png
/assets/heroes/kiriko.png
/assets/heroes/d.va.png
/assets/heroes/illari.png
/assets/heroes/genji.png
```

## 파일 구조

```text
apps/web/src/pages/PuzzleBubblePage.tsx
apps/web/src/features/puzzle-bubble/PuzzleBubbleCanvas.tsx
apps/web/src/features/puzzle-bubble/usePuzzleBubbleGame.ts
apps/web/src/features/puzzle-bubble/puzzleBubbleConfig.ts
apps/web/src/features/puzzle-bubble/puzzleBubbleEngine.ts
apps/web/src/features/puzzle-bubble/puzzleBubbleRenderer.ts
apps/web/src/styles/puzzle-bubble.css
```

페이지, 입력/루프, 순수 규칙, 렌더링, 설정, 스타일을 분리해 한 파일에 기능을 몰아넣지 않습니다.

## 현재 구현

- 모바일 포인터 입력
- 조준 가이드
- 좌우 벽 반사
- 육각형 배치형 버블 스냅
- 동일 영웅 연결 탐색
- 3개 이상 제거
- 천장과 연결이 끊긴 버블 낙하
- 콤보 점수
- 연속 실패 시 한 줄 하강
- 게임 오버 및 재시작
- 기존 영웅 스프라이트 재사용

## 다음 점검 항목

- 실제 모바일 화면에서 짧은 세로 해상도 대응
- 스프라이트별 버블 내부 크롭 위치 확인
- 벽 반사 조준선과 실제 탄도 오차 확인
- 빈 칸 스냅이 비정상 위치로 들어가지 않는지 확인
- 버블이 많을 때 프레임 유지 확인
- 효과음은 기존 프로젝트 리소스가 확인된 뒤에만 연결
