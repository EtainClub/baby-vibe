import "server-only";

import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { AppError } from "@/lib/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import type { CreateAppNoteInput, PublicAppNote } from "@/types/app-note";

const MAX_PUBLIC_NOTES_PER_APP = 20;

function mapPublicNote(id: string, data: Record<string, unknown>): PublicAppNote {
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(0);

  return {
    id: createHash("sha256").update(id).digest("hex").slice(0, 16),
    authorUsername: String(data.authorUsername ?? ""),
    authorDisplayName: String(data.authorDisplayName ?? ""),
    authorPhotoURL:
      typeof data.authorPhotoURL === "string" ? data.authorPhotoURL : null,
    message: String(data.message ?? ""),
    createdAt: createdAt.toISOString(),
  };
}

// Firestore caps an `in` filter at 30 values.
const MAX_IN_FILTER_VALUES = 30;

/**
 * Notes for a whole profile.
 *
 * This used to issue one subcollection query per app, so a maker with 50 apps
 * cost 50 Firestore round trips to render one page. A collection-group query
 * over `notes` does it in ceil(apps / 30).
 */
export async function listPublicAppNotes(appIds: string[]) {
  if (!appIds.length) return {} as Record<string, PublicAppNote[]>;

  const db = getAdminDb();
  const chunks: string[][] = [];
  for (let index = 0; index < appIds.length; index += MAX_IN_FILTER_VALUES) {
    chunks.push(appIds.slice(index, index + MAX_IN_FILTER_VALUES));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      db
        .collectionGroup("notes")
        .where("appId", "in", chunk)
        .orderBy("createdAt", "desc")
        .limit(MAX_PUBLIC_NOTES_PER_APP * chunk.length)
        .get(),
    ),
  );

  const notesByAppId = Object.fromEntries(
    appIds.map((appId) => [appId, [] as PublicAppNote[]]),
  ) as Record<string, PublicAppNote[]>;

  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      const appId = String(doc.get("appId") ?? "");
      const notes = notesByAppId[appId];
      // The per-app cap has to be applied here: the query limit is shared
      // across the whole chunk, so one loud app could otherwise crowd out
      // every other app in it.
      if (notes && notes.length < MAX_PUBLIC_NOTES_PER_APP) {
        notes.push(mapPublicNote(doc.id, doc.data()));
      }
    }
  }

  return notesByAppId;
}

export async function createAppNote(
  uid: string,
  appId: string,
  input: CreateAppNoteInput,
) {
  const db = getAdminDb();
  const appRef = db.collection("apps").doc(appId);
  const profileRef = db.collection("users").doc(uid);
  const noteRef = appRef.collection("notes").doc(uid);

  return db.runTransaction(async (transaction) => {
    const [app, profile, existingNote] = await Promise.all([
      transaction.get(appRef),
      transaction.get(profileRef),
      transaction.get(noteRef),
    ]);

    if (!app.exists || !app.get("isPublished")) {
      throw new AppError("app_not_found", "공개된 앱을 찾을 수 없어요.", 404);
    }
    if (app.get("ownerId") === uid) {
      throw new AppError(
        "own_app_note",
        "내 앱이 아닌 다른 사람의 앱에 메모를 남겨 주세요.",
        403,
      );
    }
    if (!profile.exists) {
      throw new AppError("profile_not_found", "프로필을 먼저 만들어 주세요.", 404);
    }
    if (existingNote.exists) {
      throw new AppError(
        "note_exists",
        "이 앱에는 이미 메모를 남겼어요.",
        409,
      );
    }

    const createdAt = Timestamp.now();
    const note: PublicAppNote = {
      id: createHash("sha256").update(uid).digest("hex").slice(0, 16),
      authorUsername: String(profile.get("username") ?? ""),
      authorDisplayName: String(profile.get("displayName") ?? ""),
      authorPhotoURL:
        typeof profile.get("photoURL") === "string" ? profile.get("photoURL") : null,
      message: input.message,
      createdAt: createdAt.toDate().toISOString(),
    };

    transaction.create(noteRef, {
      appId,
      authorId: uid,
      authorUsername: note.authorUsername,
      authorDisplayName: note.authorDisplayName,
      authorPhotoURL: note.authorPhotoURL,
      message: note.message,
      createdAt,
    });

    return note;
  });
}
