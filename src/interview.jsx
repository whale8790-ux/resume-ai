/* =========================================================================
   interview.jsx — interview flashcard training workspace
   ========================================================================= */

const INTERVIEW_STATUS = {
  untrained: { label: "未训练", icon: "Circle", className: "is-untrained" },
  mastered: { label: "已掌握", icon: "CircleCheck", className: "is-mastered" },
  reinforce: { label: "待强化", icon: "Bookmark", className: "is-reinforce" },
  high_risk: { label: "高危", icon: "Flag", className: "is-high-risk" },
};

function interviewTodayKey(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatInterviewDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function interviewQuestionStatus(progress, questionId) {
  return progress.questionProgress?.[questionId]?.status || "untrained";
}

function InterviewImportModal({ open, onClose, onImport, errors }) {
  const fileRef = React.useRef(null);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="modal-backdrop interview-modal-backdrop" onMouseDown={onClose}>
      <div className="interview-import-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="interview-modal-header">
          <div>
            <span className="interview-modal-icon"><Icon name="FileJson" size={18} /></span>
            <div>
              <h2>导入面试题库</h2>
              <p>仅接受符合 v1 字段协议的 JSON 文件，校验通过后才会替换当前题库。</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="关闭题库导入"><Icon name="X" size={17} /></button>
        </div>
        <div className="interview-import-body">
          <button className="interview-file-picker" onClick={() => fileRef.current?.click()}>
            <Icon name="UploadCloud" size={26} />
            <strong>选择 JSON 题库文件</strong>
            <span>schemaVersion、项目、题目和必填解析字段将被自动校验</span>
          </button>
          <a className="interview-format-download" href="interview-library.example.json" download>
            <Icon name="Download" size={14} />
            下载标准题库格式示例
          </a>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
          {errors.length > 0 && (
            <div className="interview-import-errors">
              <strong><Icon name="CircleAlert" size={15} /> 题库未通过校验</strong>
              <div>
                {errors.slice(0, 8).map((error, index) => (
                  <p key={`${error.path}-${index}`}><code>{error.path}</code>{error.message}</p>
                ))}
                {errors.length > 8 && <p>另有 {errors.length - 8} 项错误，请修正后重新导入。</p>}
              </div>
            </div>
          )}
        </div>
        <div className="interview-modal-footer">
          <button onClick={onClose}>取消</button>
          <button className="is-primary" onClick={() => fileRef.current?.click()}>选择文件</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InterviewTopbar({ library, progress, questions, onImport, onReset }) {
  const today = interviewTodayKey();
  const todayQuestionIds = new Set(
    (progress.sessions || []).filter((item) => item.date === today).map((item) => item.questionId)
  );
  const counts = questions.reduce((result, question) => {
    const status = interviewQuestionStatus(progress, question.id);
    if (status !== "untrained") result.trained += 1;
    if (status === "mastered") result.mastered += 1;
    if (status === "reinforce") result.reinforce += 1;
    if (status === "high_risk") result.highRisk += 1;
    return result;
  }, { trained: 0, mastered: 0, reinforce: 0, highRisk: 0 });

  return (
    <header className="interview-topbar">
      <div className="interview-title-block">
        <span className="interview-title-icon"><Icon name="PanelsTopLeft" size={19} /></span>
        <div>
          <span className="interview-eyebrow">INTERVIEW DRILL CONSOLE · V4.0</span>
          <h1>AI 产品经理面试闪卡</h1>
        </div>
      </div>
      <div className="interview-top-stats">
        <span><small>今日训练</small><strong>{todayQuestionIds.size}</strong></span>
        <span><small>题库进度</small><strong>{counts.trained}/{questions.length}</strong></span>
        <span className="is-mastered"><small>已掌握</small><strong>{counts.mastered}</strong></span>
        <span className="is-reinforce"><small>待强化</small><strong>{counts.reinforce}</strong></span>
        <span className="is-high-risk"><small>高危</small><strong>{counts.highRisk}</strong></span>
      </div>
      <div className="interview-top-actions">
        <button onClick={onImport}><Icon name="Upload" size={14} /> 导入题库</button>
        <button onClick={onReset} title="重置全部训练记录"><Icon name="RotateCcw" size={14} /> 重置进度</button>
      </div>
    </header>
  );
}

function InterviewProjectSidebar({ library, progress, currentProjectId, onSelectProject }) {
  return (
    <aside className="interview-project-sidebar">
      <div className="interview-panel-heading">
        <div><Icon name="ListTree" size={15} /><strong>题库项目目录</strong></div>
        <span>{library.projects.length}</span>
      </div>
      <div className="interview-project-list">
        {library.projects.map((project, index) => {
          const statusCounts = project.questions.reduce((result, question) => {
            const status = interviewQuestionStatus(progress, question.id);
            if (status !== "untrained") result.trained += 1;
            if (status === "mastered") result.mastered += 1;
            if (status === "high_risk") result.highRisk += 1;
            return result;
          }, { trained: 0, mastered: 0, highRisk: 0 });
          const percent = project.questions.length ? Math.round(statusCounts.trained / project.questions.length * 100) : 0;
          return (
            <button
              key={project.id}
              className={`interview-project-card ${currentProjectId === project.id ? "is-active" : ""}`}
              onClick={() => onSelectProject(project)}
            >
              <span className="interview-project-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="interview-project-copy">
                <strong>{project.name}</strong>
                <small>{project.description || project.tags?.join(" · ")}</small>
                <span className="interview-project-meta">
                  {project.questions.length} 题 · 已训练 {statusCounts.trained}
                  {statusCounts.highRisk > 0 && <em><Icon name="Flag" size={10} />{statusCounts.highRisk}</em>}
                </span>
                <span className="interview-project-progress"><i style={{ width: `${percent}%` }} /></span>
              </span>
              <Icon name="ChevronRight" size={14} />
            </button>
          );
        })}
      </div>
      <div className="interview-library-note">
        <Icon name="Database" size={14} />
        <div><strong>{library.libraryName}</strong><span>字段协议 v{library.schemaVersion}</span></div>
      </div>
    </aside>
  );
}

function InterviewCountdown({ seconds, running, onToggle, onReset }) {
  const percent = Math.max(0, Math.min(100, seconds / 90 * 100));
  return (
    <div className={`interview-countdown ${seconds === 0 ? "is-finished" : ""}`}>
      <div className="interview-countdown-ring" style={{ "--timer-progress": `${percent * 3.6}deg` }}>
        <span>{formatInterviewDuration(seconds)}</span>
      </div>
      <div className="interview-countdown-actions">
        <button onClick={onToggle} aria-label={running ? "暂停倒计时" : "开始倒计时"}>
          <Icon name={running ? "Pause" : "Play"} size={14} />
        </button>
        <button onClick={onReset} aria-label="重置倒计时"><Icon name="RotateCcw" size={14} /></button>
      </div>
    </div>
  );
}

function InterviewAccordion({ id, icon, index, title, badge, open, onToggle, children }) {
  return (
    <section className={`interview-accordion ${open ? "is-open" : ""}`}>
      <button onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="interview-accordion-index">{String(index).padStart(2, "0")}</span>
        <Icon name={icon} size={14} />
        <strong>{title}</strong>
        {badge && <em>{badge}</em>}
        <Icon name="ChevronDown" size={14} className="interview-accordion-chevron" />
      </button>
      {open && <div className="interview-accordion-content">{children}</div>}
    </section>
  );
}

function InterviewQuestionCard({
  project,
  question,
  questionIndex,
  progress,
  seconds,
  timerRunning,
  onToggleTimer,
  onResetTimer,
  onMark,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onStartFollowUps,
}) {
  const [openSections, setOpenSections] = React.useState({ intent: true });
  React.useEffect(() => setOpenSections({ intent: true }), [question.id]);
  const toggleSection = (id) => setOpenSections((previous) => ({ ...previous, [id]: !previous[id] }));
  const status = interviewQuestionStatus(progress, question.id);
  const stages = [
    { label: "默答", active: true },
    { label: "框架", active: !!openSections.framework },
    { label: "完整", active: !!openSections.answer },
    { label: "追问", active: false },
    { label: "标记", active: status !== "untrained" },
  ];

  return (
    <div className="interview-question-card">
      <div className="interview-question-sticky">
        <div className="interview-question-tags">
          <span>{project.name}</span>
          <span>{question.category || question.questionType}</span>
          {(question.tags || []).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="interview-question-progress">
          <span>第 {questionIndex + 1} / {project.questions.length} 题</span>
          <div>{stages.map((stage) => <i key={stage.label} className={stage.active ? "is-active" : ""} title={stage.label} />)}</div>
        </div>
        <span className="interview-current-label">CURRENT QUESTION · {String(questionIndex + 1).padStart(2, "0")}</span>
        <h2>{question.question}</h2>
      </div>

      <div className="interview-answer-stage">
        <div className="interview-silent-answer">
          <div><Icon name="AudioLines" size={15} /><strong>在脑中默答 / 口头模拟</strong></div>
          <p>调用 90 秒倒计时组织回答。先独立完成表达，再按需展开框架和参考回答。</p>
          <div className="interview-answer-hints">
            <span># 先给结论</span><span># 展开方法</span><span># 补充案例</span><span># 结果复盘</span>
          </div>
        </div>
        <InterviewCountdown seconds={seconds} running={timerRunning} onToggle={onToggleTimer} onReset={onResetTimer} />
      </div>

      <div className="interview-accordions">
        <InterviewAccordion id="intent" index={2} icon="Target" title="考察意图" open={!!openSections.intent} onToggle={toggleSection}>
          <p>{question.intent}</p>
        </InterviewAccordion>
        <InterviewAccordion id="type" index={3} icon="Tags" title="问题类型" badge={question.questionType} open={!!openSections.type} onToggle={toggleSection}>
          <p>{question.questionType}{question.category ? ` · ${question.category}` : ""}</p>
        </InterviewAccordion>
        <InterviewAccordion id="framework" index={4} icon="ListChecks" title="回答框架" open={!!openSections.framework} onToggle={toggleSection}>
          <ol>{question.answerFramework.map((item, index) => <li key={`${item}-${index}`}><span>{index + 1}</span>{item}</li>)}</ol>
        </InterviewAccordion>
        <InterviewAccordion id="answer" index={5} icon="FileText" title="完整回答" open={!!openSections.answer} onToggle={toggleSection}>
          <p>{question.referenceAnswer}</p>
        </InterviewAccordion>
        <InterviewAccordion id="risk" index={7} icon="TriangleAlert" title="风险点" badge={`${question.riskPoints?.length || 0} 项`} open={!!openSections.risk} onToggle={toggleSection}>
          {question.riskPoints?.length
            ? <ul>{question.riskPoints.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
            : <p>当前题目未配置风险点。</p>}
        </InterviewAccordion>
      </div>

      {!!question.followUps?.length && (
        <button className="interview-followup-entry" onClick={onStartFollowUps}>
          <span><Icon name="Sparkles" size={17} /></span>
          <div><strong>进入追问训练 · {question.followUps.length} 题</strong><small>主问题回答完成后，通过连续追问检验思考深度</small></div>
          <Icon name="ArrowRight" size={16} />
        </button>
      )}

      <div className="interview-question-footer">
        <div className="interview-status-actions">
          {["mastered", "reinforce", "high_risk"].map((value) => {
            const item = INTERVIEW_STATUS[value];
            return (
              <button key={value} className={`${item.className} ${status === value ? "is-active" : ""}`} onClick={() => onMark(value)}>
                <Icon name={item.icon} size={14} />{item.label}
              </button>
            );
          })}
        </div>
        <div className="interview-question-navigation">
          <button disabled={!hasPrevious} onClick={onPrevious}><Icon name="ChevronLeft" size={14} />上一题</button>
          <button className="is-primary" disabled={!hasNext} onClick={onNext}>下一题<Icon name="ChevronRight" size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function InterviewFollowUpCard({ question, followUpIndex, onChange, onBack }) {
  const followUp = question.followUps[followUpIndex];
  const [answerOpen, setAnswerOpen] = React.useState(false);
  React.useEffect(() => setAnswerOpen(false), [followUpIndex, question.id]);
  return (
    <div className="interview-question-card interview-followup-card">
      <div className="interview-followup-breadcrumb">
        <button onClick={onBack}><Icon name="ChevronLeft" size={14} /> 返回主问题</button>
        <span>{question.question}</span>
      </div>
      <div className="interview-question-sticky">
        <div className="interview-question-tags"><span>追问训练</span><span>第 {followUpIndex + 1} / {question.followUps.length} 题</span></div>
        <span className="interview-current-label">FOLLOW-UP QUESTION · {String(followUpIndex + 1).padStart(2, "0")}</span>
        <h2>{followUp.question}</h2>
      </div>
      <div className="interview-followup-practice">
        <Icon name="MessagesSquare" size={22} />
        <h3>先独立组织回答</h3>
        <p>追问重点不在复述主问题，而在补充判断依据、异常场景或更深一层的方法。</p>
        <button onClick={() => setAnswerOpen((value) => !value)}>{answerOpen ? "收起参考思路" : "查看参考思路"}</button>
      </div>
      {answerOpen && <div className="interview-followup-answer"><strong>参考思路</strong><p>{followUp.referenceAnswer || "当前追问未配置参考回答。"}</p></div>}
      <div className="interview-question-footer">
        <button className="interview-back-main" onClick={onBack}><Icon name="CornerUpLeft" size={14} />结束追问并返回</button>
        <div className="interview-question-navigation">
          <button disabled={followUpIndex === 0} onClick={() => onChange(followUpIndex - 1)}><Icon name="ChevronLeft" size={14} />上一问</button>
          <button className="is-primary" disabled={followUpIndex >= question.followUps.length - 1} onClick={() => onChange(followUpIndex + 1)}>下一问<Icon name="ChevronRight" size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function InterviewQuestionList({ project, currentQuestionId, progress, onSelectQuestion }) {
  return (
    <section className="interview-question-list-panel">
      <div className="interview-panel-heading">
        <div><Icon name="Rows3" size={15} /><strong>当前项目题目 · {project.name}</strong><span>{project.questions.length} 题</span></div>
      </div>
      <div className="interview-question-list">
        {project.questions.map((question, index) => {
          const status = interviewQuestionStatus(progress, question.id);
          const meta = INTERVIEW_STATUS[status];
          return (
            <button key={question.id} className={currentQuestionId === question.id ? "is-active" : ""} onClick={() => onSelectQuestion(question)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i className={meta.className} />
              <strong>{question.question}</strong>
              <small>{question.category || question.questionType}</small>
              <em className={meta.className}>{meta.label}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function InterviewStatsPanel({ project, progress, sessionSeconds }) {
  const today = interviewTodayKey();
  const todaySessions = (progress.sessions || []).filter((item) => item.date === today);
  const recent = (progress.sessions || []).slice(-12);
  const counts = project.questions.reduce((result, question) => {
    const status = interviewQuestionStatus(progress, question.id);
    if (status === "mastered") result.mastered += 1;
    if (status === "reinforce") result.reinforce += 1;
    if (status === "high_risk") result.highRisk += 1;
    return result;
  }, { mastered: 0, reinforce: 0, highRisk: 0 });
  const mastery = project.questions.length ? Math.round(counts.mastered / project.questions.length * 100) : 0;
  const todayQuestionIds = new Set(todaySessions.map((item) => item.questionId));
  const todaySeconds = progress.dailySeconds?.[today] || 0;
  return (
    <aside className="interview-stats-panel">
      <div className="interview-panel-heading"><div><Icon name="Activity" size={15} /><strong>本次训练 · 实时状态</strong></div></div>
      <div className="interview-stat-grid">
        <span><small>本次时长</small><strong>{formatInterviewDuration(sessionSeconds)}</strong></span>
        <span><small>今日累计</small><strong>{formatInterviewDuration(todaySeconds)}</strong></span>
        <span><small>今日训练</small><strong>{todayQuestionIds.size}</strong><em>题</em></span>
        <span className="is-high-risk"><small>高危待复盘</small><strong>{counts.highRisk}</strong></span>
      </div>
      <section className="interview-recent-performance">
        <div><strong>最近 12 题表现</strong><span>{recent.length} / 12</span></div>
        <div className="interview-heatmap">
          {Array.from({ length: 12 }).map((_, index) => {
            const item = recent[index];
            return <i key={index} className={item ? INTERVIEW_STATUS[item.status]?.className : ""} />;
          })}
        </div>
        <p><span className="is-mastered">掌握</span><span className="is-reinforce">待强化</span><span className="is-high-risk">高危</span></p>
      </section>
      <section className="interview-mastery">
        <div><strong>当前项目掌握度</strong><span>{mastery}%</span></div>
        <div className="interview-mastery-bar"><i style={{ width: `${mastery}%` }} /></div>
        <p>{project.name}</p>
      </section>
      <section className="interview-status-summary">
        <strong>项目状态分布</strong>
        <p><span className="is-mastered">已掌握 {counts.mastered}</span><span className="is-reinforce">待强化 {counts.reinforce}</span><span className="is-high-risk">高危 {counts.highRisk}</span></p>
      </section>
    </aside>
  );
}

function InterviewWorkspace({ onToast }) {
  const [library, setLibrary] = React.useState(window.loadInterviewLibrary);
  const [progress, setProgress] = React.useState(window.loadInterviewProgress);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importErrors, setImportErrors] = React.useState([]);
  const [seconds, setSeconds] = React.useState(90);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [followUpMode, setFollowUpMode] = React.useState(false);
  const [followUpIndex, setFollowUpIndex] = React.useState(0);
  const [sessionSeconds, setSessionSeconds] = React.useState(0);

  const allQuestions = React.useMemo(
    () => library.projects.flatMap((project) => project.questions),
    [library]
  );
  const initialProject = library.projects.find((item) => item.id === progress.currentProjectId) || library.projects[0];
  const currentProject = initialProject || { id: "", name: "", questions: [] };
  const currentQuestion = currentProject.questions.find((item) => item.id === progress.currentQuestionId) || currentProject.questions[0];
  const questionIndex = Math.max(0, currentProject.questions.findIndex((item) => item.id === currentQuestion?.id));

  const updateProgress = React.useCallback((updater) => {
    setProgress((previous) => {
      const next = typeof updater === "function" ? updater(previous) : updater;
      try { window.persistInterviewProgress(next); } catch (_) {}
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (!currentProject?.id || !currentQuestion?.id) return;
    if (progress.currentProjectId === currentProject.id && progress.currentQuestionId === currentQuestion.id) return;
    updateProgress((previous) => ({ ...previous, currentProjectId: currentProject.id, currentQuestionId: currentQuestion.id }));
  }, [currentProject?.id, currentQuestion?.id]);

  React.useEffect(() => {
    if (!timerRunning) return undefined;
    const timer = window.setInterval(() => {
      setSessionSeconds((value) => value + 1);
      const today = interviewTodayKey();
      updateProgress((previous) => ({
        ...previous,
        dailySeconds: {
          ...(previous.dailySeconds || {}),
          [today]: (previous.dailySeconds?.[today] || 0) + 1,
        },
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, updateProgress]);

  React.useEffect(() => {
    if (!timerRunning) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setTimerRunning(false);
          onToast && onToast("本题 90 秒训练时间结束");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, onToast]);

  const selectQuestion = (project, question) => {
    setTimerRunning(false);
    setSeconds(90);
    setFollowUpMode(false);
    setFollowUpIndex(0);
    updateProgress((previous) => ({
      ...previous,
      currentProjectId: project.id,
      currentQuestionId: question.id,
      projectQuestionIds: { ...(previous.projectQuestionIds || {}), [project.id]: question.id },
    }));
  };

  const markQuestion = (status) => {
    const now = new Date();
    const entry = {
      status,
      attempts: (progress.questionProgress?.[currentQuestion.id]?.attempts || 0) + 1,
      lastPracticedAt: now.toISOString(),
    };
    updateProgress((previous) => ({
      ...previous,
      questionProgress: { ...(previous.questionProgress || {}), [currentQuestion.id]: entry },
      sessions: [...(previous.sessions || []), {
        questionId: currentQuestion.id,
        projectId: currentProject.id,
        status,
        date: interviewTodayKey(now),
        at: now.toISOString(),
      }].slice(-200),
    }));
    onToast && onToast(`已标记为「${INTERVIEW_STATUS[status].label}」`);
  };

  const importLibrary = async (file) => {
    try {
      const parsed = JSON.parse(await file.text());
      const result = window.validateInterviewLibrary(parsed);
      if (!result.valid) {
        setImportErrors(result.errors);
        return;
      }
      window.persistInterviewLibrary(parsed);
      setLibrary(parsed);
      setImportErrors([]);
      setImportOpen(false);
      const firstProject = parsed.projects[0];
      updateProgress((previous) => ({
        ...previous,
        currentProjectId: firstProject.id,
        currentQuestionId: firstProject.questions[0].id,
        projectQuestionIds: {
          ...(previous.projectQuestionIds || {}),
          [firstProject.id]: firstProject.questions[0].id,
        },
      }));
      onToast && onToast(`题库「${parsed.libraryName}」导入成功`);
    } catch (error) {
      setImportErrors([{ path: "$", message: error instanceof SyntaxError ? "文件不是合法 JSON" : (error.message || "文件读取失败") }]);
    }
  };

  const resetProgress = () => {
    if (!window.confirm("确定重置全部面试闪卡训练记录吗？题库不会被删除。")) return;
    const next = {
      currentProjectId: library.projects[0]?.id || "",
      currentQuestionId: library.projects[0]?.questions?.[0]?.id || "",
      projectQuestionIds: {},
      questionProgress: {},
      sessions: [],
      dailySeconds: {},
    };
    updateProgress(next);
    setSessionSeconds(0);
    setSeconds(90);
    setTimerRunning(false);
    setFollowUpMode(false);
    onToast && onToast("面试训练进度已重置");
  };

  if (!library.projects.length || !currentQuestion) {
    return (
      <main className="interview-empty-workspace">
        <span><Icon name="LibraryBig" size={32} /></span>
        <h1>尚未导入面试题库</h1>
        <p>请导入符合字段协议 v{window.INTERVIEW_LIBRARY_SCHEMA_VERSION} 的 JSON 文件。</p>
        <button onClick={() => setImportOpen(true)}><Icon name="Upload" size={15} />导入题库</button>
        <InterviewImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={importLibrary} errors={importErrors} />
      </main>
    );
  }

  return (
    <main className="interview-workspace">
      <InterviewTopbar
        library={library}
        progress={progress}
        questions={allQuestions}
        onImport={() => { setImportErrors([]); setImportOpen(true); }}
        onReset={resetProgress}
      />
      <div className="interview-body">
        <InterviewProjectSidebar
          library={library}
          progress={progress}
          currentProjectId={currentProject.id}
          onSelectProject={(project) => {
            const previousQuestionId = progress.projectQuestionIds?.[project.id];
            const question = project.questions.find((item) => item.id === previousQuestionId) || project.questions[0];
            selectQuestion(project, question);
          }}
        />
        <section className="interview-training-column">
          <div className="interview-training-scroll">
            {followUpMode ? (
              <InterviewFollowUpCard
                question={currentQuestion}
                followUpIndex={followUpIndex}
                onChange={setFollowUpIndex}
                onBack={() => setFollowUpMode(false)}
              />
            ) : (
              <InterviewQuestionCard
                project={currentProject}
                question={currentQuestion}
                questionIndex={questionIndex}
                progress={progress}
                seconds={seconds}
                timerRunning={timerRunning}
                onToggleTimer={() => setTimerRunning((value) => seconds > 0 ? !value : false)}
                onResetTimer={() => { setTimerRunning(false); setSeconds(90); }}
                onMark={markQuestion}
                hasPrevious={questionIndex > 0}
                hasNext={questionIndex < currentProject.questions.length - 1}
                onPrevious={() => selectQuestion(currentProject, currentProject.questions[questionIndex - 1])}
                onNext={() => selectQuestion(currentProject, currentProject.questions[questionIndex + 1])}
                onStartFollowUps={() => { setFollowUpIndex(0); setFollowUpMode(true); setTimerRunning(false); }}
              />
            )}
            <InterviewQuestionList
              project={currentProject}
              currentQuestionId={currentQuestion.id}
              progress={progress}
              onSelectQuestion={(question) => selectQuestion(currentProject, question)}
            />
          </div>
        </section>
        <InterviewStatsPanel project={currentProject} progress={progress} sessionSeconds={sessionSeconds} />
      </div>
      <InterviewImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importLibrary}
        errors={importErrors}
      />
    </main>
  );
}

window.InterviewWorkspace = InterviewWorkspace;
