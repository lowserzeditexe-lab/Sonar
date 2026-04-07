import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, ChevronDown, GitFork, Brain, GitBranch, Code2, Bug, CheckCircle } from "lucide-react";
import GitHubPushModal from "./GitHubPushModal";

const SONAR_ICON = "https://customer-assets.emergentagent.com/job_emergent-mock-2/artifacts/bocxbvjv_66af99839e55f1ee29f117ac.png";

const AGENT_ICONS = { planner: Brain, architect: GitBranch, coder: Code2, debugger: Bug };

function formatTime() {
  return new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SonarAvatar({ size = 24 }) {
  return (
    <div className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, background: "rgba(200,100,70,0.1)", border: "1px solid rgba(200,100,70,0.2)" }}>
      <img src={SONAR_ICON} alt="" width={size - 6} height={size - 6} style={{ objectFit: "contain" }} />
    </div>
  );
}

function UserAvatar({ user, size = 26 }) {
  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();
  const avatarUrl = user?.avatar_url || null;
  return (
    <div className="flex-shrink-0 overflow-hidden"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: avatarUrl ? "transparent" : "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)",
        boxShadow: "0 1px 6px rgba(14,165,233,0.25)",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={initials}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
          onError={e => { e.currentTarget.style.display = "none"; }} />
      ) : (
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: size * 0.38, color: "#fff", textTransform: "uppercase" }}>
          {initials}
        </span>
      )}
    </div>
  );
}

/* ── User message ── */
function UserMsg({ content, isNew, isDark, user }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mb-5 flex justify-end items-end gap-2"
    >
      <div style={{ maxWidth: "75%", width: "fit-content" }}>
        <div className="text-sm leading-relaxed px-4 py-3 rounded-2xl"
          style={{
            background: isDark ? "rgba(22,101,78,0.5)" : "rgba(255,255,255,0.5)",
            backdropFilter: isDark ? "none" : "blur(12px)",
            WebkitBackdropFilter: isDark ? "none" : "blur(12px)",
            border: isDark ? "1px solid rgba(34,197,94,0.13)" : "1px solid rgba(255,255,255,0.6)",
            boxShadow: isDark ? "none" : "0 2px 12px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
            color: isDark ? "#dff5ea" : "#0a2a4e",
            fontFamily: "'Manrope',sans-serif",
            lineHeight: 1.65,
          }}>
          {content}
        </div>
        <p className="text-right mt-1 pr-1" style={{ fontSize: "11px", color: isDark ? "rgba(80,110,90,0.55)" : "rgba(40,80,140,0.4)", fontFamily: "'Manrope',sans-serif" }}>
          {formatTime()}
        </p>
      </div>
      {/* Profile icon — same as the one in the nav/menu */}
      <UserAvatar user={user} size={26} />
    </motion.div>
  );
}

