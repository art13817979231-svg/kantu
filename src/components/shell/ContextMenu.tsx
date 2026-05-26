import { useEffect } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { useUiStore } from "../../store/uiStore";
import { COLOR_MARK_PRESETS } from "../../utils/colorMarks";
import { TEXT_BG_PRESETS } from "../../utils/textDefaults";
import { FRAME_COLOR_PRESETS } from "../../utils/frameDefaults";
import { isClusterMember } from "../../utils/groupUtils";

export function ContextMenu() {
  const menu = useUiStore((s) => s.contextMenu);
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const removeSelected = useCanvasStore((s) => s.removeSelected);
  const duplicateSelected = useCanvasStore((s) => s.duplicateSelected);
  const toggleLock = useCanvasStore((s) => s.toggleLockSelected);
  const toggleVisible = useCanvasStore((s) => s.toggleVisibleSelected);
  const layerToTop = useCanvasStore((s) => s.layerToTop);
  const layerToBottom = useCanvasStore((s) => s.layerToBottom);
  const flipH = useCanvasStore((s) => s.flipSelectedH);
  const flipV = useCanvasStore((s) => s.flipSelectedV);
  const createGroupFromSelected = useCanvasStore((s) => s.createGroupFromSelected);
  const dissolveGroup = useCanvasStore((s) => s.dissolveGroupFromSelected);
  const selectGroupMembers = useCanvasStore((s) => s.selectGroupMembers);
  const groups = useCanvasStore((s) => s.groups);
  const allImages = useCanvasStore((s) => s.images);
  const assignSelectedToGroup = useCanvasStore((s) => s.assignSelectedToGroup);
  const syncFrameBounds = useCanvasStore((s) => s.syncFrameBounds);
  const setColorMarkSelected = useCanvasStore((s) => s.setColorMarkSelected);
  const categories = useCanvasStore((s) => s.categories);
  const addCategory = useCanvasStore((s) => s.addCategory);
  const assignCategoryToSelected = useCanvasStore((s) => s.assignCategoryToSelected);
  const boards = useCanvasStore((s) => s.boards);
  const activeBoardId = useCanvasStore((s) => s.activeBoardId);
  const addBoard = useCanvasStore((s) => s.addBoard);
  const moveSelectedToBoard = useCanvasStore((s) => s.moveSelectedToBoard);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const texts = useCanvasStore((s) => s.texts);
  const setEditingTextId = useUiStore((s) => s.setEditingTextId);
  const setTextBackgroundSelected = useCanvasStore(
    (s) => s.setTextBackgroundSelected,
  );
  const setFrameColorSelected = useCanvasStore((s) => s.setFrameColorSelected);
  const removeGroup = useCanvasStore((s) => s.removeGroup);
  const appMode = useUiStore((s) => s.appMode);

  useEffect(() => {
    if (!menu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [menu, setContextMenu]);

  if (!menu || immersiveMode) return null;

  const hasSelection = selectedIds.length > 0;
  const isImage = !!menu.imageId;
  const isText = !!menu.textId;
  const isFrame = !!menu.frameId;
  const menuImage = menu.imageId
    ? allImages.find((i) => i.id === menu.imageId)
    : null;
  const canSelectWholeGroup =
    menuImage?.groupId && isClusterMember(menuImage.groupId, groups);
  const boardGroups = groups.filter((g) => g.boardId === activeBoardId);
  const frameHasMembers =
    !!menu.frameId &&
    (allImages.some((i) => i.groupId === menu.frameId) ||
      texts.some((t) => t.groupId === menu.frameId));

  const run = (fn: () => void) => {
    fn();
    setContextMenu(null);
  };

  return (
    <div
      className="context-menu"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {isImage && hasSelection && (
        <>
          <button type="button" onClick={() => run(duplicateSelected)}>
            复制
          </button>
          <button type="button" onClick={() => run(toggleLock)}>
            锁定/解锁
          </button>
          <button type="button" onClick={() => run(toggleVisible)}>
            显示/隐藏
          </button>
          <hr />
          <button type="button" onClick={() => run(layerToTop)}>
            置于顶层
          </button>
          <button type="button" onClick={() => run(layerToBottom)}>
            置于底层
          </button>
          <button type="button" onClick={() => run(flipH)}>
            水平翻转
          </button>
          <button type="button" onClick={() => run(flipV)}>
            垂直翻转
          </button>
          {selectedIds.length >= 2 && (
            <button
              type="button"
              onClick={() =>
                run(() =>
                  createGroupFromSelected(
                    appMode === "view" ? "cluster" : "cluster",
                  ),
                )
              }
            >
              成组
            </button>
          )}
          {canSelectWholeGroup && menuImage?.groupId && (
            <button
              type="button"
              onClick={() => run(() => selectGroupMembers(menuImage.groupId!))}
            >
              选中整组
            </button>
          )}
          <div className="context-submenu-label">画板</div>
          {boards
            .filter((b) => b.id !== activeBoardId)
            .map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => run(() => moveSelectedToBoard(b.id))}
              >
                移到「{b.name}」
              </button>
            ))}
          <button
            type="button"
            onClick={() =>
              run(() => {
                const name = prompt("新画板名称", "新画板");
                if (name === null) return;
                const id = addBoard(name);
                moveSelectedToBoard(id);
              })
            }
          >
            新建画板并移入…
          </button>
          {boardGroups.length > 0 && selectedIds.length > 0 && (
            <>
              <div className="context-submenu-label">放入组</div>
              {boardGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    run(() => {
                      assignSelectedToGroup(g.id);
                      syncFrameBounds(g.id);
                    })
                  }
                >
                  「{g.name}」
                </button>
              ))}
              <button
                type="button"
                onClick={() => run(() => assignSelectedToGroup(null))}
              >
                移出组
              </button>
              <hr />
            </>
          )}
          <div className="context-submenu-label">分类</div>
          <button
            type="button"
            onClick={() =>
              run(() => assignCategoryToSelected(null))
            }
          >
            未分类
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => run(() => assignCategoryToSelected(c.id))}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              run(() => {
                const name = prompt("新分类名称", "新分类");
                if (name === null) return;
                const id = addCategory(name);
                assignCategoryToSelected(id);
              })
            }
          >
            新建分类并归入…
          </button>
          <hr />
          {appMode !== "view" && (
            <>
              <div className="context-submenu-label">色标</div>
              {COLOR_MARK_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => run(() => setColorMarkSelected(p.id))}
                >
                  {p.label}
                </button>
              ))}
              <button type="button" onClick={() => run(() => setColorMarkSelected("none"))}>
                清除色标
              </button>
              <hr />
              <div className="context-submenu-label">主题框</div>
              <button
                type="button"
                onClick={() => run(() => createGroupFromSelected("frame"))}
              >
                包进新框
              </button>
              {boardGroups.filter((g) => g.kind !== "cluster").map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    run(() => {
                      assignSelectedToGroup(g.id);
                      syncFrameBounds(g.id);
                    })
                  }
                >
                  放进「{g.name}」
                </button>
              ))}
              <button type="button" onClick={() => run(() => assignSelectedToGroup(null))}>
                移出框外
              </button>
            </>
          )}
          {selectedIds.some((id) => allImages.find((i) => i.id === id)?.groupId) && (
            <button type="button" onClick={() => run(dissolveGroup)}>
              解组
            </button>
          )}
          <hr />
          <button
            type="button"
            className="danger"
            onClick={() => run(removeSelected)}
          >
            删除
          </button>
        </>
      )}
      {isText && menu.textId && (
        <>
          <button
            type="button"
            onClick={() => run(() => setEditingTextId(menu.textId!))}
          >
            编辑文字
          </button>
          <button type="button" onClick={() => run(duplicateSelected)}>
            复制
          </button>
          <button type="button" onClick={() => run(toggleLock)}>
            锁定/解锁
          </button>
          <button type="button" onClick={() => run(toggleVisible)}>
            显示/隐藏
          </button>
          <div className="context-submenu-label">背景色</div>
          {TEXT_BG_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                run(() => setTextBackgroundSelected(p.color, p.textFill))
              }
            >
              {p.label}
            </button>
          ))}
          <hr />
          <button type="button" onClick={() => run(layerToTop)}>
            置于顶层
          </button>
          <button type="button" onClick={() => run(layerToBottom)}>
            置于底层
          </button>
          {selectedIds.some((id) => texts.find((t) => t.id === id)?.groupId) && (
            <button type="button" onClick={() => run(dissolveGroup)}>
              解组
            </button>
          )}
          <hr />
          <button
            type="button"
            className="danger"
            onClick={() => run(removeSelected)}
          >
            删除
          </button>
        </>
      )}
      {isFrame && menu.frameId && (
        <>
          <div className="context-submenu-label">框色</div>
          {FRAME_COLOR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                run(() => setFrameColorSelected(p.stroke, p.fill))
              }
            >
              {p.label}
            </button>
          ))}
          <hr />
          {frameHasMembers && (
            <button
              type="button"
              onClick={() => run(() => removeGroup(menu.frameId!))}
            >
              解组
            </button>
          )}
          <button
            type="button"
            className="danger"
            onClick={() => run(removeSelected)}
          >
            删除框
          </button>
        </>
      )}
      {!isImage && !isText && !isFrame && (
        <button type="button" onClick={() => setContextMenu(null)}>
          关闭
        </button>
      )}
    </div>
  );
}
