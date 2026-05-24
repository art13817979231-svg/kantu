import { useEffect } from "react";
import { Transformer } from "react-konva";
import Konva from "konva";
import { useActiveBoardCanvas } from "../hooks/useActiveBoard";
import { useCanvasStore } from "../store/canvasStore";
import {
  getAnchorWorldSize,
  selectionTransformerProps,
  SELECTION_THEME,
} from "../utils/canvasTransformer";
import { frameBoundsNodeId } from "../utils/frameBounds";

type Props = {
  stageRef: React.RefObject<Konva.Stage | null>;
  transformerRef: React.RefObject<Konva.Transformer | null>;
};

export function SelectionTransformer({ stageRef, transformerRef }: Props) {
  const { images, texts } = useActiveBoardCanvas();
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const selectedFrameId = useCanvasStore((s) => s.selectedFrameId);
  const selectedFrame = useCanvasStore((s) =>
    s.selectedFrameId
      ? (s.groups.find((g) => g.id === s.selectedFrameId) ?? null)
      : null,
  );
  const viewport = useCanvasStore((s) => s.viewport);

  const anchorSize = getAnchorWorldSize(viewport.zoom);

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) {
      tr?.nodes([]);
      tr?.getLayer()?.batchDraw();
      return;
    }

    if (selectedFrameId) {
      const boundsNode = stage.findOne(`#${frameBoundsNodeId(selectedFrameId)}`);
      tr.nodes(boundsNode ? [boundsNode] : []);
      tr.resizeEnabled(true);
      tr.rotateEnabled(false);
      tr.keepRatio(false);
      tr.anchorSize(anchorSize);
      tr.getLayer()?.batchDraw();
      return;
    }

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((n): n is Konva.Group => n !== undefined);
    const selectedNodes = nodes.filter((n) => {
      const id = n.id();
      const img = images.find((i) => i.id === id);
      if (img) return !img.locked;
      const txt = texts.find((t) => t.id === id);
      return txt && !txt.locked;
    });
    const textOnly =
      selectedNodes.length > 0 &&
      selectedNodes.every((n) => texts.some((t) => t.id === n.id()));
    tr.nodes(selectedNodes);
    tr.resizeEnabled(true);
    tr.rotateEnabled(true);
    tr.anchorSize(anchorSize);
    tr.rotateAnchorOffset(SELECTION_THEME.rotateOffset / viewport.zoom);
    tr.keepRatio(!textOnly);
    tr.getLayer()?.batchDraw();
  }, [
    selectedIds,
    selectedFrameId,
    selectedFrame?.x,
    selectedFrame?.y,
    selectedFrame?.width,
    selectedFrame?.height,
    images,
    texts,
    anchorSize,
    viewport.zoom,
    stageRef,
    transformerRef,
  ]);

  return (
    <Transformer
      ref={transformerRef}
      {...selectionTransformerProps}
      anchorSize={anchorSize}
      boundBoxFunc={(oldBox, newBox) =>
        newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
      }
      borderStroke={SELECTION_THEME.border}
      borderStrokeWidth={SELECTION_THEME.borderWidth}
    />
  );
}
