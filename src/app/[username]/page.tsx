import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import PublicProfilePage from "@/components/public-profile-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getPublicProfilePayload } from "@/lib/public-profile";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

const getPageData = cache(getPublicProfilePayload);

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

  const title = `${data.profile.displayName}님의 앱들`;
  const description =
    data.profile.bio || "바이브 코딩으로 만든 앱들을 한곳에 모아봤어요.";

  return {
    title,
    description,
    // Shared links are the product's whole growth loop, and KakaoTalk shows
    // nothing at all without these.
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${data.profile.username}`,
      siteName: "Baby Vibe",
    },
    twitter: { card: "summary_large_image", title, description },
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
      notesByAppId={data.notesByAppId}
      notesEnabled={data.notesEnabled}
      viewerUsername={viewerUsername}
    />
  );
}
