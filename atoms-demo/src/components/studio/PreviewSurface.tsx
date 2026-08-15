import { useState } from "react";
import { Download, Maximize2, RefreshCcw, TriangleAlert } from "lucide-react";

import type { GeneratedBundle } from "@/types/domain";

interface PreviewSurfaceProps {
  bundle?: GeneratedBundle;
}

export function PreviewSurface({ bundle }: PreviewSurfaceProps) {
  const [keySeed, setKeySeed] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const handleDownload = () => {
    if (!bundle) {
      return;
    }

    const blob = new Blob([bundle.previewDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "atoms-demo-preview.html";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl ${
        fullscreen ? "fixed inset-5 z-50 overflow-auto bg-zinc-950/95" : ""
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Live preview</p>
          <h2 className="mt-2 font-display text-2xl text-zinc-50">右侧直接可跑</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">这里渲染的是当前版本的 `srcDoc`，不是静态图片。</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!bundle}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            导出 HTML
          </button>
          <button
            type="button"
            onClick={() => setKeySeed((current) => current + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            刷新预览
          </button>
          <button
            type="button"
            onClick={() => setFullscreen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            <Maximize2 className="h-4 w-4" />
            {fullscreen ? "退出全屏" : "全屏"}
          </button>
        </div>
      </div>

      {bundle ? (
        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950 shadow-[0_30px_60px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-zinc-500">generated-preview://app</span>
          </div>
          <iframe key={keySeed} title="generated-preview" srcDoc={bundle.previewDoc} className="h-[640px] w-full bg-white" sandbox="allow-scripts" />
        </div>
      ) : (
        <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/15 px-6 text-center text-sm leading-6 text-zinc-400">
          <TriangleAlert className="mr-2 h-4 w-4 text-amber-300" />
          先完成一次生成，这里才会出现真实运行的应用预览。
        </div>
      )}
    </section>
  );
}
