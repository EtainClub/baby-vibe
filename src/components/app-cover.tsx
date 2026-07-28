"use client";

import { useState } from "react";
import type { DemoApp } from "@/lib/mock-data";

export function AppCover({
  kind,
  compact = false,
  imageURL = null,
  showFallbackArtwork = false,
}: {
  kind: DemoApp["cover"];
  compact?: boolean;
  imageURL?: string | null;
  showFallbackArtwork?: boolean;
}) {
  const [failedImageURL, setFailedImageURL] = useState<string | null>(null);
  const hasImage = Boolean(imageURL && imageURL !== failedImageURL);
  const showArtwork = !hasImage && showFallbackArtwork;

  return (
    <div
      className={`app-cover app-cover-${kind}${compact ? " app-cover-compact" : ""}${
        !hasImage && !showArtwork ? " app-cover-empty" : ""
      }`}
      aria-hidden="true"
    >
      {hasImage && imageURL && (
        <>
          <img
            className="app-cover-image"
            src={imageURL}
            alt=""
            draggable={false}
            onError={() => setFailedImageURL(imageURL)}
          />
          <span className="app-cover-image-shade" />
        </>
      )}
      {!hasImage && !showArtwork && (
        <span className="app-cover-empty-label">이미지 없음</span>
      )}
      {showArtwork && kind === "alien" && (
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
      {showArtwork && kind === "coin" && (
        <>
          <span className="coin coin-one">25</span>
          <span className="coin coin-two">10</span>
          <span className="coin coin-three">5</span>
          <span className="coin coin-four">1</span>
          <span className="coin-glint" />
          <span className="cover-label">COIN COLLECTOR</span>
        </>
      )}
      {showArtwork && kind === "quiet" && (
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
