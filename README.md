# 参考图板 RefBoard

轻量桌面参考图板，对标 PureRef，路线升级为 **设计师工作台**。基于 **Tauri 2 + React + Konva** 构建。

> 产品规划（已同步 v1.0.0 实现）：[docs/PRD-v2-设计师工作台.md](docs/PRD-v2-设计师工作台.md)  
> 版本历史见 [CHANGELOG.md](CHANGELOG.md)

**当前版本：1.0.1**

**仓库**：https://github.com/art13817979231-svg/kantu

## 功能

### 使用模式（默认「看图」）
- **看图**：拖入即看、滚轮缩放、空格平移；对比时把两张图拖到画布两侧；侧栏仅最近项目，底栏仅透明度
- **整理**：图层列表、色标、对齐、分组、导出等完整工作台能力（顶栏切换）

### 画板主题框（仅「整理」模式，可选）
- 切换到顶栏 **整理** 后可用 **画框** / **包成框** 做主题分组
- 默认 **看图** 模式不显示这些入口，避免干扰纯浏览

### 基础（MVP）
- **无限画布**：滚轮缩放、空格/中键拖拽平移
- **图片操作**：拖入/导入、移动、缩放、旋转、透明度
- **窗口置顶**：`Ctrl/Cmd+T`
- **项目文件**：自定义 `.pur`（ZIP + manifest + assets）

### 设计师工作台（v0.2）
- **侧栏**（默认折叠，`Tab` 切换）：图层列表、预设色标筛选、最近项目
- **框选多选**：拖拽矩形选中多张图
- **图层**：顺序调整、锁定、显隐、水平/垂直翻转
- **对齐**：多选时 6 向对齐（底部 HUD）
- **预设色标**：红/橙/黄/绿/蓝/紫分类（非自由 tag）
- **一层分组**：`Ctrl/Cmd+G` 创建分组
- **紧凑模式**：`Ctrl/Cmd+Shift+F` 隐藏顶栏
- **自动保存**：每 2 分钟（已保存过的项目）；**未命名项目**也会写入应用目录草稿  
  - 开发模式（`tauri dev`）间隔 **30 秒**，便于联调
- **导出 PNG**：工具栏「导出 PNG」
- **背景预设**：深/浅点阵、棋盘格（透明 PNG）、纯色自定义

### 设计师工作台（v0.3）
- **小地图**：默认关闭；工具栏「小地图」或 `M` 打开，用于大图布导航
- **项目模板**：新建 ▾ → 角色设定 / UI 规范 / 场景氛围
- **导入策略**：原尺寸 / 统一短边(480px) / 统一宽度(800px)
- **等距分布**：选中 ≥3 张 → 底部「横分布」「纵分布」
- **对照模式**：选中 2 张 → 勾选「对照」叠加对比 + 透明度滑块
- **`.pur` v2**：兼容 v1 自动迁移

### 设计师工作台（v0.4）
- **缩略图代理**：长边超过 512px 的图片在画布上用缩略图显示（Tauri 端 Rust 生成，浏览器端 canvas 回退）；导入、打开项目、粘贴/拖入均自动处理
- **联系表导出**：工具栏「联系表」→ 将全部可见图片拼成网格 PNG（含文件名标签）；桌面端 Rust 拼图，浏览器端 canvas 下载

### 设计师工作台（v0.5）
- **图层搜索**：侧栏按文件名过滤图层列表
- **快捷键补全**：全选、解散分组、图层顺序、翻转、`V`/`H` 工具、`?` 快捷键面板
- **全局快捷键**：`Ctrl/Cmd+Shift+Space` 显示/隐藏主窗口（桌面版）
- **自动保存恢复**：启动时扫描最近项目的 `.autosave` 并提示恢复
- **副窗口**：工具栏「副窗口」→ 独立缩放/平移的第二视图，内容与主窗口实时同步

### 设计师工作台（v0.6）
- **图层拖拽排序**：侧栏 ⠿ 拖拽调整 z 序
- **双击图层定位**：双击侧栏项缩放到该图
- **适应筛选/分组**：无选中时「适应」针对色标/搜索筛选结果；分组头 ⊡ 或双击适应分组
- **缩放控制**：顶栏与画布右下角可点击输入缩放，悬停快捷预设
- **自动保存面板**：多个 `.autosave` 时列表选择恢复
- **右键菜单**：图片右键复制/锁定/图层/翻转/删除；`Esc` 关闭

