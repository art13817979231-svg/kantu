import { useRef, useEffect } from "react";
import { Group, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import type { ImageItem } from "../types/project";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";

type Props = {
  item: ImageItem;
  panMode: boolean;
  /** 在主题框内时，父 Group 位于框左上角 */
  frameOrigin?: { x: number; y: number };
  onSelect: (id: string, additive: boolean) => void;
  onTransformEnd: (id: string, attrs: Partial<ImageItem>) => void;
};

export function ImageNode({
  item,
  panMode,
  frameOrigin,
  onSelect,
  onTransformEnd,
}: Props) {
  const imageRef = useRef<Konva.Image>(null);
  const groupRef = useRef<Konva.Group>(null);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const setSelectedFrameId = useCanvasStore((s) => s.setSelectedFrameId);
  const toggleImageZoom = useCanvasStore((s) => s.toggleImageZoom);
  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const immersiveMode = useUiStore((s) => s.immersiveMode);

  const localX = frameOrigin ? item.x - frameOrigin.x : item.x;
  const localY = frameOrigin ? item.y - frameOrigin.y : item.y;

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const node = imageRef.current;
      if (!node) return;
      node.image(img);
      node.getLayer()?.batchDraw();
    };
    img.onerror = () => {
      console.warn("[RefBoard] 图片加载失败:", item.name || item.src);
    };
    img.src = item.src;
  }, [item.src, item.width, item.height]);

  const scaleX = item.flipX ? -Math.abs(item.scaleX) : Math.abs(item.scaleX);
  const scaleY = item.flipY ? -Math.abs(item.scaleY) : Math.abs(item.scaleY);

  const toWorld = (lx: number, ly: number) =>
    frameOrigin
      ? { x: frameOrigin.x + lx, y: frameOrigin.y + ly }
      : { x: lx, y: ly };

  return (
    <Group
      ref={groupRef}
      id={item.id}
      x={localX}
      y={localY}
      scaleX={scaleX}
      scaleY={scaleY}
      rotation={item.rotation}
      opacity={item.opacity}
      draggable={!panMode && !item.locked}
      onClick={(e) => {
        e.cancelBubble = true;
        setSelectedFrameId(null);
        onSelect(item.id, e.evt.metaKey || e.evt.ctrlKey);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setSelectedFrameId(null);
        onSelect(item.id, false);
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        toggleImageZoom(item.id);
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault();
        if (immersiveMode) return;
        const ev = e.evt as MouseEvent;
        setContextMenu({ x: ev.clientX, y: ev.clientY, imageId: item.id });
        setSelectedIds([item.id]);
      }}
      onDragStart={(e) => {
        e.cancelBubble = true;
        bringToFront(item.id);
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        const w = toWorld(e.target.x(), e.target.y());
        onTransformEnd(item.id, { x: w.x, y: w.y });
      }}
      onTransformEnd={() => {
        const node = groupRef.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        const w = toWorld(node.x(), node.y());
        onTransformEnd(item.id, {
          x: w.x,
          y: w.y,
          scaleX: Math.abs(sx),
          scaleY: Math.abs(sy),
          flipX: sx < 0,
          flipY: sy < 0,
          rotation: node.rotation(),
        });
      }}
    >
      <KonvaImage
        ref={imageRef}
        image={undefined}
        width={item.width}
        height={item.height}
      />
    </Group>
  );
}
