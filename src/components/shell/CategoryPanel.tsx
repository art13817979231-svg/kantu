import { useMemo, useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { useActiveBoardCanvas } from "../../hooks/useActiveBoard";
import { useUiStore } from "../../store/uiStore";
import { UNCATEGORIZED_FILTER } from "../../types/project";
import { appConfirm, appPrompt } from "../../utils/appDialog";

function countByCategory(
  images: { categoryId: string | null }[],
  categoryId: string | null,
): number {
  if (categoryId === null) {
    return images.filter((i) => !i.categoryId).length;
  }
  return images.filter((i) => i.categoryId === categoryId).length;
}

export function CategoryPanel() {
  const { images } = useActiveBoardCanvas();
  const categories = useCanvasStore((s) => s.categories);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const addCategory = useCanvasStore((s) => s.addCategory);
  const renameCategory = useCanvasStore((s) => s.renameCategory);
  const removeCategory = useCanvasStore((s) => s.removeCategory);
  const assignCategoryToSelected = useCanvasStore((s) => s.assignCategoryToSelected);
  const fitToView = useCanvasStore((s) => s.fitToView);

  const categoryFilter = useUiStore((s) => s.categoryFilter);
  const setCategoryFilter = useUiStore((s) => s.setCategoryFilter);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const q = search.trim().toLowerCase();
  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => !q || c.name.toLowerCase().includes(q)),
    [categories, q],
  );

  const total = images.length;
  const uncategorized = countByCategory(images, null);
  const hasSelection = selectedIds.length > 0;

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const commitRename = () => {
    if (editingId) renameCategory(editingId, editName);
    setEditingId(null);
  };

  const onAddCategory = async () => {
    const name = await appPrompt("分类名称", "新分类");
    if (name === null) return;
    const id = addCategory(name);
    setCategoryFilter(id);
    if (hasSelection) assignCategoryToSelected(id);
  };

  return (
    <div className="category-panel">
      <p className="category-panel-tip">
        当前画板内可再建分类筛选；切换顶栏「画板」进入其它主题的独立空间。
        {categoryFilter !== "all" && (
          <span className="category-filter-warn">
            {" "}
            已筛选分类：新导入的图在未分类里，请点「全部」查看。
          </span>
        )}
      </p>

      <div className="layer-search">
        <input
          type="search"
          placeholder="搜索分类…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="搜索分类"
        />
      </div>

      <div className="category-list">
        <button
          type="button"
          className={`category-row ${categoryFilter === "all" ? "active" : ""}`}
          onClick={() => setCategoryFilter("all")}
          onDoubleClick={() => fitToView()}
        >
          <span className="category-row-name">全部</span>
          <span className="category-row-count">{total}</span>
        </button>
        <button
          type="button"
          className={`category-row ${categoryFilter === UNCATEGORIZED_FILTER ? "active" : ""}`}
          onClick={() => setCategoryFilter(UNCATEGORIZED_FILTER)}
        >
          <span className="category-row-name">未分类</span>
          <span className="category-row-count">{uncategorized}</span>
        </button>

        {filteredCategories.map((cat) => (
          <div key={cat.id} className="category-row-wrap">
            {editingId === cat.id ? (
              <input
                className="category-rename-input"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className={`category-row ${categoryFilter === cat.id ? "active" : ""}`}
                onClick={() => setCategoryFilter(cat.id)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  setCategoryFilter(cat.id);
                  fitToView();
                }}
              >
                <span className="category-row-name">{cat.name}</span>
                <span className="category-row-count">
                  {countByCategory(images, cat.id)}
                </span>
              </button>
            )}
            <button
              type="button"
              className="category-row-rename"
              title="重命名"
              onClick={() => startRename(cat.id, cat.name)}
            >
              ✎
            </button>
            <button
              type="button"
              className="category-row-delete"
              title="删除分类（图片变为未分类）"
              onClick={() => {
                void (async () => {
                  if (
                    !(await appConfirm(
                      `删除分类「${cat.name}」？图片将变为未分类。`,
                      "删除分类",
                    ))
                  ) {
                    return;
                  }
                  removeCategory(cat.id);
                  if (categoryFilter === cat.id) setCategoryFilter("all");
                })();
              }}
            >
              ×
            </button>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="layer-empty">暂无分类，点击下方新建</p>
        )}
      </div>

      <button
        type="button"
        className="category-add-btn"
        onClick={() => void onAddCategory()}
      >
        + 新建分类
      </button>

      {hasSelection && (
        <div className="category-assign">
          <span className="filter-label">
            已选 {selectedIds.length} 张，归入：
          </span>
          <div className="category-assign-chips">
            <button
              type="button"
              onClick={() => assignCategoryToSelected(null)}
            >
              未分类
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => assignCategoryToSelected(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
