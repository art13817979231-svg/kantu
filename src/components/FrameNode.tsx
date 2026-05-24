import { useRef } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { ImageGroup, ImageItem } from "../types/project";
import { useCanvasStore } from "../store/canvasStore";
import { isClusterGroup } from "../utils/groupUtils";
import { FRAME_MIN_SIZE, frameBoundsNodeId } from "../utils/frameBounds";
import { resolveFrameStyle } from "../utils/frameDefaults";
import { useUiStore } from "../store/uiStore";
import { ImageNode } from "./ImageNode";
import { TextNode } from "./TextNode";
import type { TextItem } from "../types/project";

type Props = {
  frame: ImageGroup;
  images: ImageItem[];
  texts: TextItem[];
  panMode: boolean;
  selected: boolean;
  onSelectFrame: (id: string) => void;
  onSelectImage: (id: string, additive: boolean) => void;
  onTextTransformEnd: (id: string, patch: Partial<TextItem>) => void;
};

export function FrameNode({
  frame,
  images,
  texts,
  panMode,
  selected,
  onSelectFrame,
  onSelectImage,
  onTextTransformEnd,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const boundsRef = useRef<Konva.Rect>(null);
  const moveFrame = useCanvasStore((s) => s.moveFrame);
  const resizeFrame = useCanvasStore((s) => s.resizeFrame);
  const afterImageDrag = useCanvasStore((s) => s.afterImageDrag);
  const updateImage = useCanvasStore((s) => s.updateImage);
  const syncFrameBounds = useCanvasStore((s) => s.syncFrameBounds);
  const setContextMenu = useUiStore((s) => s.setContextMenu);

  const virtual = isClusterGroup(frame);
  const origin = { x: frame.x, y: frame.y };
  const { stroke, fill, label } = resolveFrameStyle(frame, selected);

  return (
    <Group
      ref={groupRef}
      id={`frame-${frame.id}`}
      x={frame.x}
      y={frame.y}
      draggable={!panMode}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelectFrame(frame.id);
      }}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onSelectFrame(frame.id);
      }}
      onDragEnd={(e) => {
        moveFrame(frame.id, e.target.x(), e.target.y());
        if (!frame.boundsLocked) syncFrameBounds(frame.id);
      }}
    >
      <Rect
        ref={boundsRef}
        id={frameBoundsNodeId(frame.id)}
        width={frame.width}
        height={frame.height}
        stroke={stroke}
        strokeWidth={virtual ? 1.5 : selected ? 2.5 : 1.5}
        dash={virtual ? [8, 5] : [10, 6]}
        fill={fill}
        hitStrokeWidth={virtual ? 24 : 8}
        listening
        onContextMenu={(e) => {
          e.evt.preventDefault();
          e.cancelBubble = true;
          onSelectFrame(frame.id);
          const ev = e.evt as MouseEvent;
          setContextMenu({ x: ev.clientX, y: ev.clientY, frameId: frame.id });
        }}
        onTransformEnd={() => {
          const node = boundsRef.current;
          if (!node) return;
          const sx = node.scaleX();
          const sy = node.scaleY();
          resizeFrame(frame.id, {
            x: frame.x + node.x(),
            y: frame.y + node.y(),
            width: Math.max(FRAME_MIN_SIZE, node.width() * Math.abs(sx)),
            height: Math.max(FRAME_MIN_SIZE, node.height() * Math.abs(sy)),
          });
          node.scaleX(1);
          node.scaleY(1);
          node.x(0);
          node.y(0);
        }}
      />
      <Text
        text={
          virtual
            ? `${frame.name} · 拖入图片加入`
            : frame.name
        }
        x={8}
        y={-22}
        fontSize={11}
        fill={label}
        listening={false}
      />
      {images.map((img) => (
        <ImageNode
          key={img.id}
          item={img}
          frameOrigin={origin}
          panMode={panMode}
          onSelect={onSelectImage}
          onTransformEnd={(id, patch) => {
            updateImage(id, patch);
            afterImageDrag(id);
            syncFrameBounds(frame.id);
          }}
        />
      ))}
      {texts.map((t) => (
        <TextNode
          key={t.id}
          item={t}
          frameOrigin={origin}
          panMode={panMode}
          onSelect={onSelectImage}
          onTransformEnd={(id, patch) => {
            onTextTransformEnd(id, patch);
            syncFrameBounds(frame.id);
          }}
        />
      ))}
    </Group>
  );
}
