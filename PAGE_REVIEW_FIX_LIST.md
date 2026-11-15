# 全页面重新审查 · 修复清单 v5

审核日期：2026-11-14

项目：`aitokensflux-studio-skin`

范围：当前 Logo C「开放入口」替换后的版本；未修改 `openrouter-theme`、`new-api-org`。

## 结论先行

本轮重新遍历了现有 **41 类页面**，并复查了当前 Logo 替换后的首页和控制台导航。

### 已通过的部分

- 正常页面矩阵：41 页 × 11 个语言/主题/视口组合 = **451 条 DOM/布局检查**，未发现页面级横向溢出、被隐藏的模型卡、无名控件、关闭下拉残留尺寸或重复可见 ID。
- 四语言浅色：English、简体中文、繁體中文、Русский，分别检查 1440px 和 375px。
- 暗色：简体中文检查 1440px、768px、375px。
- 当前版本页面无原生 `<select>`；共享 Base UI Select 仍然覆盖运行时下拉。
- 复查过程中没有观察到应用运行时错误或 `/api`、`/v1` 业务请求。
- Logo C 方向在首页导航与控制台品牌区域正常渲染；favicon 返回 200；Logo 不产生页面溢出。
- 页面级标题、无效模型/路径、移动导航、组织/空间切换、角色状态、Key 轮换、业务样例重置等既有检查仍通过。

### 本轮确认的修复项

下面只列实际通过代码检查或浏览器实操确认的问题，不把候选项写成已确认缺陷。

| 优先级 | 状态 | 问题 | 影响 |
|---|---|---|---|
| P1 | 无 | 本轮没有发现阻断页面使用的 P1/P0 布局或运行时缺陷 | 暂无必须先于审核的阻断项 |
| P2 | 已完成 | 重要标签、筛选和列表状态没有进入 URL | 模型详情、组织设置、目录、活动/日志、文档章节已同步 search，可刷新和复制链接恢复 |
| P2 | 已完成 | 概念模块的 Remove 为单击即删，没有确认或撤销 | 已统一为共享 ConfirmDialog，取消保留、确认删除 |
| P2 | 已完成 | FormDialog 的关闭、Escape、Cancel 会直接丢弃未保存编辑 | 已加入 dirty 状态拦截和“继续编辑/放弃更改”确认 |
| P2 | 已完成 | 通用表单输入统一 `autocomplete="off"`，email 字段仍允许拼写检查 | 已改为字段级 autocomplete/inputMode/spellCheck 语义 |
| P2 | 已完成 | 多个搜索 placeholder 使用 ASCII `...` | 已统一为 `…` 并同步四语言键集合 |
| P2 | 已完成 | 页面审计脚本没有把 switch、link、tab 等纳入控件统计 | 已使用统一 semantic interactive selector，并增加 aria 状态/controls 检查 |
| P2 | 已完成 | i18n 收集脚本把 BrandMark 的 SVG path 当成翻译键 | 已跳过 SVG geometry/path 常量，`--check` 返回 `missing: []` |
| P3 | 延后 | Demo 中同步操作没有 pending/spinner 状态 | 当前没有真实请求，暂不应伪造网络等待；接入真实功能时必须补齐 |

### 当前版本自动检查

- TypeScript：通过。
- Oxlint：0 warnings / 0 errors。
- Oxfmt：通过。
- Vitest：23 个测试文件、152 项测试通过。
- Vite 生产构建：通过；仅有两条来自 Zod 依赖源码的 PURE 注释位置警告。
- `scripts/collect-i18n.ts --check`：通过，返回 `missing: []`；BrandMark 和 ProviderLogo 的 SVG 路径不再被当作翻译键。

## 修复清单

### 1. 让可分享的页面状态进入 URL（P2）

**确认依据：** 浏览器实际点击后，选中内容改变，但 hash 不变。

