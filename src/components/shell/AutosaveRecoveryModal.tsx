import { useUiStore } from "../../store/uiStore";
import { draftAutosaveDisplayName } from "../../utils/autosavePaths";

type Props = {
  onRestore: (autosavePath: string) => void;
  onDismiss: () => void;
};

export function AutosaveRecoveryModal({ onRestore, onDismiss }: Props) {
  const paths = useUiStore((s) => s.autosaveRecoveryPaths);
  if (!paths || paths.length === 0) return null;

  return (
    <div className="autosave-overlay" role="dialog" aria-modal="true">
      <div className="autosave-panel" onClick={(e) => e.stopPropagation()}>
        <h2>发现自动保存</h2>
        <p className="autosave-desc">
          选择要恢复的项目（含未保存草稿与已保存项目的自动备份）：
        </p>
        <ul className="autosave-list">
          {paths.map((path) => (
            <li key={path}>
              <button type="button" onClick={() => onRestore(path)}>
                <span className="autosave-name">{draftAutosaveDisplayName(path)}</span>
                <span className="autosave-path">{path}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="autosave-actions">
          <button type="button" className="ghost" onClick={onDismiss}>
            暂不恢复
          </button>
        </div>
      </div>
    </div>
  );
}
