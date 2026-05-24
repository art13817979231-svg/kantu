import type { ColorMarkId } from "../types/project";

export type ColorMarkPreset = {
  id: ColorMarkId;
  label: string;
  hex: string;
};

/** 预设色标（PRD 确认：以预设为主，非自由 tag） */
export const COLOR_MARK_PRESETS: ColorMarkPreset[] = [
  { id: "none", label: "无", hex: "#55555e" },
  { id: "red", label: "红", hex: "#e85d5d" },
  { id: "orange", label: "橙", hex: "#f0ad4e" },
  { id: "yellow", label: "黄", hex: "#e6d85c" },
  { id: "green", label: "绿", hex: "#5cb85c" },
  { id: "blue", label: "蓝", hex: "#4a9eff" },
  { id: "purple", label: "紫", hex: "#9b6dd7" },
];

export function getColorMarkHex(id: ColorMarkId): string {
  return COLOR_MARK_PRESETS.find((p) => p.id === id)?.hex ?? "#55555e";
}
