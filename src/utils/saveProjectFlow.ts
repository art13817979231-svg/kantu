import type { ImageItem, ProjectManifest } from "../types/project";
import { pickSaveProject, saveProjectFile } from "./projectIO";
import { isTauriApp } from "./tauriEnv";

export type SaveProjectResult =
  | { ok: true; path: string }
  | { ok: false; cancelled: boolean; error?: string };

/** 选择路径并写入 .pur（含另存为） */
export async function saveProjectWithPicker(
  manifest: ProjectManifest,
  images: ImageItem[],
  options: {
    saveAs: boolean;
    currentPath: string | null;
  },
): Promise<SaveProjectResult> {
  if (!isTauriApp()) {
    return {
      ok: false,
      cancelled: false,
      error: "浏览器预览无法保存 .pur 项目，请使用桌面版 RefBoard（npm run tauri dev 或安装包）。",
    };
  }

  let path = options.currentPath;
  if (!path || options.saveAs) {
    path = await pickSaveProject(path, {
      title: options.saveAs ? "另存为" : "保存项目",
    });
    if (!path) return { ok: false, cancelled: true };
    if (!path.toLowerCase().endsWith(".pur")) path = `${path}.pur`;
  }

  try {
    await saveProjectFile(path, manifest, images);
    return { ok: true, path };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, cancelled: false, error: message };
  }
}
