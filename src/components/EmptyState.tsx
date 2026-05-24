import { useUiStore } from "../store/uiStore";
import { isTauriApp } from "../utils/tauriEnv";

type Props = {
  onImport: () => void;
  hasImagesOnOtherBoards?: boolean;
};

export function EmptyState({ onImport, hasImagesOnOtherBoards }: Props) {
  const isViewMode = useUiStore((s) => s.appMode) === "view";

  return (
    <div className="empty-state">
      <div className="empty-card">
        <span className="empty-logo" aria-hidden />
        <h2 className="font-display">RefBoard</h2>
        <p className="empty-subtitle">参考图板</p>
        <p className="empty-desc">
          {hasImagesOnOtherBoards
            ? "当前画板为空，可导入图片或点击顶栏其它画板切换"
            : isViewMode
              ? "拖入参考图，铺开对比与灵感收集；顶栏可新建多个主题画板"
              : "拖入或导入图片，开始整理参考素材"}
        </p>
        <button type="button" className="empty-import-btn" onClick={onImport}>
          导入图片
        </button>
        <ul className="empty-hints">
          <li>
            <kbd>滚轮</kbd> 缩放 · 双击图片单独放大 · 点空白或 Esc 退出
          </li>
          <li>
            双击画布空白处即可输入标注（或按 <kbd>T</kbd>）
          </li>
          <li>
            <kbd>Tab</kbd> 侧栏 · 顶栏画板切换多个主题
          </li>
          {isViewMode && (
            <li>需要图层/对齐时，顶栏点「整理」</li>
          )}
        </ul>
        {!isTauriApp() && (
          <p className="empty-warn">
            浏览器预览 · 完整功能请 <code>npm run tauri dev</code>
          </p>
        )}
      </div>
    </div>
  );
}
