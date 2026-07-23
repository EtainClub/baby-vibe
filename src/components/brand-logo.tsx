import Link from "next/link";

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark brand-mark-small" : "brand-mark"}>
      <span className="brand-tile brand-tile-one" />
      <span className="brand-tile brand-tile-two" />
      <span className="brand-tile brand-tile-three" />
    </span>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-logo" href="/" aria-label="Baby Vibe 홈">
      <BrandMark small={compact} />
      <span>Baby&nbsp;Vibe</span>
    </Link>
  );
}
