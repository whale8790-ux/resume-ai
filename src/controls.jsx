/* =========================================================================
   controls.jsx — 复用控件
   · ConfirmDialog  二次确认弹窗（删除公司/项目）
   · RichEditor     富文本编辑器（加粗 / 下划线 / 数字序号 / 无序序号，真实生效）
   · DateField      年月选择器（参考交互：年份切换 + 月份网格 + 清除）
   ========================================================================= */

/* ----------------------------- 二次确认弹窗 ----------------------------- */

/* 手机号 3-4-4 格式化（11 位适用，不足则原样返回） */
function fmtPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7, 11);
  }
  return phone;
}
function ConfirmDialog({ open, title, message, confirmText = "删除", onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onMouseDown={onCancel}>
      <div className="w-[400px] rounded-2xl bg-[var(--panel)] border border-[var(--border-2)] p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <span className="shrink-0 w-9 h-9 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
            <Icon name="TriangleAlert" size={18} />
          </span>
          <div>
            <div className="text-[15px] text-[var(--text)] mb-1" style={{ fontWeight: 600 }}>{title}</div>
            <div className="text-[12.5px] text-[var(--text-dim)] leading-relaxed">{message}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <button onClick={onCancel} className="px-4 py-1.5 rounded-md text-[13px] text-[var(--text-dim)] border border-[var(--border-2)] hover:bg-[var(--field)] transition-colors">取消</button>
          <button onClick={onConfirm} className="px-4 py-1.5 rounded-md text-[13px] text-white bg-red-600 hover:bg-red-500 active:bg-red-700 transition-colors" style={{ fontWeight: 500 }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
window.ConfirmDialog = ConfirmDialog;

/* ------------------------------- 富文本 ------------------------------- */
const RT_TOOLS = [
  { cmd: "bold", icon: "Bold", title: "加粗", key: "bold" },
  { cmd: "underline", icon: "Underline", title: "下划线", key: "underline" },
  { cmd: "insertOrderedList", icon: "ListOrdered", title: "数字序号", key: "ol" },
  { cmd: "insertUnorderedList", icon: "List", title: "无序序号", key: "ul" },
];

function RichEditor({ value, onChange, rows = 5, max = 800, placeholder = "" }) {
  const ref = React.useRef(null);
  const [active, setActive] = React.useState({});
  const [count, setCount] = React.useState(0);

  // 初始化 / 外部值变化时同步（编辑器获得焦点时不覆盖，避免光标跳动）
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = value || "";
    if (document.activeElement !== el && el.innerHTML !== incoming) {
      el.innerHTML = incoming;
    }
    setCount(el.textContent.length);
  }, [value]);

  const refreshState = () => {
    try {
      setActive({
        bold: document.queryCommandState("bold"),
        underline: document.queryCommandState("underline"),
        ol: document.queryCommandState("insertOrderedList"),
        ul: document.queryCommandState("insertUnorderedList"),
      });
    } catch (e) {}
  };

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    onChange(el.innerHTML);
    setCount(el.textContent.length);
    refreshState();
  };

  const runCmd = (cmd) => (e) => {
    e.preventDefault();
    ref.current.focus();
    document.execCommand(cmd, false, null);
    emit();
  };

  const over = count > max;

  return (
    <div>
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[var(--panel-2)] border border-[var(--border)] border-b-0 rounded-t-md text-[var(--text-dim)]">
        {RT_TOOLS.map((t) => (
          <button
            key={t.cmd}
            title={t.title}
            onMouseDown={runCmd(t.cmd)}
            className={`p-1.5 rounded transition-colors ${active[t.key] ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "hover:bg-[var(--border)]"}`}
          >
            <Icon name={t.icon} size={17} strokeWidth={2.25} />
          </button>
        ))}
        <div className="flex-1" />
        <span className={`text-[11px] ${over ? "text-red-400" : "text-[var(--faint)]"}`}>{count} / {max}</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onKeyUp={refreshState}
        onMouseUp={refreshState}
        onFocus={refreshState}
        className="rt-edit w-full bg-[var(--panel-2)] border-x border-b border-[var(--border)] rounded-b-md px-3 py-2 text-[var(--text)] focus:outline-none"
        style={{ minHeight: rows * 22, fontSize: "12.5px", lineHeight: 1.625 }}
      />
    </div>
  );
}
window.RichEditor = RichEditor;