/* ── AI message ── */
function AIMsg({ content, isNew, isDark }) {
  return (
    <motion.div initial={isNew ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="flex gap-3 mb-5">
      <SonarAvatar size={24} />
      <p className="text-sm leading-relaxed flex-1 pt-0.5"
        style={{ color: isDark ? "rgba(215,225,240,0.88)" : "rgba(15,40,80,0.85)", fontFamily: "'Manrope',sans-serif", lineHeight: 1.7 }}>
        {content}
      </p>
    </motion.div>
  );
}

/* ── Agent inline step ── */
function AgentMsg({ agentId, label, status, thinking, steps, isNew, isDark }) {
  const Icon = AGENT_ICONS[agentId] || Code2;
  const isDone = status === "done";

  return (
    <motion.div initial={isNew ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
        style={{
          background: isDone ? "rgba(16,185,129,0.12)" : "rgba(6,182,212,0.1)",
          border: `1px solid ${isDone ? "rgba(16,185,129,0.3)" : "rgba(6,182,212,0.25)"}`,
        }}>
        {isDone
          ? <CheckCircle style={{ width: 12, height: 12, color: "#10b981" }} />
          : <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Icon style={{ width: 11, height: 11, color: "#06b6d4" }} />
            </motion.div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: "12px", fontWeight: 600, color: isDone ? "#10b981" : "#06b6d4", fontFamily: "'Manrope',sans-serif" }}>
            {label}
          </span>
          <span style={{ fontSize: "11px", color: isDone ? "rgba(16,185,129,0.6)" : "rgba(6,182,212,0.5)", fontFamily: "'Manrope',sans-serif" }}>
            {isDone ? "· Done" : "· Thinking..."}
          </span>
        </div>

        {/* Real thinking text from LLM */}
        {thinking && (
          <div className="mt-1 mb-1 rounded-lg px-3 py-2"
            style={{
              background: isDark ? "rgba(6,182,212,0.04)" : "rgba(6,182,212,0.05)",
              border: `1px solid ${isDark ? "rgba(6,182,212,0.1)" : "rgba(6,182,212,0.15)"}`,
              maxHeight: isDone ? "none" : "120px",
              overflow: isDone ? "visible" : "hidden",
            }}>
            <p style={{
              fontSize: "11.5px", lineHeight: 1.65,
              color: isDark ? "rgba(148,181,210,0.75)" : "rgba(30,60,120,0.65)",
              fontFamily: "'Manrope',sans-serif",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {thinking}
              {!isDone && (
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                  style={{ color: "#06b6d4", marginLeft: 2 }}>▋</motion.span>
              )}
            </p>
          </div>
        )}

        {/* Legacy steps (for backward compat) */}
        {steps && steps.length > 0 && (
          <div className="space-y-0.5">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-1.5 text-xs" style={{ color: isDark ? "rgba(100,120,150,0.75)" : "rgba(40,70,130,0.6)", fontFamily: "'Manrope',sans-serif" }}>
                <span style={{ color: isDone ? "rgba(16,185,129,0.5)" : "rgba(6,182,212,0.4)" }}>›</span> {s}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Processing dots ── */
function ProcessingRow({ isDark }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-4">
      <SonarAvatar size={24} />
      <div className="flex items-center gap-1" style={{ fontFamily: "'Manrope',sans-serif", fontSize: "13px", color: isDark ? "rgba(140,155,175,0.7)" : "rgba(40,70,130,0.55)" }}>
        Processing next step
        {[0,1,2].map(i => (
          <motion.span key={i} animate={{ opacity: [0.2,1,0.2] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}>.</motion.span>
        ))}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ messages, isTyping, isGenerating, onSendMessage, onReset, isDark = false, currentCode = "", projectName = "my-app", user = null }) {
  const [inputVal, setInputVal] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  const [showGitHubPush, setShowGitHubPush] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const dk = isDark;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  const handleSend = () => {
    if (!inputVal.trim() || isGenerating) return;
    onSendMessage(inputVal.trim());
    setInputVal("");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: dk ? "#0a0a0a" : "rgba(220,238,252,0.6)", backdropFilter: dk ? "none" : "blur(8px)" }}>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative" style={{ padding: "24px 22px 12px" }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isNew = i === messages.length - 1;
            if (msg.role === "user") return <UserMsg key={i} content={msg.content} isNew={isNew} isDark={dk} user={user} />;
            if (msg.role === "assistant") return <AIMsg key={i} content={msg.content} isNew={isNew} isDark={dk} />;
            if (msg.role === "agent") return <AgentMsg key={i} agentId={msg.agentId} label={msg.label} status={msg.status} steps={msg.steps} isNew={isNew} isDark={dk} />;
            return null;
          })}
        </AnimatePresence>
        {isTyping && <ProcessingRow isDark={dk} />}
        <div ref={bottomRef} />

        {/* Scroll btn */}
        <AnimatePresence>
          {showScroll && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              data-testid="scroll-to-bottom"
              className="sticky bottom-3 flex items-center justify-center rounded-full mx-auto"
              style={{
                width: 32, height: 32,
                background: dk ? "rgba(28,35,48,0.95)" : "rgba(255,255,255,0.9)",
                border: dk ? "1px solid rgba(60,75,100,0.6)" : "1px solid rgba(80,140,220,0.25)",
                boxShadow: dk ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 16px rgba(20,60,140,0.12)",
                display: "flex",
              }}>
              <ChevronDown style={{ width: 15, height: 15, color: dk ? "#94a3b8" : "#3b82f6" }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      {(isGenerating || messages.length > 0) && (
        <div className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0" style={{ borderTop: dk ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(80,140,220,0.1)" }}>
          {isGenerating ? (
            <>
              <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-400" />
              <span style={{ fontSize: "12px", color: "#4ade80", fontFamily: "'Manrope',sans-serif" }}>Agent is running...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full" style={{ background: dk ? "rgba(100,116,139,0.5)" : "rgba(80,140,220,0.35)" }} />
              <span style={{ fontSize: "12px", color: dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.5)", fontFamily: "'Manrope',sans-serif" }}>Agent ready</span>
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-1">
        <div className="rounded-xl overflow-hidden" style={{
          background: dk ? "#111318" : "rgba(255,255,255,0.55)",
          border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: dk ? "none" : "0 4px 20px rgba(20,80,160,0.07), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}>
          <textarea
            data-testid="chat-input"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message Sonar"
            rows={2}
            className="w-full bg-transparent outline-none resize-none"
            style={{
              padding: "12px 14px 6px",
              color: dk ? "#e2e8f0" : "#0a1a3e",
              fontSize: "13px",
              fontFamily: "'Manrope',sans-serif",
              caretColor: "#06b6d4",
              lineHeight: 1.6,
            }}
          />
          <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
            <div className="flex items-center gap-1">
              {/* GitHub push button */}
              <button
                data-testid="chat-github-btn"
                onClick={() => setShowGitHubPush(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  color: dk ? "rgba(100,116,139,0.75)" : "rgba(40,70,130,0.5)",
                  background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  border: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.15)",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = dk ? "#e2e8f0" : "#1e3264"; e.currentTarget.style.background = dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = dk ? "rgba(100,116,139,0.75)" : "rgba(40,70,130,0.5)"; e.currentTarget.style.background = dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"; }}
              >
                <GitBranch style={{ width: 11, height: 11 }} /> Push
              </button>
            </div>

            {/* Stop / Send */}
            {isGenerating ? (
              <motion.button data-testid="chat-stop-btn" onClick={onReset} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                className="flex items-center justify-center rounded-full"
                style={{ width: 30, height: 30, background: dk ? "#fff" : "#1e3264", boxShadow: "0 0 10px rgba(255,255,255,0.12)" }}>
                <Square style={{ width: 11, height: 11, color: dk ? "#000" : "#fff", fill: dk ? "#000" : "#fff" }} />
              </motion.button>
            ) : (
              <motion.button data-testid="chat-send-btn" onClick={handleSend} disabled={!inputVal.trim()}
                whileHover={inputVal.trim() ? { scale: 1.06 } : {}} whileTap={inputVal.trim() ? { scale: 0.94 } : {}}
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 30, height: 30,
                  background: inputVal.trim() ? (dk ? "#fff" : "#0a1a3e") : (dk ? "rgba(40,50,65,0.8)" : "rgba(0,0,0,0.08)"),
                  cursor: inputVal.trim() ? "pointer" : "not-allowed",
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4l8 8-8 8M4 12h16" stroke={inputVal.trim() ? (dk ? "#000" : "#fff") : (dk ? "#334155" : "#94a3b8")} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <GitHubPushModal
        open={showGitHubPush}
        onClose={() => setShowGitHubPush(false)}
        isDark={dk}
        currentCode={currentCode}
        projectName={projectName}
      />
    </div>
  );
}
