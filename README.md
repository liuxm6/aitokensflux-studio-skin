# Ai Tokens Flux — Studio Skin

基于 `openrouter-theme` 客户端功能清单重新设计的独立 **React + Tailwind** Skin 原型。与 `openrouter-theme`、`new-api-org` 平级，**不依赖或修改这两个项目的运行时与配置**。

这是设计审核 Demo，不是已接入后端的生产客户端。所有价格、规格、用量、余额、服务状态及认证流程均为模拟；不会请求 `/api`、`/v1`、支付服务或身份提供商。

## 当前预览

开发预览：<http://localhost:4174/>

当前为中文体验优化 v5.1：保留 41 类页面与原设计方向，优化中文断行、指标布局、任务文案和表单。当前 24 个测试文件、163 项自动测试通过；本轮实际浏览器覆盖、截图及边界见 [设计审核说明](REVIEW.md)。此前全页基线见 [逐页审核记录](PAGE_AUDIT.md)，复审条目见 [页面复审修复清单](PAGE_REVIEW_FIX_LIST.md)。

- 简体中文、繁体中文、English、Русский；支持浅色、深色、跟随系统。
- 首页、模型目录/详情、发现、提供商、价格、状态、文档及可选排行榜。
- 个人概览、API Keys、活动、日志、余额、资料、设置与偏好。
- 组织及空间的成员、账单、单据、审计、护栏、设置等设计页面。
- 右下角「预览控制」可以进入完整页面目录、切换演示角色、查看空/加载/失败/受限/暂停状态、启用七个可选概念模块和重置主要演示数据。

## 交互范围

可以本地体验：搜索、筛选、收藏、视图切换、分页、表单错误、创建/编辑/启停/删除示例 Key、一次性示例 Key 展示、成员邀请、角色裁剪、预算字段、规则编辑、收据详情与模拟作废、主题及语言切换。

认证、付款、SSO/SCIM、敏感操作、组织创建及未开放模块用于展示设计步骤，不是真实业务实现。示例 Key 不能鉴权；不要输入真实凭据。

已保存的业务样例在同一次预览中跨页保持，刷新或重置恢复样例；浏览器仅保存语言、主题、收藏，存储键为 `aitokensflux-studio.preferences.v1`。本原型不宣称具备生产级认证、账务或权限安全保证。真实功能接入必须在设计审核后单独完成。

## 本地开发

依赖使用 Bun 安装；开发服务、类型检查、测试和构建使用 Node.js 22。验证中发现旧版 Bun 1.3.3 运行 Vitest/Zod 存在模块互操作问题，因此不使用 `bun run --bun test`。

```bash
bun install --frozen-lockfile
```

```bash
bun run dev
```

```bash
bun run typecheck
```

```bash
bun run lint
```

```bash
bun run test
```

```bash
bun run build
```

生产静态输出在 `dist/`。使用 hash 路由，因此无需后端业务路由回退。

本机未安装 Node/Bun 时，可使用已有 Docker。当前开发服务通过应用内 Browser 的预览配置启动，使用独立的 `aitokensflux-studio-preview` 容器、`aitokensflux-studio-node_modules` 依赖卷和本机回环地址端口 4174，不影响原 Skin 的 8088 端口。

本机 `.claude/launch.json` 是含本地目录路径的预览配置，不随仓库提交。克隆后可按上面的 Node.js 22 + Bun 命令启动开发环境；已有 Docker 预览容器运行时，不要重复启动同名容器。

## 检查与验收

- `src/**/__tests__/`：字段校验、焦点、Escape、Key 生命周期、角色、状态隔离和本地化格式。
- `scripts/audit-pages.mjs`：应用内 Browser 的逐页 DOM/布局检查助手；实际结果见 `PAGE_AUDIT.md`。
- `scripts/verify-browser.cjs`：额外的 Playwright/Chromium 验收脚本。本机已有 Docker 镜像无法支持 Chromium 沙箱，整套脚本未记为通过，也没有关闭沙箱。它不替代本轮应用内 Browser 的实际验证记录。
- `artifacts/`：本机留存的截图、报告和历史打包文件，已由 `.gitignore` 排除，不随仓库上传。源码、测试、许可与本页链接的 Markdown 审核说明包含在仓库中。

设计审核通过前，不应将此原型替换线上 Skin。生产接入还需补全 HTTP 合同、真实会话、服务端权限、余额与预算约束、支付、SSO/SCIM、错误及重试流程。

## 组件与许可

纯 UI 基础组件、弹窗/确认/复制封装及剪贴板逻辑移植自 **new-api / QuantumNous**，保留源码许可头。没有复制生产应用启动器、API 客户端、认证状态或持久化系统配置。详见 `NOTICE` 与 `LICENSE`。

样式参考：<https://www.uupm.cc/demo/ai-chatbot-platform>。未复制参考站品牌、产品文案或插图资产。
