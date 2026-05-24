import { convertFileSrc } from "@tauri-apps/api/core";
import type {
  Board,
  ImageGroup,
  ImageItem,
  ProjectSettings,
  TextItem,
  Viewport,
} from "../types/project";
import { useCanvasStore } from "../store/canvasStore";
import { syncBoardViewport } from "./boardUtils";
import { isTauriApp } from "./tauriEnv";

export const PROJECT_SYNC_EVENT = "refboard-project-sync";

export type ProjectSyncPayload = {
  images: ImageItem[];
  texts: TextItem[];
  groups: ImageGroup[];
  boards: Board[];
  activeBoardId: string;
  settings: ProjectSettings;
  projectPath: string | null;
  /** 主窗口视口，副窗口可选用作初始视角 */
  viewport?: Viewport;
};

function serializeImageForSync(img: ImageItem): ImageItem {
  if (isTauriApp() && img.sourcePath) {
    return { ...img, src: convertFileSrc(img.sourcePath) };
  }
  return img;
}

export function buildProjectSyncPayload(
  viewport?: Viewport,
): ProjectSyncPayload {
  const s = useCanvasStore.getState();
  return {
    images: s.images.map(serializeImageForSync),
    texts: s.texts,
    groups: s.groups,
    boards: syncBoardViewport(s.boards, s.activeBoardId, s.viewport),
    activeBoardId: s.activeBoardId,
    settings: s.settings,
    projectPath: s.projectPath,
    viewport,
  };
}

export function applyProjectSyncPayload(
  payload: ProjectSyncPayload,
  options?: { keepViewport?: boolean },
) {
  const prev = useCanvasStore.getState();
  const boards = payload.boards ?? [];
  const activeBoardId =
    payload.activeBoardId ?? boards[0]?.id ?? prev.activeBoardId;
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  useCanvasStore.setState({
    images: payload.images,
    texts: payload.texts ?? [],
    groups: payload.groups,
    boards,
    activeBoardId,
    settings: payload.settings,
    projectPath: payload.projectPath,
    isDirty: false,
    selectedIds: [],
    viewport: options?.keepViewport
      ? prev.viewport
      : (activeBoard?.viewport ?? payload.viewport ?? prev.viewport),
  });
}
