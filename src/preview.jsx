/* =========================================================================
   ResumePreview — 右侧实时预览（A4 纸张 + 自动分页）+ 顶部「排版」工具条
   排版采用统一变量与语义类（见 index.html 的 .resume-page / .r-* / .sp-* 规则）：
     · --r-body   正文字号(px)  ← 字号下拉 10–18，各级标题按固定倍率等比缩放
     · --r-extra  行距增量(px)=行距−正文字号 ← 行距下拉 16–23（正文绝对行高 px）
     · 页边距 pageMargin(mm)    ← 页边距下拉 5/10/15/20/25，纸张四周留白
   纵向间距全部基于 --r-body 派生（见 .sp-* 类），随字号联动、节奏统一。
   ========================================================================= */

const PAGE_WIDTH = 595;          // A4 @72dpi：595×842px（内容宽 531 + 边距 32×2）
const PAGE_HEIGHT = 842;
const PAGE_PADDING = 32;         // 四周边距（新版规范）
const PREVIEW_SCALE = 96 / 72;   // 浏览器按 96dpi 显示：约 794×1123px，接近屏幕 1:1 A4

/* 三套整体版式预设（对比：字号·行距·间距·标题色）。
   ⚠ 三版共用同一张纸（同尺寸同边距），切换时背景区域保持一致：
   v1 上一版：大字号·宽松行距·深色标题
   v2 新版：设计规范首版（紧凑 px·蓝色标题）
   v3 整理版：基于规范优化行高/节奏·加入分隔线结构 */
const STYLE_PRESETS = {
  v6: { cls: "style-v6",  w: 595, h: 842, pad: 30 }    // 唯一版式：白底黑字·边距 30
};
const STYLE_DESC = {
  v1: "v1：正文 12px·行高 19px·深色标题·宽松间距",
  v5: "v5：边距 30·姓名 22·信息 12·标题 15·公司 12·正文 10/16",
  v6: "v6：白底黑字·边距 30·姓名 25·标题 16·公司 13·岗位/正文 12·间距同 v5"
};

function SectionTitle({ children }) {
  return <div className="r-section sp-section">{children}</div>;
}

/* 单个「YYYY-MM」格式化为「YYYY.MM」；「至今」原样；空则空 */
function fmtMonth(v) {
  if (!v) return "";
  if (v === "至今" || v === "今") return "至今";
  const m = String(v).match(/(\d{4})\D+(\d{1,2})/);
  return m ? `${m[1]}.${m[2].padStart(2, "0")}` : v;
}
function fmtRange(start, end) {
  const a = fmtMonth(start);
  const b = fmtMonth(end);
  if (a && b) return `${a} - ${b}`;
  return a || b || "";
}

function EntryHeader({ left, right, sub, variant, subWeight }) {
  const company = variant === "company";
  const sw = subWeight != null ? subWeight : company ? 600 : 500;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className={company ? "r-company" : "r-entry"}>
        {left}
        {sub && <span className="ml-3" style={{ fontWeight: sw }}>{sub}</span>}
      </div>
      {right && <div className="r-date shrink-0">{right}</div>}
    </div>);

}

