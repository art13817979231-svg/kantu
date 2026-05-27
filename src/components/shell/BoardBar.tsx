import { useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { appPrompt } from "../../utils/appDialog";
import { countBoardContent } from "../../utils/boardUtils";

export function BoardBar() {
  const boards = useCanvasStore((s) => s.boards);
  const activeBoardId = useCanvasStore((s) => s.activeBoardId);
  const images = useCanvasStore((s) => s.images);
  const texts = useCanvasStore((s) => s.texts);
  const switchBoard = useCanvasStore((s) => s.switchBoard);
  const addBoard = useCanvasStore((s) => s.addBoard);
  const renameBoard = useCanvasStore((s) => s.renameBoard);
  const removeBoard = useCanvasStore((s) => s.removeBoard);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const onAdd = async () => {
    const name = await appPrompt("画板名称", `画板 ${boards.length + 1}`);
    if (name === null) return;
    addBoard(name);
  };

  const commitRename = () => {
    if (editingId) renameBoard(editingId, editName);
    setEditingId(null);
  };

  return (
    <div className="board-bar" role="tablist" aria-label="二级画板">
      <span className="board-bar-label">画板</span>
      <div className="board-bar-tabs">
        {boards.map((board) => {
          const count = countBoardContent(images, texts, board.id);
          const active = board.id === activeBoardId;
          if (editingId === board.id) {
            return (
              <input
                key={board.id}
                className="board-tab-input"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            );
          }
          return (
            <button
              key={board.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`board-tab ${active ? "active" : ""}`}
              title={`${board.name} · ${count} 项`}
              onClick={() => switchBoard(board.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                setEditingId(board.id);
                setEditName(board.name);
              }}
            >
              <span className="board-tab-name">{board.name}</span>
              {count > 0 && <span className="board-tab-count">{count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          className="board-tab board-tab-add"
          title="新建画板"
          onClick={() => void onAdd()}
        >
          +
        </button>
      </div>
      {boards.length > 1 && (
        <button
          type="button"
          className="board-bar-delete"
          title="删除当前画板"
          onClick={() => void removeBoard(activeBoardId)}
        >
          删除画板
        </button>
      )}
    </div>
  );
}
