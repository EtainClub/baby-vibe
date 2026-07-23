import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicProfilePage from "@/components/public-profile-page";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { listPublicAppsForOwner } from "@/lib/repositories/app-repository";
import { getPublicProfileByUsername } from "@/lib/repositories/user-repository";
import { validateUsername } from "@/lib/validation/username";
import { demoApps, type DemoApp } from "@/lib/mock-data";
import { TOOL_LABELS } from "@/lib/utils/tool-labels";

const covers: DemoApp["cover"][] = ["alien", "coin", "quiet"];
const tones: DemoApp["toolTone"][] = ["blue", "pink", "orange"];

async function getPageData(rawUsername: string) {
  const demoData = {
    profile: {
      username: "etime",
      displayName: "E-time",
      bio: "생활과 호기심을 작은 앱으로 만들고 있어요.",
      photoURL: null,
    },
    apps: demoApps,
  };

  if (!isFirebaseAdminConfigured()) {
    return rawUsername.toLowerCase() === "etime" ? demoData : null;
  }

  let username: string;
  try {
    username = validateUsername(rawUsername);
  } catch {
    return null;
  }

  const profile = await getPublicProfileByUsername(username);
  if (!profile) return username === "etime" ? demoData : null;
  const apps = await listPublicAppsForOwner(profile.uid);

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
  };
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
  const data = await getPageData(username);
  if (!data) notFound();

  return <PublicProfilePage profile={data.profile} apps={data.apps} />;
}
