import { useEffect, useState } from "react";
import { PageSection } from "../components/common/PageSection";
import { apiClient, type CurrentUser } from "../lib/apiClient";

export function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiClient
      .me()
      .then((data) => {
        if (alive) setUser(data);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "프로필을 불러오지 못했습니다.");
      });

    return () => {
      alive = false;
    };
  }, []);

  const profile = user?.profile;

  return (
    <PageSection title="프로필" description="Discord 사용자 정보와 개인 기록을 표시합니다.">
      <div className="placeholder-card">
        {error ? (
          <>
            <p className="notice-text">{error}</p>
            <a className="primary-link" href="/login">로그인하러 가기</a>
          </>
        ) : null}
        {!user && !error ? <p className="notice-text">프로필을 불러오는 중입니다.</p> : null}
        {user ? (
          <div className="profile-row">
            {profile?.avatarUrl ? <img className="profile-avatar" src={profile.avatarUrl} alt="Discord avatar" /> : <div className="profile-avatar" />}
            <div>
              <h3>{profile?.globalName ?? profile?.username ?? user.discordId}</h3>
              <p className="notice-text">Discord ID: {user.discordId}</p>
              <p className="notice-text">서버 멤버: {user.isGuildMember ? "확인됨" : "미확인"}</p>
              <p className="notice-text">관리자: {user.isAdmin ? "예" : "아니오"}</p>
            </div>
          </div>
        ) : null}
      </div>
    </PageSection>
  );
}
