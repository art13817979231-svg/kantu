import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  Board,
  ColorMarkId,
  ImageCategory,
  ImageGroup,
  ImageItem,
  LayoutMode,
  ProjectSettings,
  TextItem,
  Viewport,
} from "../types/project";
import { DEFAULT_BOARD_ID, DEFAULT_SETTINGS } from "../types/project";
import {
  countBoardContent,
  createDefaultBoard,
  filterImagesByBoard,
  filterTextsByBoard,
  syncBoardViewport,
} from "../utils/boardUtils";
import { createTextItem } from "../utils/textDefaults";
import { measureTextBox } from "../utils/measureTextBox";
import { applyLayout, getLayoutOrigin } from "../utils/layout";
import { loadImagesFromPaths } from "../utils/imageLoader";
import { computeFitViewport, getBoundsForImages } from "../utils/viewport";
import { alignImages, type AlignKind } from "../utils/align";
import { applyImportStrategy } from "../utils/importStrategy";
import { PROJECT_TEMPLATES } from "../utils/templates";
import { distributeHorizontal, distributeVertical } from "../utils/distribute";
import { filterImages } from "../utils/filterImages";
import {
  isClusterGroup,
  isClusterMember,
  type ImageGroupKind,
} from "../utils/groupUtils";
import {
  CLUSTER_PADDING,
  computeGroupRect,
  computeItemsRect,
  boundsOverlapImageFrame,
  findGroupOverlappingImage,
  FRAME_MIN_SIZE,
  FRAME_PADDING,
} from "../utils/frameBounds";
import { getBoundsForCanvasItems, getImageBounds, getTextBounds } from "../utils/viewport";
import {
  affectedGroupIdsFromRemoval,
  detachFrameMembers,
} from "../utils/groupOps";
import {
  applyLayerOrderToBoard,
  boardLayerIdsAscending,
  bumpTextsAboveImages,
  nextImageZOnBoard,
  nextTextZOnBoard,
  TEXT_Z_BASE,
} from "../utils/layerZ";
import { useUiStore } from "./uiStore";

