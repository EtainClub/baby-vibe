import type { NextConfig } from "next";

const isTossBuild = process.env.TOSS_BUILD === "1";

const nextConfig: NextConfig = {
  // Apps in Toss loads a static bundle through its own webview shell — it never
  // runs the Node server. Only the Toss build switches to a static export; the
  // Firebase Hosting build keeps its server components and route handlers.
  ...(isTossBuild
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  webpack: (config) => {
    if (isTossBuild) {
      // Toss app review statically scans the bundle for eval-family code and
      // rejects on a match. The full Firestore SDK ships codegen (WebChannel
      // long-polling + IndexedDB persistence) that reads as eval, whether or
      // not it ever runs. The client never talks to Firestore directly, so
      // this alias is belt-and-braces against a transitive import.
      config.resolve.alias = {
        ...config.resolve.alias,
        "firebase/firestore$": "firebase/firestore/lite",
      };
    }
    return config;
  },
};

export default nextConfig;
