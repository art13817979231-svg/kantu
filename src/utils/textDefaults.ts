import { v4 as uuidv4 } from "uuid";
import type { TextItem } from "../types/project";
import { DEFAULT_BOARD_ID } from "../types/project";
import { measureTextBox } from "./measureTextBox";

export const DEFAULT_TEXT = "输入标注…";
export const DEFAULT_TEXT_FONT_SIZE = 24;
export const DEFAULT_TEXT_BACKGROUND = "rgba(18, 18, 24, 0.72)";
export const TEXT_CORNER_RADIUS = 10;

export type TextBackgroundPreset = {
  id: string;
  label: string;
  color: string;
  /** 切换背景时建议的文字颜色 */
  textFill?: string;
};

export const TEXT_BG_PRESETS: TextBackgroundPreset[] = [
  {
    id: "dark",
    label: "深色",
    color: DEFAULT_TEXT_BACKGROUND,
    textFill: "#f0f0f5",
  },
  {
    id: "black",
    label: "黑色",
    color: "rgba(0, 0, 0, 0.78)",
    textFill: "#f0f0f5",
  },
  {
    id: "white",
    label: "白色",
    color: "rgba(255, 255, 255, 0.94)",
    textFill: "#1a1a22",
  },
  {
    id: "yellow",
    label: "便签黄",
    color: "rgba(255, 236, 160, 0.96)",
    textFill: "#3d3200",
  },
  {
    id: "blue",
    label: "浅蓝",
    color: "rgba(200, 225, 255, 0.94)",
    textFill: "#152238",
  },
  {
    id: "green",
    label: "浅绿",
    color: "rgba(210, 245, 220, 0.94)",
    textFill: "#1a3324",
  },
  {
    id: "clear",
    label: "透明",
    color: "rgba(0, 0, 0, 0)",
    textFill: "#f0f0f5",
  },
];

export function createTextItem(
  partial: Partial<TextItem> & Pick<TextItem, "boardId">,
): TextItem {
  const text = partial.text ?? DEFAULT_TEXT;
  const fontSize = partial.fontSize ?? DEFAULT_TEXT_FONT_SIZE;
  const measured = measureTextBox(text, fontSize);
  return {
    id: partial.id ?? uuidv4(),
    text,
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    width: partial.width ?? measured.width,
    height: partial.height ?? measured.height,
    fontSize,
    fill: partial.fill ?? "#f0f0f5",
    backgroundColor: partial.backgroundColor ?? DEFAULT_TEXT_BACKGROUND,
    align: partial.align ?? "left",
    rotation: partial.rotation ?? 0,
    opacity: partial.opacity ?? 1,
    zIndex: partial.zIndex ?? 1,
    locked: partial.locked ?? false,
    visible: partial.visible ?? true,
    groupId: partial.groupId ?? null,
    categoryId: partial.categoryId ?? null,
    boardId: partial.boardId ?? DEFAULT_BOARD_ID,
    autoSize: partial.autoSize ?? true,
  };
}
