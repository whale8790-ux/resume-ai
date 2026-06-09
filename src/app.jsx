/* =========================================================================
   App — 桌面端分栏布局（左编辑 / 右预览），共享同一份数据
   数据字段与原版保持一致，仅在结构上明确「公司 → 项目库」的嵌套关系。
   ========================================================================= */

let _uid = 0;
const uid = () => `id_${Date.now().toString(36)}_${_uid++}`;

function makeProject(seed = {}) {
  return {
    id: uid(),
    name: seed.name || "",
    role: seed.role || "",
    start: seed.start || "",
    end: seed.end || "",
    summary: seed.summary || "",
    keyPoints: seed.keyPoints || "",
    honors: seed.honors || "",
  };
}
function makeCompany(seed = {}) {
  return {
    id: uid(),
    name: seed.name || "",
    start: seed.start || "",
    end: seed.end || "",
    projects: seed.projects || [makeProject()],
  };
}
function makeEducation(seed = {}) {
  return {
    id: uid(),
    school: seed.school || "",
    degree: seed.degree || "本科",
    major: seed.major || "",
    start: seed.start || "",
    end: seed.end || "",
  };
}
window.makeProject = makeProject;
window.makeCompany = makeCompany;
window.makeEducation = makeEducation;

/* =========================================================================
   主题配色 —— 每套都经过对比度调校（正文文字与背景对比 ≥ 约 7:1，
   强调按钮文字与底色对比 ≥ 约 4.5:1），保证可读性。
   ========================================================================= */
