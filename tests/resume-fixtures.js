const baseResume = {
  resumeName: "回归测试简历",
  avatar: null,
  personal: {
    name: "测试用户",
    phone: "13800000000",
    email: "test@example.com",
    intent: "产品经理",
    keywords: "5 年经验",
  },
  advantages: "<ul><li>能够独立完成产品规划与落地。</li></ul>",
  companies: [{
    id: "company_1",
    name: "测试公司",
    start: "2022-01",
    end: "至今",
    projects: [{
      id: "project_1",
      name: "测试项目",
      role: "产品经理",
      start: "2022-01",
      end: "至今",
      summary: "负责产品规划、需求分析与项目推进。",
      keyPoints: "<ul><li>完成核心流程设计并推动上线。</li></ul>",
      honors: "",
    }],
  }],
  education: [{
    id: "education_1",
    school: "测试大学",
    degree: "本科",
    major: "计算机科学",
    start: "2017-09",
    end: "2021-06",
  }],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validResume() {
  return clone(baseResume);
}

function invalidRequiredResume() {
  const data = clone(baseResume);
  data.personal.name = "";
  data.companies[0].name = "";
  return data;
}

function reversedDateResume() {
  const data = clone(baseResume);
  data.companies[0].start = "2025-01";
  data.companies[0].end = "2023-01";
  return data;
}

function longContentResume() {
  const data = clone(baseResume);
  const sentence = "这是一段用于验证超长内容自动分页、页面边界与 PDF 导出的固定测试文本。";
  data.advantages = `<ul><li>${sentence.repeat(140)}</li></ul>`;
  data.companies[0].projects[0].summary = sentence.repeat(140);
  data.companies[0].projects[0].keyPoints = `<ul><li>${sentence.repeat(140)}</li></ul>`;
  return data;
}

if (typeof module !== "undefined") {
  module.exports = {
    validResume,
    invalidRequiredResume,
    reversedDateResume,
    longContentResume,
  };
}
