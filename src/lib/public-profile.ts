import "server-only";

import { demoCreators } from "@/lib/demo-creators";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { listPublicAppNotes } from "@/lib/repositories/app-note-repository";
import { listPublicAppsForOwner } from "@/lib/repositories/app-repository";
import { getPublicProfileByUsername } from "@/lib/repositories/user-repository";
import { getToolTone, TOOL_LABELS } from "@/lib/utils/tool-labels";
import { validateUsername } from "@/lib/validation/username";
import type { DemoApp } from "@/lib/mock-data";
import type { PublicAppNote } from "@/types/app-note";

export interface PublicProfilePayload {
  profile: {
    username: string;
    displayName: string;
    bio: string;
    photoURL: string | null;
  };
  apps: DemoApp[];
  notesByAppId: Record<string, PublicAppNote[]>;
  notesEnabled: boolean;
}

const covers: DemoApp["cover"][] = ["alien", "coin", "quiet"];

function getDemoCreator(username: string) {
  return (
    demoCreators.find(
      (creator) => creator.profile.username === username.toLowerCase(),
    ) ?? null
  );
}

/** Shared by the server-rendered `/[username]` page and the `/api/u` endpoint
 * the Apps in Toss bundle reads, so both always show the same page. */
export async function getPublicProfilePayload(
  rawUsername: string,
): Promise<PublicProfilePayload | null> {
  const demoCreator = getDemoCreator(rawUsername);
  const demoPayload: PublicProfilePayload | null = demoCreator
    ? { ...demoCreator, notesByAppId: {}, notesEnabled: false }
    : null;
  if (!isFirebaseAdminConfigured()) return demoPayload;

  let username: string;
  try {
    username = validateUsername(rawUsername);
  } catch {
    return null;
  }

  const profile = await getPublicProfileByUsername(username);
  if (!profile) return username === "etime" ? demoPayload : null;

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
        toolTone: getToolTone(app.tool, app.customToolName),
        status: app.status,
        cover: covers[index % covers.length],
        clicks: app.outboundClicks,
        cheers: app.cheers,
        isFirst: app.isFirstApp,
        imageURL: app.imageURL,
        faviconURL: app.faviconURL,
        url: app.url,
        isPublished: true,
        health: app.health,
      }),
    ),
    notesByAppId,
    notesEnabled: true,
  };
}
