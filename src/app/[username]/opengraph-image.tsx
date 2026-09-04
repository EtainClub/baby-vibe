import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og/font";
import { getPublicProfilePayload } from "@/lib/public-profile";

export const alt = "Baby Vibe 메이커 페이지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#171814";
const MUTED = "#6f706b";
const PAPER = "#fbfaf7";
const BLUE = "#2e63f3";

/**
 * Share card for a maker's page.
 *
 * The whole product is "show people what you made", and a link with no preview
 * gets scrolled past — especially in KakaoTalk, which is where these pages
 * actually get shared.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getPublicProfilePayload(username);

  const displayName = data?.profile.displayName ?? "Baby Vibe";
  const bio = data?.profile.bio ?? "바이브 코딩으로 만든 앱을 한곳에.";
  const apps = data?.apps.slice(0, 3) ?? [];
  const appCount = data?.apps.length ?? 0;
  const heading = `${displayName}님의 앱들`;

  const glyphs = [heading, bio, `@${username}`, `${appCount}개의 앱`, "Baby Vibe"]
    .concat(apps.map((app) => `${app.name} ${app.tool}`))
    .join(" ");
  const [bold, regular] = await Promise.all([
    loadKoreanFont(glyphs, 700),
    loadKoreanFont(glyphs, 400),
  ]);

  const fonts = [
    bold && { name: "NotoKR", data: bold, weight: 700 as const, style: "normal" as const },
    regular && { name: "NotoKR", data: regular, weight: 400 as const, style: "normal" as const },
  ].filter((font) => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: PAPER,
          fontFamily: fonts.length ? "NotoKR" : undefined,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: BLUE,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: BLUE,
                color: PAPER,
                fontSize: 24,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 5,
                  background: PAPER,
                }}
              />
            </div>
            Baby Vibe
          </div>

          <div style={{ display: "flex", color: INK, fontSize: 76, fontWeight: 700 }}>
            {heading}
          </div>
          <div style={{ display: "flex", color: MUTED, fontSize: 32 }}>{bio}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {apps.map((app) => (
              <div
                key={app.id}
                style={{
                  display: "flex",
                  maxWidth: 330,
                  flexDirection: "column",
                  gap: 6,
                  padding: "18px 22px",
                  border: "1px solid rgba(23,24,20,0.11)",
                  borderRadius: 22,
                  background: "white",
                }}
              >
                <div style={{ display: "flex", color: INK, fontSize: 28, fontWeight: 700 }}>
                  {app.name}
                </div>
                <div style={{ display: "flex", color: MUTED, fontSize: 22 }}>
                  {app.tool}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: MUTED,
              fontSize: 28,
            }}
          >
            <div style={{ display: "flex" }}>@{username}</div>
            <div style={{ display: "flex", color: INK, fontWeight: 700 }}>
              {appCount}개의 앱
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
