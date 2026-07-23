"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { AppError } from "@/lib/errors";
import { getFirebaseClientServices } from "@/lib/firebase/client";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 1600;
// Any browser-decodable image is accepted; toWebp re-encodes it to WebP.

async function toWebp(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new AppError("invalid_image", "이미지 파일을 선택해 주세요.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new AppError("image_too_large", "이미지는 5MB 이하로 선택해 주세요.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new AppError("image_failed", "이미지를 처리하지 못했어요.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob) throw new AppError("image_failed", "이미지를 처리하지 못했어요.");
  return blob;
}

export async function uploadProfileImage(file: File) {
  const services = getFirebaseClientServices();
  const uid = services?.auth.currentUser?.uid;
  if (!services || !uid) throw new AppError("unauthorized", "로그인이 필요해요.", 401);

  const blob = await toWebp(file);
  const imageRef = ref(services.storage, `users/${uid}/profile/avatar.webp`);
  await uploadBytes(imageRef, blob, {
    contentType: "image/webp",
    cacheControl: "public,max-age=3600",
  });
  const url = await getDownloadURL(imageRef);
  return `${url}&_v=${Date.now()}`;
}

export async function uploadAppCover(file: File, appId: string) {
  const services = getFirebaseClientServices();
  const uid = services?.auth.currentUser?.uid;
  if (!services || !uid) throw new AppError("unauthorized", "로그인이 필요해요.", 401);
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(appId)) {
    throw new AppError("invalid_app", "앱 정보를 확인해 주세요.");
  }

  const blob = await toWebp(file);
  const imageRef = ref(services.storage, `users/${uid}/apps/${appId}/cover.webp`);
  await uploadBytes(imageRef, blob, {
    contentType: "image/webp",
    cacheControl: "public,max-age=3600",
  });
  const url = await getDownloadURL(imageRef);
  return `${url}&_v=${Date.now()}`;
}
