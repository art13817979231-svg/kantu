/** 角部延伸线长度（世界坐标） */
export const TEXT_BORDER_OVERSHOOT = 6;

export const DEFAULT_TEXT_STROKE = "rgba(255, 255, 255, 0.88)";

/** 四条边：顶 / 底 / 左 / 右，每段 [x1, y1, x2, y2] */
export function textBoxOvershootSegments(
  width: number,
  height: number,
  overshoot = TEXT_BORDER_OVERSHOOT,
): number[][] {
  const o = overshoot;
  return [
    [-o, 0, width + o, 0],
    [-o, height, width + o, height],
    [0, -o, 0, height + o],
    [width, -o, width, height + o],
  ];
}
