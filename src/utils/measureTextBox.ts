export const TEXT_PADDING = 10;
export const TEXT_MIN_WIDTH = 96;
export const TEXT_MIN_HEIGHT = 40;
export const TEXT_MAX_WIDTH = 640;
const TEXT_FONT_FAMILY = '"Noto Sans SC", Outfit, sans-serif';
const TEXT_LINE_HEIGHT = 1.35;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxInnerWidth: number,
): string[] {
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const ch of para) {
      const next = current + ch;
      if (ctx.measureText(next).width > maxInnerWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = next;
      }
    }
    lines.push(current || "");
  }

  return lines.length > 0 ? lines : [""];
}

/** 根据文案与字号计算文本框宽高（浏览器 canvas 测量，适配中文） */
export function measureTextBox(
  text: string,
  fontSize: number,
  maxWidth = TEXT_MAX_WIDTH,
): { width: number; height: number } {
  const content = text.trim() || " ";
  const innerMax = Math.max(32, maxWidth - TEXT_PADDING * 2);
  const lineHeightPx = fontSize * TEXT_LINE_HEIGHT;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: TEXT_MIN_WIDTH, height: TEXT_MIN_HEIGHT };
  }

  ctx.font = `${fontSize}px ${TEXT_FONT_FAMILY}`;
  const lines = wrapLines(ctx, content, innerMax);

  let maxLineW = 0;
  for (const line of lines) {
    maxLineW = Math.max(maxLineW, ctx.measureText(line || " ").width);
  }

  const contentWidth = Math.ceil(Math.min(innerMax, maxLineW));
  const contentHeight = Math.ceil(lines.length * lineHeightPx);
  const width = Math.max(TEXT_MIN_WIDTH, contentWidth + TEXT_PADDING * 2);
  const height = Math.max(TEXT_MIN_HEIGHT, contentHeight + TEXT_PADDING * 2);

  return { width, height };
}