const THEMES = {
  "宝蓝深色": {
    label: "宝蓝 · 深色",
    palette: "宝蓝",
    mode: "dark",
    note: "清爽专业、值得信赖",
    vars: {
      "--bg": "#0a0d12", "--panel": "#12151c", "--panel-2": "#161a22", "--bar": "#171b24",
      "--field": "#191d27", "--border": "#242a35", "--border-2": "#2d3340",
      "--text": "#e8ebf2", "--text-dim": "#98a1b3", "--faint": "#69707f",
      "--accent": "#2563eb", "--accent-hover": "#3b82f6", "--accent-active": "#1d4ed8",
      "--accent-soft": "rgba(59,130,246,0.16)", "--accent-line": "rgba(59,130,246,0.5)",
      "--accent-text": "#93c5fd", "--on-accent": "#ffffff", "--canvas": "#2b313d",
      "--ambient-1": "rgba(59,130,246,0.16)", "--ambient-2": "rgba(14,165,233,0.08)",
      "--panel-shadow": "0 16px 44px rgba(0,0,0,0.24)", "--card-radius": "14px",
    },
  },
  "青绿深色": {
    label: "青绿 · 深色",
    palette: "青绿",
    mode: "dark",
    note: "沉稳克制、专注高效",
    vars: {
      "--bg": "#0e0e10", "--panel": "#161619", "--panel-2": "#1a1a1e", "--bar": "#191920",
      "--field": "#1f1f23", "--border": "#26262b", "--border-2": "#2e2e33",
      "--text": "#eaeaec", "--text-dim": "#9aa0a6", "--faint": "#6b7077",
      "--accent": "#0d9488", "--accent-hover": "#14b8a6", "--accent-active": "#0f766e",
      "--accent-soft": "rgba(20,184,166,0.16)", "--accent-line": "rgba(20,184,166,0.45)",
      "--accent-text": "#2dd4bf", "--on-accent": "#ffffff", "--canvas": "#3a3a3e",
      "--ambient-1": "rgba(20,184,166,0.14)", "--ambient-2": "rgba(8,145,178,0.08)",
      "--panel-shadow": "0 16px 42px rgba(0,0,0,0.22)", "--card-radius": "14px",
    },
  },
  "紫罗兰深色": {
    label: "紫罗兰 · 深色",
    palette: "紫罗兰",
    mode: "dark",
    note: "现代灵动、契合 AI 调性",
    vars: {
      "--bg": "#0d0a12", "--panel": "#16121d", "--panel-2": "#1b1624", "--bar": "#1c1726",
      "--field": "#1f1929", "--border": "#2c2536", "--border-2": "#372e44",
      "--text": "#ece7f1", "--text-dim": "#a79db4", "--faint": "#736980",
      "--accent": "#7c3aed", "--accent-hover": "#8b5cf6", "--accent-active": "#6d28d9",
      "--accent-soft": "rgba(139,92,246,0.18)", "--accent-line": "rgba(167,139,250,0.5)",
      "--accent-text": "#c4b5fd", "--on-accent": "#ffffff", "--canvas": "#332b3e",
      "--ambient-1": "rgba(139,92,246,0.18)", "--ambient-2": "rgba(217,70,239,0.07)",
      "--panel-shadow": "0 16px 44px rgba(0,0,0,0.25)", "--card-radius": "16px",
    },
  },
  "宝蓝浅色": {
    label: "宝蓝 · 浅色",
    palette: "宝蓝",
    mode: "light",
    note: "默认浅色，明快清晰",
    vars: {
      "--bg": "#edf4ff", "--panel": "#ffffff", "--panel-2": "#f6f9ff", "--bar": "#f1f6ff",
      "--field": "#ffffff", "--border": "#dce7f7", "--border-2": "#bfd0e8",
      "--text": "#17233b", "--text-dim": "#5d6d86", "--faint": "#8a9ab2",
      "--accent": "#2563eb", "--accent-hover": "#3b82f6", "--accent-active": "#1d4ed8",
      "--accent-soft": "rgba(37,99,235,0.10)", "--accent-line": "rgba(37,99,235,0.42)",
      "--accent-text": "#1d4ed8", "--on-accent": "#ffffff", "--canvas": "#dce6f5",
      "--ambient-1": "rgba(37,99,235,0.10)", "--ambient-2": "rgba(14,165,233,0.07)",
      "--panel-shadow": "0 14px 36px rgba(30,64,175,0.10)", "--card-radius": "14px",
    },
  },
  "青绿浅色": {
    label: "青绿 · 浅色",
    palette: "青绿",
    mode: "light",
    note: "柔和舒展、自然耐看",
    vars: {
      "--bg": "#edf9f6", "--panel": "#ffffff", "--panel-2": "#f4fbf9", "--bar": "#eff8f6",
      "--field": "#ffffff", "--border": "#d8ebe6", "--border-2": "#b9d8d1",
      "--text": "#17312f", "--text-dim": "#5b746f", "--faint": "#89a19c",
      "--accent": "#0f766e", "--accent-hover": "#0d9488", "--accent-active": "#115e59",
      "--accent-soft": "rgba(15,118,110,0.10)", "--accent-line": "rgba(15,118,110,0.45)",
      "--accent-text": "#0f766e", "--on-accent": "#ffffff", "--canvas": "#dce9e6",
      "--ambient-1": "rgba(15,118,110,0.10)", "--ambient-2": "rgba(20,184,166,0.06)",
      "--panel-shadow": "0 14px 36px rgba(15,118,110,0.09)", "--card-radius": "14px",
    },
  },
  "紫罗兰浅色": {
    label: "紫罗兰 · 浅色",
    palette: "紫罗兰",
    mode: "light",
    note: "轻盈雅致、富有创造力",
    vars: {
      "--bg": "#f5f1ff", "--panel": "#ffffff", "--panel-2": "#faf8ff", "--bar": "#f7f4ff",
      "--field": "#ffffff", "--border": "#e7def6", "--border-2": "#cfc0e8",
      "--text": "#2b1e3f", "--text-dim": "#756586", "--faint": "#a092ae",
      "--accent": "#7c3aed", "--accent-hover": "#8b5cf6", "--accent-active": "#6d28d9",
      "--accent-soft": "rgba(124,58,237,0.10)", "--accent-line": "rgba(124,58,237,0.40)",
      "--accent-text": "#6d28d9", "--on-accent": "#ffffff", "--canvas": "#e5deef",
      "--ambient-1": "rgba(124,58,237,0.10)", "--ambient-2": "rgba(217,70,239,0.05)",
      "--panel-shadow": "0 14px 36px rgba(76,29,149,0.09)", "--card-radius": "16px",
    },
  },
};
window.THEMES = THEMES;

