import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import PublicProfilePage from "@/components/public-profile-page";
import { getSessionUser } from "@/lib/auth/session";
import { demoCreators } from "@/lib/demo-creators";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { listPublicAppsForOwner } from "@/lib/repositories/app-repository";
import { listPublicAppNotes } from "@/lib/repositories/app-note-repository";
import {
  getPublicProfileByUsername,
  getUserProfileByUid,
} from "@/lib/repositories/user-repository";
import { validateUsername } from "@/lib/validation/username";
import type { DemoApp } from "@/lib/mock-data";
import { TOOL_LABELS } from "@/lib/utils/tool-labels";

const covers: DemoApp["cover"][] = ["alien", "coin", "quiet"];
const tones: DemoApp["toolTone"][] = ["blue", "pink", "orange"];

function getDemoCreator(username: string) {
  return demoCreators.find(
    (creator) => creator.profile.username === username.toLowerCase(),
  ) ?? null;
}

const getPageData = cache(async function getPageData(rawUsername: string) {
  const demoCreator = getDemoCreator(rawUsername);
  const demoPageData = demoCreator
    ? { ...demoCreator, notesByAppId: {}, notesEnabled: false }
    : null;
  if (!isFirebaseAdminConfigured()) return demoPageData;

  let username: string;
  try {
    username = validateUsername(rawUsername);
  } catch {
    return null;
  }

  const profile = await getPublicProfileByUsername(username);
  if (!profile) return username === "etime" ? demoPageData : null;
  const apps = await listPublicAppsForOwner(profile.uid);
  const notesByAppId = await listPublicAppNotes(apps.map((app) => app.id));

  return {
    profile: {
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      photoURL: profile.photoURL,
    },
    apps: apps.map(
      (app, index): DemoApp => ({
        id: app.id,
        name: app.name,
        description: app.description,
        tool: app.customToolName || TOOL_LABELS[app.tool],
        toolTone: tones[index % tones.length],
        status: app.status,
        cover: covers[index % covers.length],
        clicks: app.outboundClicks,
        cheers: app.cheers,
        isFirst: app.isFirstApp,
        imageURL: app.imageURL,
        faviconURL: app.faviconURL,
        url: app.url,
        isPublished: true,
      }),
    ),
    notesByAppId,
    notesEnabled: true,
  };
});

async function getViewerUsername() {
  if (!isFirebaseAdminConfigured()) return "etime";
  const user = await getSessionUser();
  if (!user) return null;
  const profile = await getUserProfileByUid(user.uid);
  return profile?.username ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await getPageData(username);
  if (!data) return { title: "페이지를 찾을 수 없어요" };

  return {
    title: `${data.profile.displayName}님의 앱들`,
    description: data.profile.bio,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [data, viewerUsername] = await Promise.all([
    getPageData(username),
    getViewerUsername(),
  ]);
  if (!data) notFound();

  return (
    <PublicProfilePage
      profile={data.profile}
      apps={data.apps}
      notesByAppId={data.notesByAppId ?? {}}
      notesEnabled={data.notesEnabled ?? false}
      viewerUsername={viewerUsername}
    />
  );
}
