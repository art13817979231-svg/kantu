import { describe, expect, it } from "vitest";
import {
  autosavePath,
  draftAutosaveDisplayName,
  isDraftAutosavePath,
  parseDraftSessionId,
  projectHasAutosaveContent,
} from "./autosavePaths";

describe("autosavePaths", () => {
  it("为已保存项目生成 .autosave 路径", () => {
    expect(autosavePath("/tmp/demo.pur")).toBe("/tmp/demo.pur.autosave");
    expect(autosavePath(null)).toBeNull();
  });

  it("识别未命名草稿 autosave", () => {
    const path =
      "/Users/x/Library/Application Support/com.xia.refboard/drafts/abc-123.pur.autosave";
    expect(isDraftAutosavePath(path)).toBe(true);
    expect(parseDraftSessionId(path)).toBe("abc-123");
    expect(draftAutosaveDisplayName(path)).toBe("未命名项目（自动保存）");
  });

  it("判断项目是否有可 autosave 的内容", () => {
    expect(
      projectHasAutosaveContent({ images: [], texts: [], groups: [] }),
    ).toBe(false);
    expect(
      projectHasAutosaveContent({
        images: [{ id: "1" }],
        texts: [],
        groups: [],
      }),
    ).toBe(true);
  });
});
