const STORAGE_KEY = "refboard-recent-files";
const MAX_RECENT = 8;

export function getRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentFile(path: string) {
  const list = getRecentFiles().filter((p) => p !== path);
  list.unshift(path);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

export function fileName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}
