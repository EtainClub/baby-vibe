"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import type { PublicAppNote } from "@/types/app-note";

const COLLAPSED_NOTE_COUNT = 2;
const MAX_NOTE_LENGTH = 120;

export function AppNotes({
  appId,
  initialNotes,
  viewerUsername,
  canWrite,
  showLoginPrompt,
}: {
  appId: string;
  initialNotes: PublicAppNote[];
  viewerUsername: string | null;
  canWrite: boolean;
  showLoginPrompt: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const hasOwnNote = Boolean(
    viewerUsername && notes.some((note) => note.authorUsername === viewerUsername),
  );
  const visibleNotes = expanded ? notes : notes.slice(0, COLLAPSED_NOTE_COUNT);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !draft.trim()) return;

    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/apps/${encodeURIComponent(appId)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: draft }),
      });
      const result = (await response.json().catch(() => null)) as {
        data?: PublicAppNote;
        error?: { message?: string };
      } | null;

      if (!response.ok || !result?.data) {
        setError(result?.error?.message || "메모를 남기지 못했어요. 다시 시도해 주세요.");
        return;
      }

      setNotes((current) => [result.data!, ...current]);
      setDraft("");
    } catch {
      setError("연결이 불안정해요. 잠시 뒤에 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="app-notes" aria-label="앱 공개 메모">
      <div className="app-notes-heading">
        <strong>한 줄 메모</strong>
        <span>{notes.length}개</span>
      </div>

      {notes.length > 0 ? (
        <div className="app-note-list">
          {visibleNotes.map((note) => (
            <article className="app-note" key={note.id}>
              <Link
                className="app-note-avatar"
                href={`/${note.authorUsername}`}
                aria-label={`${note.authorDisplayName}님의 페이지`}
                style={
                  note.authorPhotoURL
                    ? {
                        backgroundImage: `url("${note.authorPhotoURL.replace(/["\\]/g, "")}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        color: "transparent",
                      }
                    : undefined
                }
              >
                {note.authorDisplayName.charAt(0).toUpperCase() || "?"}
              </Link>
              <div>
                <Link href={`/${note.authorUsername}`}>{note.authorDisplayName}</Link>
                <p>{note.message}</p>
              </div>
            </article>
          ))}
          {notes.length > COLLAPSED_NOTE_COUNT ? (
            <button
              className="app-notes-more"
              type="button"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "접기" : `메모 ${notes.length}개 모두 보기`}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="app-notes-empty">아직 메모가 없어요. 첫 마음을 남겨보세요.</p>
      )}

      {canWrite && !hasOwnNote ? (
        <form className="app-note-form" onSubmit={submitNote}>
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
            }}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="좋았던 점이나 응원을 짧게 남겨주세요"
            aria-label="앱에 남길 메모"
            required
          />
          <button type="submit" disabled={pending || !draft.trim()}>
            {pending ? "저장 중…" : "남기기"}
          </button>
        </form>
      ) : null}

      {canWrite && hasOwnNote ? (
        <p className="app-note-complete">이 앱에 메모를 남겼어요.</p>
      ) : null}

      {showLoginPrompt ? (
        <Link className="app-note-login" href="/login">
          로그인하고 메모 남기기
        </Link>
      ) : null}

      {error ? (
        <p className="app-note-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
