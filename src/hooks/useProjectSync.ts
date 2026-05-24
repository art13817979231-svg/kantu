import { useEffect } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { isSecondaryWindow, isTauriApp } from "../utils/tauriEnv";
import {
  PROJECT_SYNC_EVENT,
  applyProjectSyncPayload,
  buildProjectSyncPayload,
  type ProjectSyncPayload,
} from "../utils/projectSync";

const EMIT_DEBOUNCE_MS = 200;

/** 主窗口：画布变更时向副窗口广播 */
export function useProjectSyncEmit() {
  const isSecondary = isSecondaryWindow();

  useEffect(() => {
    if (!isTauriApp() || isSecondary) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const emit = async () => {
      const { emit } = await import("@tauri-apps/api/event");
      const payload = buildProjectSyncPayload();
      await emit(PROJECT_SYNC_EVENT, payload);
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void emit(), EMIT_DEBOUNCE_MS);
    };

    schedule();

    const unsub = useCanvasStore.subscribe(schedule);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [isSecondary]);
}

/** 副窗口：接收主窗口项目快照 */
export function useProjectSyncListen() {
  useEffect(() => {
    if (!isTauriApp() || !isSecondaryWindow()) return;

    let unlisten: (() => void) | undefined;

    const setup = async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen<ProjectSyncPayload>(PROJECT_SYNC_EVENT, (e) => {
        applyProjectSyncPayload(e.payload, { keepViewport: true });
      });
    };

    setup();
    return () => unlisten?.();
  }, []);
}
