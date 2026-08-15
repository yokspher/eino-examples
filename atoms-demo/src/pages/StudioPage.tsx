import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { AppFrame } from "@/components/layout/AppFrame";
import { CodePreviewTabs } from "@/components/studio/CodePreviewTabs";
import { GenerationRail } from "@/components/studio/GenerationRail";
import { PlanSummary } from "@/components/studio/PlanSummary";
import { PreviewSurface } from "@/components/studio/PreviewSurface";
import { PromptForm } from "@/components/studio/PromptForm";
import { VersionTimeline } from "@/components/studio/VersionTimeline";
import { useStudioStore } from "@/store/useStudioStore";
import type { AppPrompt } from "@/types/domain";

export function StudioPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const profile = useStudioStore((state) => state.profile);
  const projects = useStudioStore((state) => state.projects);
  const versionsMap = useStudioStore((state) => state.versions);
  const generation = useStudioStore((state) => state.generation);
  const reloadVersions = useStudioStore((state) => state.reloadVersions);
  const restoreVersion = useStudioStore((state) => state.restoreVersion);
  const remixVersion = useStudioStore((state) => state.remixVersion);
  const runGeneration = useStudioStore((state) => state.runGeneration);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  const project = projects.find((item) => item.id === projectId);
  const versions = versionsMap[projectId] ?? [];

  useEffect(() => {
    if (projectId) {
      void reloadVersions(projectId);
    }
  }, [projectId, reloadVersions]);

  useEffect(() => {
    if (project?.latestVersionId) {
      setActiveVersionId(project.latestVersionId);
    }
  }, [project?.latestVersionId]);

  const activeVersion = useMemo(() => {
    if (!versions.length) {
      return null;
    }
    return versions.find((item) => item.id === activeVersionId) ?? versions[0];
  }, [activeVersionId, versions]);

  const isGenerating = generation.projectId === projectId && !generation.finishedAt;
  const visibleGeneration =
    generation.projectId === projectId
      ? generation
      : {
          projectId: null,
          activeStepId: null,
          startedAt: null,
          finishedAt: null,
          steps: generation.steps.map((step) => ({ ...step, status: "idle" as const })),
        };

  if (!project) {
    return (
      <AppFrame eyebrow="Atoms demo / Studio" title="项目不存在" description="这个项目可能还没创建，或者已经被清理。">
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-10 text-center text-zinc-300 backdrop-blur-xl">
          <p className="mb-4">没有找到对应项目。</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm text-zinc-950">
            <ArrowLeft className="h-4 w-4" />
            回到工作台
          </Link>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      eyebrow="Atoms demo / Studio"
      title={project.name}
      description="左边组织需求与过程，中间看结构化计划，右边直接运行当前版本的生成结果。"
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </button>
          {profile ? <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">当前偏好：{profile.preferredStyle}</div> : null}
        </div>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[0.9fr_0.78fr_1.08fr]">
        <div className="grid gap-6">
          <PromptForm
            value={project.prompt}
            preferredStyle={profile?.preferredStyle}
            loading={isGenerating}
            onSubmit={async (prompt: AppPrompt) => {
              await runGeneration(project.id, prompt);
            }}
          />
          <GenerationRail session={visibleGeneration} />
        </div>

        <div className="grid gap-6">
          <PlanSummary plan={activeVersion?.planSnapshot} />
          <VersionTimeline
            versions={versions}
            activeVersionId={activeVersion?.id ?? null}
            onPreview={setActiveVersionId}
            onRestore={async (versionId) => {
              await restoreVersion(project.id, versionId);
              setActiveVersionId(versionId);
            }}
            onRemix={async (versionId) => {
              const nextProject = await remixVersion(project.id, versionId);
              nextProject && navigate(`/studio/${nextProject.id}`);
            }}
          />
        </div>

        <div className="grid gap-6">
          <PreviewSurface bundle={activeVersion?.bundle} />
          <CodePreviewTabs bundle={activeVersion?.bundle} />
        </div>
      </section>
    </AppFrame>
  );
}
