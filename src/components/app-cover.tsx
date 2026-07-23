import type { DemoApp } from "@/lib/mock-data";

export function AppCover({
  kind,
  compact = false,
  imageURL = null,
}: {
  kind: DemoApp["cover"];
  compact?: boolean;
  imageURL?: string | null;
}) {
  return (
    <div
      className={`app-cover app-cover-${kind}${compact ? " app-cover-compact" : ""}`}
      style={
        imageURL
          ? {
              backgroundImage: `linear-gradient(rgba(20, 21, 18, 0.05), rgba(20, 21, 18, 0.05)), url("${imageURL.replace(/["\\]/g, "")}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-hidden="true"
    >
      {!imageURL && kind === "alien" && (
        <>
          <span className="alien-orbit alien-orbit-one" />
          <span className="alien-orbit alien-orbit-two" />
          <span className="alien-planet">
            <span className="alien-eye alien-eye-left" />
            <span className="alien-eye alien-eye-right" />
            <span className="alien-mouth" />
          </span>
          <span className="cover-label">ALIEN INDEX</span>
        </>
      )}
      {!imageURL && kind === "coin" && (
        <>
          <span className="coin coin-one">25</span>
          <span className="coin coin-two">10</span>
          <span className="coin coin-three">5</span>
          <span className="coin coin-four">1</span>
          <span className="coin-glint" />
          <span className="cover-label">COIN COLLECTOR</span>
        </>
      )}
      {!imageURL && kind === "quiet" && (
        <>
          <span className="quiet-sun" />
          <span className="quiet-hill quiet-hill-back" />
          <span className="quiet-hill quiet-hill-front" />
          <span className="quiet-breath quiet-breath-one" />
          <span className="quiet-breath quiet-breath-two" />
          <span className="cover-label">QUIET MINUTE</span>
        </>
      )}
    </div>
  );
}
