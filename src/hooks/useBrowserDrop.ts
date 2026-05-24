import { useCallback, useEffect, type RefObject } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { filterImagesByBoard } from "../utils/boardUtils";
import { isImagePath } from "../types/project";
import { isTauriApp } from "../utils/tauriEnv";
import { createDefaultImageFields } from "../types/project";
import {
  createThumbnailFromUrl,
  getDimensionsFromUrl,
  needsThumbnailProxy,
} from "../utils/thumbnail";

async function importFromFiles(files: FileList) {
  const store = useCanvasStore.getState();
  const { v4: uuidv4 } = await import("uuid");
  const { getLayoutOrigin } = await import("../utils/layout");

  const origin = getLayoutOrigin(
    store.viewport.panX,
    store.viewport.panY,
    store.viewport.zoom,
    store.stageSize.width,
    store.stageSize.height,
  );

  const items = [];
  let offsetX = 0;
  const onBoard = filterImagesByBoard(store.images, store.activeBoardId);
  const maxZ = onBoard.reduce((m, i) => Math.max(m, i.zIndex), 0);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    const blobUrl = URL.createObjectURL(file);
    let dim: { width: number; height: number };
    try {
      dim = await getDimensionsFromUrl(blobUrl);
    } catch {
      URL.revokeObjectURL(blobUrl);
      continue;
    }
    const src = needsThumbnailProxy(dim.width, dim.height)
      ? await createThumbnailFromUrl(blobUrl)
      : blobUrl;
    if (src !== blobUrl) URL.revokeObjectURL(blobUrl);
    items.push({
      id: uuidv4(),
      src,
      x: origin.x + offsetX,
      y: origin.y,
      width: dim.width,
      height: dim.height,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + i + 1,
      ...createDefaultImageFields({
        name: file.name,
        boardId: store.activeBoardId,
      }),
    });
    offsetX += dim.width + 20;
  }

  if (items.length === 0) {
    alert("没有可导入的图片文件。");
    return;
  }
  try {
    store.addImages(items, true);
    queueMicrotask(() => store.fitToView());
  } catch (err) {
    console.error("importFromFiles failed", err);
    alert(`导入失败：${err instanceof Error ? err.message : String(err)}`);
  }
}

export function useBrowserDrop(containerRef: RefObject<HTMLElement | null>) {
  const importPaths = useCanvasStore((s) => s.importPaths);

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isTauriApp()) return;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        await importFromFiles(files);
        return;
      }

      const paths = (e.dataTransfer?.files
        ? Array.from(e.dataTransfer.files)
            .map((f) => (f as File & { path?: string }).path)
            .filter((p): p is string => !!p && isImagePath(p))
        : []) as string[];

      if (paths.length > 0) await importPaths(paths);
    },
    [importPaths],
  );

  useEffect(() => {
    if (isTauriApp()) return;
    const el = containerRef.current;
    if (!el) return;

    const prevent = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("dragover", prevent);
    el.addEventListener("dragenter", prevent);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragover", prevent);
      el.removeEventListener("dragenter", prevent);
      el.removeEventListener("drop", onDrop);
    };
  }, [containerRef, onDrop]);
}

export { importFromFiles };
