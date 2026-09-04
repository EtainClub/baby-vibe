import { defineConfig } from "@apps-in-toss/web-framework/config";

// `appName` must match the app registered in the Apps in Toss console exactly.
export default defineConfig({
  appName: "baby-vibe",
  brand: {
    // Matches --blue in src/app/globals.css.
    primaryColor: "#2e63f3",
  },
  // The share sheet, the "copy link" buttons and the recovery-key panel all
  // write to the clipboard.
  permissions: [{ name: "clipboard", access: "write" }],
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
  },
  // Populated by `pnpm build:toss` (Next.js static export).
  webBundleDir: "out",
});
