import type { ImageItem, TextItem, Viewport } from "../types/project";

export function getImageBounds(img: ImageItem) {
  const w = img.width * img.scaleX;
  const h = img.height * img.scaleY;
  return { minX: img.x, minY: img.y, maxX: img.x + w, maxY: img.y + h };
}

export function getTextBounds(t: TextItem) {
  return { minX: t.x, minY: t.y, maxX: t.x + t.width, maxY: t.y + t.height };
}

export function getBoundsForImages(images: ImageItem[]) {
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

export function getBoundsForCanvasItems(
  images: ImageItem[],
  texts: TextItem[],
) {
  const all: Array<{ minX: number; minY: number; maxX: number; maxY: number }> = [];
  for (const img of images) all.push(getImageBounds(img));
  for (const t of texts) all.push(getTextBounds(t));
  if (all.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }
  return {
    minX: Math.min(...all.map((b) => b.minX)),
    minY: Math.min(...all.map((b) => b.minY)),
    maxX: Math.max(...all.map((b) => b.maxX)),
    maxY: Math.max(...all.map((b) => b.maxY)),
  };
}

export function computeFitViewport(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  stageWidth: number,
  stageHeight: number,
  padding = 80,
  allowUpscale = false,
): Viewport {
  const contentW = bounds.maxX - bounds.minX;
  const contentH = bounds.maxY - bounds.minY;
  if (contentW <= 0 || contentH <= 0) {
    return { panX: 0, panY: 0, zoom: 1 };
  }

  const zoomX = (stageWidth - padding * 2) / contentW;
  const zoomY = (stageHeight - padding * 2) / contentH;
  const zoomFit = Math.min(zoomX, zoomY);
  const zoom = allowUpscale ? zoomFit : Math.min(1, zoomFit);

  const panX = stageWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom;
  const panY = stageHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom;

  return { panX, panY, zoom };
}

/** 世界坐标视口矩形 */
export function getWorldViewport(
  viewport: Viewport,
  stageWidth: number,
  stageHeight: number,
  margin = 200,
) {
  const { panX, panY, zoom } = viewport;
  return {
    minX: (-panX - margin) / zoom,
    minY: (-panY - margin) / zoom,
    maxX: (stageWidth - panX + margin) / zoom,
    maxY: (stageHeight - panY + margin) / zoom,
  };
}

export function isImageInViewport(img: ImageItem, viewport: Viewport, stageSize: { width: number; height: number }) {
  const world = getWorldViewport(viewport, stageSize.width, stageSize.height);
  const b = getImageBounds(img);
  return !(b.maxX < world.minX || b.minX > world.maxX || b.maxY < world.minY || b.minY > world.maxY);
}
