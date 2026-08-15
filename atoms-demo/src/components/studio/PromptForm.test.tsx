import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PromptForm } from "@/components/studio/PromptForm";
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
    render(<PromptForm value={basePrompt} preferredStyle="包豪斯低对比" onSubmit={onSubmit} loading={false} />);

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
  });
});
