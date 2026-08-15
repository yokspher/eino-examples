import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { AppFrame } from "@/components/layout/AppFrame";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { useStudioStore } from "@/store/useStudioStore";

export function ShowcasePage() {
  const navigate = useNavigate();
  const projects = useStudioStore((state) => state.projects);
  const versions = useStudioStore((state) => state.versions);
  const setProjectDeleted = useStudioStore((state) => state.setProjectDeleted);
  const remixVersion = useStudioStore((state) => state.remixVersion);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"active" | "archived">("active");

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesMode = mode === "active" ? !project.deletedAt : Boolean(project.deletedAt);
      const haystack = `${project.name} ${project.prompt.goal} ${project.prompt.audience}`.toLowerCase();
      return matchesMode && (!normalized || haystack.includes(normalized));
    });
  }, [mode, projects, query]);

  return (
    <AppFrame
      eyebrow="Atoms demo / Showcase"
      title="项目展示与派生"
      description="这里汇总所有已生成应用。你可以筛选、搜索、归档、恢复，或者从任一版本继续 Remix。"
    >
      <section className="grid gap-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="按项目名、目标或受众搜索"
                className="w-full rounded-full border border-white/10 bg-black/15 px-11 py-3 text-sm text-zinc-50 outline-none focus:border-cobalt-400"
              />
            </div>
            <div className="flex gap-2">
              {[
                { id: "active", label: "进行中" },
                { id: "archived", label: "已归档" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id as "active" | "archived")}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    mode === tab.id ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredProjects.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                versionCount={(versions[project.id] ?? []).length}
                onDeleteToggle={() => setProjectDeleted(project.id, !project.deletedAt)}
                onRemix={async () => {
                  if (!project.latestVersionId) {
                    navigate(`/studio/${project.id}`);
                    return;
                  }
                  const nextProject = await remixVersion(project.id, project.latestVersionId);
                  nextProject && navigate(`/studio/${nextProject.id}`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 px-6 py-14 text-center text-sm text-zinc-400 backdrop-blur-xl">
            当前筛选条件下没有项目。你可以切换到另一个状态标签，或者回工作台先生成一个。
          </div>
        )}
      </section>
    </AppFrame>
  );
}
