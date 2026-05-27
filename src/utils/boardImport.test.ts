import { describe, expect, it } from "vitest";
import { DEFAULT_BOARD_ID } from "../types/project";
import { createDefaultImageFields } from "../types/project";

describe("board import", () => {
  it("新图默认 boardId 可被当前画板覆盖", () => {
    const board2 = "board-2-id";
    const fields = createDefaultImageFields({ name: "a.png" });
    expect(fields.boardId).toBe(DEFAULT_BOARD_ID);
    const assigned = { ...fields, boardId: board2 };
    expect(assigned.boardId).toBe(board2);
  });
});