function htmlEmpty(html) {
  const t = (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return t === "";
}

function RichText({ html, style, className }) {
  return (
    <div
      className={"rt-content" + (className ? " " + className : "")}
      style={{ overflowWrap: "anywhere", wordBreak: "break-word", ...style }}
      dangerouslySetInnerHTML={{ __html: html || "" }} />);


}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitText(text, maxChars = 700) {
  const source = String(text || "").trim();
  if (!source) return [];
  const chunks = [];
  let rest = source;
  while (rest.length > maxChars) {
    const windowText = rest.slice(0, maxChars + 1);
    const candidates = [
      windowText.lastIndexOf("\n"),
      windowText.lastIndexOf("。"),
      windowText.lastIndexOf("；"),
      windowText.lastIndexOf("！"),
      windowText.lastIndexOf("？"),
      windowText.lastIndexOf("，"),
      windowText.lastIndexOf(" "),
    ];
    const splitAt = Math.max(...candidates);
    const end = splitAt > maxChars * 0.55 ? splitAt + 1 : maxChars;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

/* 正常内容保留原始富文本；异常超长的单段/单条降级为纯文本分块，确保每块可分页。 */
function splitRichHtml(html, maxChars = 700) {
  const container = document.createElement("div");
  container.innerHTML = html || "";
  const listItems = [...container.querySelectorAll("li")];
  if (listItems.length) {
    return listItems.flatMap((item, index) => {
      const text = item.textContent || "";
      const chunks = splitText(text, maxChars);
      const list = item.parentElement && item.parentElement.tagName === "OL" ? "ol" : "ul";
      if (chunks.length <= 1) {
        const start = list === "ol" ? ` start="${index + 1}"` : "";
        return [`<${list}${start}><li>${item.innerHTML}</li></${list}>`];
      }
      return chunks.map((chunk, chunkIndex) => {
        if (chunkIndex === 0) {
          const start = list === "ol" ? ` start="${index + 1}"` : "";
          return `<${list}${start}><li>${escapeHtml(chunk)}</li></${list}>`;
        }
        return `<p style="padding-left:11px">${escapeHtml(chunk)}</p>`;
      });
    });
  }

  const text = container.textContent || "";
  const chunks = splitText(text, maxChars);
  if (chunks.length <= 1) return htmlEmpty(html) ? [] : [html];
  return chunks.map((chunk) => `<p>${escapeHtml(chunk)}</p>`);
}

function PreviewHeader({ data }) {
  const p = data.personal;
  return (
    <div className="flex items-start justify-between gap-4 sp-header">
      <div className="flex-1 min-w-0">
        <h1 className="r-name">{p.name || "姓名"}</h1>
        <div className="r-contact" style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div><span>手机：</span><span>{fmtPhone(p.phone)}</span></div>
            <span>|</span>
            <div><span>邮箱：</span><span>{p.email}</span></div>
          </div>
          <div><span>关键词：</span><span>{p.keywords}</span></div>
          <div><span>求职意向：</span><span>{p.intent}</span></div>
        </div>
      </div>
      {data.avatar &&
      <div
        className="r-avatar shrink-0"
        role="img"
        aria-label="头像"
        style={{ backgroundImage: `url("${data.avatar}")` }} />
      }
    </div>);

}

/* 教育经历条目：支持新/旧两种版式
   旧版 old：学校名 与 「专业·学历」同行，时间右对齐
   新版 new：学校名单独一行；专业·学历 + 时间放于下方，字号与间距与正文相同 */
function EduView({ e, version }) {
  const major = [e.major, e.degree].filter(Boolean).join(" · ");
  const range = fmtRange(e.start, e.end);
  if (version === "new") {
    return (
      <>
        <EntryHeader left={e.school || "未输入学校"} right={range} variant="company" />
        {major && <div className="r-body sp-text">{major}</div>}
      </>);

  }
  return (
    <EntryHeader left={e.school || "未输入学校"} sub={major} right={range} variant="company" subWeight={400} />);

}

function ProjectView({ project }) {
  return (
    <div className="sp-project">
      <EntryHeader left={project.name} sub={project.role} right={fmtRange(project.start, project.end)} />
      {!htmlEmpty(project.summary) && <RichText html={project.summary} className="sp-summary rt-overview" />}
      {!htmlEmpty(project.keyPoints) &&
      <>
          <div className="r-label sp-label">重点项目</div>
          <RichText html={project.keyPoints} className="sp-text rt-items" />
        </>
      }
      {!htmlEmpty(project.honors) &&
      <>
          <div className="r-label sp-label">主要荣誉</div>
          <RichText html={project.honors} className="sp-text rt-items" />
        </>
      }
    </div>);

}

/* v6 专用：把一个项目拆成可独立分页的细粒度子块，
   使分页能填满页面而非因单个大项目整块换页留下大段空白。
   返回 [{node, keep}]；keep=true 表示不可留在页尾（标题/项目头须与下一块同页）。 */
function projectSubBlocks(project) {
  const out = [];
  const add = (node, keep) => out.push({ node, keep: !!keep });

  add(
    <div className="sp-project">
      <EntryHeader left={project.name} sub={project.role} right={fmtRange(project.start, project.end)} />
    </div>,
    true
  );

  if (!htmlEmpty(project.summary)) {
    splitRichHtml(project.summary).forEach((html, index) => {
      add(<RichText html={html} className={(index === 0 ? "sp-summary " : "") + "rt-overview"} />, false);
    });
  }

  const section = (label, html) => {
    if (htmlEmpty(html)) return;
    add(<div className="r-label sp-label">{label}</div>, true); // 小标题不可留页尾，须跟首条要点
    splitRichHtml(html).forEach((item, index) => {
      add(<RichText html={item} className={(index === 0 ? "sp-text " : "") + "rt-items"} />, false);
    });
  };
  section("重点项目", project.keyPoints);
  section("主要荣誉", project.honors);

  return out;
}

function ResumePreview({ data }) {
  const [version, setVersion] = React.useState("v6");  // 整体版式：v1 / v5 / v6
  const preset = STYLE_PRESETS[version];
  const PAGE_WIDTH = preset.w;
  const PAGE_HEIGHT = preset.h;
  const pad = preset.pad;
  const innerHeight = PAGE_HEIGHT - pad * 2;

  const { blocks, keepFlags } = React.useMemo(() => {
    const arr = [];
    const keep = [];          // keepWithNext：true = 不可作为页尾（须与下一块同页，避免标题/公司行被孤立）
    const push = (node, k) => { arr.push(node); keep.push(!!k); };

    push(<PreviewHeader data={data} />);

    push(<SectionTitle>个人优势</SectionTitle>, true);
    splitRichHtml(data.advantages).forEach((html, index) => {
      push(<RichText html={html} className={(index === 0 ? "sp-text " : "") + "rt-summary"} />, false);
    });

    data.companies.forEach((c, ci) => {
      if (ci === 0) push(<SectionTitle>工作经历</SectionTitle>, true);
      push(
        <div className={ci === 0 ? undefined : "sp-entry"}>
          <EntryHeader left={c.name || "未输入公司"} right={fmtRange(c.start, c.end)} variant="company" />
        </div>,
        true   // 公司行须与其下首个项目同页
      );
      c.projects.forEach((p) => {
        if (version === "v6") {
          // v6：拆分项目内部，允许逐条要点跨页填充，避免大段留白
          projectSubBlocks(p).forEach((b) => push(b.node, b.keep));
        } else {
          push(<ProjectView project={p} />, false);
        }
      });
    });

    data.education.forEach((e, ei) => {
      if (ei === 0) push(<SectionTitle>教育经历</SectionTitle>, true);
      push(
        <div className={ei === 0 ? undefined : "sp-edu"}>
          <EduView e={e} version="new" />
        </div>,
        false
      );
    });

    return { blocks: arr, keepFlags: keep };
  }, [data, version]);

  const measureRefs = React.useRef([]);
  const [heights, setHeights] = React.useState([]);

  React.useLayoutEffect(() => {
    const measure = () => {
      // 用 offsetTop 的累进差值测量每块「含块间外边距」的实际占位高度。
      // 注意：getBoundingClientRect().height 只含内容盒，不含 .sp-* 的 margin，
      //       页面有 padding 会阻止外边距合并 → 这些 margin 真实占位却没被计入，
      //       多段落累计可达上百 px，导致分页溢出、PDF 被裁切。改用 offsetTop 差值修正。
      const els = measureRefs.current;
      const tops = blocks.map((_, i) => (els[i] ? els[i].offsetTop : 0));
      const next = blocks.map((_, i) => {
        const el = els[i];
        if (!el) return 0;
        if (i < blocks.length - 1 && els[i + 1]) return tops[i + 1] - tops[i];
        // 末块：自身 offsetTop 到内容底部
        return el.offsetTop + el.offsetHeight - tops[i];
      });
      setHeights((prev) => {
        if (prev.length === next.length && prev.every((h, i) => Math.abs(h - next[i]) < 0.5)) return prev;
        return next;
      });
    };
    measureRefs.current.length = blocks.length;
    measure();
    const observers = [];
    measureRefs.current.forEach((el) => {
      if (!el) return;
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      observers.push(ro);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [blocks, pad, version]);

  const pages = React.useMemo(() => {
    if (heights.length !== blocks.length) return [blocks.map((_, i) => i)];
    const result = [];
    let current = [];
    let used = 0;
    blocks.forEach((_, i) => {
      const h = heights[i] || 0;
      if (current.length > 0 && used + h > innerHeight) {
        // 避免标题/公司行被孤立在页尾：把尾部 keepWithNext 的块一起带到下一页
        const carry = [];
        while (current.length > 1 && keepFlags[current[current.length - 1]]) {
          carry.unshift(current.pop());
        }
        result.push(current);
        current = carry;
        used = carry.reduce((s, idx) => s + (heights[idx] || 0), 0);
      }
      current.push(i);
      used += h;
    });
    if (current.length) result.push(current);
    return result;
  }, [heights, blocks, keepFlags, innerHeight]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="resume-canvas flex-1 min-h-0 bg-[var(--canvas)] overflow-y-auto relative scrollbar-thin">
        {/* 隐藏测量层（与真实页同宽、同边距、同排版变量，保证测高一致） */}
        <div
          aria-hidden
          className={"resume-page no-print absolute -left-[9999px] top-0 invisible pointer-events-none " + preset.cls}
          style={{ width: `${PAGE_WIDTH}px`, padding: `${pad}px` }}>
          
          {blocks.map((b, i) =>
          <div key={i} ref={(el) => {measureRefs.current[i] = el;}}>{b}</div>
          )}
        </div>

        {/* 渲染页面 */}
        <div
          className="resume-pages resume-pages-actual flex flex-col items-center"
          style={{
            "--preview-scale": PREVIEW_SCALE,
            "--preview-page-width": `${PAGE_WIDTH * PREVIEW_SCALE}px`,
          }}
        >
          {pages.map((indices, pageIdx) =>
            <div key={pageIdx} className="resume-page-stage">
              <div
                data-page-index={pageIdx + 1}
                className={"resume-page bg-white shadow-2xl rounded-sm relative " + preset.cls}
                style={{ width: `${PAGE_WIDTH}px`, height: `${PAGE_HEIGHT}px`, padding: `${pad}px` }}>
                
                {indices.map((i) => <div key={i}>{blocks[i]}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

}

window.ResumePreview = ResumePreview;
