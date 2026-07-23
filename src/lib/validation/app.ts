import { AppError } from "@/lib/errors";
import {
  APP_STATUSES,
  VIBE_TOOLS,
  type AppStatus,
  type CreateAppInput,
  type UpdateAppInput,
  type VibeTool,
} from "@/types/app";

function cleanText(
  value: unknown,
  field: string,
  maxLength: number,
  required: boolean,
) {
  if (typeof value !== "string") {
    if (!required) return undefined;
    throw new AppError("invalid_app", `${field}을 입력해 주세요.`);
  }
  const text = value.trim();
  if (required && !text) {
    throw new AppError("invalid_app", `${field}을 입력해 주세요.`);
  }
  if (text.length > maxLength) {
    throw new AppError("invalid_app", `${field}은 ${maxLength}자 이하로 입력해 주세요.`);
  }
  return text;
}

function cleanURL(value: unknown, required: boolean) {
  if (value === null || value === undefined || value === "") {
    if (required) {
      throw new AppError("invalid_app", "사용할 수 있는 앱 주소를 입력해 주세요.");
    }
    return null;
  }
  if (typeof value !== "string" || value.length > 2048) {
    throw new AppError("invalid_app", "앱 주소가 올바르지 않아요.");
  }

  try {
    const url = new URL(value);
    if (url.username || url.password) throw new Error("credentials not allowed");
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
      throw new Error("https required");
    }
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("invalid protocol");
    url.hash = "";
    return url.toString();
  } catch {
    throw new AppError("invalid_app", "앱 주소가 올바르지 않아요.");
  }
}

function cleanTool(value: unknown): VibeTool {
  if (typeof value !== "string" || !VIBE_TOOLS.includes(value as VibeTool)) {
    throw new AppError("invalid_app", "앱을 만든 도구를 선택해 주세요.");
  }
  return value as VibeTool;
}

function cleanStatus(value: unknown): AppStatus {
  if (typeof value !== "string" || !APP_STATUSES.includes(value as AppStatus)) {
    throw new AppError("invalid_app", "앱의 현재 상태를 선택해 주세요.");
  }
  return value as AppStatus;
}

function cleanImageURL(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) {
    throw new AppError("invalid_app", "이미지 주소가 올바르지 않아요.");
  }
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("invalid protocol");
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("https required");
    }
    return url.toString();
  } catch {
    throw new AppError("invalid_app", "이미지 주소가 올바르지 않아요.");
  }
}

export function validateCreateAppInput(value: unknown): CreateAppInput {
  if (!value || typeof value !== "object") {
    throw new AppError("invalid_app", "앱 정보를 확인해 주세요.");
  }
  const input = value as Record<string, unknown>;
  const status = cleanStatus(input.status);
  const tool = cleanTool(input.tool);
  const customToolName =
    tool === "other"
      ? cleanText(input.customToolName, "도구 이름", 30, true)!
      : null;

  return {
    name: cleanText(input.name, "앱 이름", 50, true)!,
    description: cleanText(input.description, "앱 설명", 140, false) ?? "",
    url: cleanURL(input.url, status === "live"),
    imageURL: cleanImageURL(input.imageURL),
    faviconURL: cleanImageURL(input.faviconURL),
    tool,
    customToolName,
    status,
    isPublished: input.isPublished !== false,
  };
}

export function validateUpdateAppInput(value: unknown): UpdateAppInput {
  if (!value || typeof value !== "object") {
    throw new AppError("invalid_app", "앱 정보를 확인해 주세요.");
  }
  const input = value as Record<string, unknown>;
  const result: UpdateAppInput = {};

  if ("name" in input) result.name = cleanText(input.name, "앱 이름", 50, true)!;
  if ("description" in input) {
    result.description = cleanText(input.description, "앱 설명", 140, false) ?? "";
  }
  if ("url" in input) result.url = cleanURL(input.url, false);
  if ("imageURL" in input) result.imageURL = cleanImageURL(input.imageURL);
  if ("faviconURL" in input) result.faviconURL = cleanImageURL(input.faviconURL);
  if ("tool" in input) result.tool = cleanTool(input.tool);
  if ("customToolName" in input) {
    result.customToolName =
      cleanText(input.customToolName, "도구 이름", 30, false) ?? null;
  }
  if ("status" in input) result.status = cleanStatus(input.status);
  if ("isPublished" in input) {
    if (typeof input.isPublished !== "boolean") {
      throw new AppError("invalid_app", "앱 공개 여부를 확인해 주세요.");
    }
    result.isPublished = input.isPublished;
  }

  if (!Object.keys(result).length) {
    throw new AppError("invalid_app", "수정할 앱 정보가 없어요.");
  }
  if (result.status === "live" && result.url === null) {
    throw new AppError("invalid_app", "사용할 수 있는 앱에는 주소가 필요해요.");
  }

  return result;
}
