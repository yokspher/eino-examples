package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type AppPrompt struct {
	AppName          string   `json:"appName"`
	Goal             string   `json:"goal"`
	Audience         string   `json:"audience"`
	Pages            []string `json:"pages"`
	StyleKeywords    []string `json:"styleKeywords"`
	ExtensionFeature string   `json:"extensionFeature"`
}

type plannedPage struct {
	Name         string   `json:"name"`
	Modules      []string `json:"modules"`
	Interactions []string `json:"interactions"`
}

type planPayload struct {
	Summary   string        `json:"summary"`
	Pages     []plannedPage `json:"pages"`
	DataModel []string      `json:"dataModel"`
	Notes     []string      `json:"notes"`
}

type bundlePayload struct {
	HTML  string   `json:"html"`
	CSS   string   `json:"css"`
	JS    string   `json:"js"`
	Notes []string `json:"notes"`
}

type generateRequest struct {
	Prompt AppPrompt `json:"prompt"`
	Config struct {
		BaseURL     string  `json:"baseUrl"`
		Model       string  `json:"model"`
		Temperature float64 `json:"temperature"`
	} `json:"config"`
}

type generateResponse struct {
	Plan   planPayload   `json:"plan"`
	Bundle bundlePayload `json:"bundle"`
	Notes  []string      `json:"notes"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func main() {
	port := envOr("AGENT_PROXY_PORT", "8787")

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("/api/agent/generate", handleGenerate)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           withCORS(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("atoms demo agent proxy listening on http://127.0.0.1:%s\n", port)
	log.Fatal(server.ListenAndServe())
}

func handleGenerate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req generateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	cfg := resolveModelConfig(req)
	plan, err := requestPlan(r.Context(), cfg, req.Prompt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	bundle, err := requestBundle(r.Context(), cfg, req.Prompt, plan)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	writeJSON(w, http.StatusOK, generateResponse{
		Plan:   plan,
		Bundle: bundle,
		Notes: append([]string{
			"当前通过服务端代理调用模型，浏览器端不需要保存 API Key。",
			fmt.Sprintf("模型: %s", cfg.Model),
		}, bundle.Notes...),
	})
}

type modelConfig struct {
	BaseURL     string
	Model       string
	Temperature float64
	APIKey      string
}

func resolveModelConfig(req generateRequest) modelConfig {
	return modelConfig{
		BaseURL:     strings.TrimRight(firstNonEmpty(os.Getenv("AGENT_BASE_URL"), req.Config.BaseURL, "https://api.openai.com/v1"), "/"),
		Model:       firstNonEmpty(os.Getenv("AGENT_MODEL"), req.Config.Model, "gpt-4.1-mini"),
		Temperature: firstNonZero(req.Config.Temperature, 0.4),
		APIKey:      os.Getenv("AGENT_API_KEY"),
	}
}

func requestPlan(ctx context.Context, cfg modelConfig, prompt AppPrompt) (planPayload, error) {
	system := strings.TrimSpace(`
你是一个资深产品规划 Agent，负责把用户需求整理成可生成网页应用的结构化计划。
输出必须是 JSON 对象，不要附带解释，不要使用 Markdown。
`)
	user := strings.TrimSpace(fmt.Sprintf(`
请把下面的应用需求整理成结构化计划。

应用名称：%s
核心目标：%s
目标用户：%s
页面列表：%s
视觉关键词：%s
延展能力：%s

返回 JSON，字段必须包含：
{
  "summary": "一句话总结",
  "pages": [
    {
      "name": "页面名",
      "modules": ["模块1", "模块2"],
      "interactions": ["交互1", "交互2"]
    }
  ],
  "dataModel": ["数据实体1", "数据实体2"],
  "notes": ["设计备注1", "设计备注2"]
}
`, fallback(prompt.AppName, "未命名应用"), prompt.Goal, prompt.Audience, joinOr(prompt.Pages, "未指定"), joinOr(prompt.StyleKeywords, "简约科技"), fallback(prompt.ExtensionFeature, "版本回滚")))

	var out planPayload
	if err := chatJSON(ctx, cfg, system, user, &out); err != nil {
		return planPayload{}, err
	}
	return out, nil
}

func requestBundle(ctx context.Context, cfg modelConfig, prompt AppPrompt, plan planPayload) (bundlePayload, error) {
	system := strings.TrimSpace(`
你是一个前端代码生成 Agent。你的任务是根据产品计划返回一个可直接运行在 iframe srcDoc 中的网页应用代码。
约束：
1. 只输出 JSON 对象，不要使用 Markdown。
2. 返回 html / css / js 三段字符串，不要返回完整 html 文档。
3. 页面必须有真实交互，不要只是静态排版。
4. 禁止引用外部脚本、外部样式、外部图片。
5. 页面要桌面优先，同时在窄屏下可读。
6. 生成结果要体现“智能体驱动构建”的工作台感。
`)

	planJSON, _ := json.MarshalIndent(plan, "", "  ")
	promptJSON, _ := json.MarshalIndent(prompt, "", "  ")
	user := strings.TrimSpace(fmt.Sprintf(`
请基于这个计划生成网页应用代码：
%s

原始用户需求：
%s

返回 JSON：
{
  "html": "<div>...</div>",
  "css": "body { ... }",
  "js": "const x = ...;",
  "notes": ["这次生成的亮点", "保留了哪些交互"]
}
`, string(planJSON), string(promptJSON)))

	var out bundlePayload
	if err := chatJSON(ctx, cfg, system, user, &out); err != nil {
		return bundlePayload{}, err
	}
	return out, nil
}

func chatJSON(ctx context.Context, cfg modelConfig, systemPrompt, userPrompt string, out any) error {
	if strings.TrimSpace(cfg.APIKey) == "" {
		return fmt.Errorf("AGENT_API_KEY is required for proxy mode")
	}

	body := map[string]any{
		"model":       cfg.Model,
		"temperature": cfg.Temperature,
		"response_format": map[string]string{
			"type": "json_object",
		},
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.BaseURL+"/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		return fmt.Errorf("model request failed (%d): %s", resp.StatusCode, truncate(string(raw), 240))
	}

	var completion chatResponse
	if err := json.Unmarshal(raw, &completion); err != nil {
		return err
	}
	if len(completion.Choices) == 0 || strings.TrimSpace(completion.Choices[0].Message.Content) == "" {
		return fmt.Errorf("model returned empty content")
	}

	return json.Unmarshal(extractJSONObject(completion.Choices[0].Message.Content), out)
}

func extractJSONObject(input string) []byte {
	trimmed := strings.TrimSpace(input)
	if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimSpace(strings.TrimPrefix(trimmed, "```json"))
		trimmed = strings.TrimSpace(strings.TrimPrefix(trimmed, "```"))
		trimmed = strings.TrimSpace(strings.TrimSuffix(trimmed, "```"))
	}
	start := strings.Index(trimmed, "{")
	end := strings.LastIndex(trimmed, "}")
	if start >= 0 && end >= start {
		return []byte(trimmed[start : end+1])
	}
	return []byte(trimmed)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func firstNonZero(value float64, fallback float64) float64 {
	if value != 0 {
		return value
	}
	return fallback
}

func joinOr(items []string, fallbackValue string) string {
	if len(items) == 0 {
		return fallbackValue
	}
	return strings.Join(items, " / ")
}

func fallback(value, fallbackValue string) string {
	if strings.TrimSpace(value) == "" {
		return fallbackValue
	}
	return value
}

func truncate(value string, max int) string {
	if len(value) <= max {
		return value
	}
	return value[:max]
}