- [x] 模型详情标签：`概览 / 提供商 / API 示例 / 性能`
  - 位置：[model-detail.tsx:16](src/features/public/model-detail.tsx#L16)
  - 当前：`useState("Overview")`
  - 建议：使用 route search，例如 `?tab=providers`；未知值回退到 `Overview`。
- [x] 组织设置标签：`General / Management keys / SSO & SCIM / Danger zone`
  - 位置：[settings.tsx:25](src/features/console/settings.tsx#L25)
  - 当前：`useState("General")`
  - 建议：`?tab=general`，并保留空间设置只显示允许的标签。
- [x] 模型目录筛选和视图状态
  - 位置：[catalog.tsx:44-50](src/features/public/catalog.tsx#L44-L50)
  - 当前保存在本地 state：收藏过滤、grid/table、排序、上下文、模态、分页。
  - 建议：与现有 `q/provider/category` 合并到 URL search；改变筛选时重置 page，删除无效值。
- [x] 活动/日志/审计查询状态
  - 位置：[activity.tsx:21-25](src/features/console/activity.tsx#L21-L25)
  - 当前：query、status、range、page 均为本地 state。
  - 建议：使用 route search，导出和返回操作读取同一份 URL 状态。
- [x] 文档章节与排行榜/提供商页面的局部选择
  - 文档章节当前由本地按钮状态驱动；如果要支持分享深链接，使用 `?section=`。
  - 不要求把纯视觉模式切换全部 URL 化，但需要明确哪些状态可以被复制链接恢复。

**验收：** 选择状态 → 复制 hash → 刷新 → 状态不丢；浏览器后退/前进能恢复；非法 search 值安全回退。

### 2. 统一破坏性操作的确认/撤销（P2）

**确认依据：** 已在浏览器执行可选概念模块“添加示例 → Remove”，行被立即删除，没有 `alertdialog`。

- [x] 为概念模块 Remove 引入共享 `ConfirmDialog` 或短时 Undo。
  - 位置：[concept.tsx:74-77](src/features/console/concept.tsx#L74-L77)
  - 当前：`onClick={() => setItems(items.filter(...))}` 直接改变共享状态。
- [x] 保持与 API Key、成员、护栏、单据作废的确认样式一致。
- [x] 确认描述要继续明确“只影响当前 Demo”，不要让概念模块看起来像已接入生产数据。

**验收：** 第一次点击只打开确认；取消不删除；确认后删除；键盘 Escape 关闭确认。

### 3. 保护未保存的编辑（P2）

**确认依据：** 打开个人资料编辑，修改名称后按 Escape，对话框直接关闭，没有二次提示，修改不保存。

- [x] 在共享 [form-dialog.tsx:81-109](src/components/form-dialog.tsx#L81-L109) 追踪 dirty 状态。
- [x] 当值未变化时，Cancel、关闭按钮、Escape 直接关闭。
- [x] 当值已变化时，关闭动作先显示“放弃编辑？”确认。
- [x] 保存成功后清理 dirty 状态；保存失败或自定义校验失败时保留输入。
- [x] 对新增表单也采用同一行为，避免不同页面各自实现。

**验收：** 空表单可直接取消；修改后关闭会确认；继续编辑会保留输入；放弃后不写入 Demo store。

### 4. 修正表单的 autocomplete / spellcheck 语义（P2）

**确认依据：** 成员邀请表单的 email 输入实际渲染为 `autocomplete="off"`、`spellcheck=true`；通用 FormDialog 对所有输入都套用了同一属性。

- [x] 扩展 `DemoField`，允许传入 `autoComplete`、`inputMode`、`spellCheck`。
- [x] email 字段使用 `type="email"`、`autoComplete="email"`、`spellCheck={false}`。
- [x] URL 字段使用合适的 `type` 或 `inputMode`，并关闭不必要的拼写检查。
- [x] 代码、Client ID、兑换码等标识字段使用 `spellCheck={false}`，不允许自动翻译或拼写修改。
- [x] 不要全局关闭所有字段的自动填充；认证 Demo 的固定只读字段可以保留明确的 Demo 边界。
- [x] 提交前继续允许粘贴，不加入阻止粘贴逻辑。

位置：[form-dialog.tsx:140-149](src/components/form-dialog.tsx#L140-L149)。

### 5. 统一 placeholder 文案（P2）

**确认依据：** 源码仍有多个搜索框使用三个 ASCII 点。根据界面规范，应使用单字符省略号 `…`，并保持翻译键一致。

- [x] [catalog.tsx:177](src/features/public/catalog.tsx#L177) → `Search models or providers…`
- [x] [discover.tsx:143](src/features/public/discover.tsx#L143) → `Search models or providers…`
- [x] [support.tsx:58](src/features/public/support.tsx#L58) → `Search providers…`
- [x] [keys.tsx:71](src/features/console/keys.tsx#L71) → `Search by name…`
- [x] [members.tsx:136](src/features/organization/members.tsx#L136) → `Search by name or email…`
- [x] [activity.tsx:108-110](src/features/console/activity.tsx#L108-L110) → 搜索请求和审计记录使用 `…`
- [x] [app-shell.tsx:369](src/components/app-shell.tsx#L369) → `Search pages and models…`
- [x] 更新四种语言键集合与 placeholder 回归测试。

### 6. 修正审计与翻译收集工具（P2）

#### 6.1 加强页面审计脚本，避免假通过

**确认依据：** `notifications` 与 `privacy` 页面有可见 switch，但当前 `inspect()` 的 controls 统计为 0；脚本只统计 `button, [role="combobox"], input`。

- [x] [audit-pages.mjs:103-104](scripts/audit-pages.mjs#L103-L104) 增加：
  - `a[href]`
  - `[role="link"]`
  - `[role="tab"]`
  - `[role="switch"]`
  - `[role="checkbox"]`
  - `[role="button"]`
- [x] 未命名控件检查使用同一套 semantic interactive selector。
- [x] offscreen 检查同样覆盖 link、tab、switch、checkbox。
- [x] 增加 `aria-pressed`、`aria-selected`、`aria-checked` 与可见状态的基本一致性检查。
- [x] 记录有意的滚动容器，避免把表格和 tab strip 的内部滚动误报成页面溢出。

#### 6.2 修正 i18n 收集器对 SVG path 的误报

**确认依据：** 初始运行 `scripts/collect-i18n.ts --check` 会把 [brand-mark.tsx](src/components/brand-mark.tsx) 和 ProviderLogo 的 SVG 路径报告为缺失翻译键；修复后已返回 `missing: []`。

- [x] 在收集器中跳过 SVG 属性值、`d` path、颜色和图形常量。
- [x] 或把品牌图形放入不参与文案扫描的资源目录。
- [x] 保留真实 `t(...)` 调用和用户可见字符串的键检查。
- [x] 修复后再次运行 `collect-i18n.ts --check`，应返回 `missing: []`。

### 7. 真实功能接入前的延后项（P3）

以下不是本轮 Demo 阻断缺陷，先列入后续开发清单：

- [ ] 真实请求开始后，按钮保持可见但进入 pending 状态并显示 spinner。
- [ ] 网络失败、重试、超时、取消和异步成功提示使用 polite live region。
- [ ] 真实认证、账务、成员权限、SSO/SCIM 和策略执行接入服务端约束。
- [ ] 真正的路由/筛选数据和生产 API 合同完成后，再跑真实浏览器/Playwright 验收。

## 按页面组的处理顺序

### 第一批：共享交互（优先）

- [x] `form-dialog.tsx`：dirty 保护 + 输入语义 + placeholder 规则
- [x] `concept.tsx`：删除确认
- [x] `audit-pages.mjs`：补齐 switch/link/tab 控件覆盖
- [x] route search schema：为标签、目录筛选、活动筛选定义统一类型

### 第二批：公共页面

- [x] 模型详情标签 URL 化
- [x] 模型目录 grid/table、sort、context、modality、favorite、page URL 化
- [x] 文档章节 URL 化
- [x] 搜索 placeholder 四语言统一

### 第三批：控制台与组织/空间

- [x] 组织设置标签 URL 化
- [x] 活动/日志/审计 query、range、status、page URL 化
- [x] 成员邀请与 SSO/SCIM 表单套用新的字段语义
- [x] 概念模块统一确认交互

## 不需要修复的已验证项

- 当前 Logo C「开放入口」在首页和控制台导航显示正常；favicon 可访问。
- 统一 Base UI Select 已替代运行时原生下拉。
- 41 页正常状态的 1440/375 多语言布局无已确认溢出。
- 暗色、俄文长文案、375/768/1440 的已覆盖组合无已确认布局缺陷。
- 模型目录 200K+ 筛选的三张模型卡均可见。
- 组织/空间范围、成员隔离、额度、单据状态、Key 轮换、重置和无效路径已有回归覆盖。

## 本轮交付状态

- 本轮已实施第 1-6 项 P2 修复，并完成回归；第 7 项真实功能接入仍按 Demo 边界延后。
- 当前本地 Demo 仍可在 <http://localhost:4174/> 访问。
- 页面矩阵摘要保存在本机 `artifacts/page-audit-layout.json`，审核产物不随 Git 仓库上传。
- 生产 Chromium 脚本仍不因沙箱限制被记为通过；不关闭浏览器沙箱绕过该限制。
