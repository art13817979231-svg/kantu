import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { useCanvasStore } from "../store/canvasStore";
import { isTauriApp } from "../utils/tauriEnv";

export function useTauriDrop() {
  const importPaths = useCanvasStore((s) => s.importPaths);

  useEffect(() => {
    if (!isTauriApp()) return;

    let unlisten: (() => void) | undefined;

    const setup = async () => {
      unlisten = await getCurrentWindow().onDragDropEvent(async (event) => {
        if (event.payload.type === "over") return;
        if (event.payload.type !== "drop") return;
        const paths = event.payload.paths.filter(
          (p) => !p.endsWith(".pur") && !p.endsWith(".autosave"),
        );
        if (paths.length === 0) return;
        try {
          const filtered = await invoke<string[]>("filter_image_paths_cmd", {
            paths,
          });
          if (filtered.length > 0) await importPaths(filtered);
        } catch (err) {
          console.error("tauri drop import failed", err);
          alert(`拖入导入失败：${err instanceof Error ? err.message : String(err)}`);
        }
      });
    };

    setup();
    return () => {
      unlisten?.();
    };
  }, [importPaths]);
}
