/* =========================================================================
   Interview flashcard library protocol, validation and local persistence
   ========================================================================= */

const INTERVIEW_LIBRARY_SCHEMA_VERSION = 1;
const INTERVIEW_LIBRARY_STORAGE_KEY = "resume_ai_interview_library_v1";
const INTERVIEW_PROGRESS_STORAGE_KEY = "resume_ai_interview_progress_v1";

const DEFAULT_INTERVIEW_LIBRARY = {
  schemaVersion: 1,
  libraryId: "ai_pm_interview_v1",
  libraryName: "AI 产品经理面试题库",
  projects: [
    {
      id: "foundation",
      name: "基础定位",
      description: "自我介绍 · 求职动机",
      tags: ["通用能力"],
      questions: [
        {
          id: "foundation_intro",
          question: "请用 3 分钟介绍一下你自己，并说明为什么适合 AI 产品经理岗位。",
          category: "基础定位",
          tags: ["自我介绍", "岗位匹配"],
          intent: "考察候选人能否围绕岗位要求组织经历，并清晰表达个人定位、核心优势和求职动机。",
          questionType: "综合题",
          answerFramework: ["一句话定位个人背景", "选择 2-3 段与岗位最相关的经历", "总结能力证据与岗位匹配点", "说明下一阶段职业方向"],
          referenceAnswer: "建议按照“背景定位—代表项目—能力沉淀—求职动机”展开。避免按时间顺序复述全部经历，重点说明你解决过什么问题、承担什么角色、取得什么结果，以及这些经验为什么适用于目标岗位。",
          followUps: [
            { id: "foundation_intro_f1", question: "你认为自己与纯互联网产品经理相比，最大的差异是什么？", referenceAnswer: "从模型能力理解、数据闭环设计、效果评测或 AI 产品落地经验中选择最有证据的一项回答，并用具体项目说明。" },
            { id: "foundation_intro_f2", question: "为什么现在考虑新的机会？", referenceAnswer: "聚焦职业发展方向、希望解决的问题和目标岗位机会，避免评价原公司或给出无法验证的外部原因。" }
          ],
          riskPoints: ["经历罗列过多，缺少主线", "只描述职责，没有结果证据", "求职动机与目标岗位没有关联"]
        },
        {
          id: "foundation_strength",
          question: "你认为自己最突出的三个产品能力是什么？",
          category: "基础定位",
          tags: ["能力模型"],
          intent: "考察候选人的自我认知，以及是否能为能力判断提供稳定、具体的项目证据。",
          questionType: "能力题",
          answerFramework: ["明确三项能力", "每项能力匹配一个项目证据", "说明适用场景", "补充仍在提升的边界"],
          referenceAnswer: "能力选择应与目标岗位相关，并且每项能力都要有一段能够验证的项目事实。推荐覆盖需求判断、方案设计、跨团队推进、数据分析或 AI 产品方法中的三项。",
          followUps: [],
          riskPoints: ["使用学习能力强等泛化表述", "三项能力之间高度重复", "缺少可验证案例"]
        }
      ]
    },
    {
      id: "ai_product",
      name: "AI 产品设计",
      description: "需求判断 · 模型应用 · 效果评估",
      tags: ["AI", "产品设计"],
      questions: [
        {
          id: "ai_effect",
          question: "如果让你评估 AI 功能上线后的效果，你会看哪些指标？",
          category: "效果评估",
          tags: ["指标体系", "数据分析"],
          intent: "考察候选人是否能从业务目标、用户价值、模型效果和系统成本建立完整指标体系。",
          questionType: "策略题",
          answerFramework: ["先明确功能目标与核心用户行为", "定义业务结果指标", "拆解过程与模型质量指标", "加入成本、安全和体验护栏", "说明评估周期与归因方法"],
          referenceAnswer: "先明确 AI 功能解决的核心问题，再设置一个与用户价值直接相关的北极星指标。过程层关注触发率、采纳率、任务完成率和重试率；模型层关注准确性、相关性、稳定性和安全性；业务层关注留存、转化或效率提升；同时监控延迟、调用成本和负反馈等护栏指标。",
          followUps: [
            { id: "ai_effect_f1", question: "核心业务指标没有提升，但模型离线评测变好了，你会如何判断？", referenceAnswer: "检查离线指标与真实任务是否一致，再排查功能入口、用户理解、输出可用性、交互链路和样本分布，避免直接将问题归因于模型。" },
            { id: "ai_effect_f2", question: "如何证明指标提升确实来自 AI 功能？", referenceAnswer: "优先使用随机对照实验；无法实验时可结合分层对照、灰度时间窗口、用户行为路径和定性访谈建立证据链。" }
          ],
          riskPoints: ["只列模型准确率", "指标很多但没有核心目标", "忽略成本、延迟与安全"]
        },
        {
          id: "ai_requirement",
          question: "什么样的需求适合用大模型解决？",
          category: "需求判断",
          tags: ["场景判断", "LLM"],
          intent: "考察候选人能否区分技术机会与真实需求，并理解大模型能力边界。",
          questionType: "方法题",
          answerFramework: ["判断用户任务是否包含语言或非结构化理解", "评估容错空间与结果可验证性", "比较规则方案和模型方案成本", "设计人机协同与兜底", "通过最小实验验证价值"],
          referenceAnswer: "适合大模型的场景通常包含非结构化输入、开放式生成、语义理解或复杂信息归纳，并且允许通过人工确认、工具校验或业务规则控制风险。若任务规则稳定、错误成本极高或输出必须完全确定，传统规则和专用模型可能更合适。",
          followUps: [
            { id: "ai_requirement_f1", question: "如何判断应该自己训练模型还是调用外部模型？", referenceAnswer: "综合数据壁垒、任务差异化、效果要求、成本、延迟、合规和团队能力判断，并先用外部模型验证产品价值。" }
          ],
          riskPoints: ["把所有智能化需求都交给大模型", "只讨论技术效果，不讨论业务价值", "缺少错误兜底"]
        },
        {
          id: "ai_prompt",
          question: "你会如何系统优化一个 Prompt？",
          category: "模型应用",
          tags: ["Prompt", "评测"],
          intent: "考察候选人是否具备从任务定义、样本分析到评测迭代的完整方法，而非依赖零散技巧。",
          questionType: "方法题",
          answerFramework: ["定义任务与成功标准", "建立代表性测试集", "拆解错误类型", "优化指令、上下文和示例", "离线评测后灰度验证"],
          referenceAnswer: "先固定输入输出协议和评价标准，再收集覆盖典型、边界和失败场景的测试集。根据错误类型分别调整任务说明、上下文顺序、few-shot 示例、输出约束和兜底逻辑。每次只改变少量变量，通过离线评测和线上业务指标验证。",
          followUps: [],
          riskPoints: ["只强调反复试词", "没有固定测试集", "没有线上业务验证"]
        }
      ]
    },
    {
      id: "project_review",
      name: "项目复盘",
      description: "方案设计 · 推进落地 · 结果复盘",
      tags: ["项目经历"],
      questions: [
        {
          id: "project_difficult",
          question: "讲一个你负责过的最有挑战的项目。",
          category: "项目复盘",
          tags: ["STAR", "项目管理"],
          intent: "考察候选人的问题复杂度、责任边界、关键判断、推进能力和复盘深度。",
          questionType: "行为题",
          answerFramework: ["交代业务背景和挑战", "明确个人职责与目标", "展开关键判断和行动", "用结果数据收尾", "说明复盘与后续迭代"],
          referenceAnswer: "选择一个确实由你承担核心责任、存在明确冲突或不确定性的项目。重点讲你做了哪些关键判断、如何影响团队决策、如何处理风险，以及结果与目标之间的差异。不要把篇幅都用在介绍项目背景。",
          followUps: [
            { id: "project_difficult_f1", question: "项目中最大的错误判断是什么？", referenceAnswer: "说明当时依据、错误信号、修正动作和后续机制，体现复盘而不是回避责任。" },
            { id: "project_difficult_f2", question: "如果重来一次，你会改变什么？", referenceAnswer: "提出具体可执行的流程或方案变化，并说明为什么能降低原问题发生概率。" }
          ],
          riskPoints: ["团队成果全部描述为个人贡献", "没有说明关键决策", "结果缺少数据或评价标准"]
        },
        {
          id: "project_conflict",
          question: "当算法、研发和业务对方案意见不一致时，你如何推进？",
          category: "协作推进",
          tags: ["跨团队", "决策"],
          intent: "考察候选人能否识别分歧本质、建立共同目标并推动可验证决策。",
          questionType: "情景题",
          answerFramework: ["澄清各方目标和约束", "把分歧转为可验证假设", "明确决策标准与负责人", "通过小范围验证降低争议", "记录结论并跟进结果"],
          referenceAnswer: "先判断分歧来自目标、事实、资源还是风险偏好。对齐共同目标后，将争议拆成可验证的问题，用数据、用户证据或小流量实验支持决策。无法验证时明确决策人和风险承担方式，避免无限讨论。",
          followUps: [],
          riskPoints: ["只强调沟通协调", "没有决策机制", "为了推进忽略技术和业务风险"]
        }
      ]
    }
  ]
};

