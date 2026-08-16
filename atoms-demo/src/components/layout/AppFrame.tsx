import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bot, Boxes, GalleryHorizontalEnd, Sparkles } from "lucide-react";

import { cn } from "@/lib/cn";

const navItems = [
  { to: "/", label: "工作台" },
  { to: "/showcase", label: "作品展示" },
];

interface AppFrameProps {
  title: string;
  eyebrow: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppFrame({ title, eyebrow, description, actions, children }: AppFrameProps) {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(91,127,255,0.25),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(76,219,201,0.15),_transparent_20%),linear-gradient(180deg,_#0c1016,_#0a0d12)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col px-6 py-6 lg:px-8">
        <header className="mb-8 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/"
                className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cobalt-200 transition hover:border-white/20 hover:bg-white/15"
              >
                <Boxes className="h-5 w-5" />
              </Link>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-400">{eyebrow}</p>
                <div>
                  <h1 className="font-display text-2xl tracking-tight text-zinc-50 lg:text-4xl">{title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 lg:text-base">{description}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:items-end">
              <nav className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "rounded-full px-4 py-2 text-sm text-zinc-300 transition",
                        isActive && "bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)]",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                  <Bot className="h-3.5 w-3.5" />
                  智能体驱动生成
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                  <GalleryHorizontalEnd className="h-3.5 w-3.5" />
                  持久化版本
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  可运行预览
                </span>
              </div>
            </div>
          </div>
          {actions ? <div className="mt-5 border-t border-white/10 pt-5">{actions}</div> : null}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
