import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { ImageNode } from "./ImageNode";
import { TextNode } from "./TextNode";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { FrameNode } from "./FrameNode";
import { EmptyState } from "./EmptyState";
import { Minimap } from "./shell/Minimap";
import { ZoomControl } from "./shell/ZoomControl";
import { CompareOverlay } from "./shell/CompareOverlay";
import { SelectionTransformer } from "./SelectionTransformer";
import { getImageBounds, getTextBounds, isImageInViewport } from "../utils/viewport";
import {
  getCanvasWrapClass,
  getCanvasWrapStyle,
} from "../utils/canvasBackground";
import { isSecondaryWindow } from "../utils/tauriEnv";
import { passesCategoryFilter } from "../utils/filterImages";
import { useActiveBoardCanvas } from "../hooks/useActiveBoard";

type Props = {
  onImport: () => void;
  onStageReady?: (stage: Konva.Stage) => void;
};

export function InfiniteCanvas({ onImport, onStageReady }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const worldLayerRef = useRef<Konva.Layer>(null);

  const { images, groups, texts, activeBoardId } = useActiveBoardCanvas();
  const allImages = useCanvasStore((s) => s.images);
  const allTexts = useCanvasStore((s) => s.texts);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const selectedFrameId = useCanvasStore((s) => s.selectedFrameId);
  const viewport = useCanvasStore((s) => s.viewport);
  const spacePressed = useCanvasStore((s) => s.spacePressed);
  const isPanning = useCanvasStore((s) => s.isPanning);
  const canvasBackground = useCanvasStore((s) => s.settings.canvasBackground);
  const canvasBackgroundColor = useCanvasStore(
    (s) => s.settings.canvasBackgroundColor,
  );

  const setStageSize = useCanvasStore((s) => s.setStageSize);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const setPanning = useCanvasStore((s) => s.setPanning);
  const setSpacePressed = useCanvasStore((s) => s.setSpacePressed);
  const selectImage = useCanvasStore((s) => s.selectImage);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const selectFrame = useCanvasStore((s) => s.selectFrame);
  const updateImage = useCanvasStore((s) => s.updateImage);
  const afterImageDrag = useCanvasStore((s) => s.afterImageDrag);
  const addTextAt = useCanvasStore((s) => s.addTextAt);
  const updateText = useCanvasStore((s) => s.updateText);
  const afterTextDrag = useCanvasStore((s) => s.afterTextDrag);
  const createFrameFromRect = useCanvasStore((s) => s.createFrameFromRect);
  const toggleImageZoom = useCanvasStore((s) => s.toggleImageZoom);
  const stageSize = useCanvasStore((s) => s.stageSize);

  const colorFilter = useUiStore((s) => s.colorFilter);
  const categoryFilter = useUiStore((s) => s.categoryFilter);
  const appMode = useUiStore((s) => s.appMode);
  const toolMode = useUiStore((s) => s.toolMode);
  const frameDrawMode = useUiStore((s) => s.frameDrawMode);
  const frameDrawActive = frameDrawMode && appMode !== "view";
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const compactMode = useUiStore((s) => s.compactMode);
  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const showMinimap = useUiStore((s) => s.showMinimap);
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const imageZoomFocusId = useUiStore((s) => s.imageZoomFocusId);

  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  const panMode = spacePressed || isPanning || toolMode === "pan";
  const textToolActive = toolMode === "text" && !frameDrawActive;
  const showEmpty =
    images.length === 0 && groups.length === 0 && texts.length === 0;
  const hasAnyContent = allImages.length > 0 || allTexts.length > 0;

  const unframedImages = useMemo(
    () => images.filter((i) => i.visible && !i.groupId),
    [images],
  );

  const unframedTexts = useMemo(
    () => texts.filter((t) => t.visible && !t.groupId),
    [texts],
  );

  const visibleUnframedTexts = useMemo(() => {
    const sorted = [...unframedTexts].sort((a, b) => a.zIndex - b.zIndex);
    return sorted.filter((t) => t.visible);
  }, [unframedTexts]);

  const visibleUnframed = useMemo(() => {
    const sorted = [...unframedImages].sort((a, b) => a.zIndex - b.zIndex);
    const selectedSet = new Set(selectedIds);
    const skipViewportCull =
      stageSize.width < 32 || stageSize.height < 32;
    return sorted.filter((img) => {
      if (
        !selectedSet.has(img.id) &&
        categoryFilter !== "all" &&
        !passesCategoryFilter(img, categoryFilter)
      ) {
        return false;
      }
      if (
        appMode === "organize" &&
        colorFilter !== "all" &&
        img.colorMark !== colorFilter
      ) {
        return false;
      }
      return (
        skipViewportCull ||
        selectedSet.has(img.id) ||
        isImageInViewport(img, viewport, stageSize)
      );
    });
  }, [
    unframedImages,
    selectedIds,
    viewport,
    stageSize,
    colorFilter,
    categoryFilter,
    appMode,
  ]);

  const visibleFrames = useMemo(
    () =>
      groups.filter(
        (f) =>
          !f.collapsed ||
          images.some((i) => i.groupId === f.id && selectedIds.includes(i.id)),
      ),
    [groups, images, selectedIds],
  );

  /** 组内文字：在全部图片之后统一绘制，保证压在图片上 */
  const framedTexts = useMemo(() => {
    const out: { item: (typeof texts)[0]; frameOrigin: { x: number; y: number } }[] =
      [];
    for (const frame of visibleFrames) {
      const origin = { x: frame.x, y: frame.y };
      const frameTexts = texts
        .filter((t) => t.groupId === frame.id && t.visible)
        .sort((a, b) => a.zIndex - b.zIndex);
      for (const item of frameTexts) {
        out.push({ item, frameOrigin: origin });
      }
    }
    return out;
  }, [visibleFrames, texts]);

  const soloZoomImage = useMemo(() => {
    if (!imageZoomFocusId) return null;
    return (
      images.find((i) => i.id === imageZoomFocusId) ??
      allImages.find(
        (i) => i.id === imageZoomFocusId && i.boardId === activeBoardId,
      ) ??
      null
    );
  }, [imageZoomFocusId, images, allImages, activeBoardId]);

  const soloImageZoom = !!soloZoomImage;

  const secondary = isSecondaryWindow();

  useEffect(() => {
    const updateSize = () => {
      const boardBarH = secondary ? 0 : 40;
      const toolbarH =
        (secondary ? 36 : compactMode ? 40 : appMode === "view" ? 44 : 48) +
        boardBarH;
      const sidebarW = secondary ? 0 : sidebarCollapsed ? 32 : 248;
      const chromePad = secondary ? 0 : 16;
      setStageSize(
        window.innerWidth - sidebarW - chromePad,
        window.innerHeight - toolbarH - chromePad,
      );
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [setStageSize, sidebarCollapsed, compactMode, selectedIds.length, secondary]);

  useEffect(() => {
    if (stageRef.current) onStageReady?.(stageRef.current);
  }, [onStageReady, stageSize]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePressed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setSpacePressed]);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - viewport.panX) / viewport.zoom,
      y: (sy - viewport.panY) / viewport.zoom,
    }),
    [viewport],
  );

  const finishMarquee = useCallback(
    (x: number, y: number, w: number, h: number) => {
      if (frameDrawActive) {
        const w1 = screenToWorld(x, y);
        const w2 = screenToWorld(x + w, y + h);
        const minX = Math.min(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const fw = Math.abs(w2.x - w1.x);
        const fh = Math.abs(w2.y - w1.y);
        if (fw > 20 && fh > 20) {
          createFrameFromRect(minX, minY, fw, fh);
        }
        return;
      }
      const w1 = screenToWorld(x, y);
      const w2 = screenToWorld(x + w, y + h);
      const minX = Math.min(w1.x, w2.x);
      const maxX = Math.max(w1.x, w2.x);
      const minY = Math.min(w1.y, w2.y);
      const maxY = Math.max(w1.y, w2.y);
      const hits = [
        ...images.filter((img) => {
          if (!img.visible) return false;
          const b = getImageBounds(img);
          return !(b.maxX < minX || b.minX > maxX || b.maxY < minY || b.minY > maxY);
        }),
        ...texts.filter((t) => {
          if (!t.visible) return false;
          const b = getTextBounds(t);
          return !(b.maxX < minX || b.minX > maxX || b.maxY < minY || b.minY > maxY);
        }),
      ];
      setSelectedIds(hits.map((i) => i.id));
    },
    [images, texts, screenToWorld, setSelectedIds, frameDrawActive, createFrameFromRect],
  );

  const applyWheelZoom = useCallback(
    (deltaY: number, pointerX: number, pointerY: number) => {
      const oldScale = viewport.zoom;
      const scaleBy = 1.08;
      const direction = deltaY > 0 ? -1 : 1;
      const newScale = Math.min(
        8,
        Math.max(0.05, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy),
      );
      const mousePointTo = {
        x: (pointerX - viewport.panX) / oldScale,
        y: (pointerY - viewport.panY) / oldScale,
      };
      setViewport({
        zoom: newScale,
        panX: pointerX - mousePointTo.x * newScale,
        panY: pointerY - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      applyWheelZoom(e.evt.deltaY, pointer.x, pointer.y);
    },
    [applyWheelZoom],
  );

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.container().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      e.preventDefault();
      applyWheelZoom(e.deltaY, x, y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyWheelZoom]);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    if (e.target === stage || e.target.getParent() === worldLayerRef.current) {
      if (panMode || e.evt.button === 1) {
        setPanning(true);
        setLastPan({ x: pos.x, y: pos.y });
        return;
      }
      if (textToolActive) {
        if (isBlankCanvasTarget(e.target)) clearSelection();
        return;
      }
      if (soloImageZoom) {
        const nodeId =
          typeof e.target.id === "function" ? e.target.id() : "";
        if (nodeId !== imageZoomFocusId && imageZoomFocusId) {
          toggleImageZoom(imageZoomFocusId);
        }
        return;
      }
      if (!panMode && e.target === stage) {
        marqueeStart.current = { x: pos.x, y: pos.y };
        setMarquee({
          x: pos.x,
          y: pos.y,
          w: 0,
          h: 0,
        });
        return;
      }
      clearSelection();
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    if (marqueeStart.current) {
      const sx = marqueeStart.current.x;
      const sy = marqueeStart.current.y;
      setMarquee({
        x: Math.min(sx, pos.x),
        y: Math.min(sy, pos.y),
        w: Math.abs(pos.x - sx),
        h: Math.abs(pos.y - sy),
      });
      return;
    }

    if (!isPanning && !panMode) return;
    const dx = pos.x - lastPan.x;
    const dy = pos.y - lastPan.y;
    setViewport({ panX: viewport.panX + dx, panY: viewport.panY + dy });
    setLastPan({ x: pos.x, y: pos.y });
  };

  const handleStageMouseUp = () => {
    if (marquee && marqueeStart.current) {
      if (marquee.w > 4 || marquee.h > 4) finishMarquee(marquee.x, marquee.y, marquee.w, marquee.h);
      else clearSelection();
    }
    marqueeStart.current = null;
    setMarquee(null);
    setPanning(false);
  };

  const onImageTransform = (id: string, patch: Partial<typeof images[0]>) => {
    updateImage(id, patch);
    if (patch.x !== undefined || patch.y !== undefined) {
      afterImageDrag(id);
    }
  };

  const onTextTransform = (id: string, patch: Parameters<typeof updateText>[1]) => {
    updateText(id, patch);
    if (patch.x !== undefined || patch.y !== undefined) {
      afterTextDrag(id);
    }
  };

  const isBlankCanvasTarget = useCallback((target: Konva.Node) => {
    const stage = stageRef.current;
    const worldLayer = worldLayerRef.current;
    if (!stage || !worldLayer) return false;
    if (target === stage || target === worldLayer) return true;

    let node: Konva.Node | null = target;
    while (node && node !== stage) {
      const nodeId = typeof node.id === "function" ? node.id() : "";
      if (nodeId) return false;
      if (node === worldLayer) return true;
      node = node.parent;
    }
    return false;
  }, []);

  const handleStageDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (soloImageZoom) return;

    const targetId =
      typeof e.target.id === "function" ? e.target.id() : "";

    if (targetId) {
      const isText = texts.some((t) => t.id === targetId);
      if (isText) return;
      const isImage = images.some((i) => i.id === targetId);
      if (isImage) return;
    }

    if (!isBlankCanvasTarget(e.target)) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    e.evt.preventDefault();
    const world = screenToWorld(pos.x, pos.y);
    addTextAt(world.x, world.y);
    if (toolMode !== "text") {
      useUiStore.getState().setToolMode("select");
    }
  };

  return (
    <div
      ref={canvasWrapRef}
      className={`${getCanvasWrapClass(canvasBackground)} ${panMode ? "pan-mode" : ""} ${frameDrawActive ? "frame-draw-mode" : ""} ${soloImageZoom ? "image-solo-zoom" : ""} ${immersiveMode ? "immersive-canvas" : ""}`}
      style={getCanvasWrapStyle(canvasBackground, canvasBackgroundColor)}
    >
      {showEmpty && !immersiveMode && (
        <EmptyState onImport={onImport} hasImagesOnOtherBoards={hasAnyContent} />
      )}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        pixelRatio={window.devicePixelRatio}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onDblClick={handleStageDblClick}
        onContextMenu={(e) => {
          if (immersiveMode) {
            e.evt.preventDefault();
            return;
          }
          if (stageRef.current && e.target !== stageRef.current) return;
          e.evt.preventDefault();
          const ev = e.evt as MouseEvent;
          setContextMenu({ x: ev.clientX, y: ev.clientY });
        }}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
        style={{
          cursor: panMode
            ? "grab"
            : frameDrawActive
              ? "crosshair"
              : textToolActive
                ? "text"
                : "default",
        }}
      >
        <Layer
          ref={worldLayerRef}
          x={viewport.panX}
          y={viewport.panY}
          scaleX={viewport.zoom}
          scaleY={viewport.zoom}
          onDblClick={handleStageDblClick}
        >
          {soloImageZoom && soloZoomImage ? (
            <ImageNode
              key={soloZoomImage.id}
              item={soloZoomImage}
              panMode={panMode}
              onSelect={selectImage}
              onTransformEnd={onImageTransform}
            />
          ) : (
            <>
              {visibleFrames.map((frame) => (
                <FrameNode
                  key={frame.id}
                  frame={frame}
                  images={images.filter((i) => {
                    if (i.groupId !== frame.id || !i.visible) return false;
                    if (
                      categoryFilter !== "all" &&
                      !selectedIds.includes(i.id) &&
                      !passesCategoryFilter(i, categoryFilter)
                    ) {
                      return false;
                    }
                    if (
                      appMode === "organize" &&
                      colorFilter !== "all" &&
                      i.colorMark !== colorFilter
                    ) {
                      return false;
                    }
                    return true;
                  })}
                  panMode={panMode}
                  selected={selectedFrameId === frame.id}
                  onSelectFrame={selectFrame}
                  onSelectImage={selectImage}
                />
              ))}
              {visibleUnframed.map((item) => (
                <ImageNode
                  key={item.id}
                  item={item}
                  panMode={panMode}
                  onSelect={selectImage}
                  onTransformEnd={onImageTransform}
                />
              ))}
              {framedTexts.map(({ item, frameOrigin }) => (
                <TextNode
                  key={item.id}
                  item={item}
                  frameOrigin={frameOrigin}
                  panMode={panMode}
                  onSelect={selectImage}
                  onTransformEnd={onTextTransform}
                />
              ))}
              {visibleUnframedTexts.map((item) => (
                <TextNode
                  key={item.id}
                  item={item}
                  panMode={panMode}
                  onSelect={selectImage}
                  onTransformEnd={onTextTransform}
                />
              ))}
              <CompareOverlay />
              <SelectionTransformer
                stageRef={stageRef}
                transformerRef={transformerRef}
              />
            </>
          )}
        </Layer>
        <Layer>
          {marquee && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.w}
              height={marquee.h}
              fill={
                frameDrawActive
                  ? "rgba(201, 136, 90, 0.08)"
                  : "rgba(255, 255, 255, 0.06)"
              }
              stroke={
                frameDrawActive
                  ? "rgba(201, 136, 90, 0.7)"
                  : "rgba(255, 255, 255, 0.45)"
              }
              strokeWidth={1}
              dash={frameDrawActive ? [6, 4] : [4, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
      <TextEditorOverlay stageRef={stageRef} />
      {!immersiveMode && <ZoomControl className="on-canvas" />}
      {!immersiveMode && hasAnyContent && showMinimap && !soloImageZoom && (
        <Minimap />
      )}
    </div>
  );
}
