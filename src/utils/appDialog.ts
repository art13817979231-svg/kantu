import { ask, confirm, message } from "@tauri-apps/plugin-dialog";
import { useUiStore } from "../store/uiStore";
import { isTauriApp } from "./tauriEnv";

/** 文本输入（桌面打包版不支持 window.prompt） */
export async function appPrompt(
  title: string,
  defaultValue = "",
): Promise<string | null> {
  if (!isTauriApp()) {
    return window.prompt(title, defaultValue);
  }
  return useUiStore.getState().requestPrompt(title, defaultValue);
}

/** 是/否确认 */
export async function appConfirm(
  msg: string,
  title = "确认",
): Promise<boolean> {
  if (!isTauriApp()) {
    return window.confirm(msg);
  }
  return confirm(msg, { title, kind: "warning" });
}

/** 是/否询问（语义同 confirm） */
export async function appAsk(msg: string, title = "确认"): Promise<boolean> {
  if (!isTauriApp()) {
    return window.confirm(msg);
  }
  return ask(msg, { title, kind: "warning" });
}

/** 提示信息 */
export async function appAlert(msg: string, title = "RefBoard"): Promise<void> {
  if (!isTauriApp()) {
    alert(msg);
    return;
  }
  await message(msg, { title, kind: "info" });
}
