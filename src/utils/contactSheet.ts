import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import type { ImageItem } from "../types/project";
import { readPathAsBytes } from "./imageLoader";
import { isTauriApp } from "./tauriEnv";
import { createThumbnailFromUrl } from "./thumbnail";

const DEFAULT_CELL = 256;
const DEFAULT_GAP = 12;
const DEFAULT_PADDING = 24;
const LABEL_HEIGHT = 28;

export async function pickContactSheetPath(): Promise<string | null> {
  if (!isTauriApp()) return "browser-download";
  return save({
    defaultPath: `refboard-contact-${Date.now()}.png`,
    filters: [{ name: "PNG Image", extensions: ["png"] }],
  });
}

async function imageBytesForExport(img: ImageItem): Promise<Uint8Array | null> {
  if (img.sourcePath && isTauriApp()) {
    try {
      return await readPathAsBytes(img.sourcePath);
    } catch {
      /* fallback */
    }
  }
  try {
    const res = await fetch(img.src);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function autoColumns(count: number): number {
  if (count <= 4) return count;
  return Math.ceil(Math.sqrt(count));
}

/** 浏览器端 canvas 联系表（无 Tauri 时） */
async function exportContactSheetBrowser(
  images: ImageItem[],
  cols: number,
  cell: number,
): Promise<void> {
  const gap = DEFAULT_GAP;
  const pad = DEFAULT_PADDING;
  const labelH = LABEL_HEIGHT;
  const rows = Math.ceil(images.length / cols);
  const sheetW = pad * 2 + cols * cell + (cols - 1) * gap;
  const sheetH = pad * 2 + rows * (cell + labelH) + (rows - 1) * gap;

  const canvas = document.createElement("canvas");
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#202028";
  ctx.fillRect(0, 0, sheetW, sheetH);

  for (let i = 0; i < images.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (cell + gap);
    const y = pad + row * (cell + labelH + gap);

    const thumbUrl = await createThumbnailFromUrl(images[i].src, cell);
    const img = await loadHtmlImage(thumbUrl);
    const aspect = img.naturalWidth / img.naturalHeight;
    let dw = cell;
    let dh = cell;
    if (aspect > 1) dh = cell / aspect;
    else dw = cell * aspect;
    const ox = x + (cell - dw) / 2;
    const oy = y + (cell - dh) / 2;
    ctx.drawImage(img, ox, oy, dw, dh);
    if (thumbUrl !== images[i].src) URL.revokeObjectURL(thumbUrl);

    ctx.fillStyle = "#32323a";
    ctx.fillRect(x, y + cell, cell, labelH);
    ctx.fillStyle = "#aaa";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    const label = (images[i].name || "未命名").slice(0, 18);
    ctx.fillText(label, x + cell / 2, y + cell + 18);
  }

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `refboard-contact-${Date.now()}.png`;
  a.click();
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function exportContactSheet(images: ImageItem[]): Promise<void> {
  const visible = images.filter((i) => i.visible);
  if (visible.length === 0) {
    alert("没有可导出的图片");
    return;
  }

  const path = await pickContactSheetPath();
  if (path === null) return;

  const cols = autoColumns(visible.length);
  const cell = DEFAULT_CELL;

  if (!isTauriApp() || path === "browser-download") {
    await exportContactSheetBrowser(visible, cols, cell);
    return;
  }

  const items: { data: number[]; name: string }[] = [];
  for (const img of visible) {
    const bytes = await imageBytesForExport(img);
    if (!bytes) continue;
    items.push({
      data: Array.from(bytes),
      name: img.name || img.id,
    });
  }

  if (items.length === 0) {
    alert("无法读取图片数据");
    return;
  }

  await invoke("export_contact_sheet", {
    path,
    items,
    columns: cols,
    cell_size: cell,
    gap: DEFAULT_GAP,
    padding: DEFAULT_PADDING,
    label_height: LABEL_HEIGHT,
  });
}
