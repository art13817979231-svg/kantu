import { isTauriApp } from "./tauriEnv";
import {
  PROJECT_SYNC_EVENT,
  buildProjectSyncPayload,
} from "./projectSync";

export async function openSecondaryWindow(): Promise<void> {
  if (!isTauriApp()) {
    alert("副窗口仅在桌面版可用");
    return;
  }

  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const { emit } = await import("@tauri-apps/api/event");

  const existing = await WebviewWindow.getByLabel("secondary");
  if (existing) {
    await existing.show();
    await existing.setFocus();
    await emit(PROJECT_SYNC_EVENT, buildProjectSyncPayload());
    return;
  }

  const win = new WebviewWindow("secondary", {
    url: "/?window=secondary",
    title: "RefBoard — 副视图",
    width: 960,
    height: 640,
    minWidth: 480,
    minHeight: 360,
  });

  const pushSync = () => emit(PROJECT_SYNC_EVENT, buildProjectSyncPayload());

  win.once("tauri://created", () => void pushSync());
  win.once("tauri://error", (e) => console.error("secondary window", e));
}
