import type { ImageGroup, ImageItem, TextItem } from "../types/project";
import { getImageBounds, getTextBounds } from "./viewport";

export const FRAME_PADDING = 20;
/** 逻辑组虚拟框留白更大，便于拖入新图 */
export const CLUSTER_PADDING = 36;
export const FRAME_MIN_SIZE = 80;

export function frameBoundsNodeId(frameId: string): string {
  return `frame-bounds-${frameId}`;
}

export function getFrameImages(images: ImageItem[], frameId: string): ImageItem[] {
  return images.filter((i) => i.groupId === frameId);
}

function rectFromBounds(
  bounds: Array<{ minX: number; minY: number; maxX: number; maxY: number }>,
  padding: number,
) {
  if (bounds.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of bounds) {
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(FRAME_MIN_SIZE, maxX - minX + padding * 2),
    height: Math.max(FRAME_MIN_SIZE, maxY - minY + padding * 2),
  };
}

/** 根据一组图片与文本的外接矩形计算框的位置与大小 */
export function computeItemsRect(
  images: ImageItem[],
  texts: TextItem[],
  padding = FRAME_PADDING,
): { x: number; y: number; width: number; height: number } | null {
  const bounds: Array<{ minX: number; minY: number; maxX: number; maxY: number }> =
    [];
  for (const img of images) bounds.push(getImageBounds(img));
  for (const t of texts) bounds.push(getTextBounds(t));
  return rectFromBounds(bounds, padding);
}

/** 根据框内图片外接矩形计算框的位置与大小 */
export function computeFrameRect(
  frameImages: ImageItem[],
  padding = FRAME_PADDING,
): { x: number; y: number; width: number; height: number } | null {
  return rectFromBounds(
    frameImages.map((img) => getImageBounds(img)),
    padding,
  );
}

/** 组内图片 + 文本的外接矩形 */
export function computeGroupRect(
  images: ImageItem[],
  texts: TextItem[],
  groupId: string,
  padding = FRAME_PADDING,
) {
  const bounds: Array<{ minX: number; minY: number; maxX: number; maxY: number }> =
    [];
  for (const img of getFrameImages(images, groupId)) {
    bounds.push(getImageBounds(img));
  }
  for (const t of texts.filter((x) => x.groupId === groupId)) {
    bounds.push(getTextBounds(t));
  }
  return rectFromBounds(bounds, padding);
}

export function imageCenter(img: ImageItem): { x: number; y: number } {
  const b = getImageBounds(img);
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
}

export function pointInFrame(
  wx: number,
  wy: number,
  frame: Pick<ImageGroup, "x" | "y" | "width" | "height">,
): boolean {
  return (
    wx >= frame.x &&
    wx <= frame.x + frame.width &&
    wy >= frame.y &&
    wy <= frame.y + frame.height
  );
}

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export function getFrameBounds(
  frame: Pick<ImageGroup, "x" | "y" | "width" | "height">,
): Bounds {
  return {
    minX: frame.x,
    minY: frame.y,
    maxX: frame.x + frame.width,
    maxY: frame.y + frame.height,
  };
}

/** 图片与组框是否有任意重叠 */
export function boundsOverlapImageFrame(
  imageBounds: Bounds,
  frame: Pick<ImageGroup, "x" | "y" | "width" | "height">,
): boolean {
  const f = getFrameBounds(frame);
  return !(
    imageBounds.maxX <= f.minX ||
    imageBounds.minX >= f.maxX ||
    imageBounds.maxY <= f.minY ||
    imageBounds.minY >= f.maxY
  );
}

/** 图片完全在组框外（无任何重叠） */
export function boundsFullyOutsideFrame(
  imageBounds: Bounds,
  frame: Pick<ImageGroup, "x" | "y" | "width" | "height">,
): boolean {
  return !boundsOverlapImageFrame(imageBounds, frame);
}

/**
 * 拖入归类：与组框有重叠即可加入（自上而下取最上层）
 * @param skipId 仍与该组重叠时不切换到其它组
 */
export function findGroupOverlappingImage(
  imageBounds: Bounds,
  frames: ImageGroup[],
  skipId?: string | null,
): ImageGroup | undefined {
  for (let i = frames.length - 1; i >= 0; i--) {
    const g = frames[i];
    if (skipId && g.id === skipId) continue;
    if (boundsOverlapImageFrame(imageBounds, g)) return g;
  }
  return undefined;
}

/** 命中任意图片组（点选），用于点击 */
export function findFrameAtPoint(
  wx: number,
  wy: number,
  frames: ImageGroup[],
): ImageGroup | undefined {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (pointInFrame(wx, wy, frames[i])) return frames[i];
  }
  return undefined;
}
