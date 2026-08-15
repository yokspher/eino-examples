import { Clock3, GitBranchPlus, RotateCcw } from "lucide-react";

import type { ProjectVersion } from "@/types/domain";

interface VersionTimelineProps {
  versions: ProjectVersion[];
  activeVersionId: string | null;
  onPreview: (versionId: string) => void;
  onRestore: (versionId: string) => Promise<void>;
  onRemix: (versionId: string) => Promise<void>;
}

export function VersionTimeline({ versions, activeVersionId, onPreview, onRestore, onRemix }: VersionTimelineProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Version timeline</p>
        <h2 className="mt-2 font-display text-2xl text-zinc-50">版本与回滚</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">每次生成都会落成一个完整快照，你可以预览、回滚或直接 Remix。</p>
      </div>

      <div className="grid gap-3">
        {versions.length ? (
          versions.map((version) => {
            const active = version.id === activeVersionId;

            return (
              <article
                key={version.id}
                className={`rounded-[24px] border p-4 transition ${
                  active ? "border-cobalt-400/40 bg-cobalt-500/10" : "border-white/8 bg-black/10"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-sm text-zinc-100">{version.versionName}</strong>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(version.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                  {active ? <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-zinc-200">当前预览</span> : null}
                </div>

                <p className="mb-4 line-clamp-2 text-sm leading-6 text-zinc-400">{version.promptSnapshot.goal}</p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPreview(version.id)}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
                  >
                    预览此版本
                  </button>
                  <button
                    type="button"
                    onClick={() => onRestore(version.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    回滚为当前
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemix(version.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/10"
                  >
                    <GitBranchPlus className="h-3.5 w-3.5" />
                    Remix
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-zinc-400">
            还没有版本记录，先生成一次应用吧。
          </div>
        )}
      </div>
    </section>
  );
}
