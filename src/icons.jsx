// 基于 lucide UMD 的轻量图标组件，名称用 PascalCase（与 lucide.icons 键一致）
function Icon({ name, size = 16, className = "", strokeWidth = 2, style }) {
  const node = (window.lucide && window.lucide.icons && window.lucide.icons[name]) || [];
  return React.createElement(
    "svg",
    {
      className,
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style,
    },
    node.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))
  );
}

window.Icon = Icon;
