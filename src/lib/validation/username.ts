import { AppError } from "@/lib/errors";
import { RESERVED_USERNAMES } from "@/lib/utils/reserved-usernames";

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])?$/;

export function normalizeUsername(value: unknown) {
  if (typeof value !== "string") {
    throw new AppError("invalid_username", "사용자명을 입력해 주세요.");
  }

  return value.trim().toLowerCase();
}

export function validateUsername(value: unknown) {
  const username = normalizeUsername(value);

  if (username.length < 3 || username.length > 24) {
    throw new AppError(
      "invalid_username",
      "사용자명은 3자 이상 24자 이하로 입력해 주세요.",
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new AppError(
      "invalid_username",
      "영문 소문자, 숫자, 하이픈만 사용할 수 있어요.",
    );
  }

  if (RESERVED_USERNAMES.has(username)) {
    throw new AppError("reserved_username", "사용할 수 없는 사용자명이에요.");
  }

  return username;
}
