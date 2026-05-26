import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { isTauriApp } from "../utils/tauriEnv";
import type Konva from "konva";
import { ToolbarMenu } from "./shell/ToolbarMenu";

type Props = {
  onOpen: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onSaveAs: () => void | Promise<void>;
  onImport: () => void | Promise<void>;
  onNew: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
};

const desktopOnlyTitle =
  "此功能需在 RefBoard 桌面版使用（浏览器预览无法读写 .pur 项目）";

export function Toolbar({
  onOpen,
  onSave,
  onSaveAs,
  onImport,
  onNew,
  stageRef,
}: Props) {
  const fitToView = useCanvasStore((s) => s.fitToView);
  const isDirty = useCanvasStore((s) => s.isDirty);
  const projectPath = useCanvasStore((s) => s.projectPath);
  const compactMode = useUiStore((s) => s.compactMode);
  const appMode = useUiStore((s) => s.appMode);
  const setAppMode = useUiStore((s) => s.setAppMode);
  const toolMode = useUiStore((s) => s.toolMode);
  const setToolMode = useUiStore((s) => s.setToolMode);
  const isViewMode = appMode === "view";
  const desktop = isTauriApp();
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const toggleImmersive = useUiStore((s) => s.toggleImmersive);

  const immersiveBtn = (
    <button
      type="button"
      className={immersiveMode ? "active" : ""}
      onClick={() => toggleImmersive()}
      title="沉浸模式 · 隐藏全部菜单 · ⌘⇧I"
    >
      沉浸
    </button>
  );

  const textToolBtn = (
    <button
      type="button"
      className={toolMode === "text" ? "active" : ""}
      onClick={() => setToolMode(toolMode === "text" ? "select" : "text")}
      title="文本工具 (T) · 画布空白处双击也可输入"
    >
      文本
    </button>
  );

  const fileName = projectPath
    ? projectPath.split(/[/\\]/).pop()
    : "未命名项目";

  const fileActions = (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => void onOpen()}
        title={desktop ? "打开 .pur 项目 · ⌘O" : desktopOnlyTitle}
      >
        打开
      </button>
      <button
        type="button"
        className={`btn-secondary${isDirty ? " toolbar-save-dirty" : ""}`}
        onClick={() => void onSave()}
        title={
          desktop
            ? "保存 · ⌘S（.pur 为 RefBoard 专用格式）"
            : desktopOnlyTitle
        }
      >
        保存
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => void onSaveAs()}
        title={desktop ? "另存为 · ⌘⇧S" : desktopOnlyTitle}
      >
        另存为
      </button>
    </>
  );

  if (isViewMode) {
    return (
      <header
        className={`toolbar toolbar-minimal ${compactMode ? "toolbar-slim" : ""}`}
      >
        <div className="toolbar-brand toolbar-brand-minimal">
          <span className="brand-mark" aria-hidden />
          <span className="app-title">RefBoard</span>
          <span className="project-title view" title={fileName}>
            {fileName}
          </span>
          {isDirty && (
            <span className="dirty-dot" title={`${fileName} · 未保存`} />
          )}
          {!desktop && <span className="browser-badge">预览</span>}
        </div>
        <div className="toolbar-actions">
          {immersiveBtn}
          {textToolBtn}
          {fileActions}
          <button type="button" className="btn-primary" onClick={() => void onImport()}>
            导入
          </button>
          <ToolbarMenu
            onNew={onNew}
            onOpen={onOpen}
            onSave={onSave}
            onSaveAs={onSaveAs}
            onImport={onImport}
            stageRef={stageRef}
            onFitView={fitToView}
          />
        </div>
      </header>
    );
  }

  return (
    <header className={`toolbar toolbar-minimal ${compactMode ? "toolbar-slim" : ""}`}>
      <div className="toolbar-brand toolbar-brand-minimal">
        <span className="brand-mark" aria-hidden />
        <button
          type="button"
          className="btn-back-view"
          onClick={() => setAppMode("view")}
          title="返回看图"
        >
          ← 看图
        </button>
        <span className="project-title organize" title={fileName ?? undefined}>
          {fileName}
          {isDirty && <span className="dirty-dot" title="未保存" />}
        </span>
      </div>
      <div className="toolbar-actions">
        {immersiveBtn}
        {textToolBtn}
        {fileActions}
        <button type="button" className="btn-primary" onClick={() => void onImport()}>
          导入
        </button>
        <ToolbarMenu
          onNew={onNew}
          onOpen={onOpen}
          onSave={onSave}
          onSaveAs={onSaveAs}
          onImport={onImport}
          stageRef={stageRef}
          onFitView={fitToView}
        />
      </div>
    </header>
  );
}
