import { useHotkeys } from "react-hotkeys-hook";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import {
  openProjectFile,
  pickOpenProject,
  pickImages,
  buildManifest,
} from "../utils/projectIO";
import { saveProjectWithPicker } from "../utils/saveProjectFlow";
import {
  autosavePath,
  removeDraftAutosave,
  rotateDraftSessionId,
} from "../utils/autosavePaths";
import { isTauriApp } from "../utils/tauriEnv";
import { addRecentFile } from "../utils/recentFiles";

type ShortcutHandlers = {
  onSave: (saveAs?: boolean) => Promise<void>;
  onOpen: () => Promise<void>;
  onImport: () => Promise<void>;
  onNew: () => void;
};

export function useShortcuts(handlers: ShortcutHandlers) {
  const store = useCanvasStore();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleCompact = useUiStore((s) => s.toggleCompactMode);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const setToolMode = useUiStore((s) => s.setToolMode);
  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const compactMode = useUiStore((s) => s.compactMode);
  const setCompactMode = useUiStore((s) => s.setCompactMode);
  const toggleMinimap = useUiStore((s) => s.toggleMinimap);

  useHotkeys("mod+o", (e) => {
    e.preventDefault();
    handlers.onOpen();
  });
  useHotkeys("mod+s", (e) => {
    e.preventDefault();
    handlers.onSave(false);
  });
  useHotkeys("mod+shift+s", (e) => {
    e.preventDefault();
    handlers.onSave(true);
  });
  useHotkeys("mod+t", async (e) => {
    e.preventDefault();
    if (!isTauriApp()) {
      alert("置顶功能仅在桌面版可用");
      return;
    }
    const next = !store.settings.alwaysOnTop;
    store.setSettings({ alwaysOnTop: next });
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setAlwaysOnTop(next);
  });
  useHotkeys("delete, backspace", (e) => {
    e.preventDefault();
    store.removeSelected();
  });
  useHotkeys("mod+d", (e) => {
    e.preventDefault();
    store.duplicateSelected();
  });
  useHotkeys("mod+0", (e) => {
    e.preventDefault();
    store.resetViewport();
  });
  useHotkeys("mod+1", (e) => {
    e.preventDefault();
    store.fitToView();
  });
  useHotkeys("[", (e) => {
    e.preventDefault();
    store.adjustOpacity(-0.05);
  });
  useHotkeys("]", (e) => {
    e.preventDefault();
    store.adjustOpacity(0.05);
  });
  useHotkeys("mod+l", (e) => {
    e.preventDefault();
    store.toggleLockSelected();
  });
  useHotkeys("mod+shift+h", (e) => {
    e.preventDefault();
    store.toggleVisibleSelected();
  });
  useHotkeys("mod+g", (e) => {
    e.preventDefault();
    store.createGroupFromSelected();
  });
  useHotkeys("tab", (e) => {
    e.preventDefault();
    toggleSidebar();
  });
  useHotkeys("mod+shift+f", (e) => {
    e.preventDefault();
    toggleCompact();
  });
  useHotkeys("arrowup", (e) => {
    e.preventDefault();
    store.nudgeSelected(0, e.shiftKey ? -20 : -5);
  });
  useHotkeys("arrowdown", (e) => {
    e.preventDefault();
    store.nudgeSelected(0, e.shiftKey ? 20 : 5);
  });
  useHotkeys("arrowleft", (e) => {
    e.preventDefault();
    store.nudgeSelected(e.shiftKey ? -20 : -5, 0);
  });
  useHotkeys("arrowright", (e) => {
    e.preventDefault();
    store.nudgeSelected(e.shiftKey ? 20 : 5, 0);
  });
  useHotkeys("mod+n", (e) => {
    e.preventDefault();
    handlers.onNew();
  });
  useHotkeys("mod+i", (e) => {
    e.preventDefault();
    handlers.onImport();
  });
  useHotkeys("mod+a", (e) => {
    e.preventDefault();
    store.selectAll();
  });
  useHotkeys("mod+shift+g", (e) => {
    e.preventDefault();
    store.dissolveGroupFromSelected();
  });
  useHotkeys("mod+]", (e) => {
    e.preventDefault();
    store.layerMoveUp();
  });
  useHotkeys("mod+[", (e) => {
    e.preventDefault();
    store.layerMoveDown();
  });
  useHotkeys("mod+shift+]", (e) => {
    e.preventDefault();
    store.layerToTop();
  });
  useHotkeys("mod+shift+[", (e) => {
    e.preventDefault();
    store.layerToBottom();
  });
  useHotkeys("f", (e) => {
    e.preventDefault();
    if (e.shiftKey) store.flipSelectedV();
    else store.flipSelectedH();
  });
  useHotkeys("m", (e) => {
    e.preventDefault();
    toggleMinimap();
  });
  useHotkeys("t", (e) => {
    e.preventDefault();
    const ui = useUiStore.getState();
    setToolMode(ui.toolMode === "text" ? "select" : "text");
  });
  useHotkeys("v", (e) => {
    e.preventDefault();
    setToolMode("select");
  });
  useHotkeys(
    "h",
    (e) => {
      e.preventDefault();
      setToolMode(e.type === "keydown" ? "pan" : "select");
    },
    { keydown: true, keyup: true },
  );
  useHotkeys("shift+/", (e) => {
    e.preventDefault();
    if (useUiStore.getState().immersiveMode) return;
    setShortcutsOpen(true);
  });
  useHotkeys("mod+shift+i", (e) => {
    e.preventDefault();
    useUiStore.getState().toggleImmersive();
  });
  useHotkeys("escape", (e) => {
    const ui = useUiStore.getState();
    if (ui.immersiveMode) {
      e.preventDefault();
      useUiStore.getState().exitImmersive();
      return;
    }
    if (ui.editingTextId) {
      e.preventDefault();
      useUiStore.getState().setEditingTextId(null);
      return;
    }
    if (ui.imageZoomFocusId && ui.viewportBeforeImageZoom) {
      e.preventDefault();
      const vp = { ...ui.viewportBeforeImageZoom };
      const state = useCanvasStore.getState();
      state.setViewport(vp);
      useUiStore.getState().clearImageZoom();
      return;
    }
    if (ui.toolMode === "text") {
      e.preventDefault();
      setToolMode("select");
      return;
    }
    if (ui.shortcutsOpen) {
      e.preventDefault();
      setShortcutsOpen(false);
      return;
    }
    if (ui.contextMenu) {
      e.preventDefault();
      setContextMenu(null);
      return;
    }
    if (compactMode) {
      e.preventDefault();
      setCompactMode(false);
    }
  });
}

