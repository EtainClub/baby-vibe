import type { Metadata } from "next";
import { Suspense } from "react";
import PublicProfileClient from "@/components/public-profile-client";

export const metadata: Metadata = {
  title: "메이커 페이지",
};

/**
 * Client-rendered public profile.
 *
 * `/[username]` is a dynamic segment with no `generateStaticParams`, so it
 * cannot exist in the Apps in Toss static export. Inside Toss every profile
 * link points here instead and the data is fetched over the API.
 */
export default function PublicProfileRoute() {
  return (
    <Suspense fallback={null}>
      <PublicProfileClient />
    </Suspense>
  );
}