function validateInterviewLibrary(input) {
  const errors = [];
  const add = (path, message) => errors.push({ path, message });
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: [{ path: "$", message: "题库必须是 JSON 对象" }] };
  }
  if (input.schemaVersion !== INTERVIEW_LIBRARY_SCHEMA_VERSION) {
    add("schemaVersion", `当前仅支持版本 ${INTERVIEW_LIBRARY_SCHEMA_VERSION}`);
  }
  if (typeof input.libraryId !== "string" || !input.libraryId.trim()) add("libraryId", "题库 ID 不能为空");
  if (typeof input.libraryName !== "string" || !input.libraryName.trim()) add("libraryName", "题库名称不能为空");
  if (!Array.isArray(input.projects) || !input.projects.length) add("projects", "题库至少需要一个项目");

  const ids = new Set();
  const registerId = (value, path) => {
    if (typeof value !== "string" || !value.trim()) return add(path, "ID 不能为空");
    if (ids.has(value)) add(path, `ID「${value}」重复`);
    ids.add(value);
  };
  (Array.isArray(input.projects) ? input.projects : []).forEach((project, projectIndex) => {
    const projectPath = `projects[${projectIndex}]`;
    if (!project || typeof project !== "object" || Array.isArray(project)) {
      add(projectPath, "项目必须是对象");
      return;
    }
    registerId(project.id, `${projectPath}.id`);
    if (typeof project.name !== "string" || !project.name.trim()) add(`${projectPath}.name`, "项目名称不能为空");
    if (!Array.isArray(project.questions) || !project.questions.length) {
      add(`${projectPath}.questions`, "项目至少需要一道题");
      return;
    }
    project.questions.forEach((question, questionIndex) => {
      const questionPath = `${projectPath}.questions[${questionIndex}]`;
      registerId(question?.id, `${questionPath}.id`);
      ["question", "intent", "questionType", "referenceAnswer"].forEach((field) => {
        if (typeof question?.[field] !== "string" || !question[field].trim()) add(`${questionPath}.${field}`, "字段不能为空");
      });
      if (!Array.isArray(question?.answerFramework) || !question.answerFramework.length) {
        add(`${questionPath}.answerFramework`, "回答框架至少需要一项");
      }
      ["tags", "followUps", "riskPoints"].forEach((field) => {
        if (question?.[field] != null && !Array.isArray(question[field])) add(`${questionPath}.${field}`, "字段必须是数组");
      });
      const followUpIds = new Set();
      (Array.isArray(question?.followUps) ? question.followUps : []).forEach((followUp, followUpIndex) => {
        const followUpPath = `${questionPath}.followUps[${followUpIndex}]`;
        if (typeof followUp?.id !== "string" || !followUp.id.trim()) add(`${followUpPath}.id`, "追问 ID 不能为空");
        else if (followUpIds.has(followUp.id)) add(`${followUpPath}.id`, `追问 ID「${followUp.id}」重复`);
        else followUpIds.add(followUp.id);
        if (typeof followUp?.question !== "string" || !followUp.question.trim()) add(`${followUpPath}.question`, "追问题干不能为空");
      });
    });
  });
  return { valid: errors.length === 0, errors };
}

