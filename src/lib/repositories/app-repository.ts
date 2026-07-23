import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AppError } from "@/lib/errors";
import { getAdminDb } from "@/lib/firebase/admin";
import type {
  CreateAppInput,
  PublicVibeApp,
  UpdateAppInput,
  VibeApp,
} from "@/types/app";
import type { AppStats } from "@/types/stats";

const MAX_APPS_PER_USER = 20;

function toDate(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : new Date(0);
}

function mapApp(id: string, data: Record<string, unknown>): VibeApp {
  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    url: typeof data.url === "string" ? data.url : null,
    imageURL: typeof data.imageURL === "string" ? data.imageURL : null,
    faviconURL: typeof data.faviconURL === "string" ? data.faviconURL : null,
    tool: data.tool as VibeApp["tool"],
    customToolName:
      typeof data.customToolName === "string" ? data.customToolName : null,
    status: data.status as VibeApp["status"],
    isFirstApp: Boolean(data.isFirstApp),
    isPublished: Boolean(data.isPublished),
    sortOrder: Number(data.sortOrder ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapStats(appId: string, data?: Record<string, unknown>): AppStats {
  return {
    appId,
    ownerId: String(data?.ownerId ?? ""),
    outboundClicks: Number(data?.outboundClicks ?? 0),
    cheers: Number(data?.cheers ?? 0),
    firstClickedAt:
      data?.firstClickedAt instanceof Timestamp ? data.firstClickedAt.toDate() : null,
    lastClickedAt:
      data?.lastClickedAt instanceof Timestamp ? data.lastClickedAt.toDate() : null,
    firstCheeredAt:
      data?.firstCheeredAt instanceof Timestamp ? data.firstCheeredAt.toDate() : null,
    updatedAt: toDate(data?.updatedAt),
  };
}

export async function listAppsForOwner(uid: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collection("apps")
    .where("ownerId", "==", uid)
    .orderBy("sortOrder", "asc")
    .get();
  const apps = snapshot.docs.map((doc) => mapApp(doc.id, doc.data()));
  const statsSnapshots = apps.length
    ? await db.getAll(...apps.map((app) => db.collection("appStats").doc(app.id)))
    : [];
  const statsById = new Map(
    statsSnapshots.map((snapshot) => [
      snapshot.id,
      mapStats(snapshot.id, snapshot.data()),
    ]),
  );

  return apps.map((app) => ({
    ...app,
    stats: statsById.get(app.id) ?? mapStats(app.id),
  }));
}

export async function listPublicAppsForOwner(uid: string): Promise<PublicVibeApp[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("apps")
    .where("ownerId", "==", uid)
    .where("isPublished", "==", true)
    .orderBy("sortOrder", "asc")
    .get();
  const apps = snapshot.docs.map((doc) => mapApp(doc.id, doc.data()));
  const statsSnapshots = apps.length
    ? await db.getAll(...apps.map((app) => db.collection("appStats").doc(app.id)))
    : [];
  const statsById = new Map(statsSnapshots.map((doc) => [doc.id, doc.data()]));

  return apps.map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description,
    url: app.url,
    imageURL: app.imageURL,
    faviconURL: app.faviconURL,
    tool: app.tool,
    customToolName: app.customToolName,
    status: app.status,
    isFirstApp: app.isFirstApp,
    sortOrder: app.sortOrder,
    outboundClicks: Number(statsById.get(app.id)?.outboundClicks ?? 0),
    cheers: Number(statsById.get(app.id)?.cheers ?? 0),
  }));
}