## 环境要求

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install)（Tauri 桌面构建）
- macOS / Windows / Linux 系统依赖见 [Tauri 前置条件](https://tauri.app/start/prerequisites/)

## 开发运行

```bash
cd "/Users/xia/Desktop/开发项目/图片管理"
npm install
npm run tauri dev
```

### 1.0
- **文本标注**、**群组框缩放/换色**、未命名草稿 autosave、数据一致性修复

## 构建发布

```bash
npm run build    # 前端
npm test         # 单元测试
npm run tauri build   # 桌面安装包（需 Rust）
```

### GitHub Actions（自动发布）

推送 `v*` 标签（如 `v1.0.0`）或在本仓库 **Actions → Release → Run workflow** 手动触发，将自动：

1. 运行 `npm test` 与前端构建  
2. 在 macOS（Apple Silicon / Intel）、Windows、Linux 上执行 `tauri build`  
3. 将 `.dmg`、`.msi`、`.deb` / `.AppImage` 等上传到对应 [GitHub Release](https://github.com/art13817979231-svg/kantu/releases)

工作流定义见 `.github/workflows/release.yml`。

## 快捷键

| 快捷键 | 行为 |
|--------|------|
| `Ctrl/Cmd+O` | 打开项目 |
| `Ctrl/Cmd+S` | 保存 |
| `Ctrl/Cmd+Shift+S` | 另存为 |
| `Ctrl/Cmd+N` | 新建项目 |
| `Ctrl/Cmd+I` | 导入图片 |
| `Ctrl/Cmd+T` | 窗口置顶切换 |
| `Ctrl/Cmd+D` | 复制选中图片 |
| `Delete` | 删除选中 |
| `Ctrl/Cmd+0` | 重置视图缩放 |
| `Ctrl/Cmd+1` | 缩放到适合（有选中时仅缩放选中项） |
| `Shift`（缩放时按住） | 自由拉伸（默认等比缩放） |
| `[` / `]` | 降低 / 提高透明度 |
| `↑↓←→` | 微移选中（`Shift` 大步长） |
| `Space`（按住） | 画布平移模式 |
| 滚轮 | 以鼠标位置为中心缩放 |

## `.pur` 项目格式

`.pur` 文件为 ZIP 压缩包，结构如下：

```
project.pur
├── manifest.json
└── assets/
    ├── <uuid>.png
    └── <uuid>.jpg
```

### manifest.json 示例

```json
{
  "version": 5,
  "viewport": { "panX": 0, "panY": 0, "zoom": 1 },
  "settings": {
    "alwaysOnTop": false,
    "canvasBackground": "dots-dark",
    "sidebarCollapsed": true,
    "compactMode": false,
    "importStrategy": "fit-short-edge"
  },
  "boards": [{ "id": "main", "name": "主画板", "viewport": { "panX": 0, "panY": 0, "zoom": 1 } }],
  "activeBoardId": "main",
  "groups": [],
  "categories": [],
  "texts": [],
  "images": [
    {
      "id": "uuid",
      "asset": "assets/uuid.png",
      "x": 100,
      "y": 200,
      "width": 1920,
      "height": 1080,
      "scaleX": 1,
      "scaleY": 1,
      "rotation": 0,
      "opacity": 1,
      "zIndex": 1
    }
  ]
}
```

> 注意：此为 RefBoard 自定义格式，与官方 PureRef 的 `.pur` **不兼容**。

## MVP 验收步骤

1. 运行 `npm run tauri dev`，拖入 10+ 张图片。
2. 分别对图片进行移动、角点缩放、旋转、透明度调节。
3. 按住空格拖动画布，滚轮缩放，确认无边界限制。
4. 点击「置顶」，窗口应始终在最前；`Ctrl/Cmd+T` 可切换。
5. 保存为 `.pur`，关闭后重新打开，布局与透明度应一致。
6. 批量导入后点击「排版」，图片应按网格或横排整齐排列。

## 项目结构

```
src/
├── components/     # InfiniteCanvas, ImageNode, Toolbar
├── store/          # Zustand 状态
├── hooks/          # 快捷键、拖放
├── utils/          # 排版、项目 IO、图片加载
└── types/          # 类型定义

src-tauri/
├── src/project.rs  # .pur ZIP 读写
└── src/lib.rs      # Tauri 命令
```

## 技术栈

- **前端**：React 19, Konva, Zustand, react-hotkeys-hook
- **桌面**：Tauri 2, Rust (zip, serde)
- **插件**：dialog, fs, opener
