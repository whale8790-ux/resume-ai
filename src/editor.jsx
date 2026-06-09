/* =========================================================================
   EditorPanel — 左侧编辑区
   颜色全部抽成 CSS 变量（由主题切换控制），简历纸张保持白底黑字不受影响。
   ========================================================================= */

const MAX_NAME_LEN = 30;

function getResumePdfFileName(data) {
  const safePart = (value, fallback) => {
    const cleaned = String(value || "").trim().replace(/[\\/:*?"<>|]/g, "_");
    return cleaned || fallback;
  };
  const personName = safePart(data && data.personal && data.personal.name, "李四");
  const intent = safePart(data && data.personal && data.personal.intent, "产品经理");
  return `${personName}-${intent}`;
}
window.getResumePdfFileName = getResumePdfFileName;

/* ----------------------------- 基础表单原子 ----------------------------- */
function FieldLabel({ children, required }) {
  return (
    <div className="text-[12px] text-[var(--text-dim)] mb-1.5 flex items-center gap-0.5">
      {required && <span className="text-red-400">*</span>}
      {children}
    </div>);

}

function DarkInput({ value, placeholder, onChange, className = "" }) {
  const [focused, setFocused] = React.useState(false);
  const has = (value ?? "") !== "";
  return (
    <div className="relative">
      <input
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full bg-[var(--field)] border border-[var(--border-2)] rounded-md px-3 py-1.5 pr-8 text-[13px] text-[var(--text)] placeholder:text-[var(--faint)] focus:outline-none focus:border-[var(--accent)] transition-colors ${className}`} />
      {focused && has &&
      <button
        type="button"
        tabIndex={-1}
        title="清除"
        onMouseDown={(e) => {e.preventDefault();onChange && onChange("");}}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--faint)] hover:text-[var(--text)] transition-colors">
          <Icon name="CircleX" size={15} />
        </button>
      }
    </div>);

}

function DarkSelect({ value, options = ["本科", "硕士", "博士", "专科"], onChange, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="appearance-none w-full bg-[var(--field)] border border-[var(--border-2)] rounded-md px-3 py-1.5 pr-8 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer">
        
        {options.map((o) =>
        <option key={o} value={o} style={{ background: "var(--field)", color: "var(--text)" }}>{o}</option>
        )}
      </select>
      <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
    </div>);

}

function SectionCard({ title, right, children, className = "", variant = "", icon, collapsible, collapsed, onToggle, titleSize }) {
  const vCls = variant ? "section-" + variant : "";
  const ts = titleSize || "15px";
  const iconSz = titleSize ? Math.round(parseInt(titleSize, 10) * 1.1) : 16;
  return (
    <div className={`ui-card bg-[var(--panel)] border border-[var(--border)] p-4 ${vCls} ${className}`}>
      {(title || right || collapsible) &&
      <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2" style={{ fontSize: ts, fontWeight: 600, color: "var(--text)" }}>
            {icon && <Icon name={icon} size={iconSz} className="text-[var(--accent-text)]" />}
            {title}
          </div>
          <div className="flex items-center gap-2">
            {right}
            {collapsible && (
              <button onClick={onToggle} className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
                <Icon name={collapsed ? "ChevronRight" : "ChevronDown"} size={16} />
              </button>
            )}
          </div>
        </div>
      }
      {(!collapsible || !collapsed) && children}
    </div>);

}

/* 富文本编辑器（RichEditor）见 controls.jsx */

/* ------------------------------ 头像上传 ------------------------------ */
function AvatarUploader({ url, onChange }) {
  const inputRef = React.useRef(null);
  const pick = () => inputRef.current && inputRef.current.click();
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // 通过 canvas 归一化：限制最长边 600px、高质量重采样后存为 JPEG dataURL。
    // 好处：① 显示清晰且尺寸可控 ② dataURL 可随 localStorage 持久化（blob: 刷新即失效）
    //       ③ 体积小（~40-80KB），不会撑大导出 PDF
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const tw = Math.max(1, Math.round(img.width * scale));
        const th = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement("canvas");
        c.width = tw; c.height = th;
        const ctx = c.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, tw, th);
        try {
          onChange(c.toDataURL("image/jpeg", 0.92));
        } catch (err) {
          onChange(reader.result); // 跨域等异常时回退原图
        }
      };
      img.onerror = () => onChange(reader.result);
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  };
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <div
        onClick={pick}
        className="group w-[104px] h-[132px] rounded-md bg-[var(--field)] border border-[var(--border-2)] flex items-center justify-center text-[var(--text-dim)] relative overflow-hidden cursor-pointer">
        
        {url ?
        <>
            <img src={url} alt="avatar" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Icon name="Pencil" size={18} className="text-white" />
            </div>
          </> :

        <div className="flex flex-col items-center gap-1.5 text-[var(--text-dim)]">
            <Icon name="Upload" size={22} />
            <span className="text-[12px]">点击上传</span>
          </div>
        }
      </div>
      {url ?
      <div className="w-[104px] flex flex-col gap-1.5 text-[12px]">
          <button onClick={pick} className="w-full text-center px-2.5 py-1 rounded border border-[var(--accent-line)] text-[var(--accent-text)] hover:bg-[var(--accent-soft)] transition-colors" style={{ borderStyle: "solid" }}>重新上传</button>
          <button onClick={() => onChange(null)} className="w-full text-center px-2.5 py-1 rounded border border-[var(--border-2)] text-[var(--text-dim)] hover:text-red-400 hover:border-red-500/40 transition-colors">删除</button>
        </div> :

      <button onClick={pick} className="text-[12px] text-[var(--accent-text)] hover:opacity-80 flex items-center gap-1 px-2.5 py-1">
          <Icon name="Camera" size={14} /> 上传头像
        </button>
      }
    </div>);

}

/* ----------------------------- 重命名弹窗 ----------------------------- */
function RenameModal({ open, initial, onClose, onConfirm }) {
  const [value, setValue] = React.useState(initial);
  React.useEffect(() => {if (open) setValue(initial);}, [open, initial]);
  if (!open) return null;
  const trimmed = value.trim();
  return ReactDOM.createPortal(
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="rename-modal w-[440px] max-w-[calc(100vw-40px)] rounded-2xl bg-[var(--panel)] border border-[var(--border-2)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-[16px] text-[var(--text)]" style={{ fontWeight: 600 }}>重命名简历</div>
          <button onClick={onClose} className="icon-button text-[var(--text-dim)] hover:text-[var(--text)]" aria-label="关闭重命名弹窗"><Icon name="X" size={16} /></button>
        </div>
        <div className="relative mb-6">
          <input
            autoFocus value={value} maxLength={MAX_NAME_LEN}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-[var(--field)] border border-[var(--border-2)] rounded-lg px-3 py-2.5 pr-14 text-[14px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]" />
          
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--faint)]">{value.length}/{MAX_NAME_LEN}</span>
        </div>
        <button
          disabled={trimmed.length === 0}
          onClick={() => {onConfirm(trimmed);onClose();}}
          className="w-full py-2.5 rounded-full text-[14px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{ background: "var(--accent)", color: "var(--on-accent)", fontWeight: 600 }}>
          
          确认修改
        </button>
      </div>
    </div>,
    document.body
  );

}

/* --------------------------- 数据管理弹窗 --------------------------- */
function DataManagerModal({
  open,
  history,
  onClose,
  onExport,
  onImportFile,
  onRestore,
  onReset,
}) {
  const inputRef = React.useRef(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl bg-[var(--panel)] border border-[var(--border-2)] p-6 shadow-2xl scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[16px] text-[var(--text)]" style={{ fontWeight: 600 }}>数据管理</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">备份文件可用于换浏览器、换电脑或清理缓存后的恢复。</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)]"><Icon name="X" size={16} /></button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (file) onImportFile(file);
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={onExport} className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-2)] bg-[var(--field)] px-4 py-3 text-[13px] text-[var(--text)] hover:border-[var(--accent-line)] transition-colors">
            <Icon name="Download" size={16} /> 导出 JSON 备份
          </button>
          <button onClick={() => inputRef.current && inputRef.current.click()} className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-2)] bg-[var(--field)] px-4 py-3 text-[13px] text-[var(--text)] hover:border-[var(--accent-line)] transition-colors">
            <Icon name="Upload" size={16} /> 导入 JSON 备份
          </button>
        </div>

        <div className="mt-6 mb-2 flex items-center justify-between">
          <div className="text-[14px] text-[var(--text)]" style={{ fontWeight: 600 }}>最近快照</div>
          <div className="text-[11px] text-[var(--faint)]">最多保留 10 份</div>
        </div>
        <div className="space-y-2">
          {history.length ? history.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2.5">
              <Icon name="History" size={15} className="text-[var(--text-dim)] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-[var(--text)] truncate">{item.data.resumeName || "未命名简历"}</div>
                <div className="text-[11px] text-[var(--faint)] mt-0.5">{fmtSavedAt(item.savedAt)}</div>
              </div>
              <button onClick={() => onRestore(item)} className="shrink-0 rounded-md border border-[var(--border-2)] px-2.5 py-1 text-[12px] text-[var(--accent-text)] hover:bg-[var(--accent-soft)] transition-colors">
                恢复
              </button>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-[var(--border-2)] px-4 py-5 text-center text-[12px] text-[var(--faint)]">
              编辑并自动保存后，这里会出现历史快照。
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <button onClick={onReset} className="flex items-center gap-2 text-[12.5px] text-red-400 hover:text-red-300 transition-colors">
            <Icon name="RotateCcw" size={14} /> 恢复默认示例数据
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportCheckModal({ open, issues, onClose, onConfirm }) {
  if (!open) return null;
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  const groups = [
    { title: "必须修复", items: errors, color: "#f87171", icon: "CircleAlert" },
    { title: "优化建议", items: warnings, color: "#fbbf24", icon: "TriangleAlert" },
  ].filter((group) => group.items.length);
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-[540px] max-h-[82vh] overflow-y-auto rounded-2xl bg-[var(--panel)] border border-[var(--border-2)] p-6 shadow-2xl scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[16px] text-[var(--text)]" style={{ fontWeight: 600 }}>导出前检查</div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1">
              {issues.length ? `发现 ${errors.length} 个错误、${warnings.length} 条建议。` : "关键字段、日期和分页检查均通过。"}
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text)]"><Icon name="X" size={16} /></button>
        </div>

        {groups.length ? groups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="flex items-center gap-1.5 text-[12px] mb-2" style={{ color: group.color, fontWeight: 600 }}>
              <Icon name={group.icon} size={14} /> {group.title}
            </div>
            <div className="space-y-2">
              {group.items.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2.5">
                  <div className="text-[12.5px] text-[var(--text)]" style={{ fontWeight: 500 }}>{item.label}</div>
                  <div className="text-[11.5px] text-[var(--text-dim)] mt-0.5">{item.message}</div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-line)] bg-[var(--accent-soft)] px-4 py-4 text-[13px] text-[var(--accent-text)]">
            <Icon name="CircleCheck" size={19} /> 简历已具备良好的导出条件
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-6">
          <button onClick={onClose} className="px-4 py-1.5 rounded-md text-[13px] text-[var(--text-dim)] border border-[var(--border-2)] hover:bg-[var(--field)] transition-colors">
            返回修改
          </button>
          <button
            onClick={onConfirm}
            disabled={errors.length > 0}
            className="px-5 py-1.5 rounded-md text-[13px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: "var(--accent)", color: "var(--on-accent)", fontWeight: 500 }}
          >
            {warnings.length ? "仍然导出" : "确认导出"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeModal({ open, themes, preference, localThemeMode, onChange, onClose }) {
  if (!open) return null;
  const previewMode = preference.mode === "auto" ? localThemeMode : preference.mode;
  const palettes = ["宝蓝", "青绿", "紫罗兰"];
  const modeOptions = [
    { value: "auto", label: "自动", note: `当前为${localThemeMode === "light" ? "浅色" : "深色"}` },
    { value: "light", label: "浅色", note: "固定浅色" },
    { value: "dark", label: "深色", note: "固定深色" },
  ];
  return ReactDOM.createPortal(
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="theme-modal w-[720px] max-w-[calc(100vw-40px)] rounded-2xl border border-[var(--border-2)] bg-[var(--panel)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-[17px] text-[var(--text)]" style={{ fontWeight: 650 }}>
              <span className="theme-title-icon"><Icon name="Palette" size={17} /></span>
              选择界面主题
            </div>
            <div className="text-[12px] text-[var(--text-dim)] mt-1.5">主题只改变编辑器界面，简历预览和 PDF 始终保持专业白底。</div>
          </div>
          <button onClick={onClose} className="icon-button text-[var(--text-dim)] hover:text-[var(--text)]" aria-label="关闭主题选择"><Icon name="X" size={17} /></button>
        </div>
        <div className="theme-mode-switch" role="group" aria-label="主题模式">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              className={`theme-mode-option ${preference.mode === option.value ? "is-active" : ""}`}
              onClick={() => onChange({ ...preference, mode: option.value })}
              aria-pressed={preference.mode === option.value}
            >
              <strong>{option.label}</strong>
              <small>{option.note}</small>
            </button>
          ))}
        </div>
        <div className="theme-palette-heading">
          <span>选择配色</span>
          <small>每套配色均提供浅色和深色版本</small>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {palettes.map((palette) => {
            const key = `${palette}${previewMode === "light" ? "浅色" : "深色"}`;
            const theme = themes[key];
            const v = theme.vars;
            const selected = palette === preference.palette;
            return (
              <button
                key={key}
                onClick={() => onChange({ ...preference, palette })}
                className={`theme-card ${selected ? "is-active" : ""}`}
                aria-pressed={selected}
                style={{
                  "--sample-bg": v["--bg"],
                  "--sample-panel": v["--panel"],
                  "--sample-field": v["--field"],
                  "--sample-border": v["--border-2"],
                  "--sample-text": v["--text"],
                  "--sample-dim": v["--text-dim"],
                  "--sample-accent": v["--accent"],
                  "--sample-on-accent": v["--on-accent"],
                }}
              >
                <span className="theme-preview">
                  <span className="theme-preview-sidebar">
                    <i /><i /><i />
                  </span>
                  <span className="theme-preview-main">
                    <i className="wide" /><i /><i className="button" />
                  </span>
                </span>
                <span className="theme-card-copy">
                  <strong>{palette}</strong>
                  <small>{theme.note}</small>
                </span>
                <span className="theme-check"><Icon name={selected ? "Check" : "Palette"} size={13} strokeWidth={selected ? 3 : 2} /></span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* --------------------------- 虚线“添加”按钮 --------------------------- */
function AddButton({ children, onClick, solid = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full border border-dashed rounded-md py-2 text-[12.5px] flex items-center justify-center gap-1.5 transition-colors ${
      solid ?
      "border-[var(--accent-line)] text-[var(--accent-text)] hover:bg-[var(--accent-soft)] bg-[var(--accent-soft)]" :
      "border-[var(--border-2)] text-[var(--accent-text)] hover:bg-[var(--panel)]"}`
      }>
      
      <Icon name="Plus" size={14} /> {children}
    </button>);

}

/* ============================== EditorPanel ============================== */
function EditorPanel({ data, setData, replaceData, onToast, savedAt, saveStatus, history = [], themes, themePreference, localThemeMode, onThemeChange }) {
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [dataOpen, setDataOpen] = React.useState(false);
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [exportCheck, setExportCheck] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);

  const patch = (patchObj) => setData((d) => ({ ...d, ...patchObj }));
  const patchPersonal = (patchObj) => setData((d) => ({ ...d, personal: { ...d.personal, ...patchObj } }));

  /* 公司增删改 */
  const addCompany = () => setData((d) => ({ ...d, companies: [...d.companies, makeCompany()] }));
  const removeCompany = (id) => setData((d) => ({ ...d, companies: d.companies.filter((c) => c.id !== id) }));
  const patchCompany = (id, patchObj) =>
  setData((d) => ({ ...d, companies: d.companies.map((c) => c.id === id ? { ...c, ...patchObj } : c) }));

  /* 项目增删改（隶属公司） */
  const addProject = (cid) =>
  setData((d) => ({
    ...d,
    companies: d.companies.map((c) => c.id === cid ? { ...c, projects: [...c.projects, makeProject()] } : c)
  }));
  const removeProject = (cid, pid) =>
  setData((d) => ({
    ...d,
    companies: d.companies.map((c) => c.id === cid ? { ...c, projects: c.projects.filter((p) => p.id !== pid) } : c)
  }));
  const patchProject = (cid, pid, patchObj) =>
  setData((d) => ({
    ...d,
    companies: d.companies.map((c) =>
    c.id === cid ? { ...c, projects: c.projects.map((p) => p.id === pid ? { ...p, ...patchObj } : p) } : c
    )
  }));

  /* 教育增删改 */
  const addEducation = () => setData((d) => ({ ...d, education: [...d.education, makeEducation()] }));
  const removeEducation = (id) => setData((d) => ({ ...d, education: d.education.filter((e) => e.id !== id) }));
  const patchEducation = (id, patchObj) =>
  setData((d) => ({ ...d, education: d.education.map((e) => e.id === id ? { ...e, ...patchObj } : e) }));

  /* 版式 D 折叠状态 */
  const [collapsed, setCollapsed] = React.useState({});
  const toggleCollapsed = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));


  /* 删除二次确认 */
  const askRemoveCompany = (c, idx) =>
  setConfirm({
    title: "删除公司",
    message: `确定删除「公司 ${idx + 1}${c.name ? `（${c.name}）` : ""}」及其下 ${c.projects.length} 个项目吗？该操作不可撤销。`,
    confirmText: "删除公司",
    onConfirm: () => removeCompany(c.id)
  });
  const askRemoveProject = (c, pid) => {
    const p = c.projects.find((x) => x.id === pid);
    setConfirm({
      title: "删除项目",
      message: `确定删除项目「${p && p.name ? p.name : "未命名项目"}」吗？该操作不可撤销。`,
      confirmText: "删除项目",
      onConfirm: () => removeProject(c.id, pid)
    });
  };

  const handleDataExport = () => {
    try {
      const payload = {
        schemaVersion: DATA_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: normalizeResumeData(data),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (data.resumeName || "简历").replace(/[\\/:*?"<>|]/g, "_");
      link.href = url;
      link.download = `${safeName}-备份.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      onToast && onToast("JSON 备份已导出");
    } catch (e) {
      onToast && onToast("备份导出失败，请重试");
    }
  };

  const handleDataImport = async (file) => {
    try {
      const text = await file.text();
      const imported = parseResumeBackup(JSON.parse(text));
      setConfirm({
        title: "导入备份",
        message: `确定导入「${imported.resumeName}」吗？当前内容会被替换，并在自动保存后生成新快照。`,
        confirmText: "确认导入",
        onConfirm: () => {
          replaceData(imported);
          setDataOpen(false);
          onToast && onToast("备份已导入");
        },
      });
    } catch (e) {
      onToast && onToast(e && e.message ? e.message : "备份文件无法读取");
    }
  };

  const askRestoreSnapshot = (item) => {
    setConfirm({
      title: "恢复历史快照",
      message: `确定恢复 ${fmtSavedAt(item.savedAt)} 的内容吗？当前内容会被替换。`,
      confirmText: "确认恢复",
      onConfirm: () => {
        replaceData(item.data);
        setDataOpen(false);
        onToast && onToast("历史快照已恢复");
      },
    });
  };

  const askResetData = () => {
    setConfirm({
      title: "恢复默认数据",
      message: "确定恢复默认示例数据吗？当前编辑内容会被替换，此操作完成后仍可从历史快照恢复。",
      confirmText: "恢复默认",
      onConfirm: () => {
        replaceData(getDefaultResumeData());
        setDataOpen(false);
        onToast && onToast("已恢复默认数据");
      },
    });
  };

  const collectExportIssues = () => {
    const issues = validateResumeData(data);
    const pages = Array.from(document.querySelectorAll(".resume-pages .resume-page"));
    pages.forEach((page, index) => {
      const verticalOverflow = page.scrollHeight > page.clientHeight + 2;
      const horizontalOverflow = page.scrollWidth > page.clientWidth + 2;
      if (verticalOverflow || horizontalOverflow) {
        issues.push({
          severity: "error",
          label: `第 ${index + 1} 页 / 分页`,
          message: "页面内容超出纸张边界，请精简超长段落后再导出",
        });
      }
    });
    return issues;
  };

  const requestDownload = () => {
    if (exporting) return;
    setExportCheck(collectExportIssues());
  };

  const handleDownload = async () => {
    setExportCheck(null);
    if (exporting) return;
    const pages = Array.from(document.querySelectorAll(".resume-pages .resume-page"));
    if (!pages.length || !window.html2canvas || !(window.jspdf && window.jspdf.jsPDF)) {
      onToast && onToast("导出组件未就绪，请稍后重试");
      return;
    }
    setExporting(true);
    onToast && onToast("正在生成 PDF…");
    try {
      const W = 720, H = Math.round(720 * 1.414);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "px", format: [W, H], hotfixes: ["px_scaling"], compress: true });

      // 头像清晰处理：整页 JPEG 截图会把头像一并降采样+压缩 → 模糊。
      // 做法：页面截图照旧（文字体积小），再按头像在页内位置，用高分辨率原图（cover 裁剪）
      // 单独叠加为独立图像对象 → 头像清晰、文件仍小。
      // 圆角：JPEG 无透明通道，故用页面背景色填充四角、再以圆角矩形裁切照片，
      //       圆角半径与「配置中心」头像一致（rounded-md = 6px）。
      const AV_RADIUS = 6;          // 屏幕 px，对应配置中心 rounded-md
      // 圆角外露区域用「实际页面背景色」填充（v4/v5 为 #FAFAFA，v1-v3 为白），逐页读取
      const roundRectPath = (cx, x, y, w, h, r) => {
        const rr = Math.max(0, Math.min(r, w / 2, h / 2));
        cx.beginPath();
        cx.moveTo(x + rr, y);
        cx.arcTo(x + w, y, x + w, y + h, rr);
        cx.arcTo(x + w, y + h, x, y + h, rr);
        cx.arcTo(x, y + h, x, y, rr);
        cx.arcTo(x, y, x + w, y, rr);
        cx.closePath();
      };
      const coverCropJpeg = (src, tw, th, radius, bg) => new Promise((resolve) => {
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(tw));
          c.height = Math.max(1, Math.round(th));
          const cx = c.getContext("2d");
          cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
          // 先用页面背景铺底（JPEG 无 alpha，圆角外露处显示为纸张色）
          cx.fillStyle = bg || "#ffffff";
          cx.fillRect(0, 0, c.width, c.height);
          // 圆角裁切
          if (radius > 0) { roundRectPath(cx, 0, 0, c.width, c.height, radius); cx.clip(); }
          const ir = im.width / im.height, cr = c.width / c.height;
          let dw, dh, dx, dy;
          if (ir > cr) { dh = c.height; dw = dh * ir; dx = (c.width - dw) / 2; dy = 0; }
          else { dw = c.width; dh = dw / ir; dx = 0; dy = (c.height - dh) / 2; }
          cx.drawImage(im, dx, dy, dw, dh);
          resolve(c.toDataURL("image/jpeg", 0.92));
        };
        im.onerror = () => resolve(null);
        im.src = src;
      });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await window.html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        // 用 JPEG（q0.85）替代 PNG：整页几乎纯白+文字，PNG 无损会让 PDF 膨胀到 10MB+，
        // JPEG + 流压缩后通常仅数百 KB，文字依旧清晰。
        const img = canvas.toDataURL("image/jpeg", 0.85);
        if (i > 0) pdf.addPage([W, H]);
        pdf.addImage(img, "JPEG", 0, 0, W, H);

        // 高清头像叠加
        const av = pages[i].querySelector(".r-avatar");
        if (av && data.avatar) {
          const pr = pages[i].getBoundingClientRect();
          const ar = av.getBoundingClientRect();
          const sx = W / pr.width;
          const x = (ar.left - pr.left) * sx;
          const y = (ar.top - pr.top) * sx;
          const w = ar.width * sx;
          const h = ar.height * sx;
          const pageBg = getComputedStyle(pages[i]).backgroundColor || "#ffffff";
          const hi = await coverCropJpeg(data.avatar, w * 4, h * 4, AV_RADIUS * 4 * sx, pageBg); // 4× 超采样 + 圆角
          if (hi) pdf.addImage(hi, "JPEG", x, y, w, h);
        }
      }
      pdf.save(`${getResumePdfFileName(data)}.pdf`);
      onToast && onToast("已导出 PDF");
    } catch (e) {
      console.error(e);
      onToast && onToast("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="editor-surface flex flex-col h-full min-h-0 text-[var(--text)]">
      {/* 顶栏 */}
      <div className="editor-header flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setRenameOpen(true)} className="flex items-center gap-2 text-[15px] text-[var(--text)] hover:opacity-80 group shrink-0" title="点击修改简历项目名称">
            <span style={{ fontWeight: 600 }}>{data.resumeName}</span>
            <Icon name="Pencil" size={15} className="text-[var(--text-dim)] group-hover:text-[var(--text)]" />
          </button>
          <span
            className={`flex items-center gap-1 text-[12px] truncate ${
              saveStatus === "error" ? "text-red-400" : "text-[var(--text-dim)]"
            }`}
            title={saveStatus === "error" ? "本地保存失败，请先导出 JSON 备份" : "当前内容会自动保存在浏览器中"}
          >
            <Icon
              name={saveStatus === "saving" ? "LoaderCircle" : saveStatus === "error" ? "CircleAlert" : "Check"}
              size={12}
              className={saveStatus === "saving" ? "animate-spin" : saveStatus === "saved" ? "text-[var(--accent-text)]" : ""}
            />
            {saveStatus === "saving"
              ? "保存中…"
              : saveStatus === "error"
                ? "保存失败"
                : savedAt
                  ? `于 ${fmtSavedAt(savedAt)} 更新`
                  : "已保存"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setThemeOpen(true)} className="toolbar-button flex items-center justify-center gap-1.5 text-[13px] px-3 py-1.5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <span className="theme-dot" /> 主题
          </button>
          <button onClick={() => setDataOpen(true)} className="toolbar-button flex items-center justify-center gap-1.5 text-[13px] px-3 py-1.5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
            <Icon name="Database" size={14} /> 数据
          </button>
          <button onClick={requestDownload} disabled={exporting} className="primary-button flex items-center justify-center gap-1.5 text-[13px] px-8 py-1.5 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: "var(--accent)", color: "var(--on-accent)", fontWeight: 600, minWidth: 110 }}>
            {exporting ? <Icon name="LoaderCircle" size={14} className="animate-spin" /> : null}
            {exporting ? "导出中…" : "下载"}
          </button>
        </div>
      </div>

      <div className="editor-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <>
            {/* 个人信息 */}
            <SectionCard title="个人信息" variant="personal" icon="UserRound" titleSize="17px">
              <div className="flex gap-4">
                <div className="flex-1 grid grid-cols-2 gap-2.5">
                  <div><FieldLabel required>姓名</FieldLabel><DarkInput value={data.personal.name} onChange={(v) => patchPersonal({"name": v})} /></div>
                  <div><FieldLabel>手机号</FieldLabel><DarkInput value={fmtPhone(data.personal.phone)} onChange={(v) => patchPersonal({"phone": v.replace(/\D/g, "")})} /></div>
                  <div><FieldLabel>邮箱</FieldLabel><DarkInput value={data.personal.email} onChange={(v) => patchPersonal({"email": v})} /></div>
                  <div><FieldLabel>意向岗位</FieldLabel><DarkInput value={data.personal.intent} onChange={(v) => patchPersonal({"intent": v})} /></div>
                  <div className="col-span-2"><FieldLabel>关键词</FieldLabel><DarkInput value={data.personal.keywords} onChange={(v) => patchPersonal({"keywords": v})} /></div>
                </div>
                <AvatarUploader url={data.avatar} onChange={(v) => patch({"avatar": v})} />
              </div>
            </SectionCard>

            {/* 个人优势 */}
            <SectionCard title="个人优势" variant="advantages" icon="Sparkles" titleSize="17px">
              <RichEditor rows={5} value={data.advantages} onChange={(v) => patch({"advantages": v})} placeholder="使用上方序号按钮逐条描述个人优势" />
            </SectionCard>

            {/* 工作经历：统一大卡片 */}
            <SectionCard
              title="工作经历"
              icon="Briefcase"
              titleSize="17px"
              right={<span className="text-[12px] text-[var(--text-dim)]" style={{"fontWeight": 400}}>{data.companies.length} 家公司 · {data.companies.reduce((s, c) => s + c.projects.length, 0)} 个项目</span>}
            >
              <div className="space-y-3">
                {data.companies.map((c, ci) => {
                  const cKey = "company-" + c.id;
                  const cCollapsed = collapsed[cKey];
                  return (
                    <div key={c.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <button onClick={() => toggleCollapsed(cKey)} className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--bar)] border-b border-[var(--border)] hover:bg-[var(--field)] transition-colors">
                        <div className="flex items-center gap-2 text-[14px] text-[var(--text)]" style={{"fontWeight": 600}}>
                          <Icon name="Building2" size={15} className="text-[var(--accent-text)]" />
                          {c.name || "未输入公司"}
                          <span className="text-[12px] text-[var(--text-dim)]" style={{"fontWeight": 400}}>· {c.projects.length} 个项目</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {data.companies.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); askRemoveCompany(c, ci); }} className="text-[var(--text-dim)] hover:text-red-400 transition-colors" title="删除该公司">
                              <Icon name="Trash2" size={14} />
                            </button>
                          )}
                          <Icon name={cCollapsed ? "ChevronRight" : "ChevronDown"} size={16} className="text-[var(--text-dim)]" />
                        </div>
                      </button>
                      {!cCollapsed && (
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-4 gap-2.5">
                            <div className="col-span-2">
                              <FieldLabel required>公司名称</FieldLabel>
                              <DarkInput value={c.name} onChange={(v) => patchCompany(c.id, {"name": v})} />
                            </div>
                            <div>
                              <FieldLabel>开始时间</FieldLabel>
                              <DateField value={c.start} onChange={(v) => patchCompany(c.id, {"start": v})} placeholder="开始时间" />
                            </div>
                            <div>
                              <FieldLabel>结束时间</FieldLabel>
                              <DateField value={c.end} onChange={(v) => patchCompany(c.id, {"end": v})} placeholder="结束时间" />
                            </div>
                          </div>
                          <div className="pl-3 border-l-2 border-[var(--accent-line)] space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)]">
                              <Icon name="FolderKanban" size={13} className="text-[var(--text-dim)]" />
                              项目库
                            </div>
                            {c.projects.map((p, pi) => {
                              const pKey = "project-" + p.id;
                              const pCollapsed = collapsed[pKey];
                              return (
                                <div key={p.id} className="border border-[var(--border)] bg-[var(--panel-2)] rounded-md overflow-hidden">
                                  <button onClick={() => toggleCollapsed(pKey)} className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bar)] border-b border-[var(--border)] hover:bg-[var(--field)] transition-colors">
                                    <div className="flex items-center gap-2 text-[12.5px] text-[var(--text)]" style={{"fontWeight": 600}}>
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--accent-soft)] text-[var(--accent-text)] text-[11px]">{pi + 1}</span>
                                      {p.name || "未命名项目"}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {c.projects.length > 1 && (
                                        <button onClick={(e) => { e.stopPropagation(); askRemoveProject(c, p.id); }} className="text-[var(--text-dim)] hover:text-red-400 transition-colors" title="删除项目">
                                          <Icon name="Trash2" size={14} />
                                        </button>
                                      )}
                                      <Icon name={pCollapsed ? "ChevronRight" : "ChevronDown"} size={14} className="text-[var(--text-dim)]" />
                                    </div>
                                  </button>
                                  {!pCollapsed && (
                                    <div className="p-3 space-y-2.5">
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <div><FieldLabel>项目名称</FieldLabel><DarkInput value={p.name} onChange={(v) => patchProject(c.id, p.id, {"name": v})} /></div>
                                        <div><FieldLabel>职责</FieldLabel><DarkInput value={p.role} onChange={(v) => patchProject(c.id, p.id, {"role": v})} /></div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2.5">
                                        <div><FieldLabel>开始时间</FieldLabel><DateField value={p.start} onChange={(v) => patchProject(c.id, p.id, {"start": v})} placeholder="开始时间" /></div>
                                        <div><FieldLabel>结束时间</FieldLabel><DateField value={p.end} onChange={(v) => patchProject(c.id, p.id, {"end": v})} placeholder="结束时间" /></div>
                                      </div>
                                      <div><FieldLabel>总结</FieldLabel><RichEditor rows={4} value={p.summary} onChange={(v) => patchProject(c.id, p.id, {"summary": v})} placeholder="项目总结" /></div>
                                      <div><FieldLabel>重点项目</FieldLabel><RichEditor rows={6} value={p.keyPoints} onChange={(v) => patchProject(c.id, p.id, {"keyPoints": v})} placeholder="使用上方序号按钮添加要点" /></div>
                                      <div><FieldLabel>主要荣誉</FieldLabel><RichEditor rows={3} value={p.honors} onChange={(v) => patchProject(c.id, p.id, {"honors": v})} placeholder="获奖 / 给项等" /></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <AddButton onClick={() => addProject(c.id)}>添加项目</AddButton>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <AddButton solid onClick={addCompany}>增加新的工作经历（公司）</AddButton>
              </div>
            </SectionCard>

            {/* 教育经历 */}
            <SectionCard title="教育经历" icon="GraduationCap" titleSize="17px">
              <div className="space-y-3">
                {data.education.map((e, ei) => {
                  const eKey = "education-" + e.id;
                  const eCollapsed = collapsed[eKey];
                  return (
                    <div key={e.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      <button onClick={() => toggleCollapsed(eKey)} className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--bar)] border-b border-[var(--border)] hover:bg-[var(--field)] transition-colors">
                        <div className="flex items-center gap-2 text-[14px] text-[var(--text)]" style={{"fontWeight": 600}}>
                          {e.school || "未输入学校"}
                          {e.degree && <span className="text-[12px] text-[var(--text-dim)]" style={{"fontWeight": 400}}>· {e.degree}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {data.education.length > 1 && (
                            <button onClick={(ev) => { ev.stopPropagation(); removeEducation(e.id); }} className="text-[var(--text-dim)] hover:text-red-400 transition-colors" title="删除">
                              <Icon name="Trash2" size={14} />
                            </button>
                          )}
                          <Icon name={eCollapsed ? "ChevronRight" : "ChevronDown"} size={16} className="text-[var(--text-dim)]" />
                        </div>
                      </button>
                      {!eCollapsed && (
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                            <div><FieldLabel>学校</FieldLabel><DarkInput value={e.school} onChange={(v) => patchEducation(e.id, {"school": v})} /></div>
                            <div><FieldLabel>学历</FieldLabel><DarkSelect value={e.degree} onChange={(v) => patchEducation(e.id, {"degree": v})} /></div>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            <div><FieldLabel>专业</FieldLabel><DarkInput value={e.major} onChange={(v) => patchEducation(e.id, {"major": v})} /></div>
                            <div><FieldLabel>开始时间</FieldLabel><DateField value={e.start} onChange={(v) => patchEducation(e.id, {"start": v})} placeholder="开始时间" /></div>
                            <div><FieldLabel>结束时间</FieldLabel><DateField value={e.end} onChange={(v) => patchEducation(e.id, {"end": v})} placeholder="结束时间" /></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <AddButton onClick={addEducation}>增加新的教育经历</AddButton>
              </div>
            </SectionCard>
          </>
      </div>

      <RenameModal open={renameOpen} initial={data.resumeName} onClose={() => setRenameOpen(false)} onConfirm={(n) => patch({ resumeName: n })} />
      <ThemeModal
        open={themeOpen}
        themes={themes}
        preference={themePreference}
        localThemeMode={localThemeMode}
        onChange={(value) => {
          onThemeChange(value);
          const modeLabel = value.mode === "auto"
            ? `自动模式（当前${localThemeMode === "light" ? "浅色" : "深色"}）`
            : value.mode === "light" ? "浅色模式" : "深色模式";
          onToast && onToast(`已切换为${value.palette} · ${modeLabel}`);
        }}
        onClose={() => setThemeOpen(false)}
      />
      <DataManagerModal
        open={dataOpen}
        history={history}
        onClose={() => setDataOpen(false)}
        onExport={handleDataExport}
        onImportFile={handleDataImport}
        onRestore={askRestoreSnapshot}
        onReset={askResetData}
      />
      <ExportCheckModal
        open={!!exportCheck}
        issues={exportCheck || []}
        onClose={() => setExportCheck(null)}
        onConfirm={handleDownload}
      />
      <ConfirmDialog
        open={!!confirm}
        title={confirm && confirm.title}
        message={confirm && confirm.message}
        confirmText={confirm && confirm.confirmText}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {confirm.onConfirm();setConfirm(null);}} />
    </div>);

}

window.EditorPanel = EditorPanel;
