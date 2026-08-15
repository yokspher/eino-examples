import { describe, expect, it } from "vitest";

import { extractJsonObject, isAgentConfigReady, normalizeBaseUrl } from "@/lib/agent";

describe("agent helpers", () => {
  it("extractJsonObject should parse fenced json payload", () => {
    const payload = extractJsonObject('```json\n{"summary":"ok","pages":[]}\n```');

    expect(payload).toEqual({ summary: "ok", pages: [] });
  });

  it("normalizeBaseUrl should trim trailing slash", () => {
    expect(normalizeBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
  });

  it("isAgentConfigReady should require key fields in agent mode", () => {
    expect(
      isAgentConfigReady({
        mode: "agent",
        transport: "browser",
        providerLabel: "OpenAI Compatible",
        baseUrl: "https://api.openai.com/v1",
        proxyUrl: "/api/agent/generate",
        model: "gpt-4.1-mini",
        apiKey: "",
        temperature: 0.4,
      }),
    ).toBe(false);
  });

  it("isAgentConfigReady should allow proxy mode without browser api key", () => {
    expect(
      isAgentConfigReady({
        mode: "agent",
        transport: "proxy",
        providerLabel: "OpenAI Compatible",
        baseUrl: "https://api.openai.com/v1",
        proxyUrl: "/api/agent/generate",
        model: "gpt-4.1-mini",
        apiKey: "",
        temperature: 0.4,
      }),
    ).toBe(true);
  });
});
