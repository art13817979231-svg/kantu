import { useCanvasStore } from "../../store/canvasStore";
import { IMPORT_STRATEGY_OPTIONS } from "../../utils/importStrategy";

export function ImportStrategySelect() {
  const strategy = useCanvasStore((s) => s.settings.importStrategy);
  const setSettings = useCanvasStore((s) => s.setSettings);

  return (
    <select
      className="import-strategy-select"
      value={strategy}
      onChange={(e) =>
        setSettings({
          importStrategy: e.target.value as typeof strategy,
        })
      }
      title="导入图片时的默认缩放"
    >
      {IMPORT_STRATEGY_OPTIONS.map((o) => (
        <option key={o.id} value={o.id}>
          导入：{o.label}
        </option>
      ))}
    </select>
  );
}
