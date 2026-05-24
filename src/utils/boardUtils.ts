import type { Board, ImageGroup, ImageItem, TextItem, Viewport } from "../types/project";
import { DEFAULT_BOARD_ID } from "../types/project";

export { DEFAULT_BOARD_ID };

export function createDefaultBoard(
  name = "主画板",
  viewport: Viewport = { panX: 0, panY: 0, zoom: 1 },
  id = DEFAULT_BOARD_ID,
): Board {
  return { id, name, viewport: { ...viewport } };
}

export function syncBoardViewport(
  boards: Board[],
  boardId: string,
  viewport: Viewport,
): Board[] {
  return boards.map((b) =>
    b.id === boardId ? { ...b, viewport: { ...viewport } } : b,
  );
}

export function filterImagesByBoard(
  images: ImageItem[],
  boardId: string,
): ImageItem[] {
  return images.filter((i) => i.boardId === boardId);
}

export function filterGroupsByBoard(
  groups: ImageGroup[],
  boardId: string,
): ImageGroup[] {
  return groups.filter((g) => g.boardId === boardId);
}

export function countBoardImages(images: ImageItem[], boardId: string): number {
  return images.filter((i) => i.boardId === boardId).length;
}

export function countBoardTexts(texts: TextItem[], boardId: string): number {
  return texts.filter((t) => t.boardId === boardId).length;
}

export function countBoardContent(
  images: ImageItem[],
  texts: TextItem[],
  boardId: string,
): number {
  return countBoardImages(images, boardId) + countBoardTexts(texts, boardId);
}

export function filterTextsByBoard(texts: TextItem[], boardId: string): TextItem[] {
  return texts.filter((t) => t.boardId === boardId);
}
