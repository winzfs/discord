# Reaction Lab Discord Activity

`discord-random-defense` 웹앱은 일반 브라우저와 Discord Activity 진입을 같은 빌드에서 처리한다.

- 일반 브라우저: 기존 React Router와 전체 게임 메뉴를 사용한다.
- Discord iframe: 최상위 `App`이 임베디드 실행을 감지하고 `ReactionLabPage`만 직접 렌더링한다.
- Activity 화면에서는 게임 선택 화면으로 돌아가는 링크를 숨긴다.
- 게임 기록은 현재 브라우저의 `localStorage`에 저장한다.

## Discord Application 설정

현재 봇과 같은 Discord Application에서 Activities를 활성화하고, `/` URL Mapping의 TARGET을 이 웹앱의 배포 도메인으로 지정한다. 봇의 `/리액션랩` 명령이 `LAUNCH_ACTIVITY` 응답을 보내면 Discord가 해당 매핑을 iframe으로 열고 리액션 랩 전용 화면이 나타난다.

Embedded App SDK와 OAuth는 현재 싱글플레이 데모에 필요하지 않다. 이후 Discord 사용자 식별, 서버 랭킹, Rich Presence를 추가할 때 SDK 초기화와 인증을 연결한다.
