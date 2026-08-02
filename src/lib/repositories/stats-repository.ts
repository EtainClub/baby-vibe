import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { AppError } from "@/lib/errors";
import { getAdminDb } from "@/lib/firebase/admin";

function getReactionHash(appId: string, visitorId: string) {
  return createHash("sha256").update(`${appId}:${visitorId}`).digest("hex");
}

export async function recordOutboundClick(appId: string) {
  const db = getAdminDb();
  const appRef = db.collection("apps").doc(appId);
  const statsRef = db.collection("appStats").doc(appId);

  return db.runTransaction(async (transaction) => {
    const [app, stats] = await Promise.all([
      transaction.get(appRef),
      transaction.get(statsRef),
    ]);

    if (!app.exists || !app.get("isPublished")) {
      throw new AppError("app_not_found", "공개된 앱을 찾을 수 없어요.", 404);
    }
    const url = app.get("url");
    if (typeof url !== "string") {
      throw new AppError("app_has_no_url", "아직 열 수 있는 앱 주소가 없어요.", 409);
    }

    const now = FieldValue.serverTimestamp();
    if (stats.exists) {
      transaction.update(statsRef, {
        outboundClicks: FieldValue.increment(1),
        firstClickedAt: stats.get("firstClickedAt") ?? now,
        lastClickedAt: now,
        updatedAt: now,
      });
    } else {
      transaction.create(statsRef, {
        appId,
        ownerId: app.get("ownerId"),
        outboundClicks: 1,
        cheers: 0,
        firstClickedAt: now,
        lastClickedAt: now,
        firstCheeredAt: null,
        updatedAt: now,
      });
    }
    return url;
  });
}

export async function cheerApp(appId: string, visitorId: string) {
  const db = getAdminDb();
  const visitorHash = createHash("sha256").update(visitorId).digest("hex");
  const reactionHash = getReactionHash(appId, visitorId);
  const cheerRef = db.collection("appCheers").doc(reactionHash);
  const appRef = db.collection("apps").doc(appId);
  const statsRef = db.collection("appStats").doc(appId);

  return db.runTransaction(async (transaction) => {
    const [app, cheer, stats] = await Promise.all([
      transaction.get(appRef),
      transaction.get(cheerRef),
      transaction.get(statsRef),
    ]);

    if (!app.exists || !app.get("isPublished")) {
      throw new AppError("app_not_found", "공개된 앱을 찾을 수 없어요.", 404);
    }
    if (cheer.exists) {
      return {
        created: false,
        cheers: Number(stats.get("cheers") ?? 0),
      };
    }

    const now = FieldValue.serverTimestamp();
    transaction.create(cheerRef, {
      appId,
      visitorHash,
      createdAt: now,
    });
    if (stats.exists) {
      transaction.update(statsRef, {
        cheers: FieldValue.increment(1),
        firstCheeredAt: stats.get("firstCheeredAt") ?? now,
        updatedAt: now,
      });
    } else {
      transaction.create(statsRef, {
        appId,
        ownerId: app.get("ownerId"),
        outboundClicks: 0,
        cheers: 1,
        firstClickedAt: null,
        lastClickedAt: null,
        firstCheeredAt: now,
        updatedAt: now,
      });
    }

    return {
      created: true,
      cheers: Number(stats.get("cheers") ?? 0) + 1,
    };
  });
}

export async function getAppCheerState(appId: string, visitorId: string | null) {
  const db = getAdminDb();
  const statsRef = db.collection("appStats").doc(appId);

  if (!visitorId) {
    const stats = await statsRef.get();
    return { cheered: false, cheers: Number(stats.get("cheers") ?? 0) };
  }

  const cheerRef = db.collection("appCheers").doc(getReactionHash(appId, visitorId));
  const [stats, cheer] = await db.getAll(statsRef, cheerRef);
  return {
    cheered: cheer.exists,
    cheers: Number(stats.get("cheers") ?? 0),
  };
}
