/* =========================================================================
   API abstraction for supported LLM providers
   ========================================================================= */

const PROVIDERS = {
  openai: {
    name: "OpenAI",
    protocol: "openai",
    baseURL: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o"],
  },
  deepseek: {
    name: "DeepSeek",
    protocol: "openai",
    baseURL: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  kimi: {
    name: "Kimi（月之暗面）",
    protocol: "openai",
    baseURL: "https://api.moonshot.cn/v1",
    models: ["moonshot-v1-8k", "moonshot-v1-32k"],
  },
  doubao: {
    name: "豆包（火山方舟）",
    protocol: "openai",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    models: [],
    modelHint: "请输入推理接入点 ID",
  },
  claude: {
    name: "Claude",
    protocol: "anthropic",
    baseURL: "https://api.anthropic.com/v1",
    models: ["claude-sonnet-4-20250514"],
  },
  custom: {
    name: "自定义 OpenAI 兼容接口",
    protocol: "openai",
    baseURL: "",
    models: [],
    modelHint: "请输入接口支持的模型名称",
  },
};

function resolveLLMConfig(config) {
  if (!config || !config.provider || !config.apiKey) {
    throw new Error("请先在设置中配置 Provider 和 API Key");
  }
  const provider = PROVIDERS[config.provider];
  if (!provider) throw new Error("不支持的 Provider: " + config.provider);

  const model = String(config.model || provider.models?.[0] || "").trim();
  const baseURL = String(config.baseURL || provider.baseURL || "").trim().replace(/\/$/, "");
  if (!model) throw new Error("请配置模型名称");
  if (!baseURL) throw new Error("请配置 Base URL");
  return { provider, model, baseURL };
}

async function callLLM(config, messages, options = {}) {
  const { provider, model, baseURL } = resolveLLMConfig(config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 45000);
  let url;
  let headers;
  let body;

  if (provider.protocol === "anthropic") {
    url = baseURL + "/messages";
    headers = {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    };
    body = {
      model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.2,
      messages: messages.filter((item) => item.role !== "system"),
    };
    const system = messages.find((item) => item.role === "system");
    if (system) body.system = system.content;
  } else {
    url = baseURL + "/chat/completions";
    headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + config.apiKey,
    };
    body = {
      model,
      messages,
      temperature: options.temperature ?? 0.2,
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = "API Error: " + response.status;
      try {
        const errorData = await response.json();
        message = errorData.error?.message || errorData.message || message;
      } catch (_) {}
      throw new Error(message);
    }

    const data = await response.json();
    if (provider.protocol === "anthropic") {
      return data.content?.find((item) => item.type === "text")?.text || "";
    }
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("请求超时，请检查网络或更换 API 配置");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJSON(text) {
  const trimmed = String(text || "").trim();
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const jsonText = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("模型响应中未找到 JSON");
  }
  return jsonText.slice(firstBrace, lastBrace + 1);
}

async function testConnection(config) {
  return callLLM(config, [
    { role: "user", content: "请只回复 OK。" },
  ], { maxTokens: 16, temperature: 0 });
}

function loadLLMConfig() {
  try {
    const raw = localStorage.getItem("llm_config");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function saveLLMConfig(config) {
  localStorage.setItem("llm_config", JSON.stringify(config));
}

Object.assign(window, {
  PROVIDERS,
  callLLM,
  extractJSON,
  testConnection,
  loadLLMConfig,
  saveLLMConfig,
});
