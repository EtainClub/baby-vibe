import Link from "next/link";
import {
  EyeIcon,
  HomeIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/icons";

type MobileNavSection = "home" | "people" | "profile" | "settings";

export function MobileBottomNav({
  active,
  username,
}: {
  active: MobileNavSection;
  username?: string | null;
}) {
  const items = [
    { key: "home", href: "/home", label: "홈", icon: HomeIcon },
    { key: "people", href: "/people", label: "둘러보기", icon: UsersIcon },
    {
      key: "profile",
      href: username ? `/${username}` : "/login",
      label: "내 페이지",
      icon: EyeIcon,
    },
    { key: "settings", href: "/settings", label: "설정", icon: SparkleIcon },
  ] as const;

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 주요 메뉴">
      {items.map((item) => {
        const Icon = item.icon;
        const isCurrent = item.key === active;
        return (
          <Link
            key={item.key}
            className={isCurrent ? "is-current" : undefined}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
          >
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