const STORAGE_KEY = "resume_ai_data_v1";
const STORAGE_KEY_TIME = "resume_ai_saved_at_v1";
const STORAGE_KEY_HISTORY = "resume_ai_history_v1";
const STORAGE_KEY_THEME = "resume_ai_theme_v1";
const STORAGE_KEY_THEME_MODE = "resume_ai_theme_mode_v1";
const STORAGE_KEY_THEME_MIGRATION = "resume_ai_theme_default_v4";
const DEFAULT_THEME_PALETTE = "宝蓝";
const DEFAULT_THEME_MODE = "auto";
const DATA_SCHEMA_VERSION = 1;
const HISTORY_LIMIT = 10;

function getLocalThemeMode(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
}

function resolveThemeName(palette, mode) {
  const themeName = `${palette}${mode === "light" ? "浅色" : "深色"}`;
  return THEMES[themeName] ? themeName : `${DEFAULT_THEME_PALETTE}${mode === "light" ? "浅色" : "深色"}`;
}

function loadThemePreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    const storedMode = localStorage.getItem(STORAGE_KEY_THEME_MODE);
    const migrated = localStorage.getItem(STORAGE_KEY_THEME_MIGRATION);
    if (!migrated) {
      localStorage.setItem(STORAGE_KEY_THEME_MIGRATION, "1");
    }
    const storedTheme = THEMES[stored];
    const legacyPalette = storedTheme?.palette
      || (["宝蓝", "青绿", "紫罗兰"].includes(stored) ? stored : DEFAULT_THEME_PALETTE);
    const mode = ["auto", "light", "dark"].includes(storedMode) ? storedMode : DEFAULT_THEME_MODE;
    return { palette: legacyPalette, mode };
  } catch (e) {
    return { palette: DEFAULT_THEME_PALETTE, mode: DEFAULT_THEME_MODE };
  }
}

/* 把时间戳格式化为 yyyy/mm/dd hh:mm */
function fmtSavedAt(ts) {
  if (!ts) return "";
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
window.fmtSavedAt = fmtSavedAt;

/* 顶部提示 toast */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="no-print fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
      <div
        key={toast.id}
        className="flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl text-[13px]"
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border-2)",
          color: "var(--text)",
          animation: "toastIn .22s ease-out",
        }}
      >
        <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
          <Icon name="Check" size={11} strokeWidth={3} />
        </span>
        {toast.msg}
      </div>
    </div>
  );
}
window.Toast = Toast;