type CanvasState = {
  images: ImageItem[];
  texts: TextItem[];
  groups: ImageGroup[];
  categories: ImageCategory[];
  boards: Board[];
  activeBoardId: string;
  selectedIds: string[];
  selectedFrameId: string | null;
  viewport: Viewport;
  settings: ProjectSettings;
  isPanning: boolean;
  spacePressed: boolean;
  projectPath: string | null;
  isDirty: boolean;
  layoutMode: LayoutMode;
  stageSize: { width: number; height: number };

  setStageSize: (w: number, h: number) => void;
  setViewport: (patch: Partial<Viewport>) => void;
  setPanning: (v: boolean) => void;
  setSpacePressed: (v: boolean) => void;
  setProjectPath: (path: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSettings: (patch: Partial<ProjectSettings>) => void;

  addImages: (items: ImageItem[], autoLayout?: boolean) => void;
  addTextAt: (x?: number, y?: number) => string;
  importPaths: (paths: string[]) => Promise<void>;
  updateImage: (id: string, patch: Partial<ImageItem>) => void;
  updateText: (id: string, patch: Partial<TextItem>) => void;
  setTextBackgroundSelected: (backgroundColor: string, textFill?: string) => void;
  setFrameColorSelected: (strokeColor: string, fillColor: string) => void;
  remeasureText: (id: string) => void;
  updateSelected: (patch: Partial<ImageItem>) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  selectImage: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;
  setSelectedFrameId: (id: string | null) => void;
  selectFrame: (id: string) => void;
  createFrameFromRect: (x: number, y: number, w: number, h: number) => string;
  moveFrame: (frameId: string, newX: number, newY: number) => void;
  resizeFrame: (
    frameId: string,
    patch: { x: number; y: number; width: number; height: number },
  ) => void;
  syncFrameBounds: (frameId: string) => void;
  afterImageDrag: (imageId: string) => void;
  afterTextDrag: (textId: string) => void;
  removeSelectedFrame: () => void;
  bringToFront: (id: string) => void;
  layerMoveUp: () => void;
  layerMoveDown: () => void;
  layerToTop: () => void;
  layerToBottom: () => void;
  toggleLockSelected: () => void;
  toggleVisibleSelected: () => void;
  flipSelectedH: () => void;
  flipSelectedV: () => void;
  setColorMarkSelected: (mark: ColorMarkId) => void;
  addCategory: (name: string) => string;
  renameCategory: (id: string, name: string) => void;
  removeCategory: (id: string) => void;
  assignCategoryToSelected: (categoryId: string | null) => void;
  addBoard: (name: string) => string;
  renameBoard: (id: string, name: string) => void;
  removeBoard: (id: string) => void;
  switchBoard: (id: string) => void;
  moveSelectedToBoard: (boardId: string) => void;
  alignSelected: (kind: AlignKind) => void;
  adjustOpacity: (delta: number) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  autoLayout: () => void;
  resetViewport: () => void;
  fitToView: () => void;
  fitToGroup: (groupId: string) => void;
  focusOnImage: (id: string) => void;
  /** 双击图片：放大铺满画布；再次双击同一图恢复视口 */
  toggleImageZoom: (imageId: string) => void;
  setZoom: (zoom: number) => void;
  reorderLayersDisplayOrder: (activeId: string, targetIndex: number) => void;
  createGroupFromSelected: (kind?: ImageGroupKind) => void;
  selectGroupMembers: (groupId: string) => void;
  assignSelectedToGroup: (groupId: string | null) => void;
  renameGroup: (groupId: string, name: string) => void;
  removeGroup: (groupId: string) => void;
  dissolveGroupFromSelected: () => void;
  selectAll: () => void;
  distributeH: () => void;
  distributeV: () => void;
  newFromTemplate: (templateId: string) => void;
  loadProject: (
    images: ImageItem[],
    texts: TextItem[],
    groups: ImageGroup[],
    categories: ImageCategory[],
    boards: Board[],
    activeBoardId: string,
    settings: ProjectSettings,
    path: string | null,
  ) => void;
  newProject: () => void;
  markSaved: (path: string) => void;
  getSnapshot: () => {
    images: ImageItem[];
    texts: TextItem[];
    groups: ImageGroup[];
    categories: ImageCategory[];
    boards: Board[];
    activeBoardId: string;
    viewport: Viewport;
    settings: ProjectSettings;
    projectPath: string | null;
  };
};

function revokeBlobUrls(images: ImageItem[]) {
  for (const img of images) {
    if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  }
}

function layerIdsOnActiveBoard(s: {
  images: ImageItem[];
  texts: TextItem[];
  activeBoardId: string;
}): string[] {
  return boardLayerIdsAscending(s.images, s.texts, s.activeBoardId);
}

function applyBoardLayerOrder(
  images: ImageItem[],
  texts: TextItem[],
  boardId: string,
  orderedIdsAscending: string[],
): { images: ImageItem[]; texts: TextItem[] } {
  return applyLayerOrderToBoard(images, texts, boardId, orderedIdsAscending);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  images: [],
  texts: [],
  groups: [],
  categories: [],
  boards: [createDefaultBoard()],
  activeBoardId: DEFAULT_BOARD_ID,
  selectedIds: [],
  selectedFrameId: null,
  viewport: { panX: 0, panY: 0, zoom: 1 },
  settings: {
    ...DEFAULT_SETTINGS,
    alwaysOnTop: localStorage.getItem("refboard-always-on-top") === "true",
  },
  isPanning: false,
  spacePressed: false,
  projectPath: null,
  isDirty: false,
  layoutMode: "grid",
  stageSize: { width: 800, height: 600 },

  setStageSize: (width, height) => set({ stageSize: { width, height } }),
  setViewport: (patch) =>
    set((s) => {
      const viewport = { ...s.viewport, ...patch };
      return {
        viewport,
        boards: syncBoardViewport(s.boards, s.activeBoardId, viewport),
      };
    }),
  setPanning: (panning) => set({ isPanning: panning }),
  setSpacePressed: (pressed) => set({ spacePressed: pressed }),
  setProjectPath: (path) => set({ projectPath: path }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSettings: (patch) =>
    set((s) => {
      const settings = { ...s.settings, ...patch };
      if (patch.alwaysOnTop !== undefined) {
        localStorage.setItem("refboard-always-on-top", String(patch.alwaysOnTop));
      }
      return { settings, isDirty: true };
    }),

  addImages: (items, autoLayout = true) => {
    const state = get();
    const boardId = state.activeBoardId;
    const scaled = applyImportStrategy(items, state.settings.importStrategy).map(
      (item) => ({ ...item, boardId: item.boardId ?? boardId }),
    );
    let nextZ = nextImageZOnBoard(state.images, boardId);
    const targetGroupId = state.selectedFrameId;
    const withZ = scaled.map((item) => {
      const zIndex = nextZ++;
      return { ...item, zIndex: Math.min(zIndex, TEXT_Z_BASE - 1) };
    });
    const withGroup = withZ.map((item) =>
      targetGroupId ? { ...item, groupId: targetGroupId } : item,
    );
    let merged = [...state.images, ...withGroup];
    if (autoLayout && withGroup.length > 0) {
      const origin = getLayoutOrigin(
        state.viewport.panX,
        state.viewport.panY,
        state.viewport.zoom,
        state.stageSize.width,
        state.stageSize.height,
      );
      merged = [
        ...state.images,
        ...applyLayout(withGroup, state.layoutMode, origin.x, origin.y),
      ];
    }
    set({ images: merged, isDirty: true });
    if (withGroup.length > 0) {
      useUiStore.getState().setCategoryFilter("all");
      if (targetGroupId) get().syncFrameBounds(targetGroupId);
    }
  },

  addTextAt: (x, y) => {
    const s = get();
    const origin = getLayoutOrigin(
      s.viewport.panX,
      s.viewport.panY,
      s.viewport.zoom,
      s.stageSize.width,
      s.stageSize.height,
    );
    const item = createTextItem({
      boardId: s.activeBoardId,
      x: x ?? origin.x,
      y: y ?? origin.y,
      zIndex: nextTextZOnBoard(s.images, s.texts, s.activeBoardId),
      groupId: s.selectedFrameId,
    });
    set({
      texts: [...s.texts, item],
      selectedIds: [item.id],
      selectedFrameId: null,
      isDirty: true,
    });
    if (s.selectedFrameId) get().syncFrameBounds(s.selectedFrameId);
    useUiStore.getState().setEditingTextId(item.id);
    return item.id;
  },

  updateText: (id, patch) =>
    set((s) => {
      let frameToSync: string | null = null;
      const texts = s.texts.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        const sizeLocked =
          patch.width !== undefined || patch.height !== undefined;
        const autoSize = next.autoSize !== false;
        if (
          !sizeLocked &&
          autoSize &&
          (patch.text !== undefined || patch.fontSize !== undefined)
        ) {
          const { width, height } = measureTextBox(next.text, next.fontSize);
          next.width = width;
          next.height = height;
          if (next.groupId) frameToSync = next.groupId;
        }
        return next;
      });
      if (frameToSync) queueMicrotask(() => get().syncFrameBounds(frameToSync!));
      return { texts, isDirty: true };
    }),

  setTextBackgroundSelected: (backgroundColor, textFill) =>
    set((s) => {
      const ids = new Set(s.selectedIds);
      if (ids.size === 0) return s;
      return {
        texts: s.texts.map((t) => {
          if (!ids.has(t.id)) return t;
          const patch: Partial<TextItem> = { backgroundColor };
          if (textFill !== undefined) patch.fill = textFill;
          return { ...t, ...patch };
        }),
        isDirty: true,
      };
    }),

  setFrameColorSelected: (strokeColor, fillColor) =>
    set((s) => {
      const fid = s.selectedFrameId;
      if (!fid) return s;
      return {
        groups: s.groups.map((g) =>
          g.id === fid ? { ...g, strokeColor, fillColor } : g,
        ),
        isDirty: true,
      };
    }),

  remeasureText: (id) => {
    set((s) => {
      const t = s.texts.find((x) => x.id === id);
      if (!t || t.autoSize === false) return s;
      const { width, height } = measureTextBox(t.text, t.fontSize);
      if (t.width === width && t.height === height) return s;
      const frameToSync = t.groupId;
      const texts = s.texts.map((x) =>
        x.id === id ? { ...x, width, height } : x,
      );
      if (frameToSync) {
        queueMicrotask(() => get().syncFrameBounds(frameToSync));
      }
      return { texts, isDirty: true };
    });
  },

  importPaths: async (paths) => {
    if (paths.length === 0) return;
    const state = get();
    const origin = getLayoutOrigin(
      state.viewport.panX,
      state.viewport.panY,
      state.viewport.zoom,
      state.stageSize.width,
      state.stageSize.height,
    );
    const onBoard = filterImagesByBoard(state.images, state.activeBoardId);
    const maxZ = onBoard.reduce((m, i) => Math.max(m, i.zIndex), 0);
    try {
      const items = await loadImagesFromPaths(paths, origin, maxZ + 1);
      if (items.length === 0) {
        alert("没有可导入的图片（请检查格式是否为 png/jpg/webp 等）。");
        return;
      }
      get().addImages(items, true);
      queueMicrotask(() => get().fitToView());
    } catch (err) {
      console.error("importPaths failed", err);
      alert(
        `导入失败：${err instanceof Error ? err.message : String(err)}\n\n若在浏览器中打开，请改用「npm run tauri dev」桌面版导入本地文件。`,
      );
    }
  },

  updateImage: (id, patch) =>
    set((s) => ({
      images: s.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
      isDirty: true,
    })),

  updateSelected: (patch) =>
    set((s) => ({
      images: s.images.map((img) =>
        s.selectedIds.includes(img.id) ? { ...img, ...patch } : img,
      ),
      isDirty: true,
    })),

  removeSelected: () => {
    const s = get();
    if (s.selectedFrameId) {
      const fid = s.selectedFrameId;
      set({
        ...detachFrameMembers(s, fid),
        selectedFrameId: null,
        selectedIds: [],
        isDirty: true,
      });
      return;
    }
    const toRemove = new Set(s.selectedIds);
    const affectedGroups = affectedGroupIdsFromRemoval(
      s.images,
      s.texts,
      toRemove,
    );
    const remaining = s.images.filter((img) => !toRemove.has(img.id));
    revokeBlobUrls(s.images.filter((img) => toRemove.has(img.id)));
    set({
      images: remaining,
      texts: s.texts.filter((t) => !toRemove.has(t.id)),
      groups: s.groups.map((g) => ({
        ...g,
        childIds: (g.childIds ?? []).filter((id) => !toRemove.has(id)),
      })),
      selectedIds: [],
      isDirty: true,
    });
    for (const gid of affectedGroups) {
      queueMicrotask(() => get().syncFrameBounds(gid));
    }
  },

  duplicateSelected: () =>
    set((s) => {
      const selected = s.images.filter((img) => s.selectedIds.includes(img.id));
      const selectedTexts = s.texts.filter((t) => s.selectedIds.includes(t.id));
      let imgZ = nextImageZOnBoard(s.images, s.activeBoardId);
      const copies = selected.map((img) => {
        const zIndex = imgZ++;
        return {
          ...img,
          id: uuidv4(),
          x: img.x + 30,
          y: img.y + 30,
          zIndex: Math.min(zIndex, TEXT_Z_BASE - 1),
        };
      });
      let txtZ = nextTextZOnBoard(s.images, s.texts, s.activeBoardId);
      const textCopies = selectedTexts.map((t) => {
        const zIndex = txtZ++;
        return {
          ...t,
          id: uuidv4(),
          x: t.x + 30,
          y: t.y + 30,
          zIndex,
        };
      });
      return {
        images: [...s.images, ...copies],
        texts: [...s.texts, ...textCopies],
        selectedIds: [...copies, ...textCopies].map((c) => c.id),
        isDirty: true,
      };
    }),

  selectImage: (id, additive) =>
    set((s) => {
      const img = s.images.find((i) => i.id === id);
      const txt = s.texts.find((t) => t.id === id);
      const locked = img?.locked || txt?.locked;
      if (locked && !additive) return { selectedIds: [id] };
      if (additive) {
        const exists = s.selectedIds.includes(id);
        return {
          selectedIds: exists
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        };
      }
      return { selectedIds: [id], selectedFrameId: null };
    }),

  clearSelection: () => set({ selectedIds: [], selectedFrameId: null }),
  setSelectedIds: (ids) => set({ selectedIds: ids, selectedFrameId: null }),
  setSelectedFrameId: (id) => set({ selectedFrameId: id }),
  selectFrame: (id) => set({ selectedFrameId: id, selectedIds: [] }),

  createFrameFromRect: (x, y, w, h) => {
    const id = uuidv4();
    const name = `主题 ${get().groups.length + 1}`;
    set((s) => ({
      groups: [
        ...s.groups,
        {
          id,
          name,
          boardId: s.activeBoardId,
          kind: "frame",
          x,
          y,
          width: Math.max(FRAME_MIN_SIZE, w),
          height: Math.max(FRAME_MIN_SIZE, h),
          collapsed: false,
          boundsLocked: true,
        },
      ],
      selectedFrameId: id,
      selectedIds: [],
      isDirty: true,
    }));
    return id;
  },

  moveFrame: (frameId, newX, newY) =>
    set((s) => {
      const frame = s.groups.find((g) => g.id === frameId);
      if (!frame) return s;
      const dx = newX - frame.x;
      const dy = newY - frame.y;
      return {
        groups: s.groups.map((g) =>
          g.id === frameId ? { ...g, x: newX, y: newY } : g,
        ),
        images: s.images.map((img) =>
          img.groupId === frameId
            ? { ...img, x: img.x + dx, y: img.y + dy }
            : img,
        ),
        texts: s.texts.map((t) =>
          t.groupId === frameId ? { ...t, x: t.x + dx, y: t.y + dy } : t,
        ),
        isDirty: true,
      };
    }),

  resizeFrame: (frameId, patch) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === frameId
          ? {
              ...g,
              x: patch.x,
              y: patch.y,
              width: Math.max(FRAME_MIN_SIZE, patch.width),
              height: Math.max(FRAME_MIN_SIZE, patch.height),
              boundsLocked: true,
            }
          : g,
      ),
      isDirty: true,
    })),

  syncFrameBounds: (frameId) =>
    set((s) => {
      const group = s.groups.find((g) => g.id === frameId);
      if (!group) return s;
      const padding = isClusterGroup(group) ? CLUSTER_PADDING : FRAME_PADDING;
      const rect = computeGroupRect(s.images, s.texts, frameId, padding);
      if (!rect) return s;
      return {
        groups: s.groups.map((g) =>
          g.id === frameId ? { ...g, ...rect, boundsLocked: false } : g,
        ),
        isDirty: true,
      };
    }),

  afterImageDrag: (imageId) => {
    const s = get();
    const img = s.images.find((i) => i.id === imageId);
    if (!img) return;

    const imageBounds = getImageBounds(img);
    const oldFrameId = img.groupId;
    const boardGroups = s.groups.filter((g) => g.boardId === s.activeBoardId);

    let newFrameId: string | null = null;

    if (oldFrameId) {
      const oldGroup = boardGroups.find((g) => g.id === oldFrameId);
      if (oldGroup && boundsOverlapImageFrame(imageBounds, oldGroup)) {
        newFrameId = oldFrameId;
      }
    }

    if (newFrameId === null) {
      const joinTarget = findGroupOverlappingImage(imageBounds, boardGroups);
      newFrameId = joinTarget?.id ?? null;
    }

    if (oldFrameId === newFrameId) {
      if (newFrameId) get().syncFrameBounds(newFrameId);
      return;
    }

    set({
      images: s.images.map((i) =>
        i.id === imageId ? { ...i, groupId: newFrameId } : i,
      ),
      isDirty: true,
    });
    if (oldFrameId) get().syncFrameBounds(oldFrameId);
    if (newFrameId) get().syncFrameBounds(newFrameId);
  },

  afterTextDrag: (textId) => {
    const s = get();
    const txt = s.texts.find((t) => t.id === textId);
    if (!txt) return;

    const textBounds = getTextBounds(txt);
    const oldFrameId = txt.groupId;
    const boardGroups = s.groups.filter((g) => g.boardId === s.activeBoardId);

    let newFrameId: string | null = null;

    if (oldFrameId) {
      const oldGroup = boardGroups.find((g) => g.id === oldFrameId);
      if (oldGroup && boundsOverlapImageFrame(textBounds, oldGroup)) {
        newFrameId = oldFrameId;
      }
    }

    if (newFrameId === null) {
      const joinTarget = findGroupOverlappingImage(textBounds, boardGroups);
      newFrameId = joinTarget?.id ?? null;
    }

    if (oldFrameId === newFrameId) {
      if (newFrameId) get().syncFrameBounds(newFrameId);
      return;
    }

    set({
      texts: s.texts.map((t) =>
        t.id === textId ? { ...t, groupId: newFrameId } : t,
      ),
      isDirty: true,
    });
    if (oldFrameId) get().syncFrameBounds(oldFrameId);
    if (newFrameId) get().syncFrameBounds(newFrameId);
  },

  removeSelectedFrame: () => {
    const s = get();
    const fid = s.selectedFrameId;
    if (!fid) return;
    set({
      ...detachFrameMembers(s, fid),
      selectedFrameId: null,
      isDirty: true,
    });
  },

  bringToFront: (id) => {
    const s = get();
    if (s.images.some((i) => i.id === id)) {
      get().updateImage(id, {
        zIndex: nextImageZOnBoard(s.images, s.activeBoardId),
      });
    } else if (s.texts.some((t) => t.id === id)) {
      get().updateText(id, {
        zIndex: nextTextZOnBoard(s.images, s.texts, s.activeBoardId),
      });
    }
  },

  layerMoveUp: () => {
    const s = get();
    if (s.selectedIds.length === 0) return;
    const ids = layerIdsOnActiveBoard(s);
    for (const sid of s.selectedIds) {
      const idx = ids.indexOf(sid);
      if (idx < ids.length - 1) [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    }
    const next = applyBoardLayerOrder(
      s.images,
      s.texts,
      s.activeBoardId,
      ids,
    );
    set({ ...next, isDirty: true });
  },

  layerMoveDown: () => {
    const s = get();
    if (s.selectedIds.length === 0) return;
    const ids = layerIdsOnActiveBoard(s);
    for (const sid of [...s.selectedIds].reverse()) {
      const idx = ids.indexOf(sid);
      if (idx > 0) [ids[idx], ids[idx - 1]] = [ids[idx - 1], ids[idx]];
    }
    const next = applyBoardLayerOrder(
      s.images,
      s.texts,
      s.activeBoardId,
      ids,
    );
    set({ ...next, isDirty: true });
  },

  layerToTop: () => {
    const s = get();
    const ids = layerIdsOnActiveBoard(s);
    const rest = ids.filter((id) => !s.selectedIds.includes(id));
    const sel = ids.filter((id) => s.selectedIds.includes(id));
    const next = applyBoardLayerOrder(
      s.images,
      s.texts,
      s.activeBoardId,
      [...rest, ...sel],
    );
    set({ ...next, isDirty: true });
  },

  layerToBottom: () => {
    const s = get();
    const ids = layerIdsOnActiveBoard(s);
    const sel = ids.filter((id) => s.selectedIds.includes(id));
    const rest = ids.filter((id) => !s.selectedIds.includes(id));
    const next = applyBoardLayerOrder(
      s.images,
      s.texts,
      s.activeBoardId,
      [...sel, ...rest],
    );
    set({ ...next, isDirty: true });
  },

  toggleLockSelected: () =>
    set((s) => {
      const allLocked = s.selectedIds.every((id) => {
        const img = s.images.find((i) => i.id === id);
        const txt = s.texts.find((t) => t.id === id);
        return img?.locked ?? txt?.locked ?? false;
      });
      return {
        images: s.images.map((img) =>
          s.selectedIds.includes(img.id) ? { ...img, locked: !allLocked } : img,
        ),
        texts: s.texts.map((t) =>
          s.selectedIds.includes(t.id) ? { ...t, locked: !allLocked } : t,
        ),
        isDirty: true,
      };
    }),

  toggleVisibleSelected: () =>
    set((s) => {
      const allVisible = s.selectedIds.every((id) => {
        const img = s.images.find((i) => i.id === id);
        const txt = s.texts.find((t) => t.id === id);
        return (img?.visible ?? txt?.visible) !== false;
      });
      return {
        images: s.images.map((img) =>
          s.selectedIds.includes(img.id) ? { ...img, visible: !allVisible } : img,
        ),
        texts: s.texts.map((t) =>
          s.selectedIds.includes(t.id) ? { ...t, visible: !allVisible } : t,
        ),
        isDirty: true,
      };
    }),

  flipSelectedH: () =>
    set((s) => ({
      images: s.images.map((img) =>
        s.selectedIds.includes(img.id) ? { ...img, flipX: !img.flipX } : img,
      ),
      isDirty: true,
    })),

  flipSelectedV: () =>
    set((s) => ({
      images: s.images.map((img) =>
        s.selectedIds.includes(img.id) ? { ...img, flipY: !img.flipY } : img,
      ),
      isDirty: true,
    })),

  setColorMarkSelected: (mark) => get().updateSelected({ colorMark: mark }),

  addCategory: (name) => {
    const id = uuidv4();
    set((s) => ({
      categories: [...s.categories, { id, name: name.trim() || "未命名" }],
      isDirty: true,
    }));
    return id;
  },

  renameCategory: (id, name) =>
    set((s) => ({
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, name: name.trim() || c.name } : c,
      ),
      isDirty: true,
    })),

  removeCategory: (id) =>
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      images: s.images.map((img) =>
        img.categoryId === id ? { ...img, categoryId: null } : img,
      ),
      isDirty: true,
    })),

  assignCategoryToSelected: (categoryId) => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0) return;
    set((s) => ({
      images: s.images.map((img) =>
        ids.has(img.id) ? { ...img, categoryId } : img,
      ),
      isDirty: true,
    }));
  },

  addBoard: (name) => {
    const id = uuidv4();
    const viewport = { panX: 0, panY: 0, zoom: 1 };
    set((s) => {
      const boards = syncBoardViewport(s.boards, s.activeBoardId, s.viewport);
      return {
        boards: [
          ...boards,
          {
            id,
            name: name.trim() || `画板 ${boards.length + 1}`,
            viewport,
          },
        ],
        activeBoardId: id,
        viewport,
        selectedIds: [],
        selectedFrameId: null,
        isDirty: true,
      };
    });
    useUiStore.getState().setCategoryFilter("all");
    return id;
  },

  renameBoard: (id, name) =>
    set((s) => ({
      boards: s.boards.map((b) =>
        b.id === id ? { ...b, name: name.trim() || b.name } : b,
      ),
      isDirty: true,
    })),

  removeBoard: (id) => {
    const s = get();
    if (s.boards.length <= 1) return;
    const fallback = s.boards.find((b) => b.id !== id)?.id;
    if (!fallback) return;
    if (
      countBoardContent(s.images, s.texts, id) > 0 &&
      !confirm("该画板仍有图片或标注，删除后内容将移到其它画板。继续？")
    ) {
      return;
    }
    set({
      boards: s.boards.filter((b) => b.id !== id),
      images: s.images.map((img) =>
        img.boardId === id ? { ...img, boardId: fallback, groupId: null } : img,
      ),
      texts: s.texts.map((t) =>
        t.boardId === id ? { ...t, boardId: fallback, groupId: null } : t,
      ),
      groups: s.groups.filter((g) => g.boardId !== id),
      activeBoardId: s.activeBoardId === id ? fallback : s.activeBoardId,
      viewport:
        s.activeBoardId === id
          ? { ...s.boards.find((b) => b.id === fallback)!.viewport }
          : s.viewport,
      selectedIds: [],
      selectedFrameId: null,
      isDirty: true,
    });
  },

  switchBoard: (id) => {
    const s = get();
    if (id === s.activeBoardId) return;
    const target = s.boards.find((b) => b.id === id);
    if (!target) return;
    useUiStore.getState().clearImageZoom();
    const boards = syncBoardViewport(s.boards, s.activeBoardId, s.viewport);
    set({
      boards,
      activeBoardId: id,
      viewport: { ...target.viewport },
      selectedIds: [],
      selectedFrameId: null,
    });
    useUiStore.getState().setCategoryFilter("all");
  },

  moveSelectedToBoard: (boardId) => {
    const ids = new Set(get().selectedIds);
    if (ids.size === 0 || !get().boards.some((b) => b.id === boardId)) return;
    set((s) => ({
      images: s.images.map((img) =>
        ids.has(img.id) ? { ...img, boardId, groupId: null } : img,
      ),
      texts: s.texts.map((t) =>
        ids.has(t.id) ? { ...t, boardId, groupId: null } : t,
      ),
      selectedIds: [],
      selectedFrameId: null,
      isDirty: true,
    }));
  },

  alignSelected: (kind) =>
    set((s) => ({
      images: alignImages(s.images, s.selectedIds, kind),
      isDirty: true,
    })),

  adjustOpacity: (delta) =>
    set((s) => ({
      images: s.images.map((img) =>
        s.selectedIds.includes(img.id)
          ? { ...img, opacity: Math.min(1, Math.max(0.05, img.opacity + delta)) }
          : img,
      ),
      isDirty: true,
    })),

  nudgeSelected: (dx, dy) =>
    set((s) => {
      if (s.selectedFrameId) {
        const fid = s.selectedFrameId;
        const frame = s.groups.find((g) => g.id === fid);
        if (!frame) return s;
        return {
          groups: s.groups.map((g) =>
            g.id === fid ? { ...g, x: g.x + dx, y: g.y + dy } : g,
          ),
          images: s.images.map((img) =>
            img.groupId === fid ? { ...img, x: img.x + dx, y: img.y + dy } : img,
          ),
          texts: s.texts.map((t) =>
            t.groupId === fid ? { ...t, x: t.x + dx, y: t.y + dy } : t,
          ),
          isDirty: true,
        };
      }
      const moveIds = new Set(
        s.selectedIds.filter((id) => {
          const img = s.images.find((i) => i.id === id);
          const txt = s.texts.find((t) => t.id === id);
          return !(img?.locked || txt?.locked);
        }),
      );
      for (const id of s.selectedIds) {
        const img = s.images.find((i) => i.id === id);
        if (img?.groupId && isClusterMember(img.groupId, s.groups)) {
          s.images
            .filter((i) => i.groupId === img.groupId && !i.locked)
            .forEach((i) => moveIds.add(i.id));
          s.texts
            .filter((t) => t.groupId === img.groupId && !t.locked)
            .forEach((t) => moveIds.add(t.id));
        }
      }
      return {
        images: s.images.map((img) =>
          moveIds.has(img.id) ? { ...img, x: img.x + dx, y: img.y + dy } : img,
        ),
        texts: s.texts.map((t) =>
          moveIds.has(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t,
        ),
        isDirty: true,
      };
    }),

  autoLayout: () =>
    set((s) => {
      const origin = getLayoutOrigin(
        s.viewport.panX,
        s.viewport.panY,
        s.viewport.zoom,
        s.stageSize.width,
        s.stageSize.height,
      );
      return { images: applyLayout(s.images, s.layoutMode, origin.x, origin.y), isDirty: true };
    }),

  resetViewport: () => set({ viewport: { panX: 0, panY: 0, zoom: 1 } }),

  fitToView: () => {
    useUiStore.getState().clearImageZoom();
    const { images, texts, selectedIds, stageSize, activeBoardId } = get();
    const ui = useUiStore.getState();
    const onBoard = filterImagesByBoard(images, activeBoardId);
    const onBoardTexts = filterTextsByBoard(texts, activeBoardId);
    let bounds;
    if (selectedIds.length > 0) {
      const selImg = onBoard.filter((img) => selectedIds.includes(img.id));
      const selTxt = onBoardTexts.filter((t) => selectedIds.includes(t.id));
      bounds = getBoundsForCanvasItems(selImg, selTxt);
    } else if (get().selectedFrameId) {
      const fid = get().selectedFrameId!;
      bounds = getBoundsForCanvasItems(
        onBoard.filter((img) => img.groupId === fid),
        onBoardTexts.filter((t) => t.groupId === fid),
      );
    } else {
      const filtered = filterImages(
        onBoard,
        ui.colorFilter,
        ui.layerSearch,
        ui.categoryFilter,
      );
      const imgTargets = filtered.length > 0 ? filtered : onBoard;
      bounds = getBoundsForCanvasItems(imgTargets, onBoardTexts);
    }
    if (bounds.maxX <= bounds.minX) return;
    set({ viewport: computeFitViewport(bounds, stageSize.width, stageSize.height) });
  },

  fitToGroup: (groupId) => {
    const { images, texts, stageSize } = get();
    const imgs = images.filter((img) => img.groupId === groupId && img.visible);
    const txts = texts.filter((t) => t.groupId === groupId && t.visible);
    if (imgs.length === 0 && txts.length === 0) return;
    const bounds = getBoundsForCanvasItems(imgs, txts);
    set({ viewport: computeFitViewport(bounds, stageSize.width, stageSize.height) });
  },

  focusOnImage: (id) => {
    const { images, texts, stageSize } = get();
    const img = images.find((i) => i.id === id);
    const txt = texts.find((t) => t.id === id);
    if (!img && !txt) return;
    const bounds = img
      ? getBoundsForImages([img])
      : getBoundsForCanvasItems([], [txt!]);
    set({
      selectedIds: [id],
      viewport: computeFitViewport(bounds, stageSize.width, stageSize.height, 120),
    });
  },

  toggleImageZoom: (imageId) => {
    const ui = useUiStore.getState();
    const s = get();

    if (ui.imageZoomFocusId === imageId && ui.viewportBeforeImageZoom) {
      const vp = { ...ui.viewportBeforeImageZoom };
      set({
        viewport: vp,
        boards: syncBoardViewport(s.boards, s.activeBoardId, vp),
      });
      ui.clearImageZoom();
      return;
    }

    const img = s.images.find((i) => i.id === imageId);
    if (!img) return;

    const before = ui.viewportBeforeImageZoom ?? { ...s.viewport };
    const bounds = getBoundsForImages([img]);
    const vp = computeFitViewport(
      bounds,
      s.stageSize.width,
      s.stageSize.height,
      24,
      true,
    );
    set({
      viewport: vp,
      boards: syncBoardViewport(s.boards, s.activeBoardId, vp),
      selectedIds: [imageId],
      selectedFrameId: null,
    });
    useUiStore.setState({
      imageZoomFocusId: imageId,
      viewportBeforeImageZoom: before,
    });
  },

  setZoom: (zoom) => {
    const z = Math.min(8, Math.max(0.05, zoom));
    const { viewport, stageSize } = get();
    const cx = stageSize.width / 2;
    const cy = stageSize.height / 2;
    const worldX = (cx - viewport.panX) / viewport.zoom;
    const worldY = (cy - viewport.panY) / viewport.zoom;
    set((s) => {
      const viewport = {
        zoom: z,
        panX: cx - worldX * z,
        panY: cy - worldY * z,
      };
      return {
        viewport,
        boards: syncBoardViewport(s.boards, s.activeBoardId, viewport),
      };
    });
  },

  reorderLayersDisplayOrder: (activeId, targetIndex) =>
    set((s) => {
      const imageIdSet = new Set(
        filterImagesByBoard(s.images, s.activeBoardId).map((i) => i.id),
      );
      if (!imageIdSet.has(activeId)) return s;

      const allDesc = layerIdsOnActiveBoard(s).reverse();
      const imagesDesc = allDesc.filter((id) => imageIdSet.has(id));
      const from = imagesDesc.indexOf(activeId);
      if (from < 0) return s;
      imagesDesc.splice(from, 1);
      const idx = Math.max(0, Math.min(targetIndex, imagesDesc.length));
      imagesDesc.splice(idx, 0, activeId);

      let imgIdx = 0;
      const newDesc = allDesc.map((id) =>
        imageIdSet.has(id) ? imagesDesc[imgIdx++]! : id,
      );
      const next = applyBoardLayerOrder(
        s.images,
        s.texts,
        s.activeBoardId,
        [...newDesc].reverse(),
      );
      return { ...next, isDirty: true };
    }),

  createGroupFromSelected: (kind) => {
    const s = get();
    if (s.selectedIds.length < 1) return;
    const groupKind: ImageGroupKind =
      kind ?? (useUiStore.getState().appMode === "view" ? "cluster" : "frame");
    const selectedImages = s.images.filter((i) => s.selectedIds.includes(i.id));
    const selectedTexts = s.texts.filter((t) => s.selectedIds.includes(t.id));
    const memberIds = [
      ...selectedImages.map((i) => i.id),
      ...selectedTexts.map((t) => t.id),
    ];
    const padding =
      groupKind === "cluster" ? CLUSTER_PADDING : FRAME_PADDING;
    const rect =
      computeItemsRect(selectedImages, selectedTexts, padding) ?? {
        x: 0,
        y: 0,
        width: FRAME_MIN_SIZE * 4,
        height: FRAME_MIN_SIZE * 3,
      };
    const onBoard = s.groups.filter((g) => g.boardId === s.activeBoardId);
    const clusterCount = onBoard.filter((g) => isClusterGroup(g)).length + 1;
    const frameCount = onBoard.filter((g) => !isClusterGroup(g)).length + 1;
    const gid = uuidv4();
    const name =
      groupKind === "cluster" ? `组 ${clusterCount}` : `主题 ${frameCount}`;

    set({
      groups: [
        ...s.groups,
        {
          id: gid,
          name,
          boardId: s.activeBoardId,
          kind: groupKind,
          ...rect,
          collapsed: false,
        },
      ],
      images: s.images.map((img) =>
        s.selectedIds.includes(img.id) ? { ...img, groupId: gid } : img,
      ),
      texts: s.texts.map((t) =>
        s.selectedIds.includes(t.id) ? { ...t, groupId: gid } : t,
      ),
      selectedFrameId: gid,
      selectedIds: memberIds,
      isDirty: true,
    });
    get().syncFrameBounds(gid);
  },

  selectGroupMembers: (groupId) => {
    const s = get();
    const ids = [
      ...s.images.filter((i) => i.groupId === groupId).map((i) => i.id),
      ...s.texts.filter((t) => t.groupId === groupId).map((t) => t.id),
    ];
    if (ids.length === 0) return;
    set({ selectedIds: ids, selectedFrameId: null });
  },

  assignSelectedToGroup: (groupId) => {
    const s = get();
    if (s.selectedIds.length === 0 && groupId) return;
    set({
      images: s.images.map((img) =>
        s.selectedIds.includes(img.id) ? { ...img, groupId } : img,
      ),
      texts: s.texts.map((t) =>
        s.selectedIds.includes(t.id) ? { ...t, groupId } : t,
      ),
      isDirty: true,
    });
    if (groupId) get().syncFrameBounds(groupId);
  },

  renameGroup: (groupId, name) =>
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
      isDirty: true,
    })),

  removeGroup: (groupId) =>
    set((s) => ({
      ...detachFrameMembers(s, groupId),
      selectedFrameId: s.selectedFrameId === groupId ? null : s.selectedFrameId,
      isDirty: true,
    })),

  dissolveGroupFromSelected: () =>
    set((s) => {
      const groupIds = new Set(
        s.selectedIds
          .map((id) => {
            const img = s.images.find((i) => i.id === id);
            if (img?.groupId) return img.groupId;
            return s.texts.find((t) => t.id === id)?.groupId ?? null;
          })
          .filter((g): g is string => !!g),
      );
      if (groupIds.size === 0) return s;
      return {
        groups: s.groups.filter((g) => !groupIds.has(g.id)),
        images: s.images.map((img) =>
          img.groupId && groupIds.has(img.groupId) ? { ...img, groupId: null } : img,
        ),
        texts: s.texts.map((t) =>
          t.groupId && groupIds.has(t.groupId) ? { ...t, groupId: null } : t,
        ),
        isDirty: true,
      };
    }),

  selectAll: () =>
    set((s) => ({
      selectedIds: [
        ...filterImagesByBoard(s.images, s.activeBoardId).map((i) => i.id),
        ...filterTextsByBoard(s.texts, s.activeBoardId).map((t) => t.id),
      ],
    })),

  distributeH: () =>
    set((s) => ({
      images: distributeHorizontal(s.images, s.selectedIds),
      isDirty: true,
    })),

  distributeV: () =>
    set((s) => ({
      images: distributeVertical(s.images, s.selectedIds),
      isDirty: true,
    })),

  newFromTemplate: (templateId) => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    revokeBlobUrls(get().images);
    set({
      images: [],
      texts: [],
      groups: [],
      categories: [],
      boards: [createDefaultBoard()],
      activeBoardId: DEFAULT_BOARD_ID,
      selectedIds: [],
      viewport: { panX: 0, panY: 0, zoom: 1 },
      projectPath: null,
      isDirty: false,
      layoutMode: tpl.layoutMode,
      settings: {
        ...get().settings,
        canvasBackground: tpl.canvasBackground,
        importStrategy: tpl.importStrategy,
      },
    });
  },

  loadProject: (images, texts, groups, categories, boards, activeBoardId, settings, path) => {
    revokeBlobUrls(get().images);
    const active =
      boards.find((b) => b.id === activeBoardId)?.id ?? boards[0]?.id ?? DEFAULT_BOARD_ID;
    const board = boards.find((b) => b.id === active)!;
    let normalizedImages = images;
    let normalizedTexts = texts;
    for (const b of boards) {
      normalizedTexts = bumpTextsAboveImages(
        normalizedImages,
        normalizedTexts,
        b.id,
      );
      const order = boardLayerIdsAscending(
        normalizedImages,
        normalizedTexts,
        b.id,
      );
      const next = applyLayerOrderToBoard(
        normalizedImages,
        normalizedTexts,
        b.id,
        order,
      );
      normalizedImages = next.images;
      normalizedTexts = next.texts;
    }
    set({
      images: normalizedImages,
      texts: normalizedTexts,
      groups,
      categories,
      boards,
      activeBoardId: active,
      viewport: { ...board.viewport },
      settings,
      projectPath: path,
      isDirty: false,
      selectedIds: [],
      selectedFrameId: null,
    });
  },

  newProject: () => {
    revokeBlobUrls(get().images);
    set({
      images: [],
      texts: [],
      groups: [],
      categories: [],
      boards: [createDefaultBoard()],
      activeBoardId: DEFAULT_BOARD_ID,
      selectedIds: [],
      selectedFrameId: null,
      viewport: { panX: 0, panY: 0, zoom: 1 },
      projectPath: null,
      isDirty: false,
      settings: {
        ...DEFAULT_SETTINGS,
        alwaysOnTop: get().settings.alwaysOnTop,
      },
    });
    useUiStore.getState().setCategoryFilter("all");
  },

  markSaved: (path) => set({ projectPath: path, isDirty: false }),

  getSnapshot: () => {
    const s = get();
    return {
      images: s.images,
      texts: s.texts,
      groups: s.groups,
      categories: s.categories,
      boards: syncBoardViewport(s.boards, s.activeBoardId, s.viewport),
      activeBoardId: s.activeBoardId,
      viewport: s.viewport,
      settings: s.settings,
      projectPath: s.projectPath,
    };
  },
}));