function loadInterviewLibrary() {
  try {
    const raw = localStorage.getItem(INTERVIEW_LIBRARY_STORAGE_KEY);
    if (!raw) return DEFAULT_INTERVIEW_LIBRARY;
    const parsed = JSON.parse(raw);
    return validateInterviewLibrary(parsed).valid ? parsed : DEFAULT_INTERVIEW_LIBRARY;
  } catch (_) {
    return DEFAULT_INTERVIEW_LIBRARY;
  }
}

function persistInterviewLibrary(library) {
  localStorage.setItem(INTERVIEW_LIBRARY_STORAGE_KEY, JSON.stringify(library));
  return library;
}

function loadInterviewProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(INTERVIEW_PROGRESS_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { currentProjectId: "", currentQuestionId: "", projectQuestionIds: {}, questionProgress: {}, sessions: [], ...parsed }
      : { currentProjectId: "", currentQuestionId: "", projectQuestionIds: {}, questionProgress: {}, sessions: [] };
  } catch (_) {
    return { currentProjectId: "", currentQuestionId: "", projectQuestionIds: {}, questionProgress: {}, sessions: [] };
  }
}

function persistInterviewProgress(progress) {
  localStorage.setItem(INTERVIEW_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

Object.assign(window, {
  INTERVIEW_LIBRARY_SCHEMA_VERSION,
  DEFAULT_INTERVIEW_LIBRARY,
  validateInterviewLibrary,
  loadInterviewLibrary,
  persistInterviewLibrary,
  loadInterviewProgress,
  persistInterviewProgress,
});
