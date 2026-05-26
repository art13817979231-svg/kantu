import { describe, expect, it } from "vitest";
import { DEFAULT_BOARD_ID } from "../types/project";
import type { ImageGroup, ImageItem, TextItem } from "../types/project";
import {
  affectedGroupIdsFromRemoval,
  detachFrameMembers,
} from "./groupOps";
import { computeGroupRect, FRAME_PADDING } from "./frameBounds";
import { migrateManifest } from "./migrate";
import { MANIFEST_VERSION } from "../types/project";

const frameId = "frame-1";
const imgId = "img-1";
const textId = "text-1";

function sampleGroup(): ImageGroup {
  return {
    id: frameId,
    name: "组 1",
    boardId: DEFAULT_BOARD_ID,
    kind: "cluster",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  };
}

function sampleImage(groupId: string | null = frameId): ImageItem {
  return {
    id: imgId,
    src: "asset://test.png",
    name: "test",
    x: 20,
    y: 20,
    width: 100,
    height: 80,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    flipX: false,
    flipY: false,
    locked: false,
    visible: true,
    colorMark: "none",
    groupId,
    categoryId: null,
    boardId: DEFAULT_BOARD_ID,
  };
}

function sampleText(groupId: string | null = frameId): TextItem {
  return {
    id: textId,
    text: "标注",
    x: 40,
    y: 40,
    width: 80,
    height: 32,
    fontSize: 24,
    fill: "#fff",
    backgroundColor: "rgba(0,0,0,0.7)",
    align: "left",
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    locked: false,
    visible: true,
    groupId,
    categoryId: null,
    boardId: DEFAULT_BOARD_ID,
    autoSize: true,
  };
}

describe("detachFrameMembers", () => {
  it("删除框并解除图片与文本的 groupId", () => {
    const next = detachFrameMembers(
      {
        groups: [sampleGroup()],
        images: [sampleImage()],
        texts: [sampleText()],
      },
      frameId,
    );

    expect(next.groups).toHaveLength(0);
    expect(next.images[0].groupId).toBeNull();
    expect(next.texts[0].groupId).toBeNull();
  });

  it("不影响其它框的成员", () => {
    const otherFrame = "frame-2";
    const next = detachFrameMembers(
      {
        groups: [sampleGroup(), { ...sampleGroup(), id: otherFrame }],
        images: [sampleImage(), { ...sampleImage(otherFrame), id: "img-2" }],
        texts: [sampleText()],
      },
      frameId,
    );

    expect(next.groups).toHaveLength(1);
    expect(next.groups[0].id).toBe(otherFrame);
    expect(next.images.find((i) => i.id === "img-2")?.groupId).toBe(otherFrame);
  });
});

describe("affectedGroupIdsFromRemoval", () => {
  it("收集被删成员所在的群组", () => {
    const ids = affectedGroupIdsFromRemoval(
      [sampleImage(), { ...sampleImage("frame-2"), id: "img-2" }],
      [sampleText()],
      new Set([imgId, textId]),
    );
    expect(ids.sort()).toEqual([frameId]);
  });
});

describe("computeGroupRect", () => {
  it("根据成员外接矩形计算框大小", () => {
    const rect = computeGroupRect(
      [sampleImage(null)],
      [sampleText(null)],
      frameId,
      FRAME_PADDING,
    );
    expect(rect).toBeNull();

    const withMembers = computeGroupRect(
      [sampleImage()],
      [sampleText()],
      frameId,
      FRAME_PADDING,
    );
    expect(withMembers).not.toBeNull();
    expect(withMembers!.width).toBeGreaterThan(0);
    expect(withMembers!.height).toBeGreaterThan(0);
  });
});

describe("migrateManifest", () => {
  it("v1 项目迁移到当前版本并补默认字段", () => {
    const migrated = migrateManifest({
      version: 1,
      viewport: { panX: 0, panY: 0, zoom: 1 },
      images: [
        {
          id: "a",
          asset: "assets/a.png",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
        },
      ],
    });
    expect(migrated.version).toBe(MANIFEST_VERSION);
    expect(migrated.images[0].groupId).toBeNull();
    expect(migrated.boards?.length).toBeGreaterThan(0);
  });

  it("为文本补 backgroundColor 与 fontSize", () => {
    const migrated = migrateManifest({
      version: 2,
      viewport: { panX: 0, panY: 0, zoom: 1 },
      settings: {
        alwaysOnTop: false,
        canvasBackground: "dots-dark",
        sidebarCollapsed: false,
        compactMode: false,
        importStrategy: "fit-short-edge",
      },
      groups: [],
      images: [],
      texts: [
        {
          id: "t1",
          text: "hi",
          x: 0,
          y: 0,
          width: 50,
          height: 30,
          fontSize: 18,
          fill: "#fff",
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          autoSize: false,
        },
      ],
    });
    expect(migrated.texts?.[0].fontSize).toBe(28);
    expect(migrated.texts?.[0].backgroundColor).toBeTruthy();
  });
});
