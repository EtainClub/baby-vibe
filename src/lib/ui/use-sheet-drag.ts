"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

interface UseSheetDragOptions {
  open: boolean;
  onDismiss: () => void;
}

interface DragState {
  pointerId: number;
  startY: number;
  startOffset: number;
  offset: number;
  lastY: number;
  lastTime: number;
  velocity: number;
}

function currentTranslateY(element: HTMLElement) {
  const transform = window.getComputedStyle(element).transform;
  if (!transform || transform === "none") return 0;

  try {
    return new DOMMatrixReadOnly(transform).m42;
  } catch {
    const values = transform.match(/matrix(?:3d)?\((.+)\)/)?.[1].split(",");
    return Number(values?.[values.length === 16 ? 13 : 5] ?? 0);
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useSheetDrag<T extends HTMLElement>({
  open,
  onDismiss,
}: UseSheetDragOptions) {
  const sheetRef = useRef<T>(null);
  const dragRef = useRef<DragState | null>(null);
  const dismissRef = useRef(onDismiss);
  const finishTimerRef = useRef<number | null>(null);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    sheet.style.removeProperty("transition");
    sheet.style.removeProperty("transform");
    sheet.style.removeProperty("will-change");

    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") dismissRef.current();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(
    () => () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
    },
    [],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    const sheet = sheetRef.current;
    if (!sheet || event.button !== 0) return;

    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    const offset = Math.max(0, currentTranslateY(sheet));
    sheet.style.transition = "none";
    sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
    sheet.style.willChange = "transform";
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: offset,
      offset,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const sheet = sheetRef.current;
    const drag = dragRef.current;
    if (!sheet || !drag || drag.pointerId !== event.pointerId) return;

    const rawOffset = drag.startOffset + event.clientY - drag.startY;
    const height = Math.max(sheet.getBoundingClientRect().height, 1);
    let offset = rawOffset;

    if (rawOffset < 0) {
      offset = -Math.min(12, Math.abs(rawOffset) * 0.12);
    } else if (rawOffset > height) {
      offset = height + (rawOffset - height) * 0.18;
    }

    const elapsed = Math.max(event.timeStamp - drag.lastTime, 1) / 1000;
    const instantVelocity = (event.clientY - drag.lastY) / elapsed;
    drag.velocity = drag.velocity * 0.7 + instantVelocity * 0.3;
    drag.offset = offset;
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;
    sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  function finishDrag(event: ReactPointerEvent<HTMLElement>, cancelled = false) {
    const sheet = sheetRef.current;
    const drag = dragRef.current;
    if (!sheet || !drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const height = Math.max(sheet.getBoundingClientRect().height, 1);
    const projectedOffset = drag.offset + Math.max(0, drag.velocity) * 0.18;
    const shouldDismiss =
      !cancelled &&
      (drag.offset > Math.min(170, height * 0.28) ||
        projectedOffset > height * 0.42 ||
        drag.velocity > 850);

    if (prefersReducedMotion()) {
      sheet.style.removeProperty("transition");
      sheet.style.removeProperty("transform");
      sheet.style.removeProperty("will-change");
      if (shouldDismiss) dismissRef.current();
      return;
    }

    if (shouldDismiss) {
      sheet.style.transition = "transform 240ms cubic-bezier(0.32, 0.72, 0, 1)";
      sheet.style.transform = `translate3d(0, ${height + 32}px, 0)`;
      finishTimerRef.current = window.setTimeout(() => {
        dismissRef.current();
        finishTimerRef.current = null;
        window.requestAnimationFrame(() => {
          sheet.style.removeProperty("transition");
          sheet.style.removeProperty("transform");
          sheet.style.removeProperty("will-change");
        });
      }, 220);
      return;
    }

    sheet.style.transition =
      "transform 420ms linear(0, 0.66 15%, 0.91 28%, 1.02 43%, 1.01 58%, 1)";
    sheet.style.transform = "translate3d(0, 0, 0)";
    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;
      sheet.style.removeProperty("transition");
      sheet.style.removeProperty("transform");
      sheet.style.removeProperty("will-change");
    }, 430);
  }

  return {
    sheetRef,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => finishDrag(event),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) =>
        finishDrag(event, true),
    },
  };
}
