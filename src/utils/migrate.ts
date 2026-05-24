import type { Board, ProjectManifest, ProjectSettings } from "../types/project";
import {
  DEFAULT_BOARD_ID,
  DEFAULT_SETTINGS,
  MANIFEST_VERSION,
} from "../types/project";
import { createDefaultBoard } from "./boardUtils";
import { measureTextBox } from "./measureTextBox";
import { DEFAULT_TEXT_BACKGROUND } from "./textDefaults";

type ManifestV1 = {
  version: number;
  viewport: ProjectManifest["viewport"];
  settings?: { alwaysOnTop?: boolean };
  images: ProjectManifest["images"];
};

function ensureBoards(m: ProjectManifest): {
  boards: Board[];
  activeBoardId: string;
} {
  if (m.boards && m.boards.length > 0) {
    const activeBoardId =
      m.activeBoardId && m.boards.some((b) => b.id === m.activeBoardId)
        ? m.activeBoardId
        : m.boards[0].id;
    return {
      boards: m.boards.map((b) => ({
        ...b,
        viewport: b.viewport ?? { ...m.viewport },
      })),
      activeBoardId,
    };
  }
  const main = createDefaultBoard("主画板", m.viewport, DEFAULT_BOARD_ID);
  return { boards: [main], activeBoardId: main.id };
}

export function migrateManifest(raw: ProjectManifest | ManifestV1): ProjectManifest {
  if (raw.version >= 2) {
    const m = raw as ProjectManifest;
    const { boards, activeBoardId } = ensureBoards(m);
    return {
      ...m,
      version: MANIFEST_VERSION,
      settings: {
        ...DEFAULT_SETTINGS,
        ...m.settings,
        canvasBackground: m.settings.canvasBackground ?? "dots-dark",
        importStrategy: m.settings.importStrategy ?? "fit-short-edge",
      },
      boards,
      activeBoardId,
      groups: (m.groups ?? []).map((g) => ({
        ...g,
        boardId: g.boardId ?? DEFAULT_BOARD_ID,
        kind: g.kind ?? "frame",
      })),
      categories: m.categories ?? [],
      texts: (m.texts ?? []).map((t) => {
        const fontSize =
          t.fontSize == null || t.fontSize <= 20
            ? 24
            : t.fontSize === 32
              ? 24
              : t.fontSize;
        const autoSize = t.autoSize !== false;
        const { width, height } = autoSize
          ? measureTextBox(t.text ?? "", fontSize)
          : { width: t.width, height: t.height };
        return {
        ...t,
        fontSize,
        width,
        height,
        autoSize: t.autoSize ?? true,
        backgroundColor: t.backgroundColor ?? DEFAULT_TEXT_BACKGROUND,
        align: t.align ?? "left",
        locked: t.locked ?? false,
        visible: t.visible ?? true,
        groupId: t.groupId ?? null,
        categoryId: t.categoryId ?? null,
        boardId: t.boardId ?? DEFAULT_BOARD_ID,
      };
      }),
      images: m.images.map((img) => ({
        ...img,
        name: img.name ?? "",
        flipX: img.flipX ?? false,
        flipY: img.flipY ?? false,
        locked: img.locked ?? false,
        visible: img.visible ?? true,
        colorMark: img.colorMark ?? "none",
        groupId: img.groupId ?? null,
        categoryId: img.categoryId ?? null,
        boardId: img.boardId ?? DEFAULT_BOARD_ID,
      })),
    };
  }

  const v1 = raw as ManifestV1;
  const settings: ProjectSettings = {
    ...DEFAULT_SETTINGS,
    alwaysOnTop: v1.settings?.alwaysOnTop ?? false,
    importStrategy: "fit-short-edge",
  };

  const boards = [createDefaultBoard("主画板", v1.viewport, DEFAULT_BOARD_ID)];
  return {
    version: MANIFEST_VERSION,
    viewport: v1.viewport,
    settings,
    boards,
    activeBoardId: DEFAULT_BOARD_ID,
    groups: [],
    categories: [],
    texts: [],
    images: v1.images.map((img) => ({
      ...img,
      name: img.name ?? "",
      flipX: false,
      flipY: false,
      locked: false,
      visible: true,
      colorMark: "none" as const,
      groupId: null,
      categoryId: null,
      boardId: DEFAULT_BOARD_ID,
    })),
  };
}
