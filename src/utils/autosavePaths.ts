import { v4 as uuidv4 } from "uuid";
import { isTauriApp } from "./tauriEnv";

const DRAFT_SESSION_KEY = "refboard-draft-session-id";

/** 开发模式 30s 便于联调；正式版 2 分钟 */
export const AUTOSAVE_MS = import.meta.env.DEV ? 30_000 : 2 * 60 * 1000;

export function autosavePath(projectPath: string | null): string | null {
  if (!projectPath) return null;
  return `${projectPath}.autosave`;
}

export function isDraftAutosavePath(path: string): boolean {
  return /[/\\]drafts[/\\][^/\\]+\.pur\.autosave$/i.test(path);
}

export function parseDraftSessionId(path: string): string | null {
  const base = path.split(/[/\\]/).pop() ?? "";
  const match = base.match(/^(.+)\.pur\.autosave$/);
  return match?.[1] ?? null;
}

export function draftAutosaveDisplayName(path: string): string {
  if (isDraftAutosavePath(path)) return "未命名项目（自动保存）";
  const base = path.split(/[/\\]/).pop() ?? path;
  return base.replace(/\.autosave$/, "");
}

export function getDraftSessionId(): string | null {
  return localStorage.getItem(DRAFT_SESSION_KEY);
}

export function getOrCreateDraftSessionId(): string {
  const existing = getDraftSessionId();
  if (existing) return existing;
  const id = uuidv4();
  localStorage.setItem(DRAFT_SESSION_KEY, id);
  return id;
}

export function setDraftSessionId(sessionId: string): void {
  localStorage.setItem(DRAFT_SESSION_KEY, sessionId);
}

export function rotateDraftSessionId(): string {
  const id = uuidv4();
  localStorage.setItem(DRAFT_SESSION_KEY, id);
  return id;
}

export async function ensureDraftAutosaveDir(): Promise<void> {
  if (!isTauriApp()) return;
  const { appDataDir, join } = await import("@tauri-apps/api/path");
  const { mkdir, exists } = await import("@tauri-apps/plugin-fs");
  const dir = await join(await appDataDir(), "drafts");
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
}

export async function resolveDraftAutosavePath(
  sessionId: string,
): Promise<string> {
  const { appDataDir, join } = await import("@tauri-apps/api/path");
  const dir = await appDataDir();
  return join(dir, "drafts", `${sessionId}.pur.autosave`);
}

export async function removeDraftAutosave(
  sessionId?: string | null,
): Promise<void> {
  if (!isTauriApp()) return;
  const id = sessionId ?? getDraftSessionId();
  if (!id) return;
  try {
    const path = await resolveDraftAutosavePath(id);
    const { exists, remove } = await import("@tauri-apps/plugin-fs");
    if (await exists(path)) await remove(path);
  } catch {
    /* ignore */
  }
}

export async function listDraftAutosavePaths(): Promise<string[]> {
  if (!isTauriApp()) return [];
  try {
    const { appDataDir, join } = await import("@tauri-apps/api/path");
    const { readDir, exists } = await import("@tauri-apps/plugin-fs");
    const draftsDir = await join(await appDataDir(), "drafts");
    if (!(await exists(draftsDir))) return [];
    const entries = await readDir(draftsDir);
    const out: string[] = [];
    for (const entry of entries) {
      if (entry.isDirectory || !entry.name?.endsWith(".pur.autosave")) continue;
      out.push(await join(draftsDir, entry.name));
    }
    return out;
  } catch {
    return [];
  }
}

export function projectHasAutosaveContent(state: {
  images: unknown[];
  texts: unknown[];
  groups: unknown[];
}): boolean {
  return (
    state.images.length > 0 ||
    state.texts.length > 0 ||
    state.groups.length > 0
  );
}

export async function resolveActiveAutosavePath(state: {
  projectPath: string | null;
  images: unknown[];
  texts: unknown[];
  groups: unknown[];
}): Promise<string | null> {
  if (state.projectPath) return autosavePath(state.projectPath);
  if (!projectHasAutosaveContent(state)) return null;
  const sessionId = getOrCreateDraftSessionId();
  await ensureDraftAutosaveDir();
  return resolveDraftAutosavePath(sessionId);
}
