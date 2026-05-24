import type { ImageItem } from "../types/project";
import { getImageBounds } from "./viewport";

/** 水平等距分布（≥3 张） */
export function distributeHorizontal(
  images: ImageItem[],
  selectedIds: string[],
): ImageItem[] {
  const selected = images
    .filter((i) => selectedIds.includes(i.id))
    .sort((a, b) => a.x - b.x);
  if (selected.length < 3) return images;

  const bounds = selected.map((img) => ({ img, ...getImageBounds(img) }));
  const totalWidth = bounds.reduce((s, b) => s + (b.maxX - b.minX), 0);
  const left = bounds[0].minX;
  const right = bounds[bounds.length - 1].maxX;
  const gap = (right - left - totalWidth) / (selected.length - 1);

  let x = left;
  const positions = new Map<string, number>();
  for (const b of bounds) {
    positions.set(b.img.id, x);
    x += b.maxX - b.minX + gap;
  }

  return images.map((img) =>
    positions.has(img.id) ? { ...img, x: positions.get(img.id)! } : img,
  );
}

/** 垂直等距分布（≥3 张） */
export function distributeVertical(
  images: ImageItem[],
  selectedIds: string[],
): ImageItem[] {
  const selected = images
    .filter((i) => selectedIds.includes(i.id))
    .sort((a, b) => a.y - b.y);
  if (selected.length < 3) return images;

  const bounds = selected.map((img) => ({ img, ...getImageBounds(img) }));
  const totalHeight = bounds.reduce((s, b) => s + (b.maxY - b.minY), 0);
  const top = bounds[0].minY;
  const bottom = bounds[bounds.length - 1].maxY;
  const gap = (bottom - top - totalHeight) / (selected.length - 1);

  let y = top;
  const positions = new Map<string, number>();
  for (const b of bounds) {
    positions.set(b.img.id, y);
    y += b.maxY - b.minY + gap;
  }

  return images.map((img) =>
    positions.has(img.id) ? { ...img, y: positions.get(img.id)! } : img,
  );
}
