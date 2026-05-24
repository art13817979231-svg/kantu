import { useMemo } from "react";
import { useCanvasStore } from "../store/canvasStore";
import {
  filterGroupsByBoard,
  filterImagesByBoard,
  filterTextsByBoard,
} from "../utils/boardUtils";

export function useActiveBoardId() {
  return useCanvasStore((s) => s.activeBoardId);
}

/** 当前二级画板上的图片与主题框（其它画板内容不渲染） */
export function useActiveBoardCanvas() {
  const activeBoardId = useCanvasStore((s) => s.activeBoardId);
  const images = useCanvasStore((s) => s.images);
  const groups = useCanvasStore((s) => s.groups);
  const texts = useCanvasStore((s) => s.texts);

  return useMemo(
    () => ({
      activeBoardId,
      images: filterImagesByBoard(images, activeBoardId),
      groups: filterGroupsByBoard(groups, activeBoardId),
      texts: filterTextsByBoard(texts, activeBoardId),
    }),
    [activeBoardId, images, groups, texts],
  );
}
