import { useEffect, useRef } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { TextItem } from "../types/project";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { TEXT_PADDING, TEXT_MIN_WIDTH, TEXT_MIN_HEIGHT } from "../utils/measureTextBox";
import { DEFAULT_TEXT_BACKGROUND, TEXT_CORNER_RADIUS } from "../utils/textDefaults";

type Props = {
  item: TextItem;
  panMode: boolean;
  frameOrigin?: { x: number; y: number };
  onSelect: (id: string, additive: boolean) => void;
  onTransformEnd: (id: string, patch: Partial<TextItem>) => void;
};

export function TextNode({
  item,
  panMode,
  frameOrigin,
  onSelect,
  onTransformEnd,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const bringToFront = useCanvasStore((s) => s.bringToFront);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const setSelectedFrameId = useCanvasStore((s) => s.setSelectedFrameId);
  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const setEditingTextId = useUiStore((s) => s.setEditingTextId);
  const editingTextId = useUiStore((s) => s.editingTextId);
  const remeasureText = useCanvasStore((s) => s.remeasureText);

  useEffect(() => {
    if (editingTextId === item.id) return;
    if (item.autoSize === false) return;
    remeasureText(item.id);
  }, [
    item.id,
    item.text,
    item.fontSize,
    item.autoSize,
    editingTextId,
    remeasureText,
  ]);

  const localX = frameOrigin ? item.x - frameOrigin.x : item.x;
  const localY = frameOrigin ? item.y - frameOrigin.y : item.y;

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
      width={item.width}
      height={item.height}
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
        e.evt.preventDefault();
        setSelectedIds([item.id]);
        setSelectedFrameId(null);
        setEditingTextId(item.id);
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault();
        const ev = e.evt as MouseEvent;
        setContextMenu({ x: ev.clientX, y: ev.clientY, textId: item.id });
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
        const w = toWorld(node.x(), node.y());
        const sx = node.scaleX();
        const sy = node.scaleY();
        const patch: Partial<TextItem> = {
          x: w.x,
          y: w.y,
          rotation: node.rotation(),
        };
        if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) {
          patch.width = Math.max(TEXT_MIN_WIDTH, node.width() * Math.abs(sx));
          patch.height = Math.max(TEXT_MIN_HEIGHT, node.height() * Math.abs(sy));
          patch.autoSize = false;
        }
        onTransformEnd(item.id, patch);
        node.scaleX(1);
        node.scaleY(1);
      }}
    >
      <Rect
        width={item.width}
        height={item.height}
        fill={item.backgroundColor ?? DEFAULT_TEXT_BACKGROUND}
        stroke="rgba(138, 180, 248, 0.35)"
        strokeWidth={1}
        cornerRadius={TEXT_CORNER_RADIUS}
        listening
      />
      <Text
        text={item.text}
        width={Math.max(16, item.width - TEXT_PADDING * 2)}
        height={item.autoSize === false ? item.height : undefined}
        padding={TEXT_PADDING}
        fontSize={item.fontSize}
        fontFamily="Noto Sans SC, Outfit, sans-serif"
        lineHeight={1.35}
        fill={item.fill}
        align={item.align}
        verticalAlign="top"
        wrap="word"
        listening={false}
      />
    </Group>
  );
}
