import type Konva from "konva";
import { isTauriApp } from "./tauriEnv";

export async function exportStageToPng(
  stage: Konva.Stage,
  savePath?: string | null,
): Promise<void> {
  const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });

  if (!isTauriApp() || savePath === "browser-download" || !savePath) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `refboard-${Date.now()}.png`;
    a.click();
    return;
  }

  const base64 = dataUrl.split(",")[1];
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  await writeFile(savePath, bytes);
}
