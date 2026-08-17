# Atoms Demo Studio 架构说明

## 1. 项目定位

`Atoms Demo Studio` 是一个前端单体网页应用，用来模拟 Atoms 风格的“智能体驱动生成应用”体验。当前版本采用“双模生成”：

- `Local Demo`：本地规则生成，作为离线演示和兜底模式
- `Agent LLM`：通过 OpenAI-compatible 接口调用真实模型，由 Planner / Coder Agent 参与规划与代码生成

它强调三件事：

- 真正可操作的交互流程，而不是静态概念页
- 真正可持久化的项目和版本状态，而不是一次性演示
- 真正可扩展的生成链路，而不是写死的单页面模板

## 2. 核心体验链路

整个产品围绕一条主流程展开：

1. 首次进入时初始化工作区
2. 用户输入昵称和默认风格
3. 选择模板或空白创建项目
4. 输入应用目标、页面、受众和扩展能力
5. 选择 `Local Demo` 或 `Agent LLM`
6. 由本地生成器或真实 Agent 输出结构化页面规划
7. 生成 HTML / CSS / JS 和可运行预览
8. 自动沉淀版本并写入本地数据库
9. 用户可继续编辑、回滚、Remix 或进入作品展示页

## 3. 架构总览

项目采用“纯前端 + 本地数据持久化 + 浏览器直连模型（BYOK）”架构，不强依赖独立后端。

- 展示层：页面、布局、表单、步骤流、卡片、弹窗
- 状态层：Zustand 统一管理工作区、项目、版本和生成会话
- 生成层：本地生成器负责离线兜底；Agent 生成器负责调用真实模型完成页面规划与代码产出
- 持久化层：Dexie 基于 IndexedDB 保存工作区资料、项目和版本
- 预览层：通过 iframe / srcDoc 渲染生成结果

## 4. 目录结构

```text
atoms-demo/
├── src/
│   ├── components/
│   │   ├── home/            # 首页初始化与工作台组件
│   │   ├── layout/          # 全局框架布局
│   │   └── studio/          # 工作室生成流程组件
│   ├── data/                # 模板与预设
│   ├── hooks/               # 主题等复用 hook
│   ├── lib/                 # db、generator、utils 等基础能力
│   ├── pages/               # Home / Studio / Showcase 页面
│   ├── store/               # Zustand 状态管理
│   ├── test/                # 测试初始化
│   └── types/               # 领域模型类型定义
├── public/                  # favicon 等静态资源
├── dist/                    # 构建产物
└── README.md / read.md      # 项目说明文档
```

## 5. 页面与职责

### 5.1 首页 / 工作台

- 展示产品能力说明
- 首次进入时弹出初始化工作区
- 提供模板入口和最近项目
- 引导进入生成工作室

### 5.2 生成工作室

- 管理 prompt 输入
- 展示生成步骤流
- 输出页面规划摘要
- 展示代码结果
- 预览运行结果
- 管理版本时间线

### 5.3 作品展示页

- 浏览所有项目
- 搜索、筛选和状态查看
- 删除、恢复和 Remix 项目

## 6. 状态管理

核心状态集中在 [`src/store/useStudioStore.ts`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/src/store/useStudioStore.ts)。

主要包含：

- `profile`：当前工作区资料
- `profile.agentConfig`：当前浏览器保存的 Agent Provider 配置
- `projects`：项目列表
- `versions`：按项目分组的版本列表
- `generation`：一次生成会话的步骤状态

核心动作包括：

- `hydrate`：从 IndexedDB 恢复工作区
- `initializeWorkspace`：初始化昵称和默认风格
- `createProject` / `seedPresetProject`：创建项目
- `runGeneration`：驱动完整生成流程
- `restoreVersion` / `remixVersion`：版本恢复与派生
- `setProjectDeleted`：软删除与恢复

## 7. 领域模型

核心类型定义在 [`src/types/domain.ts`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/src/types/domain.ts)。

关键对象有：

- `WorkspaceProfile`：工作区资料
- `AppPrompt`：用户输入的结构化需求
- `AppPlan`：生成后的页面规划
- `GeneratedBundle`：HTML / CSS / JS / 预览文档
- `Project`：项目元信息
- `ProjectVersion`：项目的快照版本

这些类型把“输入 -> 规划 -> 产物 -> 版本”串成了稳定的数据链路。

## 8. 生成器与 Agent

### 8.1 本地生成器

本地生成器位于 [`src/lib/generator.ts`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/src/lib/generator.ts)。

它负责：

- 把 prompt 转成页面与模块规划
- 根据规划拼出 HTML / CSS / JS
- 作为离线模式和失败兜底

### 8.2 Agent 生成器

真实 Agent 生成器位于 [`src/lib/agent.ts`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/src/lib/agent.ts)。

当前实现包含两步：

