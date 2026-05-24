import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { isTauriApp } from "../utils/tauriEnv";
import type Konva from "konva";
import { ToolbarMenu } from "./shell/ToolbarMenu";

type Props = {
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onImport: () => void;
  onNew: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
};

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

  if (isViewMode) {
    return (
      <header
        className={`toolbar toolbar-minimal ${compactMode ? "toolbar-slim" : ""}`}
      >
        <div className="toolbar-brand toolbar-brand-minimal">
          <span className="brand-mark" aria-hidden />
          <span className="app-title">RefBoard</span>
          {isDirty && (
            <span className="dirty-dot" title={`${fileName} · 未保存`} />
          )}
          {!isTauriApp() && <span className="browser-badge">预览</span>}
        </div>
        <div className="toolbar-actions">
          {textToolBtn}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAppMode("organize")}
            title="图层、色标、对齐等整理能力"
          >
            整理
          </button>
          <button type="button" className="btn-primary" onClick={onImport}>
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
        {textToolBtn}
        <button type="button" className="btn-primary" onClick={onImport}>
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
