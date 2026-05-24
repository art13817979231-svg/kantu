import type Konva from "konva";

/** 角点视觉：bracket=L 形角标（推荐）| dot=小圆点 */
export type AnchorVisualStyle = "bracket" | "dot";

/** 默认：细白 L 形角标 */
export const ANCHOR_VISUAL_STYLE: AnchorVisualStyle = "bracket";

export const SELECTION_THEME = {
  border: "rgba(255, 255, 255, 0.82)",
  borderWidth: 1,
  accent: "#c9885a",
  /** 角标线条：纯白细线 */
  bracketStroke: "#ffffff",
  bracketStrokeWidth: 1,
  dotFill: "rgba(255, 255, 255, 0.92)",
  dotStroke: "#c9885a",
  /** 角标臂长（屏幕像素） */
  bracketArmScreen: 8,
  /** 角点热区（屏幕像素，可点区域） */
  bracketHitScreen: 14,
  /** 圆点直径（屏幕像素） */
  dotScreen: 5,
  rotateScreen: 6,
  rotateOffset: 22,
} as const;

const CORNER_ANCHORS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

function anchorKind(name: string): "rotate" | "corner" | "edge" {
  if (name === "rotater") return "rotate";
  if (name.includes("center") || name.startsWith("middle")) return "edge";
  return "corner";
}

function drawCornerBracket(
  ctx: Konva.Context,
  shape: Konva.Rect,
  corner: string,
): void {
  const w = shape.width();
  const h = shape.height();
  const cx = w / 2;
  const cy = h / 2;
  const arm = Math.min(w, h) * 0.42;

  ctx.strokeStyle = SELECTION_THEME.bracketStroke;
  ctx.lineWidth = SELECTION_THEME.bracketStrokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  switch (corner) {
    case "top-left":
      ctx.moveTo(cx, cy - arm);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - arm, cy);
      break;
    case "top-right":
      ctx.moveTo(cx, cy - arm);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + arm, cy);
      break;
    case "bottom-left":
      ctx.moveTo(cx, cy + arm);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - arm, cy);
      break;
    case "bottom-right":
      ctx.moveTo(cx, cy + arm);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + arm, cy);
      break;
    default:
      break;
  }
  ctx.stroke();
}

function applyRotateAnchor(anchor: Konva.Rect, size: number): void {
  anchor.width(size);
  anchor.height(size);
  anchor.offsetX(size / 2);
  anchor.offsetY(size / 2);
  anchor.cornerRadius(size / 2);
  anchor.fill("#ffffff");
  anchor.stroke("rgba(255, 255, 255, 0.6)");
  anchor.strokeWidth(1);
  anchor.shadowColor("rgba(0, 0, 0, 0.2)");
  anchor.shadowBlur(2);
  anchor.shadowOffset({ x: 0, y: 1 });
  anchor.hitStrokeWidth(14);
}

function applyDotCorner(anchor: Konva.Rect, size: number): void {
  anchor.width(size);
  anchor.height(size);
  anchor.offsetX(size / 2);
  anchor.offsetY(size / 2);
  anchor.cornerRadius(size / 2);
  anchor.fill(SELECTION_THEME.dotFill);
  anchor.stroke(SELECTION_THEME.dotStroke);
  anchor.strokeWidth(1.25);
  anchor.shadowColor("rgba(0, 0, 0, 0.2)");
  anchor.shadowBlur(2);
  anchor.shadowOffset({ x: 0, y: 1 });
  anchor.hitStrokeWidth(12);
}

function applyBracketCorner(anchor: Konva.Rect, hitSize: number): void {
  const corner = anchor.name().split(" ")[0] ?? "";
  anchor.width(hitSize);
  anchor.height(hitSize);
  anchor.offsetX(hitSize / 2);
  anchor.offsetY(hitSize / 2);
  /* 完全透明无法命中拖拽，保留极小填充以响应缩放 */
  anchor.fill("rgba(255, 255, 255, 0.001)");
  anchor.stroke("transparent");
  anchor.shadowColor(undefined);
  anchor.shadowBlur(0);
  anchor.listening(true);
  anchor.draggable(true);
  anchor.sceneFunc((ctx, shape) => {
    drawCornerBracket(ctx, shape as Konva.Rect, corner);
  });
  anchor.hitFunc((ctx, shape) => {
    ctx.beginPath();
    ctx.rect(0, 0, shape.width(), shape.height());
    ctx.fillStrokeShape(shape);
  });
  anchor.hitStrokeWidth(16);
}

export function styleSelectionAnchor(anchor: Konva.Rect): void {
  const name = anchor.name().split(" ")[0] ?? "";
  const kind = anchorKind(name);
  anchor.strokeScaleEnabled(false);

  if (kind === "rotate") {
    const hit = anchor.width() || SELECTION_THEME.rotateScreen;
    const s = Math.max(4, hit * 0.55);
    applyRotateAnchor(anchor, s);
    return;
  }

  if (kind === "corner") {
    if (ANCHOR_VISUAL_STYLE === "dot") {
      applyDotCorner(anchor, anchor.width() || SELECTION_THEME.dotScreen);
    } else {
      applyBracketCorner(anchor, anchor.width() || SELECTION_THEME.bracketHitScreen);
    }
    return;
  }
}

/** 锚点在世界坐标中的边长（热区），随缩放保持屏幕尺寸稳定 */
export function getAnchorWorldSize(zoom: number, style = ANCHOR_VISUAL_STYLE): number {
  const z = Math.max(0.05, zoom);
  const screen =
    style === "dot"
      ? SELECTION_THEME.dotScreen
      : SELECTION_THEME.bracketHitScreen;
  return Math.max(4, Math.min(14, screen / z));
}

export const selectionTransformerProps = {
  resizeEnabled: true,
  rotateEnabled: true,
  keepRatio: true,
  shiftBehavior: "inverted" as const,
  enabledAnchors: [...CORNER_ANCHORS],
  borderEnabled: true,
  borderStroke: SELECTION_THEME.border,
  borderStrokeWidth: SELECTION_THEME.borderWidth,
  rotateLineVisible: false,
  rotateAnchorOffset: SELECTION_THEME.rotateOffset,
  rotateAnchorCursor: "grab",
  anchorFill: "transparent",
  anchorStroke: "transparent",
  anchorStrokeWidth: 0,
  anchorCornerRadius: 0,
  anchorStyleFunc: styleSelectionAnchor,
  padding: 0,
  flipEnabled: false,
};
