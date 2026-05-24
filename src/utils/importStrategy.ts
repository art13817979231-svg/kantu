import type { ImageItem, ImportStrategy } from "../types/project";

const SHORT_EDGE_TARGET = 480;
const WIDTH_TARGET = 800;

export function applyImportStrategy(
  items: ImageItem[],
  strategy: ImportStrategy,
): ImageItem[] {
  if (strategy === "original") return items;

  return items.map((item) => {
    if (strategy === "fit-short-edge") {
      const short = Math.min(item.width, item.height);
      const s = SHORT_EDGE_TARGET / short;
      return { ...item, scaleX: s, scaleY: s };
    }
    if (strategy === "fit-width") {
      const s = WIDTH_TARGET / item.width;
      return { ...item, scaleX: s, scaleY: s };
    }
    return item;
  });
}

export const IMPORT_STRATEGY_OPTIONS: {
  id: ImportStrategy;
  label: string;
  hint: string;
}[] = [
  { id: "original", label: "原尺寸", hint: "保持图片原始像素大小" },
  {
    id: "fit-short-edge",
    label: "统一短边",
    hint: `短边缩放到 ${SHORT_EDGE_TARGET}px`,
  },
  {
    id: "fit-width",
    label: "统一宽度",
    hint: `宽度缩放到 ${WIDTH_TARGET}px`,
  },
];
