import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, WandSparkles } from "lucide-react";

import { generatorPresets } from "@/data/presets";
import type { AppPrompt } from "@/types/domain";

interface PromptFormProps {
  value: AppPrompt;
  preferredStyle?: string;
  onSubmit: (nextValue: AppPrompt) => Promise<void>;
  loading: boolean;
}

export function PromptForm({ value, preferredStyle, onSubmit, loading }: PromptFormProps) {
  const [form, setForm] = useState<AppPrompt>(value);

  useEffect(() => {
    setForm(value);
  }, [value]);

  const preparedForm = useMemo(
    () => ({
      ...form,
      styleKeywords: form.styleKeywords.filter(Boolean),
      pages: form.pages.filter(Boolean),
    }),
    [form],
  );

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

      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(preparedForm);
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
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <WandSparkles className="h-4 w-4" />
            {loading ? "生成中..." : "开始生成"}
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
      </form>
    </section>
  );
}
