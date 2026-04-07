import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Circle, FileCode, ChevronRight, Copy, Check } from "lucide-react";

const FILE_TABS = ["App.tsx", "styles.css", "package.json", "README.md"];

// Simple syntax highlighter - escape HTML then highlight
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(code) {
  if (!code) return [];
  const lines = code.split("\n");
  return lines.map((line, idx) => {
    // Escape HTML entities first
    let h = escapeHtml(line);

    // Comments (must come first to prevent keyword matching inside)
    h = h.replace(/(\/\/[^\n]*)$/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
    // Strings
    h = h.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)/g, '<span style="color:#a3e635">$1</span>');
    // Keywords
    h = h.replace(/\b(import|export|default|from|const|let|var|function|return|if|else|for|of|in|class|extends|new|this|async|await|try|catch|throw|useState|useEffect|useRef|useCallback)\b/g,
      '<span style="color:#c084fc">$1</span>');
    // JSX tags (after html escaping, < becomes &lt;)
    h = h.replace(/&lt;(\/?[A-Z][A-Za-z0-9]*)/g, '&lt;<span style="color:#60a5fa">$1</span>');
    h = h.replace(/&lt;(\/?[a-z][a-z0-9]*)/g, '&lt;<span style="color:#f87171">$1</span>');
    // Numbers (standalone)
    h = h.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#fb923c">$1</span>');

    return { idx, content: h };
  });
}

export default function CodeEditor({ code, isGenerating, projectType }) {
  const [activeTab, setActiveTab] = useState("App.tsx");
  const [displayedCode, setDisplayedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const codeRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);

  // Stream code character by character when generating
  useEffect(() => {
    if (!code) return;
    posRef.current = 0;
    setDisplayedCode("");
    setLineCount(0);

    if (animRef.current) clearInterval(animRef.current);

    if (isGenerating) {
      animRef.current = setInterval(() => {
        posRef.current += 4;
        if (posRef.current >= code.length) {
          setDisplayedCode(code);
          setLineCount(code.split("\n").length);
          clearInterval(animRef.current);
          return;
        }
        const chunk = code.slice(0, posRef.current);
        setDisplayedCode(chunk);
        setLineCount(chunk.split("\n").length);
        codeRef.current?.scrollTo({ top: codeRef.current.scrollHeight, behavior: "smooth" });
      }, 30);
    } else {
      setDisplayedCode(code);
      setLineCount(code.split("\n").length);
    }

    return () => clearInterval(animRef.current);
  }, [code, isGenerating]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedLines = highlight(displayedCode);

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d1117" }}>
      {/* Title Bar (VS Code style) */}
      <div className="flex items-center px-4 py-2 flex-shrink-0 gap-2"
        style={{ background: "#010409", borderBottom: "1px solid #21262d" }}>
        <div className="flex items-center gap-1.5 mr-3">
          <div className="w-3 h-3 rounded-full bg-red-500/70 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-green-500/70 cursor-pointer" />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {projectType ? `${projectType}-app` : "untitled-app"} — Editor
        </span>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-0 flex-shrink-0 overflow-x-auto"
        style={{ background: "#010409", borderBottom: "1px solid #21262d" }}>
        {FILE_TABS.map(tab => (
          <button
            key={tab}
            data-testid={`file-tab-${tab.replace(".", "-")}`}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap transition-colors border-b-2"
            style={{
              background: activeTab === tab ? "#0d1117" : "transparent",
              color: activeTab === tab ? "#e6edf3" : "#848d97",
              borderBottomColor: activeTab === tab ? "#58a6ff" : "transparent",
            }}
          >
            <FileCode className="w-3 h-3" />
            {tab}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {isGenerating && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full"
            />
            Generating...
          </div>
        )}

        <button
          data-testid="copy-code-btn"
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
          style={{
            background: "rgba(33,38,45,0.9)",
            border: "1px solid #30363d",
            color: "#8b949e",
            display: isGenerating ? "none" : "flex",
          }}
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>

        <div
          ref={codeRef}
          className="h-full overflow-auto"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        >
          {activeTab === "App.tsx" ? (
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {highlightedLines.map(({ idx, content }) => (
                  <tr key={idx} className="hover:bg-white/[0.02] group">
                    <td
                      className="select-none text-right pr-4 pl-4 py-0.5 w-12"
                      style={{ color: "#3d444d", userSelect: "none", verticalAlign: "top" }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      className="pr-6 py-0.5"
                      style={{ color: "#e6edf3", whiteSpace: "pre" }}
                      dangerouslySetInnerHTML={{ __html: content || "&nbsp;" }}
                    />
                  </tr>
                ))}
                {isGenerating && (
                  <tr>
                    <td className="pl-4 pr-4 py-0.5 w-12 text-right" style={{ color: "#3d444d" }}>{lineCount + 1}</td>
                    <td className="py-0.5">
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-2 h-4 bg-cyan-400"
                        style={{ verticalAlign: "text-bottom" }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center mt-20">
              <FileCode className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">Select App.tsx to view generated code</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar (VS Code style) */}
      <div className="flex items-center justify-between px-4 py-1 flex-shrink-0 text-xs"
        style={{ background: "#1f6feb", color: "rgba(255,255,255,0.8)" }}>
        <div className="flex items-center gap-3">
          <span>main</span>
          <span>TypeScript React</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {lineCount}, Col 1</span>
          <span>UTF-8</span>
          <span>TSX</span>
        </div>
      </div>
    </div>
  );
}
