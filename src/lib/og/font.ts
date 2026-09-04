import "server-only";

// Gothic A1, not Noto Sans KR: Google serves Noto Sans KR as one unsubsettable
// 6MB face regardless of `text=`, which is far too heavy to fetch per render.
// Gothic A1 honours `text=` and comes back at ~17KB for a card's worth of
// glyphs. Both are SIL OFL.
const FAMILY = "Gothic+A1";

/**
 * Fetches a Korean font subset covering exactly the glyphs in `text`.
 *
 * `ImageResponse` ships no Korean glyphs, so without this every card would
 * render Korean names as tofu boxes.
 */
export async function loadKoreanFont(
  text: string,
  weight: 400 | 700,
): Promise<ArrayBuffer | null> {
  const url =
    `https://fonts.googleapis.com/css2?family=${FAMILY}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`;

  try {
    const css = await fetch(url, {
      headers: {
        // Google serves woff2 to modern browsers, which ImageResponse cannot
        // read. A bare user agent gets truetype.
        "User-Agent": "Mozilla/5.0 (compatible; BabyVibe-OG/1.0)",
      },
      next: { revalidate: 60 * 60 * 24 },
    }).then((response) => (response.ok ? response.text() : null));
    if (!css) return null;

    const fontUrl = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/)?.[1];
    if (!fontUrl) return null;

    const response = await fetch(fontUrl, {
      next: { revalidate: 60 * 60 * 24 },
    });
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    // A card in the fallback face still beats no card at all.
    return null;
  }
}
