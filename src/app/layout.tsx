import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "모아 — 만든 앱들이 흩어지지 않게",
    template: "%s | 모아",
  },
  description:
    "바이브 코딩으로 만든 앱을 한곳에 모아 보여주는, 처음 만드는 사람들을 위한 개인 앱 허브.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
