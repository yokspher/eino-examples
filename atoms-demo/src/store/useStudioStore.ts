import { nanoid } from "nanoid";
import { create } from "zustand";

import { defaultPrompt, generatorPresets } from "@/data/presets";
import { loadProjectVersions, loadProjects, loadWorkspaceProfile, saveProject, saveProjectVersion, saveWorkspaceProfile } from "@/lib/db";
import { buildAppPlan, buildGeneratedBundle } from "@/lib/generator";
import type { AppPrompt, GenerationSession, GenerationStep, Project, ProjectVersion, WorkspaceProfile } from "@/types/domain";

type ProjectVersionMap = Record<string, ProjectVersion[]>;

interface StudioState {
  hydrated: boolean;
  profile: WorkspaceProfile | null;
  projects: Project[];
  versions: ProjectVersionMap;
  generation: GenerationSession;
  hydrate: () => Promise<void>;
  initializeWorkspace: (nickname: string, preferredStyle: string) => Promise<void>;
  createProject: (prompt?: Partial<AppPrompt>) => Promise<Project>;
  seedPresetProject: (presetId: string) => Promise<Project>;
  runGeneration: (projectId: string, prompt: AppPrompt) => Promise<void>;
  reloadVersions: (projectId: string) => Promise<void>;
  restoreVersion: (projectId: string, versionId: string) => Promise<void>;
  remixVersion: (projectId: string, versionId: string) => Promise<Project | null>;
  setProjectDeleted: (projectId: string, deleted: boolean) => Promise<void>;
}

const baseSteps = (): GenerationStep[] => [
  { id: "parse", title: "理解需求", detail: "把自然语言整理为结构化输入", status: "idle" },
  { id: "plan", title: "规划页面", detail: "拆出页面、模块与交互", status: "idle" },
  { id: "build", title: "生成代码", detail: "拼装 HTML / CSS / JS 结果", status: "idle" },
  { id: "preview", title: "装配预览", detail: "生成可直接运行的 srcDoc", status: "idle" },
];

const emptyGeneration = (): GenerationSession => ({
  projectId: null,
  steps: baseSteps(),
  activeStepId: null,
  startedAt: null,
  finishedAt: null,
});

function stamp() {
  return new Date().toISOString();
}

function patchStep(steps: GenerationStep[], activeId: string, status: GenerationStep["status"]) {
  return steps.map((step) => (step.id === activeId ? { ...step, status } : step));
}

async function wait(ms = 280) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

export const useStudioStore = create<StudioState>((set, get) => ({
  hydrated: false,
  profile: null,
  projects: [],
  versions: {},
  generation: emptyGeneration(),

  hydrate: async () => {
    const [profile, projects] = await Promise.all([loadWorkspaceProfile(), loadProjects()]);
    const versionsEntries = await Promise.all(
      projects.map(async (project) => [project.id, (await loadProjectVersions(project.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))] as const),
    );
    set({
      hydrated: true,
      profile: profile ?? null,
      projects,
      versions: Object.fromEntries(versionsEntries),
    });
  },

  initializeWorkspace: async (nickname, preferredStyle) => {
    const profile: WorkspaceProfile = {
      id: nanoid(),
      nickname,
      preferredStyle,
      createdAt: stamp(),
    };
    await saveWorkspaceProfile(profile);
    set({ profile });
  },

  createProject: async (promptPatch) => {
    const now = stamp();
    const prompt: AppPrompt = {
      ...defaultPrompt,
      ...promptPatch,
      pages: promptPatch?.pages ?? [],
      styleKeywords: promptPatch?.styleKeywords ?? defaultPrompt.styleKeywords,
    };

    const project: Project = {
      id: nanoid(),
      name: prompt.appName || "未命名项目",
      prompt,
      status: "draft",
      latestVersionId: null,
      createdAt: now,
      updatedAt: now,
    };

    await saveProject(project);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  seedPresetProject: async (presetId) => {
    const preset = generatorPresets.find((item) => item.id === presetId);
    return get().createProject(preset?.prompt ?? {});
  },

  runGeneration: async (projectId, prompt) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    const startedAt = stamp();
    let steps = baseSteps();
    set({
      generation: {
        projectId,
        steps: patchStep(steps, "parse", "running"),
        activeStepId: "parse",
        startedAt,
        finishedAt: null,
      },
    });

    await wait();
    steps = patchStep(steps, "parse", "done");
    steps = patchStep(steps, "plan", "running");
    set((state) => ({
      generation: { ...state.generation, steps, activeStepId: "plan" },
    }));

    const plan = buildAppPlan(prompt);

    await wait();
    steps = patchStep(steps, "plan", "done");
    steps = patchStep(steps, "build", "running");
    set((state) => ({
      generation: { ...state.generation, steps, activeStepId: "build" },
    }));

    const bundle = buildGeneratedBundle(plan, prompt);

    await wait();
    steps = patchStep(steps, "build", "done");
    steps = patchStep(steps, "preview", "running");
    set((state) => ({
      generation: { ...state.generation, steps, activeStepId: "preview" },
    }));

    const version: ProjectVersion = {
      id: nanoid(),
      projectId,
      versionName: `版本 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`,
      promptSnapshot: prompt,
      planSnapshot: plan,
      bundle,
      createdAt: stamp(),
    };

    const nextProject: Project = {
      ...project,
      name: prompt.appName || project.name,
      prompt,
      status: "generated",
      latestVersionId: version.id,
      updatedAt: stamp(),
      deletedAt: undefined,
    };

    await Promise.all([saveProject(nextProject), saveProjectVersion(version)]);
    await wait();

    steps = patchStep(steps, "preview", "done");
    set((state) => ({
      projects: state.projects
        .map((item) => (item.id === projectId ? nextProject : item))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      versions: {
        ...state.versions,
        [projectId]: [version, ...(state.versions[projectId] ?? [])],
      },
      generation: {
        projectId,
        steps,
        activeStepId: "preview",
        startedAt,
        finishedAt: stamp(),
      },
    }));
  },

  reloadVersions: async (projectId) => {
    const versions = (await loadProjectVersions(projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    set((state) => ({
      versions: {
        ...state.versions,
        [projectId]: versions,
      },
    }));
  },

  restoreVersion: async (projectId, versionId) => {
    const project = get().projects.find((item) => item.id === projectId);
    const versions =
      get().versions[projectId] ?? (await loadProjectVersions(projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const target = versions.find((item) => item.id === versionId);

    if (!project || !target) {
      return;
    }

    const nextProject: Project = {
      ...project,
      prompt: target.promptSnapshot,
      status: "generated",
      latestVersionId: target.id,
      updatedAt: stamp(),
    };

    await saveProject(nextProject);
    set((state) => ({
      projects: state.projects.map((item) => (item.id === projectId ? nextProject : item)),
      versions: { ...state.versions, [projectId]: versions },
    }));
  },

  remixVersion: async (projectId, versionId) => {
    const versions =
      get().versions[projectId] ?? (await loadProjectVersions(projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const target = versions.find((item) => item.id === versionId);
    if (!target) {
      return null;
    }

    return get().createProject({
      ...target.promptSnapshot,
      appName: `${target.promptSnapshot.appName || "未命名应用"} Remix`,
    });
  },

  setProjectDeleted: async (projectId, deleted) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    const nextProject: Project = {
      ...project,
      deletedAt: deleted ? stamp() : undefined,
      updatedAt: stamp(),
    };

    await saveProject(nextProject);
    set((state) => ({
      projects: state.projects.map((item) => (item.id === projectId ? nextProject : item)),
    }));
  },
}));
