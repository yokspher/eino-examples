import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, WandSparkles } from "lucide-react";

import { generatorPresets } from "@/data/presets";
import { defaultAgentConfig, getAgentConfigIssue, isAgentConfigReady } from "@/lib/agent";
import type { AgentConfig, AppPrompt } from "@/types/domain";

interface PromptFormProps {
  value: AppPrompt;
  preferredStyle?: string;
  agentConfig?: AgentConfig;
  onSubmit: (nextValue: AppPrompt, agentConfig: AgentConfig) => Promise<void>;
  loading: boolean;
}

export function PromptForm({ value, preferredStyle, agentConfig, onSubmit, loading }: PromptFormProps) {
  const [form, setForm] = useState<AppPrompt>(value);
  const [engine, setEngine] = useState<AgentConfig>(agentConfig ?? defaultAgentConfig);
  const [showAgentConfig, setShowAgentConfig] = useState(false);

  useEffect(() => {
    setForm(value);
  }, [value]);

  useEffect(() => {
    setEngine(agentConfig ?? defaultAgentConfig);
    setShowAgentConfig((agentConfig ?? defaultAgentConfig).mode === "agent");
  }, [agentConfig]);

  const inferProviderLabel = (baseUrl: string, model: string) => {
    const source = `${baseUrl} ${model}`.toLowerCase();
    if (source.includes("openrouter")) {
      return "OpenRouter";
    }
    if (source.includes("volcengine") || source.includes("ark")) {
      return "Volcengine Ark";
    }
    if (source.includes("anthropic") || source.includes("claude")) {
      return "Anthropic Compatible";
    }
    return "OpenAI Compatible";
  };

  const preparedForm = useMemo(
    () => ({
      ...form,
      styleKeywords: form.styleKeywords.filter(Boolean),
      pages: form.pages.filter(Boolean),
    }),
    [form],
  );

  const goalReady = preparedForm.goal.trim().length >= 10;
  const audienceReady = preparedForm.audience.trim().length > 0;
  const pageReady = preparedForm.pages.length > 0;
  const agentIssue = getAgentConfigIssue(engine);
  const agentReady = isAgentConfigReady(engine);
  const canGenerate = goalReady && audienceReady && !loading && agentReady;

  const readinessText = canGenerate
    ? "输入已经足够清晰，可以开始生成。"
    : engine.mode === "agent" && agentIssue
      ? agentIssue
      : "至少补全核心目标和目标用户，生成结果会稳定很多。";

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Prompt composer</p>
          <h2 className="mt-2 font-display text-2xl text-zinc-50">把需求压成可生成输入</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">建议用“目标 + 受众 + 页面 + 风格 + 延展能力”的组合表达，生成结果会更稳定。</p>
        </div>
        {preferredStyle ? (
          <div className="rounded-2xl border border-cobalt-400/20 bg-cobalt-400/10 px-3 py-2 text-xs text-cobalt-100">
            默认风格：{preferredStyle}
          </div>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {generatorPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setForm(preset.prompt)}
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-[24px] border border-white/10 bg-black/10 p-4">
        <div className="rounded-[20px] border border-white/8 bg-white/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Generation engine</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {engine.mode === "agent"
                  ? engine.transport === "proxy"
                    ? "当前通过服务端代理调用模型，更接近正式产品形态。"
                    : "当前直接从浏览器调用模型，适合静态站点快速演示。"
                  : "当前使用本地规则生成器，适合离线演示和兜底。"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEngine((prev) => ({ ...prev, mode: "local" }));
                  setShowAgentConfig(false);
                }}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  engine.mode === "local" ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/8"
                }`}
              >
                Local Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEngine((prev) => ({ ...prev, mode: "agent" }));
                  setShowAgentConfig(true);
                }}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  engine.mode === "agent" ? "bg-cobalt-300 text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/8"
                }`}
              >
                Agent LLM
              </button>
            </div>
          </div>

          {engine.mode === "agent" ? (
            <div className="mt-4 rounded-[20px] border border-cobalt-400/15 bg-cobalt-500/8 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEngine((prev) => ({ ...prev, transport: "proxy" }))}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      engine.transport === "proxy" ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    服务端代理（推荐）
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngine((prev) => ({ ...prev, transport: "browser" }))}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      engine.transport === "browser" ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    浏览器直连
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">
                    Provider: {inferProviderLabel(engine.baseUrl, engine.model)}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">Model: {engine.model || "未填写"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAgentConfig((current) => !current)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
                >
                  {showAgentConfig ? "收起配置" : "展开配置"}
                </button>
              </div>

              {showAgentConfig ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="grid gap-2 text-xs text-zinc-300">
                      <span>Model</span>
                      <input
                        value={engine.model}
                        onChange={(event) =>
                          setEngine((prev) => {
                            const model = event.target.value;
                            return {
                              ...prev,
                              model,
                              providerLabel: inferProviderLabel(prev.baseUrl, model),
                            };
                          })
                        }
                        className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                        placeholder="gpt-4.1-mini"
                      />
                    </label>
                    {engine.transport === "proxy" ? (
                      <label className="grid gap-2 text-xs text-zinc-300">
                        <span>Proxy URL</span>
                        <input
                          value={engine.proxyUrl}
                          onChange={(event) => setEngine((prev) => ({ ...prev, proxyUrl: event.target.value }))}
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                          placeholder="/api/agent/generate"
                        />
                      </label>
                    ) : (
                      <label className="grid gap-2 text-xs text-zinc-300">
                        <span>Base URL</span>
                        <input
                          value={engine.baseUrl}
                          onChange={(event) =>
                            setEngine((prev) => {
                              const baseUrl = event.target.value;
                              return {
                                ...prev,
                                baseUrl,
                                providerLabel: inferProviderLabel(baseUrl, prev.model),
                              };
                            })
                          }
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                          placeholder="https://api.openai.com/v1"
                        />
                      </label>
                    )}
                  </div>
                  {engine.transport === "browser" ? (
                    <div className="grid gap-3">
                      <label className="grid gap-2 text-xs text-zinc-300">
                        <span>API Key（仅保存在当前浏览器）</span>
                        <input
                          type="password"
                          value={engine.apiKey}
                          onChange={(event) => setEngine((prev) => ({ ...prev, apiKey: event.target.value }))}
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                          placeholder="sk-..."
                        />
                      </label>
                      <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 px-4 py-3 text-xs leading-6 text-amber-100">
                        当前浏览器直连模式固定调用 <code className="rounded bg-black/20 px-1 py-0.5">chat/completions</code>，只支持文本或代码模型。
                        如果你用的是 Volcengine Ark，请优先填写 <code className="rounded bg-black/20 px-1 py-0.5">https://ark.cn-beijing.volces.com/api/v3</code>，
                        Model 填文本模型或你自己的 <code className="rounded bg-black/20 px-1 py-0.5">ep-xxxx</code> 接入点，不要填
                        <code className="rounded bg-black/20 px-1 py-0.5">/contents/generations/tasks</code> 这类任务型地址。
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-xs leading-6 text-emerald-100">
                      服务端代理模式下，API Key 由后端环境变量提供，不需要暴露在浏览器里。
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                goalReady ? "bg-emerald-400/15 text-emerald-200" : "bg-white/8 text-zinc-400"
              }`}
            >
              {goalReady ? "已补全核心目标" : "核心目标待补全"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                audienceReady ? "bg-emerald-400/15 text-emerald-200" : "bg-white/8 text-zinc-400"
              }`}
            >
              {audienceReady ? "已补全目标用户" : "目标用户待补全"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                pageReady ? "bg-cobalt-400/15 text-cobalt-100" : "bg-white/8 text-zinc-400"
              }`}
            >
              {pageReady ? `已配置 ${preparedForm.pages.length} 个页面` : "未填写页面，系统将自动补默认页"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{readinessText}</p>
        </div>
      </div>

      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canGenerate) {
            return;
          }
          await onSubmit(preparedForm, engine);
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">应用名称</span>
            <input
              value={form.appName}
              onChange={(event) => setForm((prev) => ({ ...prev, appName: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-zinc-50 outline-none focus:border-cobalt-400"
              placeholder="例如：运营作战台 / 活动报名页"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">目标用户</span>
            <input
              value={form.audience}
              onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-zinc-50 outline-none focus:border-cobalt-400"
              placeholder="例如：招聘面试官 / 内容运营经理"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-zinc-300">核心目标</span>
          <textarea
            rows={4}
            value={form.goal}
            onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value }))}
            className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-3 text-zinc-50 outline-none focus:border-cobalt-400"
            placeholder="描述你想生成什么应用、它要解决什么问题、希望保留什么互动体验。"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">页面列表（逗号分隔）</span>
            <input
              value={form.pages.join("，")}
              onChange={(event) => setForm((prev) => ({ ...prev, pages: event.target.value.split(/[，,]/).map((item) => item.trim()) }))}
              className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-zinc-50 outline-none focus:border-cobalt-400"
              placeholder="首页，结果页，FAQ"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">视觉关键词（逗号分隔）</span>
            <input
              value={form.styleKeywords.join("，")}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, styleKeywords: event.target.value.split(/[，,]/).map((item) => item.trim()) }))
              }
              className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-zinc-50 outline-none focus:border-cobalt-400"
              placeholder="包豪斯，低对比，编辑部科技感"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-zinc-300">延展能力</span>
          <input
            value={form.extensionFeature ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, extensionFeature: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-zinc-50 outline-none focus:border-cobalt-400"
            placeholder="例如：版本回滚 / 一键生成摘要 / 案例筛选"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canGenerate}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <WandSparkles className="h-4 w-4" />
            {loading ? "生成中..." : canGenerate ? (engine.mode === "agent" ? "启动 Agent 生成" : "开始生成") : "补全后开始生成"}
          </button>
          <button
            type="button"
            onClick={() => setForm(value)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            回到最新已保存版本
          </button>
        </div>
        {!goalReady ? <p className="text-xs text-amber-200">建议把“核心目标”写到至少 10 个字，这样生成出来的页面规划会更像真实应用。</p> : null}
      </form>
    </section>
  );
}
