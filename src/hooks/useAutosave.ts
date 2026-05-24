import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import {
  AUTOSAVE_MS,
  autosavePath,
  listDraftAutosavePaths,
  resolveActiveAutosavePath,
} from "../utils/autosavePaths";
import { buildManifest, saveProjectFile } from "../utils/projectIO";
import { getRecentFiles } from "../utils/recentFiles";
import { isSecondaryWindow, isTauriApp } from "../utils/tauriEnv";

export function useAutosave() {
  useEffect(() => {
    if (!isTauriApp() || isSecondaryWindow()) return;

    const tick = async () => {
      const state = useCanvasStore.getState();
      if (!state.isDirty) return;

      const path = await resolveActiveAutosavePath(state);
      if (!path) return;

      const ui = useUiStore.getState();
      const snap = state.getSnapshot();
      const manifest = buildManifest(
        snap.images,
        snap.texts,
        snap.groups,
        snap.categories,
        snap.boards,
        snap.activeBoardId,
        snap.viewport,
        {
          ...snap.settings,
          sidebarCollapsed: ui.sidebarCollapsed,
          compactMode: ui.compactMode,
        },
      );

      try {
        await saveProjectFile(path, manifest, state.images);
      } catch (e) {
        console.warn("autosave failed", e);
      }
    };

    const id = setInterval(tick, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, []);
}

/** 扫描最近项目与未命名草稿的 .autosave 文件 */
export async function findAutosaveCandidates(): Promise<string[]> {
  if (!isTauriApp()) return [];
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");
    const out: string[] = [];
    for (const projectPath of getRecentFiles()) {
      const auto = autosavePath(projectPath);
      if (auto && (await exists(auto))) out.push(auto);
    }
    for (const draftPath of await listDraftAutosavePaths()) {
      if (!out.includes(draftPath)) out.push(draftPath);
    }
    return out;
  } catch {
    return [];
  }
}
