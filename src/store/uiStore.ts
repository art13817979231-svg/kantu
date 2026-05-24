import { create } from "zustand";
import type { ColorMarkId, Viewport } from "../types/project";

export type ToolMode = "select" | "pan" | "text";

/** 看图：铺图、缩放、对比；整理：图层、色标、对齐等 */
export type AppMode = "view" | "organize";

export type ContextMenuState = {
  x: number;
  y: number;
  imageId?: string;
  textId?: string;
  frameId?: string;
};

type UiState = {
  sidebarCollapsed: boolean;
  compactMode: boolean;
  colorFilter: ColorMarkId | "all";
  /** 逻辑分类筛选：all | 分类 id | __uncategorized__ */
  categoryFilter: string;
  layerSearch: string;
  sidebarTab: "layers" | "projects" | "categories";
  compareMode: boolean;
  compareOpacity: number;
  shortcutsOpen: boolean;
  toolMode: ToolMode;
  contextMenu: ContextMenuState | null;
  autosaveRecoveryPaths: string[] | null;
  showMinimap: boolean;
  appMode: AppMode;
  /** 在画布上拖拽绘制主题框 */
  frameDrawMode: boolean;
  editingTextId: string | null;
  /** 双击放大单图时记录，再次双击或 Esc 恢复 */
  imageZoomFocusId: string | null;
  viewportBeforeImageZoom: Viewport | null;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setCompactMode: (v: boolean) => void;
  toggleCompactMode: () => void;
  setColorFilter: (v: ColorMarkId | "all") => void;
  setCategoryFilter: (v: string) => void;
  setLayerSearch: (q: string) => void;
  setSidebarTab: (tab: "layers" | "projects" | "categories") => void;
  setCompareMode: (v: boolean) => void;
  setCompareOpacity: (v: number) => void;
  setShortcutsOpen: (v: boolean) => void;
  setToolMode: (mode: ToolMode) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setAutosaveRecoveryPaths: (paths: string[] | null) => void;
  setShowMinimap: (v: boolean) => void;
  toggleMinimap: () => void;
  setAppMode: (mode: AppMode) => void;
  setFrameDrawMode: (v: boolean) => void;
  toggleFrameDrawMode: () => void;
  setEditingTextId: (id: string | null) => void;
  clearImageZoom: () => void;
};

function loadSidebarCollapsed(): boolean {
  const v = localStorage.getItem("refboard-sidebar-collapsed");
  if (v === null) return true;
  return v === "true";
}

function loadShowMinimap(): boolean {
  return localStorage.getItem("refboard-minimap") === "true";
}

function loadAppMode(): AppMode {
  const v = localStorage.getItem("refboard-app-mode");
  if (v === "organize") return "organize";
  return "view";
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: loadSidebarCollapsed(),
  compactMode: false,
  colorFilter: "all",
  categoryFilter: "all",
  layerSearch: "",
  sidebarTab: loadAppMode() === "view" ? "categories" : "layers",
  compareMode: false,
  compareOpacity: 0.5,
  shortcutsOpen: false,
  toolMode: "select",
  contextMenu: null,
  autosaveRecoveryPaths: null,
  showMinimap: loadShowMinimap(),
  appMode: loadAppMode(),
  frameDrawMode: false,
  editingTextId: null,
  imageZoomFocusId: null,
  viewportBeforeImageZoom: null,

  setSidebarCollapsed: (v) => {
    localStorage.setItem("refboard-sidebar-collapsed", String(v));
    set({ sidebarCollapsed: v });
  },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    get().setSidebarCollapsed(next);
  },
  setCompactMode: (v) => {
    localStorage.setItem("refboard-compact", String(v));
    set({ compactMode: v });
  },
  toggleCompactMode: () => get().setCompactMode(!get().compactMode),
  setColorFilter: (v) => set({ colorFilter: v }),
  setCategoryFilter: (v) => set({ categoryFilter: v }),
  setLayerSearch: (q) => set({ layerSearch: q }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setCompareMode: (v) => set({ compareMode: v }),
  setCompareOpacity: (v) => set({ compareOpacity: v }),
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setAutosaveRecoveryPaths: (paths) => set({ autosaveRecoveryPaths: paths }),
  setShowMinimap: (v) => {
    localStorage.setItem("refboard-minimap", String(v));
    set({ showMinimap: v });
  },
  toggleMinimap: () => get().setShowMinimap(!get().showMinimap),
  setAppMode: (mode) => {
    localStorage.setItem("refboard-app-mode", mode);
    set({ appMode: mode });
    if (mode === "view") {
      set({
        sidebarTab: "categories",
        colorFilter: "all",
        categoryFilter: "all",
        compareMode: false,
        frameDrawMode: false,
        imageZoomFocusId: null,
        viewportBeforeImageZoom: null,
      });
    }
  },
  setFrameDrawMode: (v) => set({ frameDrawMode: v }),
  toggleFrameDrawMode: () => set({ frameDrawMode: !get().frameDrawMode }),
  setEditingTextId: (id) => set({ editingTextId: id }),
  clearImageZoom: () =>
    set({ imageZoomFocusId: null, viewportBeforeImageZoom: null }),
}));
