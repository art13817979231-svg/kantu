import { convertFileSrc } from "@tauri-apps/api/core";
import type { ImageItem } from "../types/project";
import { isTauriApp } from "./tauriEnv";

/** 根据缩放提高 Stage 缓冲分辨率，减轻缩放后图片/文字发糊 */
export function getStagePixelRatio(zoom: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const z = Math.max(zoom, 0.05);
  const ratio = dpr * Math.max(1, z, 1 / z);
  return Math.min(4, ratio);
}

/** 画布上显示的图片 URL：桌面端优先原文件，不用缩略图代理 */
export function getCanvasImageUrl(
  item: Pick<ImageItem, "src" | "sourcePath">,
): string {
  if (item.sourcePath && isTauriApp()) {
    return convertFileSrc(item.sourcePath);
  }
  return item.src;
}
