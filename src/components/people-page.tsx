import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRightIcon, HomeIcon, UsersIcon } from "@/components/icons";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import type { PublicUserProfile } from "@/types/user";

export default function PeoplePage({
  people,
  viewerUsername,
}: {
  people: PublicUserProfile[];
  viewerUsername?: string | null;
}) {
  const otherPeople = people.filter((person) => person.username !== viewerUsername);

  return (
    <div className="people-shell">
      <header className="people-topbar">
        <BrandLogo compact />
        <Link href="/home">
          <HomeIcon />
          내 홈
        </Link>
      </header>

      <main className="people-main">
        <section className="people-hero">
          <span className="people-kicker">
            <UsersIcon />
            메이커 둘러보기
          </span>
          <h1>다른 사람들은<br />무엇을 만들고 있을까요?</h1>
          <p>궁금한 사람을 골라 그 사람이 공개한 앱들을 한 번에 만나보세요.</p>
        </section>

        <section className="people-section" aria-labelledby="people-list-title">
          <div className="people-section-heading">
            <div>
              <h2 id="people-list-title">새로운 메이커</h2>
              <p>프로필을 누르면 공개한 앱 목록으로 이동해요.</p>
            </div>
            <span>{otherPeople.length}명</span>
          </div>

          {otherPeople.length > 0 ? (
            <div className="people-grid">
              {otherPeople.map((person, index) => (
                <Link
                  className="person-card"
                  href={`/${person.username}`}
                  prefetch={false}
                  key={person.username}
                >
                  <span
                    className={`person-avatar person-avatar-${(index % 4) + 1}`}
                    style={
                      person.photoURL
                        ? {
                            backgroundImage: `url("${person.photoURL.replace(/["\\]/g, "")}")`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            color: "transparent",
                          }
                        : undefined
                    }
                  >
                    {person.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="person-card-copy">
                    <small>@{person.username}</small>
                    <strong>{person.displayName}</strong>
                    <p>{person.bio || "작은 아이디어를 앱으로 만들고 있어요."}</p>
                  </span>
                  <span className="person-card-action">
                    만든 앱 보기
                    <ArrowRightIcon />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="people-empty">
              <span><UsersIcon /></span>
              <h2>곧 새로운 메이커를 만날 수 있어요.</h2>
              <p>다른 사용자가 앱을 공개하면 이곳에 표시됩니다.</p>
            </div>
          )}
        </section>
      </main>

      <MobileBottomNav active="people" username={viewerUsername} />
    </div>
  );
}
