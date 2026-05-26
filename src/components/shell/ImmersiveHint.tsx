import { useUiStore } from "../../store/uiStore";

export function ImmersiveHint() {
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const exitImmersive = useUiStore((s) => s.exitImmersive);

  if (!immersiveMode) return null;

  return (
    <button
      type="button"
      className="immersive-hint"
      onClick={() => exitImmersive()}
      title="退出沉浸模式"
    >
      沉浸浏览 · Esc 或 ⌘⇧I 退出
    </button>
  );
}
