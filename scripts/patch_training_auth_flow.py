from pathlib import Path

page_path = Path("apps/web/src/pages/TrainingLabPage.tsx")
page = page_path.read_text()
page = page.replace('import { useEffect, useState } from "react";', 'import { useState } from "react";')
page = page.replace('''  useEffect(() => {\n    if (activityMode && identityState.status === "idle") {\n      void ensureDiscordTrainingIdentity().catch(() => undefined);\n    }\n  }, [activityMode, identityState.status]);\n\n''', '')
page = page.replace(
    '  const identity = identityState.identity;\n',
    '''  const identity = identityState.identity;\n  const connectionRequired = activityMode && identityState.status !== "ready";\n\n  const connectDiscord = () => {\n    if (identityState.status === "error") {\n      retryDiscordTrainingIdentity();\n      return;\n    }\n    void ensureDiscordTrainingIdentity().catch(() => undefined);\n  };\n''',
)
page = page.replace(
    '''            <strong>{identity\n              ? identity.displayName\n              : identityState.status === "loading" || identityState.status === "idle"\n                ? "Discord 계정 연결 중…"\n                : "서버 랭킹 연결 안 됨"}</strong>''',
    '''            <strong>{identity\n              ? `${identity.displayName} 님으로 연결됨`\n              : identityState.status === "loading"\n                ? "Discord 계정 연결 중…"\n                : identityState.status === "error"\n                  ? "랭킹 연결에 실패했어요"\n                  : "Discord 계정을 먼저 연결하세요"}</strong>''',
)
page = page.replace(
    '''            <span>{identity\n              ? "현재 서버의 별명과 Discord ID로 안전하게 기록됩니다."\n              : identityState.message ?? "Discord 서버 채널에서 Activity를 실행해 주세요."}</span>''',
    '''            <span>{identity\n              ? "현재 서버 별명과 Discord ID로 최고 기록이 자동 저장됩니다."\n              : identityState.status === "error"\n                ? identityState.message\n                : "버튼을 누르면 현재 서버 랭킹 확인과 기록 저장이 활성화됩니다."}</span>''',
)
page = page.replace(
    '''          {identityState.status === "error" ? (\n            <button type="button" onClick={retryDiscordTrainingIdentity}>다시 연결</button>\n          ) : identity ? <b className="training-profile-connected">CONNECTED</b> : null}''',
    '''          {identity ? (\n            <b className="training-profile-connected">CONNECTED</b>\n          ) : activityMode ? (\n            <button\n              type="button"\n              className="training-connect-button"\n              onClick={connectDiscord}\n              disabled={identityState.status === "loading"}\n            >\n              {identityState.status === "loading"\n                ? "연결 중…"\n                : identityState.status === "error"\n                  ? "Discord 다시 연결"\n                  : "Discord 계정 연결"}\n            </button>\n          ) : null}''',
)
page = page.replace(
    '<button type="button" onClick={() => setGame("reaction")}>훈련 시작</button>',
    '<button type="button" onClick={() => setGame("reaction")} disabled={connectionRequired}>{connectionRequired ? "연결 후 시작" : "훈련 시작"}</button>',
)
page = page.replace(
    '<button type="button" onClick={() => setGame("widow")}>훈련 시작</button>',
    '<button type="button" onClick={() => setGame("widow")} disabled={connectionRequired}>{connectionRequired ? "연결 후 시작" : "훈련 시작"}</button>',
)
page_path.write_text(page)

css_path = Path("apps/web/src/styles/training-discord-identity.css")
css = css_path.read_text()
css += '''\n.training-profile--idle,\n.training-profile--error {\n  border-color: rgba(82, 205, 255, .42);\n  background:\n    linear-gradient(105deg, rgba(18, 82, 119, .38), rgba(7, 18, 31, .97) 58%),\n    linear-gradient(180deg, rgba(13, 28, 43, .96), rgba(5, 13, 24, .98));\n  box-shadow: 0 0 0 1px rgba(83, 209, 255, .08), 0 18px 44px rgba(0, 0, 0, .3);\n}\n\n.training-profile--error {\n  border-color: rgba(255, 102, 122, .38);\n}\n\n.training-connect-button {\n  min-width: 190px !important;\n  padding: 0 20px !important;\n  border-color: rgba(122, 224, 255, .72) !important;\n  background: linear-gradient(180deg, #35b7ee, #187ba9) !important;\n  box-shadow: 0 10px 26px rgba(36, 166, 220, .25);\n  font-size: .78rem !important;\n}\n\n.training-connect-button:disabled {\n  cursor: wait;\n  opacity: .7;\n}\n\n.training-card-footer button:disabled {\n  cursor: not-allowed;\n  filter: grayscale(.35);\n  opacity: .48;\n}\n\n.training-ranking-auth strong {\n  color: #eefaff;\n  font-size: .82rem;\n}\n\n@media (max-width: 720px) {\n  .training-connect-button {\n    width: 100%;\n    min-width: 0 !important;\n    min-height: 48px !important;\n  }\n}\n'''
css_path.write_text(css)

edge_path = Path("supabase/functions/training-discord/index.ts")
edge = edge_path.read_text()
edge = edge.replace('  code?: unknown;\n};', '  code?: unknown;\n  accessToken?: unknown;\n};')
edge = edge.replace(
    '''async function requireIdentity(request: Request, guildId: unknown): Promise<DiscordIdentity> {\n  const token = bearerToken(request);\n  if (!token) throw new Error("missing access token");\n  if (!isDiscordId(guildId)) throw new Error("invalid guild id");\n  return getDiscordIdentity(token, guildId);\n}''',
    '''async function requireIdentity(\n  request: Request,\n  guildId: unknown,\n  payloadAccessToken: unknown,\n): Promise<DiscordIdentity> {\n  const bodyToken = typeof payloadAccessToken === "string"\n    ? payloadAccessToken.trim()\n    : "";\n  const token = bodyToken || bearerToken(request);\n  if (!token || token.length > 4096) throw new Error("missing access token");\n  if (!isDiscordId(guildId)) throw new Error("invalid guild id");\n  return getDiscordIdentity(token, guildId);\n}''',
)
edge = edge.replace(
    'identity = await requireIdentity(request, payload.guildId);',
    'identity = await requireIdentity(request, payload.guildId, payload.accessToken);',
)
edge_path.write_text(edge)
