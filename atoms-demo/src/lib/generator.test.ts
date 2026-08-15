import { describe, expect, it } from "vitest";

import { buildAppPlan, buildGeneratedBundle } from "@/lib/generator";

const prompt = {
  appName: "运营作战台",
  goal: "生成一个包含数据看板、任务优先级和趋势观察的运营应用",
  audience: "内容运营经理",
  pages: ["总览", "任务面板"],
  styleKeywords: ["包豪斯", "低对比"],
  extensionFeature: "版本回滚",
};

describe("generator", () => {
  it("buildAppPlan should keep pages and infer modules", () => {
    const plan = buildAppPlan(prompt);

    expect(plan.pages).toHaveLength(2);
    expect(plan.pages[0].modules).toContain("指标卡");
    expect(plan.dataModel).toContain("指标项");
    expect(plan.notes[2]).toContain("版本回滚");
  });

  it("buildGeneratedBundle should produce runnable preview doc", () => {
    const plan = buildAppPlan(prompt);
    const bundle = buildGeneratedBundle(plan, prompt);

    expect(bundle.html).toContain("运营作战台");
    expect(bundle.css).toContain("--accent");
    expect(bundle.js).toContain("toggleTheme");
    expect(bundle.previewDoc).toContain("<!doctype html>");
    expect(bundle.previewDoc).toContain("<body>");
    expect(bundle.previewDoc).not.toContain("<script src=");
  });
});
