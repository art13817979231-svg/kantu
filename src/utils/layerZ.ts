import type { ImageItem, TextItem } from "../types/project";
import { filterImagesByBoard, filterTextsByBoard } from "./boardUtils";

/** 文字图层 zIndex 基准，保证始终高于图片 */
export const TEXT_Z_BASE = 100_000;

export function maxImageZOnBoard(
  images: ImageItem[],
  boardId: string,
): number {
  const zi = filterImagesByBoard(images, boardId).map((i) => i.zIndex);
  return zi.length ? Math.max(...zi) : 0;
}

export function maxTextZOnBoard(texts: TextItem[], boardId: string): number {
  const zt = filterTextsByBoard(texts, boardId).map((t) => t.zIndex);
  return zt.length ? Math.max(...zt) : TEXT_Z_BASE;
}

export function nextImageZOnBoard(images: ImageItem[], boardId: string): number {
  const z = maxImageZOnBoard(images, boardId) + 1;
  return Math.min(z, TEXT_Z_BASE - 1);
}

export function nextTextZOnBoard(
  images: ImageItem[],
  texts: TextItem[],
  boardId: string,
): number {
  const maxImg = maxImageZOnBoard(images, boardId);
  const maxTxt = maxTextZOnBoard(texts, boardId);
  return Math.max(maxTxt, maxImg, TEXT_Z_BASE - 1) + 1;
}

/** 图层列表：先全部图片（低→高），再全部文字（低→高） */
export function boardLayerIdsAscending(
  images: ImageItem[],
  texts: TextItem[],
  boardId: string,
): string[] {
  const imgIds = filterImagesByBoard(images, boardId)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((i) => i.id);
  const textIds = filterTextsByBoard(texts, boardId)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((t) => t.id);
  return [...imgIds, ...textIds];
}

export function applyLayerOrderToBoard(
  images: ImageItem[],
  texts: TextItem[],
  boardId: string,
  orderedIdsAscending: string[],
): { images: ImageItem[]; texts: TextItem[] } {
  const imageIds = orderedIdsAscending.filter((id) =>
    images.some((i) => i.id === id && i.boardId === boardId),
  );
  const textIds = orderedIdsAscending.filter((id) =>
    texts.some((t) => t.id === id && t.boardId === boardId),
  );
  let z = 1;
  const imgMap = new Map(imageIds.map((id) => [id, z++]));
  let tz = TEXT_Z_BASE;
  const textMap = new Map(textIds.map((id) => [id, tz++]));
  return {
    images: images.map((img) =>
      img.boardId === boardId && imgMap.has(img.id)
        ? { ...img, zIndex: imgMap.get(img.id)! }
        : img,
    ),
    texts: texts.map((t) =>
      t.boardId === boardId && textMap.has(t.id)
        ? { ...t, zIndex: textMap.get(t.id)! }
        : t,
    ),
  };
}

/** 加载项目后，把仍压在图片下的文字抬到图片之上 */
export function bumpTextsAboveImages(
  images: ImageItem[],
  texts: TextItem[],
  boardId: string,
): TextItem[] {
  const floor = maxImageZOnBoard(images, boardId);
  let next = Math.max(maxTextZOnBoard(texts, boardId), floor + 1, TEXT_Z_BASE);
  return texts.map((t) => {
    if (t.boardId !== boardId) return t;
    if (t.zIndex > floor) return t;
    const z = next++;
    return { ...t, zIndex: z };
  });
}
