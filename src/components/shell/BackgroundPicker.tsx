import { useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import {
  BACKGROUND_OPTIONS,
  SOLID_PRESETS,
} from "../../utils/canvasBackground";
import type { CanvasBackground } from "../../types/project";

export function BackgroundPicker() {
  const settings = useCanvasStore((s) => s.settings);
  const setSettings = useCanvasStore((s) => s.setSettings);
  const [open, setOpen] = useState(false);

  const current = BACKGROUND_OPTIONS.find((o) => o.id === settings.canvasBackground);

  const pick = (id: CanvasBackground, color?: string) => {
    setSettings({
      canvasBackground: id,
      canvasBackgroundColor:
        id === "solid" ? color ?? settings.canvasBackgroundColor ?? "#2e2e34" : undefined,
    });
  };

  return (
    <div className="bg-picker-wrap">
      <button
        type="button"
        className="bg-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        title="画布背景"
      >
        背景
        <span
          className={`bg-preview-swatch bg-swatch-${settings.canvasBackground}`}
          style={
            settings.canvasBackground === "solid"
              ? { background: settings.canvasBackgroundColor ?? "#2e2e34" }
              : undefined
          }
        />
      </button>
      {open && (
        <>
          <div className="bg-picker-backdrop" onClick={() => setOpen(false)} />
          <div className="bg-picker-menu">
            <p className="bg-picker-title">画布背景 · {current?.label}</p>
            <div className="bg-picker-grid">
              {BACKGROUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`bg-picker-item ${settings.canvasBackground === opt.id ? "active" : ""}`}
                  onClick={() => {
                    pick(opt.id);
                    if (opt.id !== "solid") setOpen(false);
                  }}
                >
                  <span className={`bg-picker-preview bg-swatch-${opt.id}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {settings.canvasBackground === "solid" && (
              <div className="bg-solid-section">
                <span className="filter-label">纯色</span>
                <div className="bg-solid-presets">
                  {SOLID_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className={
                        settings.canvasBackgroundColor === hex ? "active" : ""
                      }
                      style={{ background: hex }}
                      onClick={() => pick("solid", hex)}
                    />
                  ))}
                </div>
                <label className="bg-solid-custom">
                  自定义
                  <input
                    type="color"
                    value={settings.canvasBackgroundColor ?? "#2e2e34"}
                    onChange={(e) => pick("solid", e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
