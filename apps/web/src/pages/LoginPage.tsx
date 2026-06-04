import { PageSection } from "../components/common/PageSection";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function LoginPage() {
  return (
    <PageSection title="Discord 로그인" description="디스코드 계정으로 로그인하고 서버 멤버 여부를 확인합니다.">
      <div className="placeholder-card">
        <p>로그인 후 대시보드, 기록 저장, 랭킹 기능을 사용할 수 있습니다.</p>
        <a className="primary-link" href={`${API_BASE_URL}/api/auth/discord`}>
          Discord로 로그인
        </a>
      </div>
    </PageSection>
  );
}
