import { nanoid } from "nanoid";

import type { AppPlan, AppPrompt, GeneratedBundle, PlannedPage } from "@/types/domain";

function normalizeList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function inferModules(goal: string, pageName: string) {
  const goalText = goal.toLowerCase();
  const pageText = pageName.toLowerCase();
  const modules = new Set<string>();

  if (goalText.includes("表单") || goalText.includes("报名") || goalText.includes("预约")) {
    modules.add("表单区");
  }
  if (goalText.includes("数据") || goalText.includes("看板") || goalText.includes("dashboard")) {
    modules.add("指标卡");
    modules.add("趋势区");
  }
  if (goalText.includes("展示") || goalText.includes("官网") || goalText.includes("landing")) {
    modules.add("卖点区");
    modules.add("用户证言");
  }
  if (goalText.includes("工具") || goalText.includes("生成")) {
    modules.add("输入面板");
    modules.add("结果卡片");
  }

  if (pageText.includes("faq")) {
    modules.add("常见问题");
  }
  if (pageText.includes("案例")) {
    modules.add("案例卡片");
  }
  if (pageText.includes("任务")) {
    modules.add("优先级队列");
  }

  if (!modules.size) {
    modules.add("核心内容");
    modules.add("行动区");
  }

  return Array.from(modules);
}

function inferInteractions(pageName: string) {
  const interactions = ["悬停反馈", "按钮触发状态变更"];
  if (pageName.includes("报名") || pageName.includes("生成器")) {
    interactions.push("表单提交");
  }
  if (pageName.includes("趋势") || pageName.includes("总览")) {
    interactions.push("筛选切换");
  }
  if (pageName.includes("案例") || pageName.includes("展示")) {
    interactions.push("卡片高亮");
  }
  return interactions;
}

function inferDataModel(prompt: AppPrompt) {
  const models = ["项目摘要", "页面模块", "交互动作"];
  const goalText = prompt.goal.toLowerCase();
  if (goalText.includes("报名") || goalText.includes("预约")) {
    models.push("报名记录");
  }
  if (goalText.includes("看板") || goalText.includes("数据")) {
    models.push("指标项");
  }
  if (prompt.extensionFeature) {
    models.push(`延展能力：${prompt.extensionFeature}`);
  }
  return models;
}

