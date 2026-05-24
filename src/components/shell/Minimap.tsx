import { useCallback, useEffect, useRef } from "react";
import { useActiveBoardCanvas } from "../../hooks/useActiveBoard";
import { useCanvasStore } from "../../store/canvasStore";
import { getBoundsForImages } from "../../utils/viewport";

const MAP_W = 168;
const MAP_H = 120;
const PAD = 8;

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { images } = useActiveBoardCanvas();
  const viewport = useCanvasStore((s) => s.viewport);
  const stageSize = useCanvasStore((s) => s.stageSize);
  const setViewport = useCanvasStore((s) => s.setViewport);

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_W, MAP_H);
    ctx.fillStyle = "rgba(28, 28, 34, 0.92)";
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    if (images.length === 0) {
      ctx.fillStyle = "#666";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("无内容", MAP_W / 2, MAP_H / 2);
      return;
    }

    const bounds = getBoundsForImages(images);
    const cw = bounds.maxX - bounds.minX || 1;
    const ch = bounds.maxY - bounds.minY || 1;
    const scale = Math.min((MAP_W - PAD * 2) / cw, (MAP_H - PAD * 2) / ch);

    const toMap = (wx: number, wy: number) => ({
      x: PAD + (wx - bounds.minX) * scale,
      y: PAD + (wy - bounds.minY) * scale,
    });

    for (const img of images) {
      if (!img.visible) continue;
      const w = img.width * Math.abs(img.scaleX);
      const h = img.height * Math.abs(img.scaleY);
      const p = toMap(img.x, img.y);
      ctx.fillStyle = "rgba(74, 158, 255, 0.55)";
      ctx.fillRect(p.x, p.y, Math.max(2, w * scale), Math.max(2, h * scale));
    }

    const vMin = toMap(
      (-viewport.panX) / viewport.zoom,
      (-viewport.panY) / viewport.zoom,
    );
    const vMax = toMap(
      (stageSize.width - viewport.panX) / viewport.zoom,
      (stageSize.height - viewport.panY) / viewport.zoom,
    );
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      vMin.x,
      vMin.y,
      vMax.x - vMin.x,
      vMax.y - vMin.y,
    );
  }, [images, viewport, stageSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  const onPointer = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el || images.length === 0) return;
    const rect = el.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const bounds = getBoundsForImages(images);
    const cw = bounds.maxX - bounds.minX || 1;
    const ch = bounds.maxY - bounds.minY || 1;
    const scale = Math.min((MAP_W - PAD * 2) / cw, (MAP_H - PAD * 2) / ch);

    const wx = bounds.minX + (mx - PAD) / scale;
    const wy = bounds.minY + (my - PAD) / scale;

    setViewport({
      panX: stageSize.width / 2 - wx * viewport.zoom,
      panY: stageSize.height / 2 - wy * viewport.zoom,
    });
  };

  return (
    <div className="minimap" title="小地图 · 点击跳转">
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        onMouseDown={(e) => onPointer(e.clientX, e.clientY)}
        onMouseMove={(e) => {
          if (e.buttons === 1) onPointer(e.clientX, e.clientY);
        }}
      />
    </div>
  );
}
