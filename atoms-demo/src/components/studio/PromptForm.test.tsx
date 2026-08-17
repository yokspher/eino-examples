import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PromptForm } from "@/components/studio/PromptForm";
import { defaultAgentConfig } from "@/lib/agent";
import type { AppPrompt } from "@/types/domain";

const basePrompt: AppPrompt = {
  appName: "测试项目",
  goal: "生成一个带实时预览的工具页",
  audience: "产品经理",
  pages: ["首页"],
  styleKeywords: ["包豪斯"],
  extensionFeature: "版本回滚",
};

describe("PromptForm", () => {
  it("should submit normalized arrays", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PromptForm
        value={basePrompt}
        preferredStyle="包豪斯低对比"
        agentConfig={defaultAgentConfig}
        onSubmit={onSubmit}
        loading={false}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("首页"), {
      target: { value: "首页，结果页， FAQ " },
    });
    fireEvent.change(screen.getByDisplayValue("包豪斯"), {
      target: { value: "包豪斯，低对比， 编辑部 " },
    });
    fireEvent.click(screen.getByRole("button", { name: "开始生成" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].pages).toEqual(["首页", "结果页", "FAQ"]);
    expect(onSubmit.mock.calls[0][0].styleKeywords).toEqual(["包豪斯", "低对比", "编辑部"]);
    expect(onSubmit.mock.calls[0][1].mode).toBe("local");
  });

  it("should block submit when goal is too short", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PromptForm
        value={{ ...basePrompt, goal: "太短", audience: "产品经理" }}
        preferredStyle="包豪斯低对比"
        agentConfig={defaultAgentConfig}
        onSubmit={onSubmit}
        loading={false}
      />,
    );

    expect(screen.getByRole("button", { name: "补全后开始生成" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "补全后开始生成" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should require model config in agent mode", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PromptForm
        value={basePrompt}
        preferredStyle="包豪斯低对比"
        agentConfig={{ ...defaultAgentConfig, mode: "agent", transport: "browser", apiKey: "" }}
        onSubmit={onSubmit}
        loading={false}
      />,
    );

    expect(screen.getByRole("button", { name: "补全后开始生成" })).toBeDisabled();
    expect(screen.getByText("浏览器直连模式还缺少 Base URL、Model 或 API Key。")).toBeInTheDocument();
  });

  it("should allow proxy mode without browser api key", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PromptForm
        value={basePrompt}
        preferredStyle="包豪斯低对比"
        agentConfig={{ ...defaultAgentConfig, mode: "agent", transport: "proxy", apiKey: "" }}
        onSubmit={onSubmit}
        loading={false}
      />,
    );

    expect(screen.getByRole("button", { name: "启动 Agent 生成" })).toBeEnabled();
  });

  it("should show helpful message for task-style volcengine urls", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <PromptForm
        value={basePrompt}
        preferredStyle="包豪斯低对比"
        agentConfig={{
          ...defaultAgentConfig,
          mode: "agent",
          transport: "browser",
          baseUrl: "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
          model: "Doubao-Seedance-2.5",
          apiKey: "ark-demo",
        }}
        onSubmit={onSubmit}
        loading={false}
      />,
    );

    expect(screen.getByRole("button", { name: "补全后开始生成" })).toBeDisabled();
    expect(screen.getByText(/不要填写具体任务地址/)).toBeInTheDocument();
  });
});
