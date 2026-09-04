"use client";

import { useEffect, useId, useRef } from "react";
import { useSheetDrag } from "@/lib/ui/use-sheet-drag";

export interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Bottom-sheet confirmation, in place of `window.confirm`.
 *
 * The native dialog is unstyled, breaks the sheet language the rest of the app
 * speaks, and inside the Toss webview it fights the system back-swipe.
 */
export function ConfirmSheet({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  const open = request !== null;
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { sheetRef, dragHandleProps } = useSheetDrag<HTMLElement>({
    open,
    onDismiss: onClose,
  });

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  return (
    <>
      <div
        className={`sheet-scrim${open ? " is-visible" : ""}`}
        onClick={onClose}
      />
      <section
        ref={sheetRef}
        className={`add-app-sheet confirm-sheet${open ? " is-visible" : ""}`}
        role="alertdialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-labelledby={titleId}
      >
        <div className="sheet-handle" aria-hidden="true" {...dragHandleProps} />
        <div className="sheet-heading">
          <div>
            <h2 id={titleId}>{request?.title}</h2>
            {request?.description && <p>{request.description}</p>}
          </div>
        </div>
        <div className="confirm-sheet-actions">
          <button
            className="button button-quiet"
            type="button"
            onClick={onClose}
          >
            {request?.cancelLabel ?? "취소"}
          </button>
          <button
            ref={confirmRef}
            className={
              request?.destructive
                ? "button confirm-sheet-destructive"
                : "button button-primary"
            }
            type="button"
            onClick={() => {
              request?.onConfirm();
              onClose();
            }}
          >
            {request?.confirmLabel}
          </button>
        </div>
      </section>
    </>
  );
}
