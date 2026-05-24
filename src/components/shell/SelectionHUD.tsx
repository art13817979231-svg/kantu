import { useActiveBoardCanvas } from "../../hooks/useActiveBoard";
import { useCanvasStore } from "../../store/canvasStore";
import { useUiStore } from "../../store/uiStore";
import type { AlignKind } from "../../utils/align";
import { TEXT_BG_PRESETS } from "../../utils/textDefaults";
import { FRAME_COLOR_PRESETS } from "../../utils/frameDefaults";
import { isClusterGroup, isClusterMember } from "../../utils/groupUtils";

export function SelectionHUD() {
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const selectedFrameId = useCanvasStore((s) => s.selectedFrameId);
  const groups = useCanvasStore((s) => s.groups);
  const activeBoardId = useCanvasStore((s) => s.activeBoardId);
  const createGroupFromSelected = useCanvasStore((s) => s.createGroupFromSelected);
  const dissolveGroupFromSelected = useCanvasStore((s) => s.dissolveGroupFromSelected);
  const selectGroupMembers = useCanvasStore((s) => s.selectGroupMembers);
  const { images, texts } = useActiveBoardCanvas();
  const setTextBackgroundSelected = useCanvasStore(
    (s) => s.setTextBackgroundSelected,
  );
  const setFrameColorSelected = useCanvasStore((s) => s.setFrameColorSelected);
  const alignSelected = useCanvasStore((s) => s.alignSelected);
  const distributeH = useCanvasStore((s) => s.distributeH);
  const distributeV = useCanvasStore((s) => s.distributeV);
  const toggleLock = useCanvasStore((s) => s.toggleLockSelected);
  const flipH = useCanvasStore((s) => s.flipSelectedH);
  const flipV = useCanvasStore((s) => s.flipSelectedV);
  const appMode = useUiStore((s) => s.appMode);
  const compareMode = useUiStore((s) => s.compareMode);
  const compareOpacity = useUiStore((s) => s.compareOpacity);
  const setCompareMode = useUiStore((s) => s.setCompareMode);
  const setCompareOpacity = useUiStore((s) => s.setCompareOpacity);

  const activeGroup = selectedFrameId
    ? groups.find((g) => g.id === selectedFrameId && g.boardId === activeBoardId)
    : null;

  if (selectedIds.length === 0 && !activeGroup) return null;

  const selected = images.filter((i) => selectedIds.includes(i.id));
  const selectedTexts = texts.filter((t) => selectedIds.includes(t.id));
  const first = selected[0];
  const count = selected.length + selectedTexts.length;
  const align = (kind: AlignKind) => alignSelected(kind);

  const textBackgroundActions =
    selectedTexts.length > 0 ? (
      <div className="hud-text-bg">
        <span className="hud-text-bg-label">背景</span>
        <div className="hud-text-bg-swatches">
          {TEXT_BG_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="hud-text-bg-swatch"
              title={p.label}
              style={{ background: p.color }}
              onClick={() =>
                setTextBackgroundSelected(p.color, p.textFill)
              }
            />
          ))}
        </div>
      </div>
    ) : null;

  const frameColorActions = activeGroup ? (
    <div className="hud-text-bg">
      <span className="hud-text-bg-label">框色</span>
      <div className="hud-text-bg-swatches">
        {FRAME_COLOR_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="hud-text-bg-swatch"
            title={p.label}
            style={{ background: p.stroke }}
            onClick={() => setFrameColorSelected(p.stroke, p.fill)}
          />
        ))}
      </div>
    </div>
  ) : null;

  const groupIds = new Set(
    selected.map((i) => i.groupId).filter((g): g is string => !!g),
  );
  const singleGroup =
    groupIds.size === 1 ? groups.find((g) => g.id === [...groupIds][0]) : null;
  const anyInGroup = groupIds.size > 0;
  const canSelectWholeGroup =
    count === 1 &&
    first?.groupId &&
    isClusterMember(first.groupId, groups);

  const groupActions = (
    <>
      {count >= 2 && (
        <>
          <button
            type="button"
            onClick={() => createGroupFromSelected("cluster")}
            title="Cmd+G"
          >
            成组
          </button>
          {appMode !== "view" && (
            <button
              type="button"
              onClick={() => createGroupFromSelected("frame")}
              title="带边框的主题框"
            >
              主题框
            </button>
          )}
        </>
      )}
      {canSelectWholeGroup && first?.groupId && (
        <button
          type="button"
          onClick={() => selectGroupMembers(first.groupId!)}
        >
          选中整组
        </button>
      )}
      {anyInGroup && (
        <button
          type="button"
          onClick={dissolveGroupFromSelected}
          title="Cmd+Shift+G"
        >
          解组
        </button>
      )}
    </>
  );

  if (selectedIds.length === 0 && activeGroup) {
    return (
      <footer className="selection-hud selection-hud-float selection-hud-view">
        <span className="hud-count">
          「{activeGroup.name}」
          {isClusterGroup(activeGroup) ? " · 虚拟框已选中" : " · 主题框已选中"}
          <span className="hud-group-hint"> · 拖图片进框内加入，或先点框再导入</span>
        </span>
        {frameColorActions}
      </footer>
    );
  }

  if (appMode === "view") {
    return (
      <footer className="selection-hud selection-hud-float selection-hud-view">
        <span className="hud-count">
          已选 {count} 项
          {singleGroup && (
            <span className="hud-group-tag">
              {" "}
              · {singleGroup.name}
              {isClusterGroup(singleGroup) ? "（组）" : "（框）"}
            </span>
          )}
          {count >= 2 && !singleGroup ? " · 拖到两侧即可对比" : ""}
        </span>
        {textBackgroundActions}
        {groupActions}
      </footer>
    );
  }

  return (
    <footer className="selection-hud selection-hud-float">
      <span className="hud-count">
        已选 {count} 项
        {singleGroup && (
          <span className="hud-group-tag">
            {" "}
            · {singleGroup.name}
          </span>
        )}
      </span>
      {count === 1 && first && (
        <span className="hud-size">
          {Math.round(first.width * Math.abs(first.scaleX))}×
          {Math.round(first.height * Math.abs(first.scaleY))}
          · {Math.round(first.rotation)}° · {Math.round(first.opacity * 100)}%
        </span>
      )}
      {groupActions}
      {textBackgroundActions}
      {count === 2 && (
        <label className="hud-compare">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
          />
          对照
          {compareMode && (
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(compareOpacity * 100)}
              onChange={(e) => setCompareOpacity(Number(e.target.value) / 100)}
            />
          )}
        </label>
      )}
      {count >= 2 && (
        <div className="hud-align">
          <button type="button" onClick={() => align("left")} title="左对齐">
            ⫷
          </button>
          <button type="button" onClick={() => align("center-h")} title="水平居中">
            ⫶
          </button>
          <button type="button" onClick={() => align("right")} title="右对齐">
            ⫸
          </button>
          <button type="button" onClick={() => align("top")} title="顶对齐">
            ⫠
          </button>
          <button type="button" onClick={() => align("center-v")} title="垂直居中">
            ⫡
          </button>
          <button type="button" onClick={() => align("bottom")} title="底对齐">
            ⫸
          </button>
        </div>
      )}
      {count >= 3 && (
        <>
          <button type="button" onClick={distributeH} title="水平等距">
            横分布
          </button>
          <button type="button" onClick={distributeV} title="垂直等距">
            纵分布
          </button>
        </>
      )}
      <button type="button" onClick={toggleLock}>
        锁定
      </button>
      <button type="button" onClick={flipH}>
        水平翻转
      </button>
      <button type="button" onClick={flipV}>
        垂直翻转
      </button>
    </footer>
  );
}
