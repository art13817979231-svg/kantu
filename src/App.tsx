import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type Konva from "konva";
import { AppShell } from "./components/shell/AppShell";
import { ShortcutsHelp } from "./components/shell/ShortcutsHelp";
import { ContextMenu } from "./components/shell/ContextMenu";
import { AutosaveRecoveryModal } from "./components/shell/AutosaveRecoveryModal";
import { ImmersiveHint } from "./components/shell/ImmersiveHint";
import { Toolbar } from "./components/Toolbar";
import { InfiniteCanvas } from "./components/InfiniteCanvas";
import { SecondaryView } from "./components/SecondaryView";
import { useTauriDrop } from "./hooks/useTauriDrop";
import { useBrowserDrop } from "./hooks/useBrowserDrop";
import { useShortcuts, createProjectHandlers } from "./hooks/useShortcuts";
import { useOpenProject } from "./hooks/useOpenProject";
import { useAutosave, findAutosaveCandidates } from "./hooks/useAutosave";
import { useUiStore } from "./store/uiStore";
import { useCanvasStore } from "./store/canvasStore";
import { getLayoutOrigin } from "./utils/layout";
import { getDimensionsFromUrl, resolveDisplaySrc } from "./utils/thumbnail";
import { createDefaultImageFields } from "./types/project";
import { isSecondaryWindow, isTauriApp } from "./utils/tauriEnv";
import { useGlobalShortcut } from "./hooks/useGlobalShortcut";
import { useProjectSyncEmit } from "./hooks/useProjectSync";
import "./App.css";
import "./styles/refined.css";

async function getTauriWindow() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

function App() {
  const secondary = isSecondaryWindow();
  const appRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isDirty = useCanvasStore((s) => s.isDirty);
  const settings = useCanvasStore((s) => s.settings);
  const addImages = useCanvasStore((s) => s.addImages);
  const { openProjectAtPath } = useOpenProject();

  useTauriDrop();
  useBrowserDrop(appRef);
  useAutosave();
  useGlobalShortcut();
  useProjectSyncEmit();

  const handlers = createProjectHandlers(useCanvasStore.getState);
  useShortcuts(handlers);

  useEffect(() => {
    if (secondary || !isTauriApp()) return;
    getTauriWindow().then((win) => win.setAlwaysOnTop(settings.alwaysOnTop));
  }, [settings.alwaysOnTop, secondary]);

  useEffect(() => {
    if (secondary || !isTauriApp()) return;
    findAutosaveCandidates().then((paths) => {
      if (paths.length > 0) useUiStore.getState().setAutosaveRecoveryPaths(paths);
    });
  }, [secondary]);

  useEffect(() => {
    if (secondary || !isTauriApp()) return;
    let unlisten: (() => void) | undefined;
    getTauriWindow().then((win) => {
      win.onCloseRequested((event) => {
        if (isDirty) {
          const ok = confirm("项目未保存，确定退出？");
          if (!ok) event.preventDefault();
        }
      }).then((fn) => {
        unlisten = fn;
      });
    });
    return () => unlisten?.();
  }, [isDirty, secondary]);

  useEffect(() => {
    if (secondary || !isTauriApp()) return;
    let unlistenDrop: (() => void) | undefined;
    let unlistenOpen: (() => void) | undefined;

    const setup = async () => {
      const win = await getTauriWindow();
      unlistenDrop = await win.onDragDropEvent(async (event) => {
        if (event.payload.type !== "drop") return;
        const project = event.payload.paths.find(
          (p) => p.endsWith(".pur") || p.endsWith(".autosave"),
        );
        if (project) await openProjectAtPath(project);
      });
      const { listen } = await import("@tauri-apps/api/event");
      unlistenOpen = await listen<string>("open-project-file", (e) => {
        openProjectAtPath(e.payload, true);
      });
    };
    setup();
    return () => {
      unlistenDrop?.();
      unlistenOpen?.();
    };
  }, [openProjectAtPath, secondary]);

  useEffect(() => {
    if (secondary) return;
    const onPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const url = URL.createObjectURL(file);
        const dimensions = await getDimensionsFromUrl(url);
        const displaySrc = await resolveDisplaySrc(
          undefined,
          url,
          dimensions.width,
          dimensions.height,
        );
        if (displaySrc !== url) URL.revokeObjectURL(url);
        const state = useCanvasStore.getState();
        const origin = getLayoutOrigin(
          state.viewport.panX,
          state.viewport.panY,
          state.viewport.zoom,
          state.stageSize.width,
          state.stageSize.height,
        );
        addImages(
          [
            {
              id: uuidv4(),
              src: displaySrc,
              x: origin.x,
              y: origin.y,
              width: dimensions.width,
              height: dimensions.height,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              opacity: 1,
              zIndex: 0,
              ...createDefaultImageFields({
                name: file.name,
                boardId: state.activeBoardId,
              }),
            },
          ],
          true,
        );
        queueMicrotask(() => useCanvasStore.getState().fitToView());
        break;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addImages, secondary]);

  if (secondary) {
    return <SecondaryView />;
  }

  return (
    <div className="app" ref={appRef}>
      <AppShell
        onOpenRecent={openProjectAtPath}
        toolbar={
          <Toolbar
            onNew={handlers.onNew}
            onOpen={handlers.onOpen}
            onSave={() => handlers.onSave(false)}
            onSaveAs={() => handlers.onSave(true)}
            onImport={handlers.onImport}
            stageRef={stageRef}
          />
        }
        canvas={
          <InfiniteCanvas
            onImport={handlers.onImport}
            onStageReady={(stage) => {
              stageRef.current = stage;
            }}
          />
        }
      />
      <ShortcutsHelp />
      <ContextMenu />
      <ImmersiveHint />
      <AutosaveRecoveryModal
        onRestore={(path) => {
          useUiStore.getState().setAutosaveRecoveryPaths(null);
          void openProjectAtPath(path, true);
        }}
        onDismiss={() => useUiStore.getState().setAutosaveRecoveryPaths(null)}
      />
    </div>
  );
}

export default App;
