import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design-additions.css";
import { IS_TOSS_APP, PUBLIC_APP_URL } from "@/lib/platform";

export const metadata: Metadata = {
  // Required for the generated OG/Twitter cards to get absolute URLs; a
  // relative og:image is ignored by every crawler that matters.
  metadataBase: new URL(PUBLIC_APP_URL),
  title: {
    default: "Baby Vibe — 만든 앱들이 흩어지지 않게",
    template: "%s | Baby Vibe",
  },
  description:
    "바이브 코딩으로 만든 앱을 한곳에 모아 보여주는, 처음 만드는 사람들을 위한 개인 앱 허브.",
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  // The Toss webview is edge-to-edge; content has to clear the notch itself.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `data-toss` lets plain CSS switch on the Toss build with no runtime work.
    <html lang="ko" data-toss={IS_TOSS_APP ? "1" : undefined}>
      <body>{children}</body>
    </html>
  );
}
