"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ShareIcon,
  SparkleIcon,
} from "@/components/icons";
import { useSheetDrag } from "@/lib/ui/use-sheet-drag";

interface ShareProfileSheetProps {
  open: boolean;
  username: string;
  displayName: string;
  profileUrl: string;
  onClose: () => void;
  onNotice: (message: string) => void;
  onCrossPromotion: () => void;
}

async function copyText(value: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function ShareProfileSheet({
  open,
  username,
  displayName,
  profileUrl,
  onClose,
  onNotice,
  onCrossPromotion,
}: ShareProfileSheetProps) {
  const [message, setMessage] = useState(
    `바이브 코딩으로 만든 앱들을 한곳에 모아봤어요.\n\n👉 ${profileUrl}`,
  );
  const [qrDataUrl, setQrDataUrl] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { sheetRef, dragHandleProps } = useSheetDrag<HTMLElement>({
    open,
    onDismiss: onClose,
  });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void QRCode.toDataURL(profileUrl, {
      width: 720,
      margin: 2,
      color: {
        dark: "#181917",
        light: "#fffdfa",
      },
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    window.requestAnimationFrame(() => headingRef.current?.focus());

    return () => {
      cancelled = true;
    };
  }, [open, profileUrl]);

  async function copyProfileLink() {
    await copyText(profileUrl);
    onNotice("내 페이지 링크를 복사했어요");
  }

  async function shareNative(fallbackMessage: string) {
    if (navigator.share) {
      await navigator
        .share({
          title: `${displayName}님의 앱들`,
          text: message.replace(profileUrl, "").trim(),
          url: profileUrl,
        })
        .catch(() => undefined);
      return;
    }
    await copyText(message);
    onNotice(fallbackMessage);
  }

  function shareToX() {
    const url = `https://x.com/intent/post?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function saveQrCode() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${username}-moa-qr.png`;
    link.click();
    onNotice("QR 코드를 저장했어요");
  }

  return (
    <>
      <div
        className={`sheet-scrim share-sheet-scrim${open ? " is-visible" : ""}`}
        onClick={onClose}
      />
      <section
        ref={sheetRef}
        className={`share-profile-sheet${open ? " is-visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-labelledby="share-sheet-title"
      >
        <div className="sheet-handle" aria-hidden="true" {...dragHandleProps} />
        <header className="share-sheet-heading">
          <div>
            <span>내 페이지 알리기</span>
            <h2 id="share-sheet-title" ref={headingRef} tabIndex={-1}>
              만든 앱들을 공유해 보세요.
            </h2>
            <p>문구를 편집한 뒤 원하는 방법을 선택할 수 있어요.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="공유 화면 닫기">
            ×
          </button>
        </header>

        <div className="share-sheet-content">
          <label className="share-message-field">
            <span>공유 문구</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={280}
              rows={4}
            />
            <small>{message.length} / 280</small>
          </label>

          <div className="share-link-row">
            <span>{profileUrl}</span>
            <button type="button" onClick={() => void copyProfileLink()}>
              <CopyIcon />
              링크 복사
            </button>
          </div>

          <div className="share-channel-grid">
            <button type="button" onClick={() => void shareNative("공유 문구를 복사했어요")}>
              <span className="share-channel-icon share-channel-native">
                <ShareIcon />
              </span>
              공유 시트
            </button>
            <button type="button" onClick={shareToX}>
              <span className="share-channel-icon share-channel-x">𝕏</span>
              X에 공유
            </button>
            <button
              type="button"
              onClick={() =>
                void shareNative("공유 문구를 복사했어요. 카카오톡에 붙여넣어 주세요")
              }
            >
              <span className="share-channel-icon share-channel-kakao">⌁</span>
              카카오톡
            </button>
          </div>

          <div className="share-qr-card">
            <div className="share-qr-preview">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`${displayName}님의 페이지 QR 코드`} />
              ) : (
                <span>QR</span>
              )}
            </div>
            <div>
              <strong>QR 코드로 보여주기</strong>
              <p>오프라인이나 프로필 이미지에서도 바로 열 수 있어요.</p>
            </div>
            <button type="button" onClick={saveQrCode} disabled={!qrDataUrl}>
              <CheckIcon />
              QR 저장
            </button>
          </div>

          <button
            className="share-cross-promo"
            type="button"
            onClick={onCrossPromotion}
          >
            <span>
              <SparkleIcon />
            </span>
            <span>
              <strong>내 앱에 허브 링크 추가하기</strong>
              <small>AI 도구에 붙여넣을 버튼 생성 프롬프트</small>
            </span>
            <ArrowRightIcon />
          </button>
        </div>
      </section>
    </>
  );
}
