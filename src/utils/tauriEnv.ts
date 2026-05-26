import { isTauri } from "@tauri-apps/api/core";

/** 是否在 Tauri 桌面环境中运行 */
export function isTauriApp(): boolean {
  if (typeof window === "undefined") return false;
  if (isTauri()) return true;
  // 兼容旧检测方式
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

/** 是否为副窗口（双视图） */
export function isSecondaryWindow(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("window") === "secondary";
}
