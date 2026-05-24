/** 是否在 Tauri 桌面环境中运行 */
export function isTauriApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** 是否为副窗口（双视图） */
export function isSecondaryWindow(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("window") === "secondary";
}
