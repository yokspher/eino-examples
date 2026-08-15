import Dexie, { type Table } from "dexie";

import type { Project, ProjectVersion, WorkspaceProfile } from "@/types/domain";

class AtomsDemoDatabase extends Dexie {
  workspaceProfiles!: Table<WorkspaceProfile, string>;
  projects!: Table<Project, string>;
  projectVersions!: Table<ProjectVersion, string>;

  constructor() {
    super("atoms-demo-db");

    this.version(1).stores({
      workspaceProfiles: "id, createdAt",
      projects: "id, status, updatedAt, deletedAt",
      projectVersions: "id, projectId, createdAt",
    });
  }
}

export const db = new AtomsDemoDatabase();

export async function loadWorkspaceProfile() {
  return db.workspaceProfiles.orderBy("createdAt").last();
}

export async function saveWorkspaceProfile(profile: WorkspaceProfile) {
  await db.workspaceProfiles.put(profile);
  return profile;
}

export async function loadProjects() {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function saveProject(project: Project) {
  await db.projects.put(project);
  return project;
}

export async function saveProjectVersion(version: ProjectVersion) {
  await db.projectVersions.put(version);
  return version;
}

export async function loadProjectVersions(projectId: string) {
  return db.projectVersions.where("projectId").equals(projectId).toArray();
}

export async function removeProject(projectId: string) {
  await db.transaction("rw", db.projects, db.projectVersions, async () => {
    await db.projects.delete(projectId);
    const versions = await db.projectVersions.where("projectId").equals(projectId).toArray();
    await Promise.all(versions.map((item) => db.projectVersions.delete(item.id)));
  });
}
