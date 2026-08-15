import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { HomePage } from "@/pages/HomePage";
import { ShowcasePage } from "@/pages/ShowcasePage";
import { StudioPage } from "@/pages/StudioPage";
import { useStudioStore } from "@/store/useStudioStore";

export default function App() {
  const hydrated = useStudioStore((state) => state.hydrated);
  const hydrate = useStudioStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-300">
        正在恢复本地工作区...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/studio/:projectId" element={<StudioPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
