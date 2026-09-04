import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AppError } from "@/lib/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  CreateProfileInput,
  PublicUserProfile,
  UpdateProfileInput,
  UserProfile,
} from "@/types/user";

function toDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : new Date(0);
}

function mapUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    username: String(data.username ?? ""),
    displayName: String(data.displayName ?? ""),
    bio: String(data.bio ?? ""),
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    onboardingCompleted: Boolean(data.onboardingCompleted),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getUserProfileByUid(uid: string) {
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  if (!snapshot.exists) return null;
  return mapUserProfile(snapshot.id, snapshot.data()!);
}

export const PUBLIC_PROFILE_PAGE_SIZE = 24;

/**
 * A page of makers, newest first.
 *
 * This used to read the first 100 user documents in whatever order Firestore
 * returned them and sort in memory, so maker 101 was simply unreachable — and
 * which 100 you got was arbitrary. The cursor is the last profile's
 * `createdAt` as an ISO string.
 */
export async function listPublicProfiles({
  limit = PUBLIC_PROFILE_PAGE_SIZE,
  cursor = null,
}: { limit?: number; cursor?: string | null } = {}): Promise<{
  people: PublicUserProfile[];
  nextCursor: string | null;
}> {
  let query = getAdminDb()
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(limit + 1);

  const startAfter = cursor ? new Date(cursor) : null;
  if (startAfter && !Number.isNaN(startAfter.getTime())) {
    query = query.startAfter(Timestamp.fromDate(startAfter));
  }

  const snapshot = await query.get();
  const profiles = snapshot.docs.map((doc) =>
    mapUserProfile(doc.id, doc.data()),
  );
  const hasMore = profiles.length > limit;
  const page = profiles.slice(0, limit);

  return {
    people: page
      .filter((profile) => profile.username && profile.displayName)
      .map(({ username, displayName, bio, photoURL }) => ({
        username,
        displayName,
        bio,
        photoURL,
      })),
    // Paginate on the raw page, not the filtered one: a page that is entirely
    // incomplete profiles still has to advance the cursor.
    nextCursor:
      hasMore && page.length
        ? page[page.length - 1].createdAt.toISOString()
        : null,
  };
}

export async function getPublicProfileByUsername(
  username: string,
): Promise<(PublicUserProfile & { uid: string }) | null> {
  const db = getAdminDb();
  const mapping = await db.collection("usernames").doc(username).get();
  if (!mapping.exists) return null;

  const uid = mapping.get("uid");
  if (typeof uid !== "string") return null;

  const profile = await db.collection("users").doc(uid).get();
  if (!profile.exists) return null;
  const data = profile.data()!;

  return {
    uid,
    username: String(data.username ?? username),
    displayName: String(data.displayName ?? ""),
    bio: String(data.bio ?? ""),
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
  };
}

export async function isUsernameAvailable(username: string, uid?: string) {
  const snapshot = await getAdminDb().collection("usernames").doc(username).get();
  if (!snapshot.exists) return true;
  return Boolean(uid && snapshot.get("uid") === uid);
}

export async function createUserProfile(
  uid: string,
  input: CreateProfileInput,
): Promise<UserProfile> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const usernameRef = db.collection("usernames").doc(input.username);

  await db.runTransaction(async (transaction) => {
    const [existingUser, existingUsername] = await Promise.all([
      transaction.get(userRef),
      transaction.get(usernameRef),
    ]);

    if (existingUser.exists) {
      throw new AppError("profile_exists", "이미 프로필을 만들었어요.", 409);
    }
    if (existingUsername.exists) {
      throw new AppError("username_taken", "이미 사용 중인 사용자명이에요.", 409);
    }

    const now = FieldValue.serverTimestamp();
    transaction.create(usernameRef, { uid, createdAt: now });
    transaction.create(userRef, {
      uid,
      username: input.username,
      displayName: input.displayName,
      bio: input.bio,
      photoURL: input.photoURL ?? null,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  const created = await getUserProfileByUid(uid);
  if (!created) throw new AppError("profile_create_failed", "프로필을 만들지 못했어요.", 500);
  return created;
}

export async function updateUserProfile(uid: string, input: UpdateProfileInput) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const snapshot = await userRef.get();
  if (!snapshot.exists) {
    throw new AppError("profile_not_found", "프로필을 먼저 만들어 주세요.", 404);
  }

  await userRef.update({
    ...input,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return getUserProfileByUid(uid);
}

export async function markOnboardingCompleted(uid: string) {
  const ref = getAdminDb().collection("users").doc(uid);
  await ref.update({
    onboardingCompleted: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
