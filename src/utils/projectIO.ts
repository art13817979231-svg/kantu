import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import type {
  Board,
  ImageCategory,
  ImageGroup,
  ImageItem,
  ProjectManifest,
  ProjectSettings,
  TextItem,
} from "../types/project";
import { DEFAULT_BOARD_ID } from "../types/project";
import { MANIFEST_VERSION } from "../types/project";
import { getExtension, hydrateDisplayThumbnails, readPathAsBytes } from "./imageLoader";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isTauriApp } from "./tauriEnv";
import { importFromFiles } from "../hooks/useBrowserDrop";
import { DEFAULT_TEXT_BACKGROUND } from "./textDefaults";
import { hydrateFrameGroups } from "./hydrateFrames";
import { migrateManifest } from "./migrate";

type SaveAssetPayload = {
  asset_path: string;
  data: number[];
};

type OpenProjectResult = {
  manifest: string;
  temp_dir: string;
  assets: Array<{ id: string; path: string }>;
};

function pickFilesBrowser(multiple: boolean, accept: string): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = accept;
    input.onchange = () => resolve(input.files);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function pickOpenProject(): Promise<string | null> {
  if (!isTauriApp()) {
    alert("浏览器预览不支持打开 .pur 项目，请使用 npm run tauri dev 启动桌面版。");
    return null;
  }
  const selected = await open({
    multiple: false,
    filters: [{ name: "RefBoard Project", extensions: ["pur"] }],
  });
  if (!selected || Array.isArray(selected)) return null;
  return selected;
}

export async function pickSaveProject(
  currentPath: string | null,
  options?: { title?: string },
): Promise<string | null> {
  if (!isTauriApp()) {
    return null;
  }
  const selected = await save({
    title: options?.title ?? "保存项目",
    defaultPath: currentPath ?? "未命名.pur",
    filters: [{ name: "RefBoard 项目", extensions: ["pur"] }],
    canCreateDirectories: true,
  });
  return selected;
}

export async function pickExportPng(): Promise<string | null> {
  if (!isTauriApp()) return "browser-download";
  return save({
    defaultPath: "refboard-export.png",
    filters: [{ name: "PNG Image", extensions: ["png"] }],
  });
}

