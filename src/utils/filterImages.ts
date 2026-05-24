import type { ColorMarkId, ImageItem } from "../types/project";
import { UNCATEGORIZED_FILTER } from "../types/project";

export function passesCategoryFilter(
  img: ImageItem,
  categoryFilter: string,
): boolean {
  if (categoryFilter === "all") return true;
  if (categoryFilter === UNCATEGORIZED_FILTER) return !img.categoryId;
  return img.categoryId === categoryFilter;
}

export function filterImages(
  images: ImageItem[],
  colorFilter: ColorMarkId | "all",
  layerSearch: string,
  categoryFilter = "all",
): ImageItem[] {
  const q = layerSearch.trim().toLowerCase();
  return images.filter((img) => {
    if (!passesCategoryFilter(img, categoryFilter)) return false;
    if (colorFilter !== "all" && img.colorMark !== colorFilter) return false;
    if (q && !(img.name || "").toLowerCase().includes(q)) return false;
    return true;
  });
}
