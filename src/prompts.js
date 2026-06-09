/* =========================================================================
   Match analysis protocol, serialization and prompts
   ========================================================================= */

const MATCH_ANALYSIS_VERSION = "match_analysis_v2";
const JOB_CHAT_VERSION = "job_chat_v4";
const MATCH_DIMENSIONS = [
  { key: "core_responsibilities", name: "核心职责" },
  { key: "skills_keywords", name: "技能关键词" },
  { key: "projects_results", name: "项目与成果" },
  { key: "experience_seniority", name: "年限与职级" },
  { key: "industry_business", name: "行业与业务" },
  { key: "basic_requirements", name: "基础条件" },
  { key: "location_direction", name: "地区与方向" },
];

function htmlToPlainText(value) {
  const container = document.createElement("div");
  container.innerHTML = String(value || "");
  return (container.textContent || "").replace(/\s+/g, " ").trim();
}

function serializeResumeForAnalysis(resumeData) {
  const data = resumeData && typeof resumeData === "object" ? resumeData : {};
  return {
    companies: (data.companies || []).map((company) => ({
      companyName: company.name || "",
      start: company.start || "",
      end: company.end || "",
      projects: (company.projects || []).map((project) => ({
        projectName: project.name || "",
        role: project.role || "",
        start: project.start || "",
        end: project.end || "",
        summary: htmlToPlainText(project.summary),
        keyPoints: htmlToPlainText(project.keyPoints),
        honors: htmlToPlainText(project.honors),
      })),
    })),
  };
}

function serializeJobForAnalysis(job) {
  return {
    id: job.id,
    title: job.title || "",
    company: job.company || "",
    location: job.location || "",
    business: job.business || "",
    industry: job.industry || "",
    experience: job.experience || "",
    education: job.education || "",
    responsibilities: job.responsibilities || [],
    requirements: job.requirements || [],
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function hashAnalysisInput(value) {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getModelCacheKey(config) {
  if (!config) return "unconfigured";
  const provider = window.PROVIDERS?.[config.provider];
  return [
    config.provider || "",
    config.baseURL || provider?.baseURL || "",
    config.model || provider?.models?.[0] || "",
  ].join(":");
}

function buildAnalysisPrompt(resumeData, jobData) {
  const dimensionTemplate = MATCH_DIMENSIONS.map((item) => ({
    key: item.key,
    name: item.name,
    score: 0,
    analysis: "该维度的简要结论",
  }));
  return [
    "你是一位严谨的职位匹配分析师。请比较岗位与简历，仅依据输入中明确存在的事实进行判断。",
    "所有评分均为 0-100 的整数。不要编造经历、技能或数据。简历未体现的能力应按证据不足处理。",
    "",
    "【岗位】",
    JSON.stringify(jobData, null, 2),
    "",
    "【已脱敏工作经历】",
    JSON.stringify(resumeData, null, 2),
    "",
    "只返回 JSON，不要返回 Markdown。结构必须严格如下，dimensions 的 key、name、数量和顺序不得改变：",
    JSON.stringify({
      overallScore: 0,
      conclusion: "一句简短结论",
      summary: "一段整体分析",
      dimensions: dimensionTemplate,
      strengths: ["匹配优势"],
      gaps: ["关键缺口"],
      suggestions: ["投递前建议"],
    }, null, 2),
  ].join("\n");
}

function normalizeStringList(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];
}

function validateAnalysisResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("分析结果不是有效对象");
  }
  const overallScore = Number(value.overallScore);
  if (!Number.isFinite(overallScore) || overallScore < 0 || overallScore > 100) {
    throw new Error("分析总分必须在 0-100 之间");
  }
  if (!Array.isArray(value.dimensions) || value.dimensions.length !== MATCH_DIMENSIONS.length) {
    throw new Error("分析结果必须包含 7 个雷达维度");
  }

  const dimensions = MATCH_DIMENSIONS.map((expected, index) => {
    const actual = value.dimensions[index];
    const score = Number(actual?.score);
    if (actual?.key !== expected.key || !Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error(`维度「${expected.name}」格式不正确`);
    }
    return {
      key: expected.key,
      name: expected.name,
      score: Math.round(score),
      analysis: typeof actual.analysis === "string" ? actual.analysis.trim() : "",
    };
  });

  return {
    score: Math.round(overallScore),
    overallScore: Math.round(overallScore),
    conclusion: typeof value.conclusion === "string" ? value.conclusion.trim() : "分析完成",
    summary: typeof value.summary === "string" ? value.summary.trim() : "",
    dimensions,
    strengths: normalizeStringList(value.strengths),
    gaps: normalizeStringList(value.gaps),
    suggestions: normalizeStringList(value.suggestions),
  };
}

function buildFollowUpMessages({ resumeData, jobData, analysis, history, question }) {
  const recentHistory = (Array.isArray(history) ? history : [])
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .slice(-20)
    .map((item) => ({ role: item.role, content: item.content }));

  return [
    {
      role: "system",
      content: [
        "你是严谨、实用的中文求职分析助手。",
        "只能依据提供的岗位、工作经历和匹配分析回答，不得编造经历、技能、学历、数据或录用结论。",
        "生成面试话术时，只能把输入中明确存在的内容写成候选人已经完成或具备的事实。",
        "输入中不存在的学习、工具使用和行动只能写成“建议后续补充”或“可以尝试”，不得写成“我已经”“我目前”“我具备”。",
        "输入未提供某项能力时，只能说“工作经历中未体现”或“缺少相关证据”，不得断言候选人“没有”或“不具备”。",
        "不要生成候选人可以直接照读的第一人称经历话术。涉及面试表达时，分为“工作经历可证明的内容”和“建议后续准备”两部分。",
        "不得为了举例补充输入中没有出现的方法、调研方式、实验、工具、产品名称或行动。",
        "输出前逐句检查：凡是描述候选人已经完成的动作，都必须能在工作经历 JSON 中找到直接依据，否则删除该句。",
        "回答使用纯文本，不使用 Markdown 标题、表格或代码块。",
        "优先给出明确结论和可执行建议；信息不足时直接说明。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "以下内容是本次对话的固定上下文。",
        "【岗位】",
        JSON.stringify(jobData, null, 2),
        "【已脱敏工作经历】",
        JSON.stringify(resumeData, null, 2),
        "【当前匹配分析】",
        analysis ? JSON.stringify(analysis, null, 2) : "尚未进行匹配分析",
      ].join("\n"),
    },
    ...recentHistory,
    { role: "user", content: String(question || "").trim() },
  ];
}

function normalizePlainTextResponse(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1（$2）")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildRewritePrompt(resumeData, jobData) {
  return [
    "请基于岗位要求优化简历表达，不得创造输入中不存在的事实或数字。",
    "【岗位】",
    JSON.stringify(jobData, null, 2),
    "【简历】",
    JSON.stringify(resumeData, null, 2),
  ].join("\n");
}

Object.assign(window, {
  MATCH_ANALYSIS_VERSION,
  JOB_CHAT_VERSION,
  MATCH_DIMENSIONS,
  serializeResumeForAnalysis,
  serializeJobForAnalysis,
  hashAnalysisInput,
  getModelCacheKey,
  buildAnalysisPrompt,
  validateAnalysisResult,
  buildFollowUpMessages,
  normalizePlainTextResponse,
  buildRewritePrompt,
});
