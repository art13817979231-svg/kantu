import type { ImageGroup } from "../types/project";
import { isClusterGroup } from "./groupUtils";

export type FrameColorPreset = {
  id: string;
  label: string;
  stroke: string;
  fill: string;
};

export const FRAME_COLOR_PRESETS: FrameColorPreset[] = [
  {
    id: "blue",
    label: "蓝色",
    stroke: "#4a9eff",
    fill: "rgba(74, 158, 255, 0.08)",
  },
  {
    id: "purple",
    label: "紫色",
    stroke: "#a78bfa",
    fill: "rgba(167, 139, 250, 0.1)",
  },
  {
    id: "green",
    label: "绿色",
    stroke: "#6ee7b7",
    fill: "rgba(110, 231, 183, 0.08)",
  },
  {
    id: "amber",
    label: "橙色",
    stroke: "#fbbf24",
    fill: "rgba(251, 191, 36, 0.1)",
  },
  {
    id: "red",
    label: "红色",
    stroke: "#f87171",
    fill: "rgba(248, 113, 113, 0.08)",
  },
  {
    id: "cyan",
    label: "青色",
    stroke: "#22d3ee",
    fill: "rgba(34, 211, 238, 0.08)",
  },
  {
    id: "white",
    label: "白色",
    stroke: "rgba(255, 255, 255, 0.55)",
    fill: "rgba(255, 255, 255, 0.04)",
  },
  {
    id: "clear",
    label: "透明",
    stroke: "rgba(255, 255, 255, 0.35)",
    fill: "rgba(0, 0, 0, 0)",
  },
];

const CLUSTER_STROKE = "#8ab4f8";
const CLUSTER_STROKE_SELECTED = "#b8d4ff";
const CLUSTER_FILL = "rgba(138, 180, 248, 0.07)";
const FRAME_STROKE = "#4a9eff";
const FRAME_STROKE_SELECTED = "#6eb1ff";
const FRAME_FILL = "rgba(74, 158, 255, 0.05)";

export function resolveFrameStyle(
  frame: Pick<ImageGroup, "kind" | "strokeColor" | "fillColor">,
  selected: boolean,
): { stroke: string; fill: string; label: string } {
  if (frame.strokeColor) {
    return {
      stroke: frame.strokeColor,
      fill: frame.fillColor ?? "rgba(0, 0, 0, 0)",
      label: frame.strokeColor,
    };
  }
  if (isClusterGroup(frame as ImageGroup)) {
    return {
      stroke: selected ? CLUSTER_STROKE_SELECTED : CLUSTER_STROKE,
      fill: CLUSTER_FILL,
      label: CLUSTER_STROKE,
    };
  }
  return {
    stroke: selected ? FRAME_STROKE_SELECTED : FRAME_STROKE,
    fill: FRAME_FILL,
    label: "#aaa",
  };
}
