export type ColorMarkId =
  | "none"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

export type ImageItem = {
  id: string;
  src: string;
  sourcePath?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  flipX: boolean;
  flipY: boolean;
  locked: boolean;
  visible: boolean;
  colorMark: ColorMarkId;
  groupId: string | null;
  /** 逻辑分类（与画布位置无关，可随意拖动） */
  categoryId: string | null;
  /** 所属二级画板 */
  boardId: string;
};

/** 画布文本标注 */
export type TextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fill: string;
  backgroundColor: string;
  align: "left" | "center" | "right";
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  groupId: string | null;
  categoryId: string | null;
  boardId: string;
  /** 为 true 时框随文字自动收缩；手动缩放后为 false */
  autoSize?: boolean;
};

/** 项目内的二级画板：独立视口与图片空间 */
export type Board = {
  id: string;
  name: string;
  viewport: Viewport;
};

/** 命名分类，用于几百张图的筛选与归档 */
export type ImageCategory = {
  id: string;
  name: string;
};

/** 图片组：cluster=逻辑组（无框，联动移动）；frame=主题框（带边框） */
export type ImageGroupKind = "cluster" | "frame";

/** 画板上的图片组 / 主题框 */
export type ImageGroup = {
  id: string;
  name: string;
  boardId: string;
  kind?: ImageGroupKind;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
  /** @deprecated 仅兼容旧数据，成员关系以图片 groupId 为准 */
  themeKey?: string;
  collapsed?: boolean;
  childIds?: string[];
  /** 手动拉过角点缩放后为 true，仅避免「拖框移动」时立刻被 sync 覆盖；移动内部图片仍会重新贴合 */
  boundsLocked?: boolean;
  strokeColor?: string;
  fillColor?: string;
};

export type Viewport = {
  panX: number;
  panY: number;
  zoom: number;
};

export type LayoutMode = "grid" | "row";

/** 导入时缩放策略 */
export type ImportStrategy = "original" | "fit-short-edge" | "fit-width";

export type CanvasBackground = "dots-dark" | "dots-light" | "checker" | "solid";

export type ProjectSettings = {
  alwaysOnTop: boolean;
  canvasBackground: CanvasBackground;
  canvasBackgroundColor?: string;
  sidebarCollapsed: boolean;
  compactMode: boolean;
  importStrategy: ImportStrategy;
};

export type ProjectManifest = {
  version: number;
  viewport: Viewport;
  settings: ProjectSettings;
  boards?: Board[];
  activeBoardId?: string;
  groups: ImageGroup[];
  categories?: ImageCategory[];
  images: Array<{
    id: string;
    asset: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    opacity: number;
    zIndex: number;
    flipX?: boolean;
    flipY?: boolean;
    locked?: boolean;
    visible?: boolean;
    colorMark?: ColorMarkId;
    groupId?: string | null;
    categoryId?: string | null;
    boardId?: string;
  }>;
  texts?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fill: string;
    backgroundColor?: string;
    align?: "left" | "center" | "right";
    rotation: number;
    opacity: number;
    zIndex: number;
    locked?: boolean;
    visible?: boolean;
    groupId?: string | null;
    categoryId?: string | null;
    boardId?: string;
    autoSize?: boolean;
  }>;
};

export const MANIFEST_VERSION = 5;

export const DEFAULT_BOARD_ID = "main";

export const UNCATEGORIZED_FILTER = "__uncategorized__" as const;

export const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".tiff",
  ".tif",
];

export function isImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function createDefaultImageFields(
  partial?: Partial<
    Pick<ImageItem, "name" | "colorMark" | "groupId" | "categoryId" | "boardId">
  >,
): Pick<
  ImageItem,
  | "flipX"
  | "flipY"
  | "locked"
  | "visible"
  | "colorMark"
  | "groupId"
  | "categoryId"
  | "boardId"
  | "name"
> {
  return {
    name: partial?.name ?? "",
    flipX: false,
    flipY: false,
    locked: false,
    visible: true,
    colorMark: partial?.colorMark ?? "none",
    groupId: partial?.groupId ?? null,
    categoryId: partial?.categoryId ?? null,
    boardId: partial?.boardId ?? DEFAULT_BOARD_ID,
  };
}

export const DEFAULT_SETTINGS: ProjectSettings = {
  alwaysOnTop: false,
  canvasBackground: "dots-dark",
  sidebarCollapsed: true,
  compactMode: false,
  importStrategy: "fit-short-edge",
};
