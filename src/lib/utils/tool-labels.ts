import type { VibeTool } from "@/types/app";

export const TOOL_LABELS: Record<VibeTool, string> = {
  codex: "Codex",
  "claude-code": "Claude Code",
  gemini: "Gemini",
  lovable: "Lovable",
  bolt: "Bolt",
  replit: "Replit",
  v0: "v0",
  base44: "Base44",
  cursor: "Cursor",
  "firebase-studio": "Firebase Studio",
  other: "기타",
};

export type ToolTone = "blue" | "pink" | "orange";

const TOOL_TONES: Record<VibeTool, ToolTone> = {
  codex: "blue",
  "claude-code": "blue",
  gemini: "pink",
  lovable: "pink",
  bolt: "orange",
  replit: "orange",
  v0: "orange",
  base44: "pink",
  cursor: "blue",
  "firebase-studio": "orange",
  other: "pink",
};

const TOOL_BY_LABEL = new Map(
  Object.entries(TOOL_LABELS).map(([tool, label]) => [
    label.toLowerCase(),
    tool as VibeTool,
  ]),
);

export function getToolTone(tool: VibeTool, customToolName?: string | null) {
  const resolvedTool =
    tool === "other" && customToolName
      ? (TOOL_BY_LABEL.get(customToolName.trim().toLowerCase()) ?? tool)
      : tool;
  return TOOL_TONES[resolvedTool];
}
