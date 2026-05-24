import type { CSSProperties } from "react";
import type { CanvasBackground } from "../types/project";

export type BackgroundOption = {
  id: CanvasBackground;
  label: string;
  preview: string;
};

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: "dots-dark", label: "深点阵", preview: "#2e2e34" },
  { id: "dots-light", label: "浅点阵", preview: "#e8e8ec" },
  { id: "checker", label: "棋盘格", preview: "checker" },
  { id: "solid", label: "纯色", preview: "#2e2e34" },
];

export const SOLID_PRESETS = [
  "#141418",
  "#2e2e34",
  "#1a2838",
  "#3d2b1f",
  "#ffffff",
  "#888890",
];

export function getCanvasWrapClass(bg: CanvasBackground): string {
  return `canvas-wrap bg-${bg}`;
}

export function getCanvasWrapStyle(
  bg: CanvasBackground,
  solidColor?: string,
): CSSProperties {
  if (bg === "solid" && solidColor) {
    return { background: solidColor, backgroundImage: "none" };
  }
  return {};
}
