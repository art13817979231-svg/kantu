import { useEffect } from "react";
import { isSecondaryWindow, isTauriApp } from "../utils/tauriEnv";

const GLOBAL_TOGGLE = "CommandOrControl+Shift+Space";

async function toggleMainWindow() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  const visible = await win.isVisible();
  if (visible) {
    await win.hide();
  } else {
    await win.show();
    await win.setFocus();
  }
}

export function useGlobalShortcut() {
  useEffect(() => {
    if (!isTauriApp() || isSecondaryWindow()) return;

    let cancelled = false;

    const setup = async () => {
      try {
        const { register } = await import("@tauri-apps/plugin-global-shortcut");
        if (cancelled) return;
        await register(GLOBAL_TOGGLE, (event) => {
          if (event.state === "Pressed") void toggleMainWindow();
        });
      } catch (e) {
        console.warn("global shortcut register failed", e);
      }
    };

    setup();

    return () => {
      cancelled = true;
      import("@tauri-apps/plugin-global-shortcut")
        .then(({ unregister }) => unregister(GLOBAL_TOGGLE))
        .catch(() => {});
    };
  }, []);
}
