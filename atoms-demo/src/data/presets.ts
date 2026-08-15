import type { AppPrompt, GeneratorPreset } from "@/types/domain";

export const defaultPrompt: AppPrompt = {
  appName: "",
  goal: "",
  audience: "",
  pages: [],
  styleKeywords: ["包豪斯", "低对比", "简约科技"],
  extensionFeature: "版本回滚",
};

export const preferredStyles = [
  "包豪斯低对比",
  "工业面板",
  "编辑部科技感",
  "柔和数据看板",
];

export const generatorPresets: GeneratorPreset[] = [
  {
    id: "event-launch",
    name: "活动报名页",
    summary: "适合生成有表单、议程与 FAQ 的活动落地页。",
    badge: "表单 / 落地页",
    prompt: {
      appName: "品牌开放日报名站",
      goal: "为一场线下开放日活动生成报名落地页，需要活动亮点、时间安排和报名表单。",
      audience: "潜在报名者与市场团队",
      pages: ["首页", "报名确认", "FAQ"],
      styleKeywords: ["包豪斯", "高级灰", "强引导"],
      extensionFeature: "报名数据导出说明",
    },
  },
  {
    id: "ops-dashboard",
    name: "运营看板",
    summary: "适合生成有指标卡、趋势区和行动建议的数据看板。",
    badge: "Dashboard",
    prompt: {
      appName: "内容运营作战台",
      goal: "为运营团队生成一个简洁但可交互的内容看板，包含核心指标、任务优先级和趋势对比。",
      audience: "内容运营经理",
      pages: ["总览", "任务面板", "趋势洞察"],
      styleKeywords: ["低对比", "编辑部", "数据可视化"],
      extensionFeature: "一键生成日报摘要",
    },
  },
  {
    id: "tool-lab",
    name: "小工具页",
    summary: "适合生成含输入、结果卡片和辅助说明的轻量工具应用。",
    badge: "Tool",
    prompt: {
      appName: "标题灵感实验室",
      goal: "生成一个给内容创作者使用的标题灵感小工具，输入主题后可以得到不同风格的标题建议。",
      audience: "内容创作者",
      pages: ["生成器", "风格对照", "收藏夹"],
      styleKeywords: ["极简", "实验感", "柔和强调色"],
      extensionFeature: "收藏与再次改写",
    },
  },
  {
    id: "product-showcase",
    name: "产品展示站",
    summary: "适合生成多模块产品介绍页，突出卖点与用户证言。",
    badge: "Showcase",
    prompt: {
      appName: "AI 协作产品展示站",
      goal: "生成一个展示 AI 协作产品核心卖点与典型使用场景的官网风格页面。",
      audience: "潜在客户和招聘面试官",
      pages: ["首页", "能力介绍", "案例展示"],
      styleKeywords: ["极简科技", "几何构成", "沉浸动效"],
      extensionFeature: "案例筛选器",
    },
  },
];
