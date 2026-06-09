/* =========================================================================
   settings.jsx — AI 配置面板（Provider / Model / API Key / baseURL）
   ========================================================================= */

function SettingsPanel({ onClose }) {
  const [config, setConfig] = React.useState(() => {
    try {
      const raw = localStorage.getItem("llm_config");
      return raw ? JSON.parse(raw) : { provider: "openai", model: "", apiKey: "", baseURL: "" };
    } catch (_) {
      return { provider: "openai", model: "", apiKey: "", baseURL: "" };
    }
  });
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);

  const provider = window.PROVIDERS[config.provider] || window.PROVIDERS.openai;
  const availableModels = provider.models || [];

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    const newProviderCfg = window.PROVIDERS[newProvider];
    setConfig((prev) => ({
      ...prev,
      provider: newProvider,
      model: newProviderCfg?.models?.[0] || "",
    }));
    setTestResult(null);
  };

  const handleSave = () => {
    localStorage.setItem("llm_config", JSON.stringify(config));
    onClose && onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMsg("");
    try {
      const result = await window.testConnection(config);
      const isOk = result && result.trim().toLowerCase().includes("ok");
      setTestResult(isOk ? "ok" : "error");
      if (!isOk) setErrorMsg("连接成功但返回结果异常，请检查 API Key 是否有效");
    } catch (err) {
      setTestResult("error");
      setErrorMsg(err.message || "连接失败");
    } finally {
      setTesting(false);
    }
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-2)",
    background: "var(--field)",
    color: "var(--text)",
    fontSize: "13.5px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12.5px",
    color: "var(--text-dim)",
    marginBottom: "6px",
  };

  const btnPrimary = {
    padding: "6px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#fff",
    background: "var(--primary)",
    border: "none",
    cursor: "pointer",
    opacity: testing || !config.apiKey ? 0.5 : 1,
    pointerEvents: testing || !config.apiKey ? "none" : "auto",
  };

  const btnGhost = {
    padding: "6px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "var(--text-dim)",
    background: "transparent",
    border: "1px solid var(--border-2)",
    cursor: "pointer",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 70,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)",
    }} onMouseDown={onClose}>
      <div style={{
        width: 480, maxHeight: "85vh", overflowY: "auto",
        borderRadius: 16,
        background: "var(--panel)",
        border: "1px solid var(--border-2)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
      }} onMouseDown={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="Settings" size={18} />
            <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>AI 配置</span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, border: "none", background: "transparent",
            color: "var(--text-dim)", cursor: "pointer",
          }}>
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Provider */}
          <label style={{ display: "block" }}>
            <div style={labelStyle}>Provider</div>
            <select value={config.provider} onChange={handleProviderChange} style={{ ...inputStyle }}>
              {Object.entries(window.PROVIDERS || {}).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </label>

          {/* Model */}
          <label style={{ display: "block" }}>
            <div style={labelStyle}>Model</div>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
              placeholder={provider.modelHint || availableModels[0] || "请输入模型名称"}
              list="llm-model-options"
              style={inputStyle}
            />
            <datalist id="llm-model-options">
              {availableModels.map((m) => <option key={m} value={m} />)}
            </datalist>
            <div style={{ marginTop: 6, color: "var(--faint)", fontSize: 11.5 }}>
              可直接填写接口支持的新模型名称，无需等待应用更新。
            </div>
          </label>

          {/* API Key */}
          <label style={{ display: "block" }}>
            <div style={labelStyle}>API Key</div>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                style={{ ...inputStyle, paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowKey((v) => !v)} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                padding: 4, border: "none", background: "transparent",
                color: "var(--text-dim)", cursor: "pointer",
              }}>
                <Icon name={showKey ? "EyeOff" : "Eye"} size={15} />
              </button>
            </div>
          </label>

          {/* Base URL */}
          <label style={{ display: "block" }}>
            <div style={labelStyle}>Base URL <span style={{ color: "var(--faint)" }}>（留空使用默认值）</span></div>
            <input
              type="text"
              value={config.baseURL}
              onChange={(e) => setConfig((prev) => ({ ...prev, baseURL: e.target.value }))}
              placeholder={provider.baseURL}
              style={inputStyle}
            />
          </label>

          {/* Test Connection */}
          <div>
            <button onClick={handleTest} style={btnPrimary}>
              {testing ? "测试中..." : "测试连接"}
            </button>
            {testResult === "ok" && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#22c55e" }}>
                <Icon name="CheckCircle" size={14} /> 连接成功
              </div>
            )}
            {testResult === "error" && errorMsg && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#f87171", lineHeight: 1.6 }}>{errorMsg}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "16px 24px",
          borderTop: "1px solid var(--border-2)",
        }}>
          <button onClick={onClose} style={btnGhost}>取消</button>
          <button onClick={handleSave} style={{
            ...btnPrimary,
            opacity: 1, pointerEvents: "auto",
          }}>保存配置</button>
        </div>
      </div>
    </div>
  );
}

window.SettingsPanel = SettingsPanel;
