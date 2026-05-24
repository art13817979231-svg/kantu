export type ThemeGroupPresetId =
  | "character"
  | "scene"
  | "ui"
  | "material"
  | "color"
  | "other";

export type ThemeGroupPreset = {
  id: ThemeGroupPresetId;
  label: string;
  /** 主题条色点 */
  hex: string;
};

export const THEME_GROUP_PRESETS: ThemeGroupPreset[] = [
  { id: "character", label: "角色", hex: "#e85d5d" },
  { id: "scene", label: "场景", hex: "#5cb85c" },
  { id: "ui", label: "UI", hex: "#4a9eff" },
  { id: "material", label: "材质", hex: "#f0ad4e" },
  { id: "color", label: "配色", hex: "#b565d9" },
  { id: "other", label: "其他", hex: "#888890" },
];

export function getThemePreset(id: string): ThemeGroupPreset | undefined {
  return THEME_GROUP_PRESETS.find((p) => p.id === id);
}

export function uniqueGroupName(existing: string[], base: string): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
