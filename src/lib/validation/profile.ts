import { AppError } from "@/lib/errors";
import type { CreateProfileInput, UpdateProfileInput } from "@/types/user";
import { validateUsername } from "@/lib/validation/username";

function cleanText(value: unknown, field: string, maxLength: number, required: boolean) {
  if (typeof value !== "string") {
    if (!required) return undefined;
    throw new AppError("invalid_profile", `${field}을 입력해 주세요.`);
  }

  const text = value.trim();
  if (required && !text) {
    throw new AppError("invalid_profile", `${field}을 입력해 주세요.`);
  }
  if (text.length > maxLength) {
    throw new AppError(
      "invalid_profile",
      `${field}은 ${maxLength}자 이하로 입력해 주세요.`,
    );
  }
  return text;
}

function cleanPhotoURL(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new AppError("invalid_profile", "프로필 이미지 주소가 올바르지 않아요.");
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("invalid protocol");
    return url.toString();
  } catch {
    throw new AppError("invalid_profile", "프로필 이미지 주소가 올바르지 않아요.");
  }
}

export function validateCreateProfileInput(value: unknown): CreateProfileInput {
  if (!value || typeof value !== "object") {
    throw new AppError("invalid_profile", "프로필 정보를 확인해 주세요.");
  }
  const input = value as Record<string, unknown>;

  return {
    username: validateUsername(input.username),
    displayName: cleanText(input.displayName, "표시 이름", 40, true)!,
    bio: cleanText(input.bio, "한 줄 소개", 120, false) ?? "",
    photoURL: cleanPhotoURL(input.photoURL),
  };
}

export function validateUpdateProfileInput(value: unknown): UpdateProfileInput {
  if (!value || typeof value !== "object") {
    throw new AppError("invalid_profile", "프로필 정보를 확인해 주세요.");
  }
  const input = value as Record<string, unknown>;
  const result: UpdateProfileInput = {};

  if ("displayName" in input) {
    result.displayName = cleanText(input.displayName, "표시 이름", 40, true)!;
  }
  if ("bio" in input) {
    result.bio = cleanText(input.bio, "한 줄 소개", 120, false) ?? "";
  }
  if ("photoURL" in input) {
    result.photoURL = cleanPhotoURL(input.photoURL);
  }

  if (!Object.keys(result).length) {
    throw new AppError("invalid_profile", "수정할 프로필 정보가 없어요.");
  }

  return result;
}
