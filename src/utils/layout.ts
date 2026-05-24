import type { ImageItem, LayoutMode } from "../types/project";

const GAP = 20;
const MAX_ROW_WIDTH = 2400;

export function layoutGrid(
  images: ImageItem[],
  startX: number,
  startY: number,
): ImageItem[] {
  let x = startX;
  let y = startY;
  let rowHeight = 0;

  return images.map((img) => {
    const w = img.width * img.scaleX;
    const h = img.height * img.scaleY;

    if (x > startX && x + w > startX + MAX_ROW_WIDTH) {
      x = startX;
      y += rowHeight + GAP;
      rowHeight = 0;
    }

    const placed = { ...img, x, y };
    x += w + GAP;
    rowHeight = Math.max(rowHeight, h);
    return placed;
  });
}

export function layoutRow(
  images: ImageItem[],
  startX: number,
  startY: number,
): ImageItem[] {
  let x = startX;

  return images.map((img) => {
    const w = img.width * img.scaleX;
    const placed = { ...img, x, y: startY };
    x += w + GAP;
    return placed;
  });
}

export function applyLayout(
  images: ImageItem[],
  mode: LayoutMode,
  startX: number,
  startY: number,
): ImageItem[] {
  const sorted = [...images].sort((a, b) => a.zIndex - b.zIndex);
  return mode === "grid"
    ? layoutGrid(sorted, startX, startY)
    : layoutRow(sorted, startX, startY);
}

export function getLayoutOrigin(
  panX: number,
  panY: number,
  zoom: number,
  stageWidth: number,
  stageHeight: number,
): { x: number; y: number } {
  const centerX = (stageWidth / 2 - panX) / zoom;
  const centerY = (stageHeight / 2 - panY) / zoom;
  return { x: centerX - 200, y: centerY - 150 };
}
