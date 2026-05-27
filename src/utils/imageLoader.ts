import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { v4 as uuidv4 } from "uuid";
import type { ImageItem } from "../types/project";
import { createDefaultImageFields, DEFAULT_BOARD_ID } from "../types/project";
import { getCanvasImageUrl } from "./canvasDisplay";
import {
  getDimensionsForPath,
  getDimensionsFromUrl,
  resolveDisplaySrc,
} from "./thumbnail";

function nameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}

export async function loadImageFromPath(
  path: string,
  position?: { x: number; y: number },
  zIndex?: number,
  boardId: string = DEFAULT_BOARD_ID,
): Promise<ImageItem> {
  const fileUrl = convertFileSrc(path);
  const dimensions = await getDimensionsForPath(path, fileUrl);
  const src = await resolveDisplaySrc(
    path,
    fileUrl,
    dimensions.width,
    dimensions.height,
  );

  return {
    id: uuidv4(),
    src,
    sourcePath: path,
    x: position?.x ?? 0,
    y: position?.y ?? 0,
    width: dimensions.width,
    height: dimensions.height,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    zIndex: zIndex ?? 0,
    ...createDefaultImageFields({
      name: nameFromPath(path),
      boardId,
    }),
  };
}

export async function loadImagesFromPaths(
  paths: string[],
  layoutOrigin: { x: number; y: number },
  startZIndex: number,
  boardId: string = DEFAULT_BOARD_ID,
): Promise<ImageItem[]> {
  const items: ImageItem[] = [];
  let offsetX = 0;

  for (let i = 0; i < paths.length; i++) {
    const item = await loadImageFromPath(
      paths[i],
      { x: layoutOrigin.x + offsetX, y: layoutOrigin.y },
      startZIndex + i,
      boardId,
    );
    items.push(item);
    offsetX += item.width + 20;
  }

  return items;
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return getDimensionsFromUrl(src);
}

export async function readPathAsBytes(path: string): Promise<Uint8Array> {
  const data = await invoke<number[]>("read_image_file", { path });
  return new Uint8Array(data);
}

export function getExtension(path: string): string {
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx) : ".png";
}

/** 打开项目后刷新画布显示 URL（原图，非缩略图） */
export async function hydrateDisplayThumbnails(
  images: ImageItem[],
): Promise<ImageItem[]> {
  const out: ImageItem[] = [];
  for (const img of images) {
    const src = getCanvasImageUrl(img);
    if (src !== img.src && img.src.startsWith("blob:")) {
      URL.revokeObjectURL(img.src);
    }
    out.push({ ...img, src });
  }
  return out;
}
