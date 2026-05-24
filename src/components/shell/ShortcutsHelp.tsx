import { useUiStore } from "../../store/uiStore";

const ROWS: { keys: string; action: string }[] = [
  { keys: "Ctrl/Cmd+O", action: "打开项目" },
  { keys: "Ctrl/Cmd+S", action: "保存" },
  { keys: "Ctrl/Cmd+Shift+S", action: "另存为" },
  { keys: "Ctrl/Cmd+N", action: "新建项目" },
  { keys: "Ctrl/Cmd+I", action: "导入图片" },
  { keys: "Ctrl/Cmd+A", action: "全选" },
  { keys: "Ctrl/Cmd+D", action: "复制选中" },
  { keys: "Delete", action: "删除选中" },
  { keys: "Ctrl/Cmd+G", action: "成组（逻辑组，联动移动）" },
  { keys: "Ctrl/Cmd+Shift+G", action: "解组" },
  { keys: "双击图片", action: "单独放大查看" },
  { keys: "再双击 / 点空白 / Esc", action: "退出单独查看" },
  { keys: "Ctrl/Cmd+L", action: "锁定/解锁" },
  { keys: "Ctrl/Cmd+Shift+H", action: "显隐切换" },
  { keys: "Ctrl/Cmd+]", action: "图层上移" },
  { keys: "Ctrl/Cmd+[", action: "图层下移" },
  { keys: "Ctrl/Cmd+Shift+]", action: "置顶" },
  { keys: "Ctrl/Cmd+Shift+[", action: "置底" },
  { keys: "F", action: "水平翻转" },
  { keys: "Shift+F", action: "垂直翻转" },
  { keys: "Ctrl/Cmd+0", action: "重置缩放" },
  { keys: "Ctrl/Cmd+1", action: "缩放到适合" },
  { keys: "[ / ]", action: "透明度 ±5%" },
  { keys: "↑↓←→", action: "微移（Shift 大步长）" },
  { keys: "Space / 按住 H", action: "平移画布（松开恢复选择）" },
  { keys: "V", action: "选择工具" },
  { keys: "双击空白", action: "新建文本并输入（无需先按 T）" },
  { keys: "T", action: "文本工具（可选）" },
  { keys: "双击文本", action: "编辑已有标注" },
  { keys: "M", action: "显示/隐藏小地图" },
  { keys: "Tab", action: "折叠/展开侧栏" },
  { keys: "Ctrl/Cmd+Shift+F", action: "紧凑模式" },
  { keys: "Ctrl/Cmd+T", action: "窗口置顶" },
  { keys: "Ctrl/Cmd+Shift+Space", action: "全局显示/隐藏（桌面版）" },
  { keys: "?", action: "本快捷键面板" },
  { keys: "Shift（拖角缩放时）", action: "自由拉伸宽高" },
];

export function ShortcutsHelp() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  if (!open) return null;

  return (
    <div
      className="shortcuts-overlay refined-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="快捷键"
      onClick={() => setOpen(false)}
    >
      <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
        <header className="shortcuts-header">
          <h2 className="font-display">快捷键</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="关闭">
            ×
          </button>
        </header>
        <table className="shortcuts-table">
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.keys}>
                <td>
                  <kbd>{row.keys}</kbd>
                </td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