export function createProjectHandlers(
  getState: () => ReturnType<typeof useCanvasStore.getState>,
): ShortcutHandlers {
  return {
    onNew: () => {
      const state = getState();
      if (state.isDirty && !confirm("当前项目未保存，确定新建？")) return;
      void removeDraftAutosave();
      rotateDraftSessionId();
      state.newProject();
    },
    onOpen: async () => {
      const state = getState();
      if (state.isDirty && !confirm("当前项目未保存，确定打开？")) return;
      const path = await pickOpenProject();
      if (!path) return;
      const { manifest, images, texts, groups, categories, boards, activeBoardId } =
        await openProjectFile(path);
      state.loadProject(
        images,
        texts,
        groups,
        categories,
        boards,
        activeBoardId,
        manifest.settings,
        path,
      );
      useUiStore.getState().setCategoryFilter("all");
      const ui = useUiStore.getState();
      ui.setSidebarCollapsed(manifest.settings.sidebarCollapsed ?? true);
      ui.setCompactMode(manifest.settings.compactMode ?? false);
      addRecentFile(path);
      if (isTauriApp()) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setAlwaysOnTop(manifest.settings.alwaysOnTop);
      }
    },
    onImport: async () => {
      try {
        const paths = await pickImages();
        if (paths.length > 0) await getState().importPaths(paths);
      } catch (err) {
        console.error("onImport failed", err);
        alert(`导入失败：${err instanceof Error ? err.message : String(err)}`);
      }
    },
    onSave: async (saveAs = false) => {
      const state = getState();
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

      const result = await saveProjectWithPicker(manifest, state.images, {
        saveAs,
        currentPath: state.projectPath,
      });

      if (!result.ok) {
        if (result.cancelled) return;
        alert(result.error ?? "保存失败");
        return;
      }

      const path = result.path;
      state.markSaved(path);
      addRecentFile(path);
      await removeDraftAutosave();

      const auto = autosavePath(path);
      if (auto && isTauriApp()) {
        try {
          const { remove } = await import("@tauri-apps/plugin-fs");
          await remove(auto);
        } catch {
          /* ignore */
        }
      }
    },
  };
}
