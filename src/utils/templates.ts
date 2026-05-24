import type { CanvasBackground, ImportStrategy, LayoutMode } from "../types/project";

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  layoutMode: LayoutMode;
  importStrategy: ImportStrategy;
  canvasBackground: CanvasBackground;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "空白项目",
    description: "从零开始，自由排版",
    layoutMode: "grid",
    importStrategy: "original",
    canvasBackground: "dots-dark",
  },
  {
    id: "character",
    name: "角色设定",
    description: "网格排版，统一短边，适合角色参考",
    layoutMode: "grid",
    importStrategy: "fit-short-edge",
    canvasBackground: "dots-dark",
  },
  {
    id: "ui",
    name: "UI 规范",
    description: "横排对比，统一宽度，适合界面稿",
    layoutMode: "row",
    importStrategy: "fit-width",
    canvasBackground: "dots-light",
  },
  {
    id: "scene",
    name: "场景氛围",
    description: "网格 + 原尺寸，适合大图场景 ref",
    layoutMode: "grid",
    importStrategy: "original",
    canvasBackground: "checker",
  },
];
