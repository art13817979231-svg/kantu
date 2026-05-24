import { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "../../store/canvasStore";

const PRESETS = [25, 50, 75, 100, 150, 200];

export function ZoomControl({ className = "" }: { className?: string }) {
  const zoom = useCanvasStore((s) => s.viewport.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const resetViewport = useCanvasStore((s) => s.resetViewport);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const n = parseInt(draft.replace(/%/g, ""), 10);
    if (!Number.isNaN(n)) setZoom(n / 100);
    setEditing(false);
  };

  return (
    <div className={`zoom-control ${className}`.trim()}>
      {editing ? (
        <input
          ref={inputRef}
          className="zoom-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="zoom-badge-btn"
          onClick={() => {
            setDraft(String(Math.round(zoom * 100)));
            setEditing(true);
          }}
          title="点击输入缩放比例"
        >
          {Math.round(zoom * 100)}%
        </button>
      )}
      <div className="zoom-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setZoom(p / 100)}>
            {p}%
          </button>
        ))}
        <button type="button" onClick={resetViewport}>
          100%
        </button>
      </div>
    </div>
  );
}
