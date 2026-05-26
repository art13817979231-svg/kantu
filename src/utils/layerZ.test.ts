import { describe, expect, it } from "vitest";
import type { ImageItem, TextItem } from "../types/project";
import {
  TEXT_Z_BASE,
  applyLayerOrderToBoard,
  boardLayerIdsAscending,
  bumpTextsAboveImages,
  nextImageZOnBoard,
  nextTextZOnBoard,
} from "./layerZ";

const boardId = "b1";

function img(id: string, z: number): ImageItem {
  return {
    id,
    boardId,
    zIndex: z,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    src: "",
    visible: true,
    locked: false,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  } as ImageItem;
}

function txt(id: string, z: number): TextItem {
  return {
    id,
    boardId,
    zIndex: z,
    text: "标注",
    x: 0,
    y: 0,
    width: 200,
    height: 48,
    fontSize: 18,
    fill: "#f0f0f5",
    backgroundColor: "rgba(0,0,0,0.5)",
    align: "left",
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    groupId: null,
    categoryId: null,
  };
}

describe("layerZ", () => {
  it("图层列表先图后文", () => {
    const ids = boardLayerIdsAscending(
      [img("i1", 2), img("i2", 1)],
      [txt("t1", TEXT_Z_BASE + 1)],
      boardId,
    );
    expect(ids).toEqual(["i2", "i1", "t1"]);
  });

  it("新建文字 zIndex 高于所有图片", () => {
    const images = [img("i1", 50)];
    const texts = [txt("t1", TEXT_Z_BASE)];
    expect(nextTextZOnBoard(images, texts, boardId)).toBeGreaterThan(50);
    expect(nextTextZOnBoard(images, texts, boardId)).toBeGreaterThanOrEqual(
      TEXT_Z_BASE,
    );
  });

  it("新建图片 zIndex 不超过文字层基准", () => {
    expect(nextImageZOnBoard([img("i1", TEXT_Z_BASE - 2)], boardId)).toBe(
      TEXT_Z_BASE - 1,
    );
  });

  it("加载时把压在图片下的文字抬高", () => {
    const images = [img("i1", 10)];
    const texts = [txt("t1", 5)];
    const bumped = bumpTextsAboveImages(images, texts, boardId);
    expect(bumped[0]!.zIndex).toBeGreaterThan(10);
  });

  it("写回图层顺序时图片与文字分区", () => {
    const { images, texts } = applyLayerOrderToBoard(
      [img("i1", 99), img("i2", 1)],
      [txt("t1", 2)],
      boardId,
      ["i2", "i1", "t1"],
    );
    expect(images.find((i) => i.id === "i1")!.zIndex).toBe(2);
    expect(images.find((i) => i.id === "i2")!.zIndex).toBe(1);
    expect(texts.find((t) => t.id === "t1")!.zIndex).toBe(TEXT_Z_BASE);
  });
});