export async function createApp(uid: string, input: CreateAppInput) {
  const db = getAdminDb();
  const appRef = db.collection("apps").doc();
  const statsRef = db.collection("appStats").doc(appRef.id);
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (transaction) => {
    const [profile, existingApps] = await Promise.all([
      transaction.get(userRef),
      transaction.get(db.collection("apps").where("ownerId", "==", uid)),
    ]);

    if (!profile.exists) {
      throw new AppError("profile_not_found", "프로필을 먼저 만들어 주세요.", 404);
    }
    if (existingApps.size >= MAX_APPS_PER_USER) {
      throw new AppError(
        "app_limit_reached",
        `첫 버전에서는 앱을 ${MAX_APPS_PER_USER}개까지 등록할 수 있어요.`,
        409,
      );
    }

    const now = FieldValue.serverTimestamp();
    const sortOrder = existingApps.docs.reduce(
      (largest, doc) => Math.max(largest, Number(doc.get("sortOrder") ?? -1)),
      -1,
    ) + 1;
    const isFirstApp = existingApps.empty;

    transaction.create(appRef, {
      ownerId: uid,
      ...input,
      imageURL: input.imageURL ?? null,
      faviconURL: input.faviconURL ?? null,
      customToolName: input.customToolName ?? null,
      isPublished: input.isPublished !== false,
      isFirstApp,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    transaction.create(statsRef, {
      appId: appRef.id,
      ownerId: uid,
      outboundClicks: 0,
      cheers: 0,
      firstClickedAt: null,
      lastClickedAt: null,
      firstCheeredAt: null,
      updatedAt: now,
    });
    if (isFirstApp) {
      transaction.update(userRef, {
        onboardingCompleted: true,
        updatedAt: now,
      });
    }
  });

  const snapshot = await appRef.get();
  return mapApp(snapshot.id, snapshot.data()!);
}

export async function updateApp(uid: string, appId: string, input: UpdateAppInput) {
  const db = getAdminDb();
  const ref = db.collection("apps").doc(appId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.get("ownerId") !== uid) {
      throw new AppError("app_not_found", "앱을 찾을 수 없어요.", 404);
    }

    const nextStatus = input.status ?? snapshot.get("status");
    const nextUrl = "url" in input ? input.url : snapshot.get("url");
    const nextTool = input.tool ?? snapshot.get("tool");
    const nextCustomToolName =
      "customToolName" in input
        ? input.customToolName
        : snapshot.get("customToolName");
    if (nextStatus === "live" && !nextUrl) {
      throw new AppError("invalid_app", "사용할 수 있는 앱에는 주소가 필요해요.");
    }
    if (nextTool === "other" && !nextCustomToolName) {
      throw new AppError("invalid_app", "기타 도구 이름을 입력해 주세요.");
    }
    if (nextTool !== "other" && nextCustomToolName) {
      throw new AppError(
        "invalid_app",
        "기타 도구 이름은 기타를 선택했을 때만 사용할 수 있어요.",
      );
    }

    transaction.update(ref, {
      ...input,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const updated = await ref.get();
  return mapApp(updated.id, updated.data()!);
}

export async function deleteApp(uid: string, appId: string) {
  const db = getAdminDb();
  const appRef = db.collection("apps").doc(appId);
  const snapshot = await appRef.get();
  if (!snapshot.exists || snapshot.get("ownerId") !== uid) {
    throw new AppError("app_not_found", "앱을 찾을 수 없어요.", 404);
  }

  const cheers = await db.collection("appCheers").where("appId", "==", appId).get();
  for (let index = 0; index < cheers.docs.length; index += 450) {
    const cheerBatch = db.batch();
    cheers.docs
      .slice(index, index + 450)
      .forEach((doc) => cheerBatch.delete(doc.ref));
    await cheerBatch.commit();
  }
  const appBatch = db.batch();
  appBatch.delete(appRef);
  appBatch.delete(db.collection("appStats").doc(appId));
  await appBatch.commit();
}

export async function reorderApps(uid: string, appIds: string[]) {
  if (!appIds.length || new Set(appIds).size !== appIds.length) {
    throw new AppError("invalid_order", "앱 순서를 확인해 주세요.");
  }

  const db = getAdminDb();
  const ownerApps = await db
    .collection("apps")
    .where("ownerId", "==", uid)
    .get();
  const ownerAppIds = new Set(ownerApps.docs.map((doc) => doc.id));
  if (
    ownerAppIds.size !== appIds.length ||
    appIds.some((appId) => !ownerAppIds.has(appId))
  ) {
    throw new AppError(
      "invalid_order",
      "내 앱 전체가 포함된 순서만 저장할 수 있어요.",
      409,
    );
  }

  const refs = appIds.map((id) => db.collection("apps").doc(id));
  const snapshots = await db.getAll(...refs);
  if (
    snapshots.some(
      (snapshot) => !snapshot.exists || snapshot.get("ownerId") !== uid,
    )
  ) {
    throw new AppError("invalid_order", "순서를 바꿀 수 없는 앱이 포함되어 있어요.", 403);
  }

  const batch = db.batch();
  refs.forEach((ref, index) => {
    batch.update(ref, {
      sortOrder: index,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}
