import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, GalleryHorizontalEnd, Plus } from "lucide-react";

import { InitWorkspaceModal } from "@/components/home/InitWorkspaceModal";
import { AppFrame } from "@/components/layout/AppFrame";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { generatorPresets } from "@/data/presets";
import { useStudioStore } from "@/store/useStudioStore";

export function HomePage() {
  const navigate = useNavigate();
  const profile = useStudioStore((state) => state.profile);
  const projects = useStudioStore((state) => state.projects);
  const versions = useStudioStore((state) => state.versions);
  const initializeWorkspace = useStudioStore((state) => state.initializeWorkspace);
  const createProject = useStudioStore((state) => state.createProject);
  const seedPresetProject = useStudioStore((state) => state.seedPresetProject);
  const setProjectDeleted = useStudioStore((state) => state.setProjectDeleted);
  const remixVersion = useStudioStore((state) => state.remixVersion);

  const activeProjects = useMemo(() => projects.filter((item) => !item.deletedAt).slice(0, 3), [projects]);

  return (
    <>
      <AppFrame
        eyebrow="Atoms demo / Workbench"
        title="一句话想法，变成可运行网页"
        description="这是一个带真实交互和本地持久化的 Atoms 风格 Demo：输入需求、看见智能体过程、拿到可运行应用，并把每次生成保存成版本。"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const project = await createProject();
                navigate(`/studio/${project.id}`);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              空白新建
            </button>
            <button
              type="button"
              onClick={() => navigate("/showcase")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              <GalleryHorizontalEnd className="h-4 w-4" />
              查看全部作品
            </button>
          </div>
        }
      >
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <article className="rounded-[30px] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <div className="mb-6 flex items-center gap-3">
                <Boxes className="h-5 w-5 text-cobalt-200" />
                <h2 className="font-display text-2xl text-zinc-50">推荐模板</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {generatorPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={async () => {
                      const project = await seedPresetProject(preset.id);
                      navigate(`/studio/${project.id}`);
                    }}
                    className="rounded-[24px] border border-white/10 bg-black/15 p-5 text-left transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                        {preset.badge}
                      </span>
                      <ArrowRight className="h-4 w-4 text-zinc-500" />
                    </div>
                    <h3 className="font-display text-xl text-zinc-50">{preset.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{preset.summary}</p>
                  </button>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Recent projects</p>
                  <h2 className="mt-2 font-display text-2xl text-zinc-50">最近项目</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/showcase")}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
                >
                  全部打开
                </button>
              </div>
              {activeProjects.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {activeProjects.map((project) => {
                    const latestVersionId = project.latestVersionId;
                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        versionCount={(versions[project.id] ?? []).length}
                        onDeleteToggle={() => setProjectDeleted(project.id, true)}
                        onRemix={async () => {
                          if (!latestVersionId) {
                            return;
                          }
                          const nextProject = await remixVersion(project.id, latestVersionId);
                          nextProject && navigate(`/studio/${nextProject.id}`);
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-8 text-sm leading-6 text-zinc-400">
                  还没有项目。最省心的开始方式是先点一个模板，再去工作室里继续改。
                </div>
              )}
            </article>
          </div>

          <aside className="grid gap-6">
            <article className="rounded-[30px] border border-white/10 bg-gradient-to-br from-cobalt-500/20 to-cyan-400/10 p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-100/70">Workspace profile</p>
              <h2 className="mt-2 font-display text-3xl text-white">{profile ? `你好，${profile.nickname}` : "等待初始化"}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-200/80">
                {profile
                  ? `当前默认风格是「${profile.preferredStyle}」，你创建的新项目会优先沿用这套审美倾向。`
                  : "完成一次初始化后，系统会开始记住你的默认风格和最近项目。"}
              </p>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Why this demo</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
                <li>1. 真实工作流：可见的“理解 / 规划 / 生成 / 预览”阶段</li>
                <li>2. 真实持久化：项目、版本、Remix、恢复都写入本地数据库</li>
                <li>3. 真实体验：右侧预览直接运行生成网页，而不是截图</li>
              </ul>
            </article>
          </aside>
        </section>
      </AppFrame>

      <InitWorkspaceModal open={!profile} onSubmit={initializeWorkspace} />
    </>
  );
}
