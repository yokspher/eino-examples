import type { AgentConfig, AppPlan, AppPrompt, GeneratedBundle, PlannedPage } from "@/types/domain";

export interface AgentGenerationResult {
  plan: AppPlan;
  bundle: GeneratedBundle;
  notes: string[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PlanPayload {
  summary: string;
  pages: Array<{
    name: string;
    modules: string[];
    interactions: string[];
  }>;
  dataModel: string[];
  notes: string[];
}

interface BundlePayload {
  html: string;
  css: string;
  js: string;
  notes?: string[];
}

export const defaultAgentConfig: AgentConfig = {
  mode: "local",
  providerLabel: "OpenAI Compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKey: "",
  temperature: 0.4,
};

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, "");
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function toPlannedPages(value: unknown): PlannedPage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((page, index) => {
      const source = (page ?? {}) as Record<string, unknown>;
      const name = String(source.name ?? `页面 ${index + 1}`).trim();
      if (!name) {
        return null;
      }
      return {
        id: `agent-page-${index + 1}`,
        name,
        modules: ensureList(source.modules),
        interactions: ensureList(source.interactions),
      };
    })
    .filter(Boolean) as PlannedPage[];
}

export function extractJsonObject(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("模型没有返回内容");
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace >= firstBrace ? candidate.slice(firstBrace, lastBrace + 1) : candidate;

  return JSON.parse(jsonText);
}

function buildPreviewDoc(appName: string, bundle: BundlePayload) {
  return `
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(appName || "Atoms Demo Preview")}</title>
        <style>${bundle.css}</style>
      </head>
      <body>
        ${bundle.html}
        <script>${bundle.js}</script>
      </body>
    </html>
  `.trim();
}

async function invokeOpenAICompatible<T>(config: AgentConfig, messages: ChatMessage[]): Promise<T> {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  if (!baseUrl || !config.model.trim() || !config.apiKey.trim()) {
    throw new Error("Agent 模式需要补全 Base URL、Model 和 API Key。");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: config.model.trim(),
      temperature: config.temperature,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agent 调用失败（${response.status}）：${text.slice(0, 240)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("模型没有返回可解析的内容");
  }

  return extractJsonObject(content) as T;
}

function normalizePlan(prompt: AppPrompt, payload: PlanPayload): AppPlan {
  const pages = toPlannedPages(payload.pages);

  return {
    summary: String(payload.summary || `${prompt.appName || "未命名应用"} 将通过 agent 生成一个可直接预览的网页应用。`).trim(),
    pages: pages.length
      ? pages
      : [
          {
            id: "agent-page-1",
            name: prompt.pages[0] || "首页",
            modules: ["英雄区", "核心内容", "行动区"],
            interactions: ["按钮触发状态变更", "平滑滚动"],
          },
        ],
    dataModel: ensureList(payload.dataModel),
    notes: ensureList(payload.notes),
  };
}

function normalizeBundle(prompt: AppPrompt, payload: BundlePayload): GeneratedBundle {
  const html = String(payload.html || "").trim();
  const css = String(payload.css || "").trim();
  const js = String(payload.js || "").trim();

  if (!html || !css) {
    throw new Error("模型返回的代码不完整，至少需要 html 和 css。");
  }

  return {
    html,
    css,
    js,
    previewDoc: buildPreviewDoc(prompt.appName, { html, css, js }),
  };
}

export async function runAgentGeneration(prompt: AppPrompt, config: AgentConfig): Promise<AgentGenerationResult> {
  const plannerSystem = `
你是一个资深产品规划 Agent，负责把用户需求整理成可生成网页应用的结构化计划。
输出必须是 JSON 对象，不要附带解释，不要使用 Markdown。
`.trim();

  const plannerUser = `
请把下面的应用需求整理成结构化计划。

应用名称：${prompt.appName || "未命名应用"}
核心目标：${prompt.goal}
目标用户：${prompt.audience}
页面列表：${prompt.pages.join(" / ") || "未指定"}
视觉关键词：${prompt.styleKeywords.join(" / ") || "简约科技"}
延展能力：${prompt.extensionFeature || "版本回滚"}

返回 JSON，字段必须包含：
{
  "summary": "一句话总结",
  "pages": [
    {
      "name": "页面名",
      "modules": ["模块1", "模块2"],
      "interactions": ["交互1", "交互2"]
    }
  ],
  "dataModel": ["数据实体1", "数据实体2"],
  "notes": ["设计备注1", "设计备注2"]
}
`.trim();

  const planPayload = await invokeOpenAICompatible<PlanPayload>(config, [
    { role: "system", content: plannerSystem },
    { role: "user", content: plannerUser },
  ]);
  const plan = normalizePlan(prompt, planPayload);

  const builderSystem = `
你是一个前端代码生成 Agent。你的任务是根据产品计划返回一个可直接运行在 iframe srcDoc 中的网页应用代码。
约束：
1. 只输出 JSON 对象，不要使用 Markdown。
2. 返回 html / css / js 三段字符串，不要返回完整 html 文档。
3. 页面必须有真实交互，不要只是静态排版。
4. 禁止引用外部脚本、外部样式、外部图片。
5. 页面要桌面优先，同时在窄屏下可读。
6. 生成结果要体现“智能体驱动构建”的工作台感。
`.trim();

  const builderUser = `
请基于这个计划生成网页应用代码：
${JSON.stringify(plan, null, 2)}

原始用户需求：
${JSON.stringify(prompt, null, 2)}

返回 JSON：
{
  "html": "<div>...</div>",
  "css": "body { ... }",
  "js": "const x = ...;",
  "notes": ["这次生成的亮点", "保留了哪些交互"]
}
`.trim();

  const bundlePayload = await invokeOpenAICompatible<BundlePayload>(config, [
    { role: "system", content: builderSystem },
    { role: "user", content: builderUser },
  ]);
  const bundle = normalizeBundle(prompt, bundlePayload);

  return {
    plan,
    bundle,
    notes: ensureList(bundlePayload.notes),
  };
}

export function isAgentConfigReady(config?: AgentConfig | null) {
  if (!config || config.mode !== "agent") {
    return true;
  }
  return Boolean(config.baseUrl.trim() && config.model.trim() && config.apiKey.trim());
}