/* ----------------------------- 年月选择器 ----------------------------- */
const MONTHS_CN = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

function DateField({ value, onChange, placeholder = "选择时间" }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const wrapRef = React.useRef(null);

  const m = (value || "").match(/(\d{4})\D+(\d{1,2})/);
  const isNow = value === "至今";
  const selYear = m ? +m[1] : null;
  const selMonth = m ? +m[2] : null;
  const [viewYear, setViewYear] = React.useState(selYear || new Date().getFullYear());

  const openPicker = () => {
    const r = wrapRef.current.getBoundingClientRect();
    const EST = 300;        // 面板估算高度
    const margin = 8;
    const width = Math.max(r.width, 320);
    // 垂直：默认在下方，下方空间不足则翻转到上方，再不行则贴边钳制
    let top = r.bottom + 6;
    if (top + EST > window.innerHeight - margin) {
      const above = r.top - 6 - EST;
      top = above >= margin ? above : Math.max(margin, window.innerHeight - margin - EST);
    }
    // 水平：避免超出右/左边界
    let left = r.left;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
    if (left < margin) left = margin;
    setPos({ left, top, width });
    setViewYear(selYear || new Date().getFullYear());
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const pick = (idx) => {
    onChange(`${viewYear}-${String(idx + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  const popover = open && pos
    ? ReactDOM.createPortal(
        <div className="fixed inset-0 z-[55]" onMouseDown={() => setOpen(false)}>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{ ...(window.__themeVars || {}), position: "fixed", left: pos.left, top: pos.top, width: pos.width, maxHeight: window.innerHeight - 16, overflowY: "auto" }}
            className="rounded-xl bg-[var(--panel)] border border-[var(--border-2)] shadow-2xl p-3"
          >
            {/* 年份导航 */}
            <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-[var(--border)]">
              <button onMouseDown={(e) => { e.preventDefault(); setViewYear((y) => y - 1); }} className="p-1.5 rounded hover:bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"><Icon name="ChevronsLeft" size={16} /></button>
              <div className="text-[14px] text-[var(--text)]" style={{ fontWeight: 600 }}>{viewYear} 年</div>
              <button onMouseDown={(e) => { e.preventDefault(); setViewYear((y) => y + 1); }} className="p-1.5 rounded hover:bg-[var(--field)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"><Icon name="ChevronsRight" size={16} /></button>
            </div>
            {/* 月份网格 */}
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS_CN.map((label, idx) => {
                const isSel = selYear === viewYear && selMonth === idx + 1;
                return (
                  <button
                    key={idx}
                    onMouseDown={(e) => { e.preventDefault(); pick(idx); }}
                    className={`py-2 rounded-md text-[13px] transition-colors ${
                      isSel ? "bg-[var(--accent-soft)] text-[var(--accent-text)]" : "text-[var(--text)] hover:bg-[var(--field)]"
                    }`}
                    style={isSel ? { fontWeight: 600 } : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* 快捷操作 */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--border)]">
              <button onMouseDown={(e) => { e.preventDefault(); onChange("至今"); setOpen(false); }} className="text-[12px] text-[var(--accent-text)] hover:opacity-80 px-1">设为「至今」</button>
              <button onMouseDown={(e) => { e.preventDefault(); onChange(""); setOpen(false); }} className="text-[12px] text-[var(--text-dim)] hover:text-red-400 px-1">清除</button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const hasVal = !!value;
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={openPicker}
        className={`w-full bg-[var(--field)] border rounded-md px-3 py-1.5 pr-8 text-[13px] text-left flex items-center transition-colors ${
          open ? "border-[var(--accent)]" : "border-[var(--border-2)]"
        } ${hasVal ? "text-[var(--text)]" : "text-[var(--faint)]"}`}
      >
        {hasVal ? (isNow ? "至今" : value) : placeholder}
      </button>
      {hasVal ? (
        <button
          type="button"
          title="清除"
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--faint)] hover:text-[var(--text)] transition-colors"
        >
          <Icon name="CircleX" size={15} />
        </button>
      ) : (
        <Icon name="Calendar" size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--faint)] pointer-events-none" />
      )}
      {popover}
    </div>
  );
}
window.DateField = DateField;
