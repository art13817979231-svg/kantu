import type { ReactNode } from "react";
import { useUiStore } from "../../store/uiStore";
import { BoardBar } from "./BoardBar";
import { Sidebar } from "./Sidebar";
import { SelectionHUD } from "./SelectionHUD";

type Props = {
  toolbar: ReactNode;
  canvas: ReactNode;
  onOpenRecent: (path: string) => void;
};

export function AppShell({ toolbar, canvas, onOpenRecent }: Props) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const compactMode = useUiStore((s) => s.compactMode);
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  if (immersiveMode) {
    return (
      <div className="app-shell refined-ui immersive-mode">
        <div className="shell-main shell-main-immersive">{canvas}</div>
      </div>
    );
  }

  return (
    <div className={`app-shell refined-ui ${compactMode ? "compact" : ""}`}>
      {toolbar}
      <BoardBar />
      <div className="shell-body">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title="切换侧栏 (Tab)"
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
        {!sidebarCollapsed && <Sidebar onOpenRecent={onOpenRecent} />}
        <div className="shell-main">
          {canvas}
          <SelectionHUD />
        </div>
      </div>
    </div>
  );
}
