import type { ImageGroup, ImageItem } from "../types/project";
import { computeFrameRect, FRAME_MIN_SIZE, getFrameImages } from "./frameBounds";

export function hydrateFrameGroups(
  groups: ImageGroup[],
  images: ImageItem[],
): ImageGroup[] {
  return groups.map((g) => {
    const hasGeometry =
      typeof g.x === "number" &&
      typeof g.y === "number" &&
      typeof g.width === "number" &&
      g.width > 0;
    if (hasGeometry) {
      return {
        ...g,
        collapsed: g.collapsed ?? false,
        childIds: g.childIds ?? [],
      };
    }
    const frameImages = getFrameImages(images, g.id);
    const rect = computeFrameRect(frameImages);
    if (rect) return { ...g, ...rect, collapsed: g.collapsed ?? false };
    return {
      ...g,
      x: 0,
      y: 0,
      width: FRAME_MIN_SIZE * 4,
      height: FRAME_MIN_SIZE * 3,
      collapsed: g.collapsed ?? false,
    };
  });
}
