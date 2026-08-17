import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, TerminalSquare } from "lucide-react";

import type { GenerationSession } from "@/types/domain";

interface GenerationRailProps {
  session: GenerationSession;
}

export function GenerationRail({ session }: GenerationRailProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session.startedAt || session.finishedAt) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session.finishedAt, session.startedAt]);

  const activeStep = useMemo(
    () => session.steps.find((step) => step.status === "running") ?? null,
    [session.steps],
  );

  const completedCount = session.steps.filter((step) => step.status === "done").length;
  const progressPercent = session.steps.length ? Math.round((completedCount / session.steps.length) * 100) : 0;
  const elapsedSeconds = session.startedAt ? Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000)) : 0;

  const elapsedLabel =
    elapsedSeconds < 60 ? `${elapsedSeconds} 秒` : `${Math.floor(elapsedSeconds / 60)} 分 ${String(elapsedSeconds % 60).padStart(2, "0")} 秒`;

  const waitingHint = (() => {
    switch (activeStep?.id) {
      case "plan":
        return "Planner Agent 正在等模型完整返回结构化计划。这个阶段通常最慢，常见耗时在 10-40 秒。";
      case "build":
        return "Coder Agent 正在把计划转成 html / css / js。通常会比 Planner 更快一些。";
      case "preview":
        return "结果已经拿到，正在装配 Preview 和版本记录。这个阶段一般很快。";
      case "parse":
        return "正在整理需求并准备发给模型。";
      default:
        return "等待启动新的生成任务。";
    }
  })();

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Agent rail</p>
          <h2 className="mt-2 font-display text-2xl text-zinc-50">把生成过程真的展示出来</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">这里不是静态装饰，而是当前生成任务的真实阶段状态。</p>
        </div>
        <div className="grid gap-2 text-right">
          <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-zinc-300">
            {activeStep ? "生成进行中" : session.finishedAt ? "最近一次已完成" : "等待启动"}
          </div>
          <div className="text-xs text-zinc-500">{session.engineLabel ?? "Local Demo"}</div>
        </div>
      </div>

      {session.startedAt ? (
        <div className="mb-5 rounded-[24px] border border-cobalt-400/20 bg-cobalt-500/8 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cobalt-200/80">Live status</p>
              <p className="mt-2 text-sm text-zinc-100">
                {activeStep ? `${activeStep.title} 处理中，已等待 ${elapsedLabel}` : `本轮生成已结束，总耗时 ${elapsedLabel}`}
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-xs text-zinc-200">
              进度 {progressPercent}%
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{waitingHint}</p>
          {activeStep?.id === "plan" || activeStep?.id === "build" ? (
            <p className="mt-2 text-xs leading-6 text-zinc-400">当前阶段会在模型完整返回后一次性进入下一步，所以等待时不会先看到半成品代码。</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        {session.steps.map((step, index) => {
          const running = step.status === "running";
          const done = step.status === "done";

          return (
            <div
              key={step.id}
              className={`rounded-[24px] border px-4 py-4 transition ${
                running
                  ? "border-cobalt-400/50 bg-cobalt-500/10"
                  : done
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-white/8 bg-black/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  {running ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-cobalt-200" />
                  ) : done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  ) : index === 0 ? (
                    <Bot className="h-4 w-4 text-zinc-300" />
                  ) : (
                    <TerminalSquare className="h-4 w-4 text-zinc-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm text-zinc-100">{step.title}</strong>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{step.status}</span>
                  </div>
                  <p className="text-sm leading-6 text-zinc-400">{step.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {session.errorMessage ? (
        <div className="mt-4 rounded-[20px] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{session.errorMessage}</div>
      ) : null}

      {session.notes?.length ? (
        <div className="mt-4 rounded-[20px] border border-white/8 bg-black/10 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Generation notes</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-400">
            {session.notes.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