const INITIAL_DATA = {
  schemaVersion: DATA_SCHEMA_VERSION,
  resumeName: "xx-AI产品经理",
  avatar: "assets/default-avatar.jpg",
  personal: {
    name: "李四",
    phone: "138 0000 0000",
    email: "lisi@example.com",
    intent: "AI 产品经理",
    keywords: "5 年经验",
  },
  advantages: `<ul><li>8 年互联网产品经验，曾主导从 0 到 1 的多个明星项目，覆盖 B 端与 C 端业务。</li><li>擅长用户研究与数据驱动的产品决策，注重业务目标与用户体验的平衡。</li><li>拥有完整的团队管理经验，带领过 10+ 人的跨职能产品团队。</li><li>熟悉互联网行业最新趋势，持续跟进 AI、SaaS、企业服务等领域动态。</li></ul>`,
  companies: [
    makeCompany({
      name: "赤子城集团",
      start: "2024-05",
      end: "2026-03",
      projects: [
        makeProject({
          name: "AI 聊天助手",
          role: "AI 产品经理",
          start: "2024-05",
          end: "2026-03",
          summary:
            "主导 AI 聊天助手从 0 到 1 落地，定位陌生人社交匹配后“开口难、回复难”导致会话转化不足的问题，将 LLM 能力嵌入会话页，推动双向会话渗透率从 45% 提升至 52%，人均会话次数提升 20%；功能推全后，大盘 7 日留存提升 2pp。",
          keyPoints: `<ul><li>定义 AI 介入链路：拆解破冰、回复、重启三类会话阻塞场景，确立“候选建议 + 用户确认后发送”的辅助形态，兼顾表达效率与社交真实性。</li><li>制定 Prompt 与上下文策略：配置分场景任务目标、上下文优先级和输出约束，引入双方画像与会话上下文，沉淀 few-shot 示例集。</li><li>优化候选生成及重试逻辑：制定多切入点候选策略，按信息完整度匹配兴趣切入、话题承接、低信息兜底等生成方向。</li><li>平台治理：推动真人认证、资料审核、低质 / 无脸图片识别及风控能力建设，提升平台供给质量与用户信任感。</li></ul>`,
          honors: `<ul><li>2024–2025「优秀新人」奖</li><li>2024 财年个人绩效 A+（前 10%）</li></ul>`,
        }),
      ],
    }),
  ],
  education: [
    makeEducation({ school: "北京邮电大学", degree: "本科", major: "计算机科学与技术", start: "2014-09", end: "2018-06" }),
  ],
};

const asString = (value, fallback = "") => typeof value === "string" ? value : fallback;
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function normalizeProject(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    id: asString(source.id) || uid(),
    name: asString(source.name),
    role: asString(source.role),
    start: asString(source.start),
    end: asString(source.end),
    summary: asString(source.summary),
    keyPoints: asString(source.keyPoints),
    honors: asString(source.honors),
  };
}

function normalizeCompany(value) {
  const source = value && typeof value === "object" ? value : {};
  const projects = Array.isArray(source.projects)
    ? source.projects.map(normalizeProject)
    : [];
  return {
    id: asString(source.id) || uid(),
    name: asString(source.name),
    start: asString(source.start),
    end: asString(source.end),
    projects: projects.length ? projects : [normalizeProject({})],
  };
}

function normalizeEducation(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    id: asString(source.id) || uid(),
    school: asString(source.school),
    degree: asString(source.degree, "本科") || "本科",
    major: asString(source.major),
    start: asString(source.start),
    end: asString(source.end),
  };
}

function normalizeResumeData(value) {
  const source = value && typeof value === "object" ? value : {};
  const defaults = INITIAL_DATA.personal;
  const personal = source.personal && typeof source.personal === "object" ? source.personal : {};
  const companies = Array.isArray(source.companies)
    ? source.companies.map(normalizeCompany)
    : [];
  const education = Array.isArray(source.education)
    ? source.education.map(normalizeEducation)
    : [];
  let avatar = hasOwn(source, "avatar") ? source.avatar : INITIAL_DATA.avatar;
  if (typeof avatar !== "string" && avatar !== null) avatar = INITIAL_DATA.avatar;
  if (typeof avatar === "string" && avatar.startsWith("blob:")) avatar = INITIAL_DATA.avatar;
  // 旧版默认头像是 SVG 占位图；统一替换为新的默认照片（用户自己上传的是 data:image/jpeg，不受影响）
  if (typeof avatar === "string" && avatar.startsWith("data:image/svg+xml")) avatar = INITIAL_DATA.avatar;

  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    resumeName: asString(source.resumeName, INITIAL_DATA.resumeName) || INITIAL_DATA.resumeName,
    avatar,
    personal: {
      name: asString(personal.name, defaults.name),
      phone: asString(personal.phone, defaults.phone),
      email: asString(personal.email, defaults.email),
      intent: asString(personal.intent, defaults.intent),
      keywords: asString(personal.keywords, defaults.keywords),
    },
    advantages: asString(source.advantages, INITIAL_DATA.advantages),
    companies: companies.length ? companies : [normalizeCompany({})],
    education: education.length ? education : [normalizeEducation({})],
  };
}

