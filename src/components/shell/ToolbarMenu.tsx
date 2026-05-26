import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { useUiStore } from "../../store/uiStore";
import type { LayoutMode } from "../../types/project";
import { isTauriApp } from "../../utils/tauriEnv";
import { NewProjectMenu } from "./NewProjectMenu";
import { ImportStrategySelect } from "./ImportStrategySelect";
import { BackgroundPicker } from "./BackgroundPicker";
import { openSecondaryWindow } from "../../utils/secondaryWindow";
import { pickExportPng } from "../../utils/projectIO";
import { exportStageToPng } from "../../utils/exportPng";
import { exportContactSheet } from "../../utils/contactSheet";
import type Konva from "konva";

type Props = {
  onNew: () => void;
  onOpen: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onSaveAs: () => void | Promise<void>;
  onImport: () => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  onFitView?: () => void;
};

export function ToolbarMenu({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onImport,
  stageRef,
  onFitView,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const appMode = useUiStore((s) => s.appMode);
  const settings = useCanvasStore((s) => s.settings);
  const setSettings = useCanvasStore((s) => s.setSettings);
  const layoutMode = useCanvasStore((s) => s.layoutMode);
  const setLayoutMode = useCanvasStore((s) => s.setLayoutMode);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const showMinimap = useUiStore((s) => s.showMinimap);
  const toggleMinimap = useUiStore((s) => s.toggleMinimap);
  const compactMode = useUiStore((s) => s.compactMode);
  const toggleCompact = useUiStore((s) => s.toggleCompactMode);
  const frameDrawMode = useUiStore((s) => s.frameDrawMode);
  const toggleFrameDrawMode = useUiStore((s) => s.toggleFrameDrawMode);
  const toggleImmersive = useUiStore((s) => s.toggleImmersive);
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const createGroupFromSelected = useCanvasStore((s) => s.createGroupFromSelected);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const images = useCanvasStore((s) => s.images);

  const isViewMode = appMode === "view";
  const setAppMode = useUiStore((s) => s.setAppMode);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const toggleAlwaysOnTop = async () => {
    if (!isTauriApp()) {
      alert("置顶功能仅在桌面版可用");
      return;
    }
    const next = !settings.alwaysOnTop;
    setSettings({ alwaysOnTop: next });
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setAlwaysOnTop(next);
    setOpen(false);
  };

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const runAsync = (fn: () => void | Promise<void>) => {
    setOpen(false);
    void Promise.resolve(fn()).catch((err) => {
      console.error(err);
      alert(`操作失败：${err instanceof Error ? err.message : String(err)}`);
    });
  };

  return (
    <div className="toolbar-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="btn-icon"
        onClick={() => setOpen((v) => !v)}
        title="更多"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open && (
        <div className="toolbar-menu" role="menu">
          <div className="menu-section">
            <span className="menu-label">项目</span>
            <NewProjectMenu onBlankNew={() => run(onNew)} />
            <button type="button" onClick={() => runAsync(onOpen)}>
              打开
            </button>
            <button type="button" onClick={() => runAsync(onSave)}>
              保存
            </button>
            <button type="button" onClick={() => runAsync(onSaveAs)}>
              另存为
            </button>
            <button type="button" onClick={() => runAsync(onImport)}>
              导入图片
            </button>
          </div>
          {isViewMode && (
            <div className="menu-section">
              <span className="menu-label">画布</span>
              {onFitView && (
                <button type="button" onClick={() => run(onFitView)}>
                  适应画布
                </button>
              )}
              <button type="button" onClick={() => run(() => setAppMode("organize"))}>
                整理模式…
              </button>
            </div>
          )}
          {!isViewMode && (
            <div className="menu-section">
              <span className="menu-label">整理</span>
              <button
                type="button"
                className={frameDrawMode ? "active" : ""}
                onClick={() => run(toggleFrameDrawMode)}
              >
                画框
              </button>
              {selectedIds.length >= 2 && (
                <button
                  type="button"
                  onClick={() => run(() => createGroupFromSelected("cluster"))}
                >
                  成组
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => run(() => createGroupFromSelected("frame"))}
                >
                  包成框
                </button>
              )}
              <button type="button" onClick={() => run(autoLayout)}>智能排版</button>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
              >
                <option value="grid">网格排版</option>
                <option value="row">横排排版</option>
              </select>
              <ImportStrategySelect />
              <button
                type="button"
                className={showMinimap ? "active" : ""}
                onClick={() => run(toggleMinimap)}
              >
                小地图
              </button>
            </div>
          )}
          <div className="menu-section">
            <span className="menu-label">视图</span>
            <button
              type="button"
              className={immersiveMode ? "active" : ""}
              onClick={() => run(toggleImmersive)}
            >
              沉浸模式
            </button>
            {!isViewMode && onFitView && (
              <button type="button" onClick={() => run(onFitView)}>
                适应画布
              </button>
            )}
            {!isViewMode && (
              <button type="button" onClick={() => run(() => setAppMode("view"))}>
                看图模式
              </button>
            )}
            <BackgroundPicker />
            <button
              type="button"
              className={settings.alwaysOnTop ? "active" : ""}
              onClick={() => void toggleAlwaysOnTop()}
            >
              窗口置顶
            </button>
            <button
              type="button"
              className={compactMode ? "active" : ""}
              onClick={() => run(toggleCompact)}
            >
              {compactMode ? "标准顶栏" : "紧凑顶栏"}
            </button>
            {!isViewMode && isTauriApp() && (
              <button
                type="button"
                onClick={() => {
                  void openSecondaryWindow();
                  setOpen(false);
                }}
              >
                副窗口
              </button>
            )}
            {!isViewMode && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const stage = stageRef.current;
                    if (!stage) return;
                    const path = await pickExportPng();
                    if (path === null && isTauriApp()) return;
                    await exportStageToPng(stage, path);
                    setOpen(false);
                  }}
                >
                  导出 PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void exportContactSheet(images);
                    setOpen(false);
                  }}
                >
                  联系表
                </button>
              </>
            )}
            <button type="button" onClick={() => run(() => setShortcutsOpen(true))}>
              快捷键
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
