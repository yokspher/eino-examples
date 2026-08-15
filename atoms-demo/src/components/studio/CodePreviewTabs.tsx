import { useMemo, useState } from "react";
import { Copy, FileCode2 } from "lucide-react";

import type { GeneratedBundle } from "@/types/domain";

interface CodePreviewTabsProps {
  bundle?: GeneratedBundle;
}

const tabs = [
  { id: "html", label: "HTML", language: "markup" },
  { id: "css", label: "CSS", language: "css" },
  { id: "js", label: "JS", language: "javascript" },
] as const;

export function CodePreviewTabs({ bundle }: CodePreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("html");
  const currentValue = useMemo(() => (bundle ? bundle[activeTab] : ""), [activeTab, bundle]);
  const currentTab = tabs.find((item) => item.id === activeTab)!;

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Generated code</p>
          <h2 className="mt-2 font-display text-2xl text-zinc-50">代码产出区</h2>
        </div>
        <button
          type="button"
          disabled={!currentValue}
          onClick={async () => currentValue && navigator.clipboard.writeText(currentValue)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          <Copy className="h-4 w-4" />
          复制当前片段
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === tab.id ? "bg-white text-zinc-950" : "border border-white/10 text-zinc-300 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {bundle ? (
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0B1017]">
          <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-zinc-500">{currentTab.label}</div>
          <pre className="min-h-[360px] overflow-auto p-5 text-sm leading-6 text-zinc-200">
            <code>{currentValue}</code>
          </pre>
        </div>
      ) : (
        <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/15 text-sm text-zinc-400">
          <FileCode2 className="mr-2 h-4 w-4" />
          生成后可查看 HTML / CSS / JS 代码
        </div>
      )}
    </section>
  );
}
