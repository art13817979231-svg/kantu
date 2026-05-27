import { useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { openProjectFile } from "../utils/projectIO";
import {
  isDraftAutosavePath,
  parseDraftSessionId,
  setDraftSessionId,
} from "../utils/autosavePaths";
import { addRecentFile } from "../utils/recentFiles";
import { appConfirm } from "../utils/appDialog";
import { isTauriApp } from "../utils/tauriEnv";

export function useOpenProject() {
  const loadProject = useCanvasStore((s) => s.loadProject);

  const openProjectAtPath = useCallback(
    async (path: string, skipConfirm = false) => {
      const isAutosave = path.endsWith(".autosave");
      const isDraft = isDraftAutosavePath(path);
      const purPath = isAutosave ? path.replace(/\.autosave$/, "") : path;
      if (!purPath.endsWith(".pur") && !isAutosave) return false;

      const state = useCanvasStore.getState();
      if (
        !skipConfirm &&
        state.isDirty &&
        !(await appConfirm("当前项目未保存，确定打开？", "打开项目"))
      ) {
        return false;
      }

      const { manifest, images, texts, groups, categories, boards, activeBoardId } =
        await openProjectFile(isAutosave ? path : purPath);

      loadProject(
        images,
        texts,
        groups,
        categories,
        boards,
        activeBoardId,
        manifest.settings,
        isDraft ? null : purPath,
      );
      useUiStore.getState().setCategoryFilter("all");

      const ui = useUiStore.getState();
      ui.setSidebarCollapsed(manifest.settings.sidebarCollapsed ?? true);
      ui.setCompactMode(manifest.settings.compactMode ?? false);

      if (isDraft) {
        const sessionId = parseDraftSessionId(path);
        if (sessionId) setDraftSessionId(sessionId);
      }

      if (isAutosave) {
        useCanvasStore.getState().setDirty(true);
      } else {
        addRecentFile(purPath);
      }

      if (isTauriApp()) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setAlwaysOnTop(manifest.settings.alwaysOnTop);
      }

      return true;
    },
    [loadProject],
  );

  return { openProjectAtPath };
}
