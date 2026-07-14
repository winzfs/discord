# 훈련소 Activity URL Mapping

Discord Activity는 외부 URL로 직접 `fetch`할 수 없으므로 Supabase 함수 요청을 Discord 프록시 경로로 보낸다.

Developer Portal > Activities > URL Mappings에 다음 매핑을 추가한다.

```text
PREFIX: /training-api
TARGET: pbjjjggnudihwynixqai.supabase.co/functions/v1
```

주의사항:

- TARGET에는 `https://`를 넣지 않는다.
- `/training-api` 매핑은 기존 `/` 매핑보다 위에 둔다.
- 기존 `/` 매핑은 현재 Cloudflare Pages 웹 주소를 그대로 유지한다.

클라이언트 요청 경로:

```text
/.proxy/training-api/training-discord
```

브라우저에서 직접 실행할 때는 기존 Supabase 전체 URL을 사용하고, Discord Activity iframe에서만 프록시 경로를 사용한다.
