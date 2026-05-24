import { useUiStore } from "../../store/uiStore";
import { COLOR_MARK_PRESETS } from "../../utils/colorMarks";
import { LayerTree } from "./LayerTree";
import { CategoryPanel } from "./CategoryPanel";
import { getRecentFiles, fileName } from "../../utils/recentFiles";

type Props = {
  onOpenRecent: (path: string) => void;
};

export function Sidebar({ onOpenRecent }: Props) {
  const appMode = useUiStore((s) => s.appMode);
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);
  const colorFilter = useUiStore((s) => s.colorFilter);
  const setColorFilter = useUiStore((s) => s.setColorFilter);
  const layerSearch = useUiStore((s) => s.layerSearch);
  const setLayerSearch = useUiStore((s) => s.setLayerSearch);
  const recent = getRecentFiles();

  if (appMode === "view") {
    return (
      <aside className="sidebar sidebar-view">
        <CategoryPanel />
        {recent.length > 0 && (
          <>
            <div className="sidebar-section-label">最近项目</div>
            <div className="project-list project-list-compact">
              {recent.map((path) => (
                <button
                  key={path}
                  type="button"
                  className="project-row"
                  onClick={() => onOpenRecent(path)}
                >
                  {fileName(path)}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          type="button"
          className={sidebarTab === "categories" ? "active" : ""}
          onClick={() => setSidebarTab("categories")}
        >
          分类
        </button>
        <button
          type="button"
          className={sidebarTab === "layers" ? "active" : ""}
          onClick={() => setSidebarTab("layers")}
        >
          图层
        </button>
        <button
          type="button"
          className={sidebarTab === "projects" ? "active" : ""}
          onClick={() => setSidebarTab("projects")}
        >
          项目
        </button>
      </div>

      {sidebarTab === "categories" && <CategoryPanel />}

      {sidebarTab === "layers" && (
        <>
          <div className="layer-search">
            <input
              type="search"
              placeholder="搜索图层名称…"
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
              aria-label="搜索图层"
            />
          </div>
          <div className="color-filter">
            <span className="filter-label">色标筛选</span>
            <div className="color-chips">
              <button
                type="button"
                className={colorFilter === "all" ? "active" : ""}
                onClick={() => setColorFilter("all")}
              >
                全部
              </button>
              {COLOR_MARK_PRESETS.filter((p) => p.id !== "none").map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={colorFilter === p.id ? "active" : ""}
                  title={p.label}
                  onClick={() => setColorFilter(p.id)}
                  style={{ background: p.hex }}
                />
              ))}
            </div>
          </div>
          <LayerTree />
        </>
      )}

      {sidebarTab === "projects" && (
        <div className="project-list">
          {recent.length === 0 && <p className="layer-empty">暂无最近项目</p>}
          {recent.map((path) => (
            <button
              key={path}
              type="button"
              className="project-row"
              onClick={() => onOpenRecent(path)}
            >
              {fileName(path)}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