function themeFromKeywords(keywords: string[]) {
  const joined = keywords.join(" ");
  const bauhaus = joined.includes("包豪斯") || joined.includes("几何");
  const editorial = joined.includes("编辑部") || joined.includes("极简");
  const accent = bauhaus ? "#4C6EF5" : "#3AC7B3";
  const accentSoft = bauhaus ? "#DDE4FF" : "#D8FFF7";
  const surface = editorial ? "#F3F0EA" : "#EEF1F5";
  const ink = "#13151A";

  return {
    accent,
    accentSoft,
    surface,
    ink,
    titleFont: bauhaus ? "\"Avenir Next\", \"Futura\", sans-serif" : "\"Iowan Old Style\", \"Times New Roman\", serif",
    bodyFont: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
  };
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildAppPlan(prompt: AppPrompt): AppPlan {
  const pages = normalizeList(prompt.pages);
  const resolvedPages = pages.length ? pages : ["首页", "核心流程", "结果展示"];

  const plannedPages: PlannedPage[] = resolvedPages.map((page) => ({
    id: nanoid(8),
    name: page,
    modules: inferModules(prompt.goal, page),
    interactions: inferInteractions(page),
  }));

  return {
    summary: `${prompt.appName || "未命名应用"} 将围绕 ${prompt.goal} 生成一个桌面优先、强调实时反馈的单页体验。`,
    pages: plannedPages,
    dataModel: inferDataModel(prompt),
    notes: [
      `目标受众：${prompt.audience || "通用用户"}`,
      `视觉关键词：${normalizeList(prompt.styleKeywords).join(" / ") || "简约科技"}`,
      `延展能力：${prompt.extensionFeature || "版本回滚"}`,
    ],
  };
}

export function buildGeneratedBundle(plan: AppPlan, prompt: AppPrompt): GeneratedBundle {
  const theme = themeFromKeywords(prompt.styleKeywords);
  const navItems = plan.pages
    .map((page) => `<button class="nav-chip" data-anchor="${page.id}">${escapeHtml(page.name)}</button>`)
    .join("");

  const sections = plan.pages
    .map((page, index) => {
      const modules = page.modules
        .map((module) => `<li><span class="pill-index">${index + 1}</span>${escapeHtml(module)}</li>`)
        .join("");
      const interactions = page.interactions
        .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
        .join("");

      return `
        <section id="${page.id}" class="app-section">
          <div class="section-head">
            <p class="eyebrow">Page ${String(index + 1).padStart(2, "0")}</p>
            <h2>${escapeHtml(page.name)}</h2>
            <p>${escapeHtml(`这一屏聚焦 ${page.modules.join("、")}，适合承接 ${prompt.goal}`)}</p>
          </div>
          <div class="section-grid">
            <article class="module-card">
              <h3>模块清单</h3>
              <ul class="module-list">${modules}</ul>
            </article>
            <article class="module-card">
              <h3>关键交互</h3>
              <div class="tag-group">${interactions}</div>
              <form class="smart-form">
                <label>体验输入</label>
                <input type="text" placeholder="输入一个你想测试的场景" />
                <button type="submit">触发动作</button>
              </form>
              <p class="feedback" aria-live="polite">等待输入</p>
            </article>
          </div>
        </section>
      `;
    })
    .join("");

  const dataItems = plan.dataModel
    .map((item, index) => `<div class="data-chip"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(item)}</div>`)
    .join("");

  const html = `
    <div class="generated-app">
      <header class="hero-panel">
        <div>
          <p class="eyebrow">Atoms-inspired demo</p>
          <h1>${escapeHtml(prompt.appName || "未命名应用")}</h1>
          <p class="hero-copy">${escapeHtml(prompt.goal || "一个由智能体驱动生成的网页应用。")}</p>
        </div>
        <div class="hero-actions">
          <button id="toggleTheme" class="ghost-button">切换氛围</button>
          <button id="pulseAction" class="primary-button">模拟主操作</button>
        </div>
      </header>
      <nav class="nav-strip">${navItems}</nav>
      <section class="summary-grid">
        <article class="summary-card">
          <p class="eyebrow">受众</p>
          <strong>${escapeHtml(prompt.audience || "通用用户")}</strong>
        </article>
        <article class="summary-card">
          <p class="eyebrow">风格</p>
          <strong>${escapeHtml(normalizeList(prompt.styleKeywords).join(" / ") || "简约科技")}</strong>
        </article>
        <article class="summary-card">
          <p class="eyebrow">延展能力</p>
          <strong>${escapeHtml(prompt.extensionFeature || "版本回滚")}</strong>
        </article>
      </section>
      <section class="data-model">
        <div class="section-head">
          <p class="eyebrow">Data model</p>
          <h2>结构化输出</h2>
        </div>
        <div class="data-grid">${dataItems}</div>
      </section>
      ${sections}
    </div>
  `.trim();

  const css = `
    :root {
      --accent: ${theme.accent};
      --accent-soft: ${theme.accentSoft};
      --surface: ${theme.surface};
      --ink: ${theme.ink};
      --paper: #ffffff;
      --muted: #667085;
      --border: rgba(19, 21, 26, 0.08);
      --shadow: 0 24px 60px rgba(19, 21, 26, 0.08);
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${theme.bodyFont}; background: linear-gradient(180deg, #fbfbfc, var(--surface)); color: var(--ink); }
    h1, h2, h3, strong { font-family: ${theme.titleFont}; margin: 0; }
    p { margin: 0; }
    button, input { font: inherit; }
    .generated-app { padding: 32px; display: grid; gap: 24px; min-height: 100vh; }
    .hero-panel, .summary-card, .module-card, .data-model { background: rgba(255,255,255,0.86); backdrop-filter: blur(18px); border: 1px solid var(--border); box-shadow: var(--shadow); }
    .hero-panel { border-radius: 28px; padding: 28px; display: grid; grid-template-columns: 1.6fr 0.8fr; gap: 24px; position: relative; overflow: hidden; }
    .hero-panel::after { content: ""; position: absolute; inset: auto -10% -40% auto; width: 240px; height: 240px; background: radial-gradient(circle, var(--accent-soft), transparent 65%); }
    .hero-copy { margin-top: 12px; color: var(--muted); max-width: 56ch; }
    .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); margin-bottom: 10px; }
    .hero-actions { display: flex; align-items: flex-start; justify-content: flex-end; gap: 12px; }
    .primary-button, .ghost-button, .smart-form button { border-radius: 999px; padding: 12px 18px; border: 1px solid transparent; cursor: pointer; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
    .primary-button, .smart-form button { background: var(--ink); color: white; }
    .ghost-button { background: transparent; border-color: var(--border); }
    .primary-button:hover, .ghost-button:hover, .smart-form button:hover { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(19, 21, 26, 0.12); }
    .nav-strip { display: flex; flex-wrap: wrap; gap: 10px; }
    .nav-chip { background: rgba(255,255,255,0.72); border: 1px solid var(--border); border-radius: 999px; padding: 10px 14px; cursor: pointer; }
    .summary-grid, .section-grid, .data-grid { display: grid; gap: 16px; }
    .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .summary-card { border-radius: 24px; padding: 20px; }
    .data-model { border-radius: 28px; padding: 24px; }
    .data-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .data-chip { border-radius: 20px; padding: 18px; background: var(--accent-soft); display: flex; gap: 12px; align-items: center; font-weight: 600; }
    .data-chip span, .pill-index { min-width: 30px; width: 30px; height: 30px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: white; color: var(--ink); font-size: 12px; }
    .app-section { display: grid; gap: 14px; }
    .section-head p:last-child { color: var(--muted); margin-top: 8px; }
    .section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .module-card { border-radius: 28px; padding: 22px; display: grid; gap: 18px; }
    .module-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
    .module-list li { display: flex; gap: 10px; align-items: center; }
    .tag-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .tag { padding: 8px 12px; border-radius: 999px; background: var(--accent-soft); font-size: 13px; }
    .smart-form { display: grid; gap: 10px; }
    .smart-form input { border-radius: 16px; padding: 12px 14px; border: 1px solid var(--border); background: rgba(255,255,255,0.92); }
    .feedback { min-height: 22px; color: var(--muted); font-size: 14px; }
    .dark body, body.dark { background: linear-gradient(180deg, #151922, #0d1017); color: #f5f7fb; }
    .dark .hero-panel, .dark .summary-card, .dark .module-card, .dark .data-model { background: rgba(20, 24, 34, 0.86); border-color: rgba(255,255,255,0.08); box-shadow: 0 24px 60px rgba(0,0,0,0.28); }
    .dark .data-chip, .dark .tag { color: #10131a; }
    .dark .nav-chip, .dark .ghost-button, .dark .smart-form input { background: rgba(255,255,255,0.04); color: #f4f7ff; border-color: rgba(255,255,255,0.12); }
    .dark .hero-copy, .dark .eyebrow, .dark .section-head p:last-child, .dark .feedback { color: rgba(245,247,251,0.72); }
    @media (max-width: 900px) {
      .generated-app { padding: 18px; }
      .hero-panel, .summary-grid, .section-grid { grid-template-columns: 1fr; }
      .hero-actions { justify-content: flex-start; }
    }
  `.trim();

  const js = `
    const root = document.body;
    const feedbackNodes = Array.from(document.querySelectorAll('.feedback'));
    document.querySelectorAll('.smart-form').forEach((form, index) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('input');
        const value = input.value.trim();
        feedbackNodes[index].textContent = value ? '已记录体验输入：' + value : '请先输入一个场景';
      });
    });
    document.getElementById('toggleTheme')?.addEventListener('click', () => {
      root.classList.toggle('dark');
    });
    document.getElementById('pulseAction')?.addEventListener('click', () => {
      feedbackNodes[0] && (feedbackNodes[0].textContent = '主操作已触发，界面状态已同步。');
    });
    document.querySelectorAll('.nav-chip').forEach((button) => {
      button.addEventListener('click', () => {
        const anchor = button.getAttribute('data-anchor');
        anchor && document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  `.trim();

  return {
    html,
    css,
    js,
    previewDoc: `
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${escapeHtml(prompt.appName || "Atoms Demo Preview")}</title>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>${js}</script>
        </body>
      </html>
    `.trim(),
  };
}
