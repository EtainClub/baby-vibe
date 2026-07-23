import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRightIcon } from "@/components/icons";

export default function ProfileNotFound() {
  return (
    <main className="profile-not-found">
      <BrandLogo />
      <span>404</span>
      <h1>아직 이 이름의 앱 페이지가 없어요.</h1>
      <p>주소를 다시 확인하거나, 당신의 페이지를 먼저 만들어보세요.</p>
      <Link className="button button-primary" href="/login">
        내 페이지 만들기
        <ArrowRightIcon />
      </Link>
    </main>
  );
}