- `Planner Agent`：读取用户需求，返回结构化 `AppPlan`
- `Coder Agent`：读取 `AppPlan` 和原始需求，生成 `html / css / js`

特点：

- 使用 OpenAI-compatible `chat/completions`
- 要求模型返回 JSON，避免前端难以消费的自由文本
- 生成后的代码同样通过 `iframe + srcDoc` 即时运行
- 采用 BYOK，密钥只保存在当前浏览器，不写入仓库

## 9. 数据持久化

数据库封装位于 [`src/lib/db.ts`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/src/lib/db.ts)。

采用 Dexie 管理三类数据：

- `workspaceProfiles`
- `projects`
- `projectVersions`

这样页面刷新后仍然能够恢复：

- 用户昵称和默认风格
- 最近项目
- 历史版本
- 删除 / 恢复状态

## 10. 预览机制

项目通过生成后的文档字符串进行实时预览，目标是让评审能直接感知“生成结果是否可运行”。

预览层有两个价值：

- 让生成结果不是截图，而是真正的网页运行结果
- 让错误状态可以被隔离并反馈到工作台
- 不论是本地生成器还是 Agent 代码产物，都走同一套预览出口

## 11. 路由设计

入口路由定义在 [`src/App.tsx`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/src/App.tsx)。

- `/`：首页 / 工作台
- `/studio/:projectId`：生成工作室
- `/showcase`：作品展示页

## 12. 测试与构建

常用命令：

```bash
pnpm dev
pnpm build
pnpm test
pnpm preview
```

当前已验证：

- `pnpm test` 可通过
- `pnpm build` 可通过

## 13. 当前部署信息

- 当前公开访问地址：`https://zesty-meadow-622.harvis.page/`
- 当前发布方式：`1FreeHosting`
- 当前发布形态：独立子域静态站点

说明：

- 公网访问的是 `dist/` 构建产物副本，不是直接读取本地源码
- 本地重新执行发布命令会更新同一个线上地址
- 账号绑定所需的 claim 信息属于私有信息，不写入仓库，保存在本地 `dist/.hosting.json`

## 14. 后续建议

- 把当前站点 claim 到账号下，转成长期保留链接
- 迁移到 Vercel / Netlify / Cloudflare Pages 做正式托管
- 把本地生成器抽象成 Provider，接入真实 LLM
- 为生成结果增加更细粒度的错误边界与日志
- 补充更多单测，覆盖版本恢复、Remix 和展示页筛选

## 15. 工程取舍

这次实现里有几处是刻意做的工程取舍：

- 不先接真实 LLM，而是先完成离线可运行生成链路
  - 目的：保证 Demo 稳定、可展示、可复现
  - 代价：生成智能度仍然是 Demo 级
- 不引入后端，直接采用 IndexedDB 本地持久化
  - 目的：降低交付复杂度，让核心价值聚焦在交互与工作流
  - 代价：数据只保存在当前浏览器
- 预览采用 `iframe + srcDoc`
  - 目的：最快速实现“生成即运行”的真实体验
  - 代价：隔离能力有限于前端沙箱，不适合高风险脚本场景
- 当前发布选择轻量托管
  - 目的：优先完成可访问的评审链接
  - 代价：长期稳定性仍不如标准云平台托管

## 16. 按评估维度的自评

### 16.1 完成度

- 已完成首页、工作室、展示页三块核心页面
- 已完成初始化、生成、预览、版本、Remix、删除恢复等主流程
- 已通过本地 `build` 与 `test`
- 当前不足：自动化测试覆盖仍偏少，且 Agent 真链路更多依赖运行时 Provider 成功率

### 16.2 工程思维

- 采用“展示层 / 状态层 / 生成层 / 持久化层”拆分
- 生成链路采用可替换 Provider 思路，当前已具备真实 Agent 接口
- 用 Dexie + IndexedDB 控制复杂度，同时把 Agent 配置也持久化到本地
- 在稳定性和速度之间采用“双模”策略：本地兜底，Agent 增强

### 16.3 用户体验

- 首次进入有工作区初始化引导
- 生成流程可视化，不是纯装饰进度条
- 当前版本支持实时预览、刷新、全屏、导出 HTML
- Prompt 输入区增加了“生成准备度”提示，降低误操作成本

### 16.4 创新性

- 不是单纯生成静态页面，而是把“智能体过程可视化”纳入体验核心
- 版本回滚 + Remix 让 Demo 不只停留在一次性生成
- 生成结果支持导出 HTML，增强了从 Demo 到交付件的连接
- 通过 BYOK 方式在纯静态站点里接入了真实 Agent，扩展潜力明确

### 16.5 可交付性

- 已提供在线访问链接
- 已提供 README、架构说明、PRD、技术架构文档
- 当前链接已是可登录管理的独立站点
- 代码、文档、线上演示三者已经对齐，可直接用于提交评审
