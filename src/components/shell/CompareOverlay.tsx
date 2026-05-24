import { useEffect, useRef } from "react";
import { Group, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { useActiveBoardCanvas } from "../../hooks/useActiveBoard";
import { useCanvasStore } from "../../store/canvasStore";
import { useUiStore } from "../../store/uiStore";

export function CompareOverlay() {
  const compareMode = useUiStore((s) => s.compareMode);
  const compareOpacity = useUiStore((s) => s.compareOpacity);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const { images } = useActiveBoardCanvas();
  const imageRef = useRef<Konva.Image>(null);

  const a =
    compareMode && selectedIds.length === 2
      ? images.find((i) => i.id === selectedIds[0])
      : undefined;
  const b =
    compareMode && selectedIds.length === 2
      ? images.find((i) => i.id === selectedIds[1])
      : undefined;

  useEffect(() => {
    if (!b) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current?.image(img);
      imageRef.current?.getLayer()?.batchDraw();
    };
    img.src = b.src;
  }, [b?.src]);

  if (!compareMode || !a || !b) return null;

  const scaleX = b.flipX ? -Math.abs(b.scaleX) : Math.abs(b.scaleX);
  const scaleY = b.flipY ? -Math.abs(b.scaleY) : Math.abs(b.scaleY);
  const ratioX = (a.width * Math.abs(a.scaleX)) / (b.width * Math.abs(b.scaleX));
  const ratioY = (a.height * Math.abs(a.scaleY)) / (b.height * Math.abs(b.scaleY));

  return (
    <Group
      x={a.x}
      y={a.y}
      scaleX={scaleX * ratioX}
      scaleY={scaleY * ratioY}
      rotation={a.rotation}
      opacity={compareOpacity}
      listening={false}
    >
      <KonvaImage ref={imageRef} image={undefined} width={b.width} height={b.height} />
    </Group>
  );
}
