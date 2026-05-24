# RefBoard v1.0.0 — GitHub Release 说明

> 发布时在 GitHub → Releases → Draft a new release  
> **Tag**: `v1.0.0` · **Title**: `RefBoard v1.0.0`  
> 将下方「Release body」整段粘贴到描述框。

---

## Release body（复制以下内容）

```markdown
## RefBoard v1.0.0 — 参考图板首版

轻量桌面参考图工具，对标 PureRef，面向设计师的本地灵感收集与整理。基于 **Tauri 2 + React + Konva**。

### 亮点

- **看图模式**：拖入即看、滚轮缩放、双击图片放大、双图对照
- **文本标注**：双击画布输入，背景色预设，随项目保存
- **群组 / 主题框**：成组联动、四角缩放、框色自定义、拖入自动归类
- **多画板**：顶栏切换多个主题画板
- **整理模式**：图层、色标、分类、对齐、分布、联系表导出
- **项目文件**：自定义 `.pur`（ZIP + manifest + assets），自动保存与崩溃恢复
- **未命名草稿**：尚未另存为时也会自动备份到应用目录

### 安装

1. 下载对应平台的安装包（见 Assets）
2. **macOS**：若提示「无法验证开发者」，右键 → 打开，或在 系统设置 → 隐私与安全性 中允许
3. **Windows**：若 SmartScreen 拦截，点击「更多信息」→「仍要运行」（未签名包常见）
4. 双击 `.pur` 文件可关联打开（若安装时已注册）

### 系统要求

- macOS 10.15+ / Windows 10+ / Linux（glibc 2.31+ 常见发行版）
- 建议单项目数百张参考图以内以获得流畅体验

### 快速上手

| 操作 | 说明 |
|------|------|
| 拖入图片 | 桌面版直接拖文件；看图模式默认 |
| 滚轮 | 缩放 |
| 空格 + 拖 | 平移画布 |
| 双击空白 | 创建文本标注 |
| 双击图片 | 单独放大查看 |
| `Tab` | 侧栏 |
| `?` | 快捷键帮助 |
| 顶栏「整理」 | 图层、对齐、成组等 |

### 自动保存

- **已保存项目**：每 2 分钟写入 `{项目路径}.autosave`
- **未命名项目**：每 2 分钟写入应用数据目录 `drafts/`
- 启动时若发现备份会提示恢复

> 开发版（`npm run tauri dev`）自动保存间隔为 **30 秒**，便于联调。

### 与 PureRef 的关系

RefBoard 使用**自定义** `.pur` 格式，与官方 PureRef 的 `.pur` **不兼容**。这是独立产品，不是 PureRef 插件或替代品的数据格式迁移工具。

### 已知限制（v1.0）

- 暂无撤销 / 重做
- 图层侧栏以图片为主，文本未完全纳入侧栏
- 无云同步、无账号体系
- 安装包暂未代码签名（自行构建分发时请注意）

### 从源码构建

```bash
git clone https://github.com/art13817979231-svg/kantu.git
cd kantu
npm install
npm run tauri build
```

### 完整变更

见仓库 [CHANGELOG.md](../CHANGELOG.md)

---

**Full Changelog**: https://github.com/art13817979231-svg/kantu/releases/tag/v1.0.0
```

---

## 发布 Checklist

- [ ] `npm test` 通过（或由 CI 自动执行）
- [ ] 推送 `v*` 标签触发 [Release workflow](https://github.com/art13817979231-svg/kantu/actions/workflows/release.yml)，或本地 `npm run tauri build` 后手动上传 Assets
- [x] 仓库地址：https://github.com/art13817979231-svg/kantu
- [ ] （可选）macOS 公证 / Windows 签名后再上传
