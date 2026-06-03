# 09. Cloudflare 배포 가이드

## 1. 현재 배포 목표

현재 목표는 완성 MVP가 아니라 **스마트폰 테스트용 프론트엔드 프로토타입 배포**입니다.

현재 배포에서 가능한 것:

- 웹 접속
- 4x4 보드 확인
- 랜덤 영웅 소환
- 같은 등급 3명 합성
- 웨이브 클리어 테스트
- 적 누수 테스트
- 점수/생명/코인 확인

아직 포함하지 않는 것:

- Discord 로그인
- 결과 저장 API 연결
- 랭킹 저장
- D1 실제 연결
- 실제 전투 애니메이션
- 실시간 2인 협동

## 2. Cloudflare Pages 배포 설정

Cloudflare Pages에서 GitHub 저장소 `winzfs/discord`를 연결합니다.

권장 설정:

```text
Project name: discord-random-defense
Production branch: main
Framework preset: Vite 또는 None
Root directory: /
Build command: pnpm --filter @discord-random-defense/web build
Build output directory: apps/web/dist
Node.js version: 20
```

Cloudflare Pages 환경 변수에 다음을 추가하는 것을 권장합니다.

```text
NODE_VERSION=20
```

## 3. 배포 후 확인할 URL

배포가 성공하면 다음과 비슷한 URL이 생성됩니다.

```text
https://discord-random-defense.pages.dev
```

스마트폰에서 해당 URL을 열어 테스트합니다.

확인할 것:

1. 홈 화면이 뜨는지
2. 게임 페이지로 이동되는지
3. 4x4 보드가 보이는지
4. 랜덤 영웅 소환 버튼이 동작하는지
5. 합성 버튼이 동작하는지
6. 웨이브 클리어 테스트 버튼이 동작하는지
7. 모바일 화면에서 버튼이 너무 작지 않은지

## 4. Workers API 배포는 다음 단계

현재는 프론트엔드 프로토타입 배포가 우선입니다.

Workers API는 다음 기능을 붙일 때 배포합니다.

- Discord OAuth
- 게임 결과 저장
- 랭킹 조회
- 관리자 페이지 데이터

API 배포 시 사용할 설정 파일:

```text
apps/api/wrangler.toml
```

## 5. D1 데이터베이스 준비

초기 D1 스키마 파일은 다음 위치에 있습니다.

```text
database/migrations/0001_initial.sql
```

나중에 D1을 생성한 뒤 이 SQL을 적용합니다.

예상 테이블:

- users
- seasons
- game_runs
- leaderboard_entries
- admin_logs

## 6. 현재 추천 개발 순서

1. Cloudflare Pages에 프론트엔드 프로토타입 배포
2. 스마트폰에서 UI/버튼/보드 테스트
3. 모바일 불편한 점 수정
4. 게임 결과 생성 함수 정리
5. `POST /api/game/runs` 구현
6. D1 연결
7. 랭킹 API 구현
8. Discord OAuth 연결

## 7. 문제 해결

### 빌드가 pnpm을 찾지 못하는 경우

Cloudflare Pages의 빌드 환경에서 pnpm이 자동 감지되지 않으면 다음 환경 변수를 추가합니다.

```text
NODE_VERSION=20
```

또는 빌드 명령을 다음처럼 바꿔볼 수 있습니다.

```text
corepack enable && pnpm install --frozen-lockfile=false && pnpm --filter @discord-random-defense/web build
```

### 빌드 출력 폴더 오류

출력 폴더는 반드시 다음으로 설정합니다.

```text
apps/web/dist
```

### 라우팅 새로고침 404

React Router를 사용하므로 Pages에서 새로고침 시 404가 나면 SPA fallback 설정이 필요합니다.

추후 `_redirects` 파일을 `apps/web/public/_redirects`에 추가합니다.

```text
/* /index.html 200
```
