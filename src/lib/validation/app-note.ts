import { AppError } from "@/lib/errors";
import type { CreateAppNoteInput } from "@/types/app-note";

const MAX_NOTE_LENGTH = 120;

export function validateCreateAppNoteInput(value: unknown): CreateAppNoteInput {
  if (!value || typeof value !== "object") {
    throw new AppError("invalid_note", "메모 내용을 확인해 주세요.");
  }

  const messageValue = (value as Record<string, unknown>).message;
  if (typeof messageValue !== "string") {
    throw new AppError("invalid_note", "메모를 입력해 주세요.");
  }

  const message = messageValue.replace(/\s+/g, " ").trim();
  if (!message) {
    throw new AppError("invalid_note", "메모를 입력해 주세요.");
  }
  if (message.length > MAX_NOTE_LENGTH) {
    throw new AppError(
      "invalid_note",
      `메모는 ${MAX_NOTE_LENGTH}자 이하로 입력해 주세요.`,
    );
  }

  return { message };
}