export async function saveProjectFile(
  path: string,
  manifest: ProjectManifest,
  images: ImageItem[],
): Promise<void> {
  if (!isTauriApp()) return;

  const assets: SaveAssetPayload[] = [];

  for (const img of images) {
    const ext = img.sourcePath ? getExtension(img.sourcePath) : ".png";
    const assetPath = `assets/${img.id}${ext}`;
    let bytes: Uint8Array;

    if (img.sourcePath) {
      bytes = await readPathAsBytes(img.sourcePath);
    } else if (img.src.startsWith("blob:")) {
      const response = await fetch(img.src);
      const buffer = await response.arrayBuffer();
      bytes = new Uint8Array(buffer);
    } else {
      bytes = await readPathAsBytes(img.src.replace(/^asset:\/\//, ""));
    }

    assets.push({ asset_path: assetPath, data: Array.from(bytes) });
    const entry = manifest.images.find((m) => m.id === img.id);
    if (entry) entry.asset = assetPath;
  }

  await invoke("save_project", { path, manifest: JSON.stringify(manifest, null, 2), assets });
}

export async function openProjectFile(path: string): Promise<{
  manifest: ProjectManifest;
  images: ImageItem[];
  texts: TextItem[];
  groups: ImageGroup[];
  categories: ImageCategory[];
  boards: Board[];
  activeBoardId: string;
}> {
  const result = await invoke<OpenProjectResult>("open_project", { path });
  const raw = JSON.parse(result.manifest) as ProjectManifest;
  const manifest = migrateManifest(raw);

  const images: ImageItem[] = [];
  for (const entry of manifest.images) {
    const asset = result.assets.find((a) => a.id === entry.id);
    const filePath = asset?.path ?? "";
    const src = convertFileSrc(filePath);

    images.push({
      id: entry.id,
      src,
      sourcePath: filePath,
      name: entry.name ?? "",
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
      scaleX: entry.scaleX,
      scaleY: entry.scaleY,
      rotation: entry.rotation,
      opacity: entry.opacity,
      zIndex: entry.zIndex,
      flipX: entry.flipX ?? false,
      flipY: entry.flipY ?? false,
      locked: entry.locked ?? false,
      visible: entry.visible ?? true,
      colorMark: entry.colorMark ?? "none",
      groupId: entry.groupId ?? null,
      categoryId: entry.categoryId ?? null,
      boardId: entry.boardId ?? DEFAULT_BOARD_ID,
    });
  }

  const hydrated = await hydrateDisplayThumbnails(images);
  const groups = hydrateFrameGroups(manifest.groups ?? [], hydrated).map((g) => ({
    ...g,
    boardId: g.boardId ?? DEFAULT_BOARD_ID,
  }));
  const categories = manifest.categories ?? [];
  const boards = manifest.boards ?? [];
  const activeBoardId = manifest.activeBoardId ?? boards[0]?.id ?? DEFAULT_BOARD_ID;
  const texts: TextItem[] = (manifest.texts ?? []).map((t) => ({
    id: t.id,
    text: t.text,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    fontSize: t.fontSize,
    fill: t.fill,
    backgroundColor: t.backgroundColor ?? DEFAULT_TEXT_BACKGROUND,
    align: t.align ?? "left",
    rotation: t.rotation,
    opacity: t.opacity,
    zIndex: t.zIndex,
    locked: t.locked ?? false,
    visible: t.visible ?? true,
    groupId: t.groupId ?? null,
    categoryId: t.categoryId ?? null,
    boardId: t.boardId ?? DEFAULT_BOARD_ID,
    autoSize: t.autoSize ?? true,
  }));
  return {
    manifest,
    images: hydrated,
    texts,
    groups,
    categories,
    boards,
    activeBoardId,
  };
}

export function buildManifest(
  images: ImageItem[],
  texts: TextItem[],
  groups: ImageGroup[],
  categories: ImageCategory[],
  boards: Board[],
  activeBoardId: string,
  viewport: ProjectManifest["viewport"],
  settings: ProjectSettings,
): ProjectManifest {
  return {
    version: MANIFEST_VERSION,
    viewport,
    settings,
    boards,
    activeBoardId,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      boardId: g.boardId,
      kind: g.kind ?? "frame",
      x: g.x,
      y: g.y,
      width: g.width,
      height: g.height,
      padding: g.padding,
      themeKey: g.themeKey,
      collapsed: g.collapsed,
      childIds: g.childIds,
      boundsLocked: g.boundsLocked,
      strokeColor: g.strokeColor,
      fillColor: g.fillColor,
    })),
    categories,
    images: images.map((img) => ({
      id: img.id,
      asset: img.sourcePath
        ? `assets/${img.id}${getExtension(img.sourcePath)}`
        : `assets/${img.id}.png`,
      name: img.name,
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      scaleX: img.scaleX,
      scaleY: img.scaleY,
      rotation: img.rotation,
      opacity: img.opacity,
      zIndex: img.zIndex,
      flipX: img.flipX,
      flipY: img.flipY,
      locked: img.locked,
      visible: img.visible,
      colorMark: img.colorMark,
      groupId: img.groupId,
      categoryId: img.categoryId,
      boardId: img.boardId,
    })),
    texts: texts.map((t) => ({
      id: t.id,
      text: t.text,
      x: t.x,
      y: t.y,
      width: t.width,
      height: t.height,
      fontSize: t.fontSize,
      fill: t.fill,
      backgroundColor: t.backgroundColor,
      align: t.align,
      rotation: t.rotation,
      opacity: t.opacity,
      zIndex: t.zIndex,
      locked: t.locked,
      visible: t.visible,
      groupId: t.groupId,
      categoryId: t.categoryId,
      boardId: t.boardId,
      autoSize: t.autoSize ?? true,
    })),
  };
}

export async function pickImages(): Promise<string[]> {
  if (!isTauriApp()) {
    const files = await pickFilesBrowser(true, "image/*");
    if (files && files.length > 0) await importFromFiles(files);
    return [];
  }

  const selected = await open({
    multiple: true,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "tiff", "tif"],
      },
    ],
  });
  if (!selected) return [];
  return Array.isArray(selected) ? selected : [selected];
}
