import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="login-shell">
      <header className="login-topbar">
        <BrandLogo />
        <Link href="/">돌아가기</Link>
      </header>
      <main className="login-main">
        <section className="login-story">
          <div className="login-orbit" />
          <div className="login-story-content">
            <span className="login-story-kicker">만든 앱들이 흩어지지 않게</span>
            <h1>
              오늘 만든 앱부터,
              <br />
              한곳에 모아보세요.
            </h1>
            <p>
              GitHub도, 어려운 설정도 필요 없어요.
              <br />
              첫 앱 주소 하나면 충분합니다.
            </p>
            <div className="login-mini-profile">
              <span className="login-mini-avatar">E</span>
              <div>
                <strong>E-time님의 앱들</strong>
                <small>baby-vibe.web.app/etime</small>
              </div>
              <span className="login-mini-count">3개의 앱</span>
            </div>
          </div>
        </section>
        <section className="login-panel">
          <div className="login-card">
            <BrandMark />
            <span className="login-kicker">반가워요</span>
            <h2>내 앱 페이지 만들기</h2>
            <p>
              Google 계정 하나로 시작하고,
              <br />
              3분 안에 첫 앱을 올려보세요.
            </p>
            <GoogleLoginButton />
            <div className="login-divider">
              <span>또는 데모 둘러보기</span>
            </div>
            <Link className="button button-quiet login-demo-button" href="/start">
              로그인 없이 화면 체험하기
              <ArrowRightIcon />
            </Link>
            <ul className="login-benefits">
              <li>
                <CheckIcon /> 무료로 시작
              </li>
              <li>
                <CheckIcon /> 카드 정보 없음
              </li>
              <li>
                <CheckIcon /> 언제든 앱 숨기기
              </li>
            </ul>
            <small className="login-terms">
              계속하면 서비스 이용약관과 개인정보 처리방침에 동의하게 됩니다.
            </small>
          </div>
        </section>
      </main>
    </div>
  );
}
