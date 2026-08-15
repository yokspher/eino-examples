import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, WandSparkles } from "lucide-react";

import { generatorPresets } from "@/data/presets";
import { defaultAgentConfig, isAgentConfigReady } from "@/lib/agent";
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

  useEffect(() => {
    setForm(value);
  }, [value]);

  useEffect(() => {
    setEngine(agentConfig ?? defaultAgentConfig);
  }, [agentConfig]);

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
  const agentReady = isAgentConfigReady(engine);
  const canGenerate = goalReady && audienceReady && !loading && agentReady;

  const readinessText = canGenerate
    ? "输入已经足够清晰，可以开始生成。"
    : engine.mode === "agent" && !agentReady
      ? "Agent 模式还缺少 Base URL、Model 或 API Key。"
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
        <div className="mb-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[20px] border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Generation engine</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEngine((prev) => ({ ...prev, mode: "local" }))}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  engine.mode === "local" ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/8"
                }`}
              >
                Local Demo
              </button>
              <button
                type="button"
                onClick={() => setEngine((prev) => ({ ...prev, mode: "agent" }))}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  engine.mode === "agent" ? "bg-cobalt-300 text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/8"
                }`}
              >
                Agent LLM
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {engine.mode === "agent"
                ? "当前会真实调用模型，让 Planner / Coder Agent 生成页面结构和代码。"
                : "当前使用本地规则生成器，适合离线演示和兜底。"}
            </p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-white/5 p-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-2 text-xs text-zinc-300">
                <span>Provider Label</span>
                <input
                  value={engine.providerLabel}
                  onChange={(event) => setEngine((prev) => ({ ...prev, providerLabel: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                  placeholder="OpenAI Compatible"
                />
              </label>
              <label className="grid gap-2 text-xs text-zinc-300">
                <span>Model</span>
                <input
                  value={engine.model}
                  onChange={(event) => setEngine((prev) => ({ ...prev, model: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                  placeholder="gpt-4.1-mini"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-xs text-zinc-300">
                <span>Base URL</span>
                <input
                  value={engine.baseUrl}
                  onChange={(event) => setEngine((prev) => ({ ...prev, baseUrl: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
                  placeholder="https://api.openai.com/v1"
                />
              </label>
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
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
