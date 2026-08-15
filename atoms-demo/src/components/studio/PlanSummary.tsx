import { Blocks, Layers3, Orbit, Rows2 } from "lucide-react";

import type { AppPlan } from "@/types/domain";

interface PlanSummaryProps {
  plan?: AppPlan;
}

export function PlanSummary({ plan }: PlanSummaryProps) {
  if (!plan) {
    return (
      <section className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-5 text-sm text-zinc-400 backdrop-blur-xl">
        生成完成后，这里会展示页面拆解、数据模型和设计备注。
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Structured plan</p>
        <h2 className="mt-2 font-display text-2xl text-zinc-50">中间产物一眼可读</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{plan.summary}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="grid gap-4">
          {plan.pages.map((page) => (
            <article key={page.id} className="rounded-[24px] border border-white/8 bg-black/10 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Rows2 className="h-4 w-4 text-cobalt-200" />
                <strong className="text-zinc-100">{page.name}</strong>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {page.modules.map((module) => (
                  <span key={module} className="rounded-full bg-cobalt-400/10 px-3 py-1 text-xs text-cobalt-100">
                    {module}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {page.interactions.map((interaction) => (
                  <span key={interaction} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                    {interaction}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-4">
          <article className="rounded-[24px] border border-white/8 bg-black/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-cyan-200" />
              <strong className="text-zinc-100">数据模型</strong>
            </div>
            <div className="flex flex-wrap gap-2">
              {plan.dataModel.map((item) => (
                <span key={item} className="rounded-full bg-white/6 px-3 py-1.5 text-xs text-zinc-300">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-white/8 bg-black/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Blocks className="h-4 w-4 text-cobalt-200" />
              <strong className="text-zinc-100">设计备注</strong>
            </div>
            <ul className="grid gap-2 text-sm leading-6 text-zinc-400">
              {plan.notes.map((item) => (
                <li key={item} className="flex gap-2">
                  <Orbit className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
