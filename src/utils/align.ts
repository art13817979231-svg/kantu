import type { ImageItem } from "../types/project";
import { getImageBounds } from "./viewport";

export type AlignKind =
  | "left"
  | "center-h"
  | "right"
  | "top"
  | "center-v"
  | "bottom";

function boundsOf(images: ImageItem[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const img of images) {
    const b = getImageBounds(img);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  return { minX, minY, maxX, maxY };
}

export function alignImages(
  images: ImageItem[],
  selectedIds: string[],
  kind: AlignKind,
): ImageItem[] {
  const selected = images.filter((i) => selectedIds.includes(i.id));
  if (selected.length < 2) return images;

  const box = boundsOf(selected);
  const idSet = new Set(selectedIds);

  return images.map((img) => {
    if (!idSet.has(img.id)) return img;
    const b = getImageBounds(img);
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    let x = img.x;
    let y = img.y;

    switch (kind) {
      case "left":
        x = box.minX;
        break;
      case "center-h":
        x = (box.minX + box.maxX) / 2 - w / 2;
        break;
      case "right":
        x = box.maxX - w;
        break;
      case "top":
        y = box.minY;
        break;
      case "center-v":
        y = (box.minY + box.maxY) / 2 - h / 2;
        break;
      case "bottom":
        y = box.maxY - h;
        break;
    }
    return { ...img, x, y };
  });
}
