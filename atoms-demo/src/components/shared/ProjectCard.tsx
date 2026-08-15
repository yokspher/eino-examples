import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, GitBranchPlus, History, Trash2, Undo2 } from "lucide-react";

import type { Project } from "@/types/domain";

interface ProjectCardProps {
  project: Project;
  versionCount?: number;
  onRemix?: () => void;
  onDeleteToggle?: () => void;
}

export function ProjectCard({ project, versionCount = 0, onRemix, onDeleteToggle }: ProjectCardProps) {
  const isDeleted = Boolean(project.deletedAt);

  return (
    <article className="group rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-400">
              {project.status}
            </span>
            {isDeleted ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-200">
                已归档
              </span>
            ) : null}
          </div>
          <h3 className="font-display text-xl text-zinc-50">{project.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{project.prompt.goal || "等待输入更具体的应用目标。"}</p>
        </div>
        <Link
          to={`/studio/${project.id}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:border-white/20 hover:bg-white/10"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 text-xs text-zinc-400">
        <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
          <Clock3 className="mb-2 h-4 w-4 text-cyan-300" />
          <p>最近更新</p>
          <strong className="mt-1 block text-sm text-zinc-100">{new Date(project.updatedAt).toLocaleString("zh-CN")}</strong>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
          <History className="mb-2 h-4 w-4 text-cobalt-300" />
          <p>版本数量</p>
          <strong className="mt-1 block text-sm text-zinc-100">{versionCount}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRemix}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          <GitBranchPlus className="h-4 w-4" />
          Remix
        </button>
        <button
          type="button"
          onClick={onDeleteToggle}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
        >
          {isDeleted ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          {isDeleted ? "恢复" : "归档"}
        </button>
      </div>
    </article>
  );
}
