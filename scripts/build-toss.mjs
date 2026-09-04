#!/usr/bin/env node
/**
 * Builds the Apps in Toss static bundle.
 *
 * `output: "export"` refuses to build route handlers and dynamic segments that
 * have no `generateStaticParams`, so the server-only parts of the app are moved
 * aside for the duration of the build and restored afterwards. The Toss bundle
 * reaches those endpoints over the network instead (see src/lib/platform.ts).
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const stash = join(root, ".toss-build-stash");

// Server-only routes: API handlers, the click-tracking redirect, and the
// server-rendered public profile (replaced by /u in the Toss bundle).
const serverOnly = [
  "src/app/api",
  "src/app/go",
  "src/app/[username]",
  "src/proxy.ts",
];

/**
 * Routes replaced by a Toss-only version for the duration of the build.
 *
 * These exist because Next.js attributes an awaited dynamic import's CSS and
 * JS to the route that renders it, so guarding the marketing pages behind
 * `IS_TOSS_APP` still shipped their stylesheet and the Google sign-in button.
 */
const overrides = [
  ["toss-overrides/app/page.tsx", "src/app/page.tsx"],
  ["toss-overrides/app/login/page.tsx", "src/app/login/page.tsx"],
];

const moved = [];
const overridden = [];

function stashPath(relative) {
  const from = join(root, relative);
  if (!existsSync(from)) return;
  const to = join(stash, relative);
  mkdirSync(dirname(to), { recursive: true });
  renameSync(from, to);
  moved.push([from, to]);
}

function applyOverride(source, target) {
  stashPath(target);
  copyFileSync(join(root, source), join(root, target));
  overridden.push(join(root, target));
}

function restore() {
  for (const target of overridden.splice(0)) {
    rmSync(target, { force: true });
  }

  for (const [from, to] of moved.reverse()) {
    mkdirSync(dirname(from), { recursive: true });
    renameSync(to, from);
  }
  moved.length = 0;
  rmSync(stash, { recursive: true, force: true });
}

process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

/**
 * Origin the bundle talks to.
 *
 * The mini app has no server of its own, so every API call, share link and
 * profile URL is absolute. `.env.local` points those at http://localhost:3000
 * for `next dev`, which is unreachable from inside the Toss webview. Passing
 * the deployed origin through `spawnSync`'s env wins over the dotenv files,
 * because Next.js never overwrites a variable that is already set.
 */
const apiBase = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://baby.etain.club"
).replace(/\/$/, "");

if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$)/.test(apiBase)) {
  console.error(
    `NEXT_PUBLIC_API_BASE_URL is ${apiBase} — the Toss webview cannot reach a local host.\n` +
      "Set it to the deployed origin before building.",
  );
  process.exit(1);
}

console.log(`Building the Apps in Toss bundle against ${apiBase}`);

rmSync(stash, { recursive: true, force: true });

let status = 1;
try {
  serverOnly.forEach(stashPath);
  overrides.forEach(([source, target]) => applyOverride(source, target));
  status = spawnSync("npx", ["next", "build", "--webpack"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      TOSS_BUILD: "1",
      NEXT_PUBLIC_TOSS_APP: "1",
      NEXT_PUBLIC_API_BASE_URL: apiBase,
      NEXT_PUBLIC_APP_URL: apiBase,
    },
  }).status ?? 1;
} finally {
  restore();
}

if (status === 0) scrubGlobalThisProbe();

process.exit(status);

/**
 * Toss app review statically scans the bundle for eval-family code. webpack's
 * runtime and core-js both probe for the global object with
 * `Function("return this")()` behind a `typeof globalThis` guard, so the call
 * never runs in the Toss webview but the text still shows up in the scan.
 * Substituting `globalThis` is exactly what those guards resolve to.
 */
function scrubGlobalThisProbe() {
  const chunks = join(root, "out", "_next", "static", "chunks");
  if (!existsSync(chunks)) return;

  const probe = /Function\((["'])return this\1\)\(\)/g;
  let patched = 0;

  for (const entry of readdirSync(chunks, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const file = join(chunks, entry.name);
    const source = readFileSync(file, "utf8");
    if (!probe.test(source)) continue;
    probe.lastIndex = 0;
    writeFileSync(file, source.replace(probe, "globalThis"));
    patched += 1;
  }

  if (patched) console.log(`Replaced the global-object probe in ${patched} chunk(s).`);
}