function getDefaultResumeData() {
  return normalizeResumeData(JSON.parse(JSON.stringify(INITIAL_DATA)));
}

function parseResumeBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("备份文件内容无效");
  }
  const payload = value.data && typeof value.data === "object" ? value.data : value;
  if (Array.isArray(payload)) throw new Error("备份文件内容无效");
  const recognizable = ["resumeName", "personal", "companies", "education", "advantages"]
    .some((key) => hasOwn(payload, key));
  if (!recognizable) throw new Error("这不是有效的简历备份文件");
  const version = Number(value.schemaVersion ?? payload.schemaVersion ?? 0);
  if (version > DATA_SCHEMA_VERSION) {
    throw new Error(`该备份来自更新版本（v${version}），当前版本暂不支持`);
  }
  return normalizeResumeData(payload);
}

function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultResumeData();
    const normalized = normalizeResumeData(JSON.parse(raw));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (e) {
    return getDefaultResumeData();
  }
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, HISTORY_LIMIT).flatMap((item) => {
      try {
        if (!item || typeof item !== "object") return [];
        return [{
          id: asString(item.id) || uid(),
          savedAt: Number(item.savedAt) || Date.now(),
          data: normalizeResumeData(item.data),
        }];
      } catch (e) {
        return [];
      }
    });
  } catch (e) {
    return [];
  }
}

function persistHistory(items) {
  let next = items.slice(0, HISTORY_LIMIT);
  while (next.length) {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
      return next;
    } catch (e) {
      next = next.slice(0, -1);
    }
  }
  try { localStorage.removeItem(STORAGE_KEY_HISTORY); } catch (e) {}
  return [];
}

function plainText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function monthValue(value) {
  if (!value || value === "至今" || value === "今") return null;
  const match = String(value).match(/^(\d{4})\D+(\d{1,2})$/);
  if (!match) return NaN;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return NaN;
  return Number(match[1]) * 12 + month;
}

function validateResumeData(value) {
  const data = normalizeResumeData(value);
  const issues = [];
  const add = (severity, label, message) => issues.push({ severity, label, message });
  const required = (text, label) => {
    if (!String(text || "").trim()) add("error", label, "必填内容为空");
  };
  const checkRange = (start, end, label) => {
    const startValue = monthValue(start);
    const endValue = monthValue(end);
    if (Number.isNaN(startValue) || Number.isNaN(endValue)) {
      add("warning", label, "日期格式应为 YYYY-MM");
    } else if (startValue != null && endValue != null && startValue > endValue) {
      add("warning", label, "开始时间晚于结束时间");
    }
  };

  required(data.personal.name, "个人信息 / 姓名");
  if (!data.personal.phone.trim()) {
    add("warning", "个人信息 / 手机号", "建议填写联系方式");
  } else {
    const digits = data.personal.phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) add("warning", "个人信息 / 手机号", "号码长度看起来不正确");
  }
  if (!data.personal.email.trim()) {
    add("warning", "个人信息 / 邮箱", "建议填写邮箱");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal.email.trim())) {
    add("warning", "个人信息 / 邮箱", "邮箱格式看起来不正确");
  }
  if (!data.personal.intent.trim()) add("warning", "个人信息 / 意向岗位", "建议填写目标岗位");
  if (!plainText(data.advantages)) add("warning", "个人优势", "建议补充 2–4 条核心优势");

  data.companies.forEach((company, companyIndex) => {
    const companyLabel = `工作经历 ${companyIndex + 1}`;
    required(company.name, `${companyLabel} / 公司名称`);
    checkRange(company.start, company.end, `${companyLabel} / 任职时间`);
    company.projects.forEach((project, projectIndex) => {
      const projectLabel = `${companyLabel} / 项目 ${projectIndex + 1}`;
      if (!project.name.trim()) add("warning", `${projectLabel} / 项目名称`, "建议填写项目名称");
      if (!project.role.trim()) add("warning", `${projectLabel} / 职责`, "建议填写承担角色");
      checkRange(project.start, project.end, `${projectLabel} / 项目时间`);
      const contentLength = [
        plainText(project.summary),
        plainText(project.keyPoints),
        plainText(project.honors),
      ].join("").length;
      if (!contentLength) add("warning", projectLabel, "项目内容为空");
      if (contentLength > 2400) add("warning", projectLabel, "内容较长，建议精简以提高阅读效率");
    });
  });

  data.education.forEach((education, index) => {
    const label = `教育经历 ${index + 1}`;
    if (!education.school.trim()) add("warning", `${label} / 学校`, "建议填写学校名称");
    checkRange(education.start, education.end, `${label} / 就读时间`);
  });

  return issues;
}

