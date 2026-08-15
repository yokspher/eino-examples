export type ProjectStatus = "draft" | "planning" | "building" | "generated" | "error";
export type GenerationMode = "local" | "agent";
export type AgentTransport = "proxy" | "browser";

export interface AgentConfig {
  mode: GenerationMode;
  transport: AgentTransport;
  providerLabel: string;
  baseUrl: string;
  proxyUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
}

export interface WorkspaceProfile {
  id: string;
  nickname: string;
  preferredStyle: string;
  agentConfig?: AgentConfig;
  createdAt: string;
}

export interface AppPrompt {
  appName: string;
  goal: string;
  audience: string;
  pages: string[];
  styleKeywords: string[];
  extensionFeature?: string;
}

export interface PlannedPage {
  id: string;
  name: string;
  modules: string[];
  interactions: string[];
}

export interface AppPlan {
  summary: string;
  pages: PlannedPage[];
  dataModel: string[];
  notes: string[];
}

export interface GeneratedBundle {
  html: string;
  css: string;
  js: string;
  previewDoc: string;
}

export interface Project {
  id: string;
  name: string;
  prompt: AppPrompt;
  status: ProjectStatus;
  latestVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionName: string;
  promptSnapshot: AppPrompt;
  planSnapshot: AppPlan;
  bundle: GeneratedBundle;
  generationMode?: GenerationMode;
  generationNotes?: string[];
  createdAt: string;
}

export interface GeneratorPreset {
  id: string;
  name: string;
  summary: string;
  badge: string;
  prompt: AppPrompt;
}

export interface GenerationStep {
  id: string;
  title: string;
  detail: string;
  status: "idle" | "running" | "done" | "error";
}

export interface GenerationSession {
  projectId: string | null;
  mode?: GenerationMode;
  engineLabel?: string;
  steps: GenerationStep[];
  activeStepId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage?: string;
  notes?: string[];
}
