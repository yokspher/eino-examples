import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { preferredStyles } from "@/data/presets";

interface InitWorkspaceModalProps {
  open: boolean;
  onSubmit: (nickname: string, style: string) => Promise<void>;
}

export function InitWorkspaceModal({ open, onSubmit }: InitWorkspaceModalProps) {
  const [nickname, setNickname] = useState("");
  const [preferredStyle, setPreferredStyle] = useState(preferredStyles[0]);
  const [saving, setSaving] = useState(false);

  const disabled = useMemo(() => saving || !nickname.trim(), [nickname, saving]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-zinc-950/95 p-6 text-zinc-50 shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
        <div className="mb-6 space-y-3">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
            <Sparkles className="mr-2 h-4 w-4 text-cyan-300" />
            首次进入需要初始化工作区
          </div>
          <h2 className="font-display text-3xl tracking-tight">先把你的工作台点亮</h2>
          <p className="max-w-lg text-sm leading-6 text-zinc-400">
            这里会保存你的默认视觉偏好、最近项目和生成版本。整个 Demo 不要求登录，但会把状态持久化到当前浏览器。
          </p>
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (disabled) {
              return;
            }
            setSaving(true);
            await onSubmit(nickname.trim(), preferredStyle);
            setSaving(false);
          }}
        >
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-300">你的称呼</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              required
              autoFocus
              aria-describedby="workspace-init-hint"
              placeholder="例如：Suki / Demo Reviewer / Builder"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-cobalt-400 focus:bg-white/7"
            />
            <span id="workspace-init-hint" className="text-xs text-zinc-500">
              先输入一个称呼，再点击“开始构建”。
            </span>
          </label>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm text-zinc-300">默认视觉偏好</legend>
            <div className="grid grid-cols-2 gap-3">
              {preferredStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setPreferredStyle(style)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    preferredStyle === style
                      ? "border-cobalt-400 bg-cobalt-500/15 text-white"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/8"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={disabled}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "初始化中..." : disabled ? "先输入称呼" : "开始构建"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