Object.assign(window, {
  DATA_SCHEMA_VERSION,
  normalizeResumeData,
  parseResumeBackup,
  getDefaultResumeData,
  validateResumeData,
});

const WORKSPACE_NAV = [
  { id: "editor", label: "简历编辑", icon: "FilePenLine" },
  { id: "jobs", label: "职位推荐", icon: "BriefcaseBusiness" },
  { id: "interview", label: "面试闪卡", icon: "PanelsTopLeft" },
];

function WorkspaceSidebar({ active, onChange, onSettings }) {
  return (
    <aside className="workspace-sidebar no-print">
      <div className="sidebar-brand" title="我的简历">
        <span className="sidebar-brand-mark">R</span>
        <span>简历台</span>
      </div>
      <nav className="sidebar-nav" aria-label="工作区导航">
        {WORKSPACE_NAV.map((item) => {
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${selected ? "is-active" : ""}`}
              onClick={() => onChange(item.id)}
              aria-current={selected ? "page" : undefined}
            >
              <span className="sidebar-icon"><Icon name={item.icon} size={21} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
        <button className="sidebar-item" onClick={onSettings}>
          <span className="sidebar-icon"><Icon name="Settings" size={21} strokeWidth={2} /></span>
          <span>设置</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-version">LOCAL</span>
      </div>
    </aside>
  );
}

function ReservedWorkspace({ section, onBack }) {
  const item = WORKSPACE_NAV.find((nav) => nav.id === section) || WORKSPACE_NAV[0];
  return (
    <main className="reserved-workspace">
      <div className="reserved-card">
        <span className="reserved-icon"><Icon name={item.icon} size={28} /></span>
        <div className="reserved-eyebrow">功能预留</div>
        <h1>{item.label}</h1>
        <p>该工作区已完成导航和页面结构预留，后续功能可以直接在此接入，不会影响当前简历编辑流程。</p>
        <button className="primary-button reserved-action" onClick={onBack} style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
          <Icon name="ChevronLeft" size={15} /> 返回简历编辑
        </button>
      </div>
    </main>
  );
}

function App() {
  const [themePreference, setThemePreference] = React.useState(loadThemePreference);
  const [localThemeMode, setLocalThemeMode] = React.useState(getLocalThemeMode);
  const [activeWorkspace, setActiveWorkspace] = React.useState("editor");
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // 排版采用固定配置（排版设定入口已移除）：字号 10pt · 行距 16pt · 页边距 10mm（见 DEFAULT_LAYOUT）

  const [data, setData] = React.useState(loadStoredData);
  const [history, setHistory] = React.useState(loadHistory);
  const [toast, setToast] = React.useState(null);
  const [saveStatus, setSaveStatus] = React.useState("saved");
  const [savedAt, setSavedAt] = React.useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_TIME) || null; } catch (e) { return null; }
  });
  const toastTimer = React.useRef(null);
  const firstSave = React.useRef(true);

  const showToast = React.useCallback((msg) => {
    setToast({ msg, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);

  const saveSnapshot = React.useCallback((value, savedAt = Date.now()) => {
    const normalized = normalizeResumeData(value);
    const serialized = JSON.stringify(normalized);
    setHistory((previous) => {
      const latest = previous[0];
      if (latest && JSON.stringify(latest.data) === serialized) return previous;
      return persistHistory([{
        id: uid(),
        savedAt: Number(savedAt),
        data: normalized,
      }, ...previous]);
    });
  }, []);

  const replaceData = React.useCallback((nextData) => {
    saveSnapshot(data);
    setData(normalizeResumeData(nextData));
  }, [data, saveSnapshot]);

  // 自动保存：编辑后防抖写入本地，并弹出 toast（首次加载不提示）
  React.useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    setSaveStatus("saving");
    const id = setTimeout(() => {
      try {
        const normalized = normalizeResumeData(data);
        const serialized = JSON.stringify(normalized);
        localStorage.setItem(STORAGE_KEY, serialized);
        const now = String(Date.now());
        try { localStorage.setItem(STORAGE_KEY_TIME, now); } catch (e) {}
        setSavedAt(now);
        saveSnapshot(normalized, Number(now));
        setSaveStatus("saved");
        showToast("已自动保存");
      } catch (e) {
        setSaveStatus("error");
        showToast("保存失败（本地存储不可用）");
      }
    }, 600);
    return () => clearTimeout(id);
  }, [data, saveSnapshot, showToast]);

  React.useEffect(() => {
    const updateLocalThemeMode = () => setLocalThemeMode(getLocalThemeMode());
    const timer = window.setInterval(updateLocalThemeMode, 60 * 1000);
    window.addEventListener("focus", updateLocalThemeMode);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateLocalThemeMode);
    };
  }, []);

  const resolvedThemeMode = themePreference.mode === "auto" ? localThemeMode : themePreference.mode;
  const themeName = resolveThemeName(themePreference.palette, resolvedThemeMode);
  const theme = THEMES[themeName] || THEMES[resolveThemeName(DEFAULT_THEME_PALETTE, resolvedThemeMode)];

  // 把主题变量挂到 <html> 与 body，并暴露给 Portal（日期选择器）直接内联引用
  React.useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.theme = themeName;
    root.dataset.themeMode = resolvedThemeMode;
    document.body.style.background = theme.vars["--bg"];
    window.__themeVars = theme.vars;
    try {
      localStorage.setItem(STORAGE_KEY_THEME, themeName);
      localStorage.setItem(STORAGE_KEY_THEME_MODE, themePreference.mode);
    } catch (e) {}
  }, [resolvedThemeMode, theme, themeName, themePreference.mode]);

  return (
    <div className="app-shell w-full h-full min-h-0 flex bg-[var(--bg)]" style={theme.vars}>
      {/* 顶部 toast */}
      <Toast toast={toast} />
      <WorkspaceSidebar active={activeWorkspace} onChange={setActiveWorkspace} onSettings={() => setSettingsOpen(true)} />
      <div className="workspace-main min-h-0">
        {activeWorkspace === "editor" ? (
          <div className="resume-workspace min-h-0">
            <div className="editor-pane no-print h-full min-h-0 border-r border-[var(--border)]">
              <EditorPanel
                data={data}
                setData={setData}
                replaceData={replaceData}
                onToast={showToast}
                savedAt={savedAt}
                saveStatus={saveStatus}
                history={history}
                themes={THEMES}
                themePreference={themePreference}
                localThemeMode={localThemeMode}
                onThemeChange={setThemePreference}
              />
            </div>
            <div className="preview-pane h-full min-h-0 min-w-0">
              <ResumePreview data={data} />
            </div>
          </div>
        ) : activeWorkspace === "jobs" ? (
          <JobsWorkspace resumeData={data} onToast={showToast} />
        ) : activeWorkspace === "interview" ? (
          <InterviewWorkspace onToast={showToast} />
        ) : (
          <ReservedWorkspace section={activeWorkspace} onBack={() => setActiveWorkspace("editor")} />
        )}
      </div>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
