import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export default function LogsPanel({ logs, isGenerating, isOpen, onToggle }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const getLineStyle = (line) => {
    if (line.startsWith("✓") || line.includes("success") || line.includes("complete")) return "#4ade80";
    if (line.startsWith("$") || line.startsWith(">")) return "#60a5fa";
    if (line.includes("Error") || line.includes("error") || line.includes("✗")) return "#f87171";
    if (line.includes("warning") || line.includes("Warning")) return "#fbbf24";
    if (line.includes("Deploying") || line.includes("Building") || line.includes("Compiling")) return "#c084fc";
    return "#6b7280";
  };

  return (
    <div
      className="flex-shrink-0 transition-all duration-300"
      style={{
        height: isOpen ? "200px" : "36px",
        borderTop: "1px solid rgba(30,41,59,0.8)",
        background: "#000000",
      }}
    >
      {/* Header */}
      <button
        data-testid="logs-toggle"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 h-9 text-xs hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-medium">Terminal</span>
          {isGenerating && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-1 text-green-400"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              running
            </motion.div>
          )}
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-slate-600 bg-slate-800">{logs.length} lines</span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {/* Log Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-y-auto px-4 py-2"
            style={{ height: "calc(200px - 36px)" }}
          >
            {logs.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-700 text-xs mt-4">
                <Terminal className="w-4 h-4" />
                <span>No output yet. Start building to see logs.</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                {logs.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.5) }}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                  >
                    <span className="text-slate-700 select-none w-8 text-right flex-shrink-0">{i + 1}</span>
                    <span style={{ color: getLineStyle(line) }}>{line}</span>
                  </motion.div>
                ))}
                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs mt-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="text-slate-700 w-8 text-right">{logs.length + 1}</span>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-green-400"
                    >
                      █
                    </motion.span>
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
