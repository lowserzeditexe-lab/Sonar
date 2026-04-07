import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, FileCode, Server, Package } from "lucide-react";

// ── Syntax Highlighter ────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJS(code) {
  if (!code) return [];
  return code.split("\n").map((line, idx) => {
    let h = escapeHtml(line);
    h = h.replace(/(\/\/[^\n]*)$/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    h = h.replace(/(#[^\n]*)$/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    h = h.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)/g, '<span style="color:#a3e635">$1</span>');
    h = h.replace(/\b(import|export|default|from|const|let|var|function|return|if|else|for|of|in|class|extends|new|this|async|await|try|catch|throw|useState|useEffect|useRef|useCallback|useMemo)\b/g,
      '<span style="color:#c084fc">$1</span>');
    h = h.replace(/&lt;(\/?[A-Z][A-Za-z0-9]*)/g, '&lt;<span style="color:#60a5fa">$1</span>');
    h = h.replace(/&lt;(\/?[a-z][a-z0-9-]*)/g, '&lt;<span style="color:#f87171">$1</span>');
    h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#fb923c">$1</span>');
    return { idx, content: h };
  });
}

function highlightPython(code) {
  if (!code) return [];
  return code.split("\n").map((line, idx) => {
    let h = escapeHtml(line);
    h = h.replace(/(#[^\n]*)$/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    h = h.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?""")/g, '<span style="color:#a3e635">$1</span>');
    h = h.replace(/\b(from|import|def|class|return|if|elif|else|for|while|in|not|and|or|True|False|None|async|await|try|except|finally|with|as|pass|raise)\b/g,
      '<span style="color:#c084fc">$1</span>');
    h = h.replace(/\b(FastAPI|APIRouter|BaseModel|Optional|List|Dict|HTTPException|Depends|Request|Response)\b/g,
      '<span style="color:#60a5fa">$1</span>');
    h = h.replace(/(@[a-zA-Z_.]+)/g, '<span style="color:#f59e0b">$1</span>');
    h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#fb923c">$1</span>');
    return { idx, content: h };
  });
}

function highlightPlain(code) {
  if (!code) return [];
  return code.split("\n").map((line, idx) => {
    let h = escapeHtml(line);
    h = h.replace(/(#[^\n]*)$/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    h = h.replace(/\b(fastapi|uvicorn|pydantic|react|axios|tailwindcss)\b/g, '<span style="color:#60a5fa">$1</span>');
    return { idx, content: h };
  });
}

// ── CodeBlock ─────────────────────────────────────────────────────────────────
function CodeBlock({ code, language = "js", isStreaming = false }) {
  const codeRef = useRef(null);
  const highlight = language === "python" ? highlightPython : language === "plain" ? highlightPlain : highlightJS;
  const lines = highlight(code || "");

  useEffect(() => {
    if (isStreaming && codeRef.current) {
      codeRef.current.scrollTo({ top: codeRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [code, isStreaming]);

  if (!code) return (
    <div ref={codeRef} className="flex-1 flex items-center justify-center"
      style={{ background: "#0d1117", color: "rgba(100,116,139,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
      {isStreaming ? (
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <span style={{ color: "#06b6d4" }}>▋</span>
          </motion.div>
          <span>Generating code...</span>
        </div>
      ) : (
        <span>No code yet</span>
      )}
    </div>
  );

  return (
    <div ref={codeRef} className="flex-1 overflow-auto" style={{ background: "#0d1117" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
        <tbody>
          {lines.map(({ idx, content }) => (
            <tr key={idx} style={{ lineHeight: "1.7" }}>
              <td style={{
                width: "48px", minWidth: "48px", textAlign: "right", paddingRight: "16px",
                paddingLeft: "12px", color: "rgba(100,116,139,0.4)", userSelect: "none",
                borderRight: "1px solid rgba(255,255,255,0.04)", fontSize: "11px",
              }}>
                {idx + 1}
              </td>
              <td style={{ paddingLeft: "16px", paddingRight: "20px", color: "#e6edf3", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ __html: content }} />
            </tr>
          ))}
          {isStreaming && (
            <tr>
              <td style={{ width: "48px", borderRight: "1px solid rgba(255,255,255,0.04)" }} />
              <td style={{ paddingLeft: "16px" }}>
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                  style={{ color: "#06b6d4", fontFamily: "'JetBrains Mono', monospace" }}>▋</motion.span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── File Tabs Config ──────────────────────────────────────────────────────────
const FILE_TABS = [
  { id: "frontend", label: "App.jsx", icon: FileCode, language: "js", color: "#61dafb" },
  { id: "backend", label: "main.py", icon: Server, language: "python", color: "#3b82f6" },
  { id: "requirements", label: "requirements.txt", icon: Package, language: "plain", color: "#a3e635" },
];

// ── Main CodeEditor ───────────────────────────────────────────────────────────
export default function CodeEditor({ code, backendCode, requirementsCode, isGenerating, isCoderActive }) {
  const [activeTab, setActiveTab] = useState("frontend");
  const [copied, setCopied] = useState(false);

  // Auto-switch to backend tab when it starts receiving content
  useEffect(() => {
    if (backendCode && backendCode.length > 10 && !isGenerating) {
      // Stay on frontend by default, let user switch
    }
  }, [backendCode, isGenerating]);

  // Current code based on tab
  const currentContent = activeTab === "frontend" ? (code || "")
    : activeTab === "backend" ? (backendCode || "")
    : (requirementsCode || "");

  const currentTab = FILE_TABS.find(t => t.id === activeTab);
  const lineCount = (currentContent || "").split("\n").length;

  const handleCopy = () => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Show tab only if it has content OR is currently active
  const visibleTabs = FILE_TABS.filter(t =>
    t.id === "frontend" ||
    (t.id === "backend" && (backendCode || isGenerating)) ||
    (t.id === "requirements" && (requirementsCode || (!isGenerating && backendCode)))
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d1117", borderRadius: "0 0 8px 8px" }}>
      {/* Header with file tabs */}
      <div className="flex items-center justify-between flex-shrink-0"
        style={{ background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 12px", minHeight: "38px" }}>

        {/* File tabs */}
        <div className="flex items-center gap-0">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasContent = tab.id === "frontend" ? !!code : tab.id === "backend" ? !!backendCode : !!requirementsCode;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs transition-all relative"
                style={{
                  color: isActive ? "#e6edf3" : "rgba(100,116,139,0.65)",
                  background: isActive ? "#0d1117" : "transparent",
                  borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  cursor: "pointer",
                }}>
                <Icon style={{ width: 11, height: 11, color: isActive ? tab.color : "inherit", flexShrink: 0 }} />
                {tab.label}
                {hasContent && !isActive && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: tab.color, opacity: 0.7, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "10px", color: "rgba(100,116,139,0.45)", fontFamily: "'JetBrains Mono', monospace" }}>
            {lineCount} lines
          </span>
          <button onClick={handleCopy} disabled={!currentContent}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: copied ? "#4ade80" : "rgba(100,116,139,0.7)", cursor: currentContent ? "pointer" : "not-allowed",
            }}>
            {copied ? <Check style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }} className="flex-1 overflow-hidden flex flex-col">
          <CodeBlock
            code={currentContent}
            language={currentTab?.language || "js"}
            isStreaming={isGenerating && (activeTab === "frontend" || (activeTab === "backend" && !!isCoderActive))}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
