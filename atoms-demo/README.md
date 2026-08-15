# Atoms Demo Studio

一个面向评审与体验场景的 Atoms 风格网页 Demo。它把“自然语言想法 -> 页面规划 -> 代码生成 -> 实时预览 -> 版本沉淀”做成了一条可运行、可感知、可持久化的前端工作流。

## 在线访问

- 当前访问地址：`https://gentle-comet-344.harvis.page/`
- 当前发布方式：`1FreeHosting` 独立子域托管
- 说明：这次发布已经是独立站点入口，不再依赖路径前缀；若要长期保留，需要使用本地私有 claim 信息把站点绑定到账号。私有 claim 信息未写入仓库，保存在本地 `dist/.hosting.json`。

## 本地启动

```bash
pnpm install
pnpm dev
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm preview
```

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Dexie / IndexedDB
- Framer Motion
- React Router
- Vitest + Testing Library

## 功能概览

- 首页工作台：初始化工作区、模板入口、最近项目、能力介绍
- 生成工作室：需求输入、智能体步骤流、页面规划、代码产出、实时预览
- 版本管理：每次生成自动沉淀为版本，可回滚、Remix、恢复
- 展示页：查看所有项目、筛选、搜索、删除与恢复
- 本地持久化：用户偏好、项目、版本全部写入浏览器 IndexedDB

## 项目文档

- 产品说明：[`../.trae/documents/atoms-demo-prd.md`](file:///Users/bytedance/Desktop/eino-examples/.trae/documents/atoms-demo-prd.md)
- 技术架构：[`../.trae/documents/atoms-demo-tech-architecture.md`](file:///Users/bytedance/Desktop/eino-examples/.trae/documents/atoms-demo-tech-architecture.md)
- 详细架构与模块说明：[`./read.md`](file:///Users/bytedance/Desktop/eino-examples/atoms-demo/read.md)

## 部署说明

当前仓库内的代码仍然保留在本地，线上站点访问的是构建后的静态产物副本。重新发布时，先执行：

```bash
pnpm build
cd dist
npx hosting --name atoms-demo-studio
```

如果已经链接过同一个站点，后续重新执行会更新同一个线上地址。
