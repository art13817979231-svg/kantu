import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { isTauriApp } from "./tauriEnv";

export const THUMB_MAX = 512;

export function needsThumbnailProxy(width: number, height: number): boolean {
  return Math.max(width, height) > THUMB_MAX;
}

/** 浏览器端 canvas 缩略图 */
export async function createThumbnailFromUrl(
  url: string,
  maxDim = THUMB_MAX,
): Promise<string> {
  const img = await loadImage(url);
  const { w, h } = fitSize(img.naturalWidth, img.naturalHeight, maxDim);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return url;
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 0.85),
  );
  if (!blob) return url;
  return URL.createObjectURL(blob);
}

export async function createThumbnailFromBytes(
  bytes: Uint8Array,
  maxDim = THUMB_MAX,
): Promise<string> {
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  try {
    return await createThumbnailFromUrl(url, maxDim);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 画布显示用原图 URL（不再生成 512px 缩略图，避免放大后发糊）。
 * 缩略图仅用于联系表等导出场景（createThumbnailFromUrl）。
 */
export async function resolveDisplaySrc(
  sourcePath: string | undefined,
  fallbackUrl: string,
  _width?: number,
  _height?: number,
): Promise<string> {
  if (sourcePath && isTauriApp()) {
    return convertFileSrc(sourcePath);
  }
  return fallbackUrl;
}

export async function getDimensionsForPath(
  path: string,
  fallbackUrl: string,
): Promise<{ width: number; height: number }> {
  if (isTauriApp()) {
    try {
      const [w, h] = await invoke<[number, number]>("get_image_dimensions_from_path", {
        path,
      });
      return { width: w, height: h };
    } catch {
      /* fall through */
    }
  }
  return getDimensionsFromUrl(fallbackUrl);
}

export function getDimensionsFromUrl(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function fitSize(w: number, h: number, maxDim: number) {
  if (w <= maxDim && h <= maxDim) return { w, h };
  const scale = maxDim / Math.max(w, h);
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}
