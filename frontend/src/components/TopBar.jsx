import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Share2, LayoutGrid, Zap, Eye, Code2 } from "lucide-react";

export default function TopBar({
  isGenerating,
  onDeploy,
  onShare,
  onHome,
  projectName,
  isDark = false,
  user,
  showPreview,
  onTogglePreview,
  onOpenCode,
  // App state for Live/Share/Deploy
  previewReady = false,
  liveUrl = null,
}) {
  const dk = isDark;
  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();
  const avatarUrl = user?.avatar_url || null;

  // App is considered "live" when generation is done and E2B sandbox URL is ready
  const isLive = previewReady && !!liveUrl && !isGenerating;

  const tabStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 12px",
    borderRadius: "8px",
    border: active
      ? (dk ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.6)")
      : (dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.15)"),
    background: active
      ? (dk ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)")
      : (dk ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.35)"),
    boxShadow: active && !dk ? "0 1px 4px rgba(20,80,160,0.06)" : "none",
    color: active
      ? (dk ? "#e2e8f0" : "#0a1a3e")
      : (dk ? "rgba(100,116,139,0.6)" : "rgba(40,70,130,0.5)"),
    fontSize: "12px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: active ? 600 : 500,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div
      className="h-11 flex items-center flex-shrink-0 z-20 relative"
      style={{
        background: dk ? "#06090f" : "rgba(255,255,255,0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.5)",
        boxShadow: dk ? "none" : "0 2px 16px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {/* Home — left */}
      <button
        data-testid="nav-home"
        onClick={onHome}
        className="flex items-center gap-2 px-4 h-full flex-shrink-0 transition-colors relative z-10"
        style={{ color: dk ? "rgba(180,195,215,0.7)" : "rgba(30,60,120,0.6)", borderRight: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.12)" }}
        onMouseEnter={e => e.currentTarget.style.color = dk ? "#e2e8f0" : "#0a1a3e"}
        onMouseLeave={e => e.currentTarget.style.color = dk ? "rgba(180,195,215,0.7)" : "rgba(30,60,120,0.6)"}
      >
        <LayoutGrid style={{ width: 14, height: 14 }} />
        <span style={{ fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, letterSpacing: "-0.01em" }}>Home</span>
      </button>

      {/* Center — project name */}
      {projectName && projectName !== "untitled-app" && (
        <div
          className="flex items-center justify-center gap-2"
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}
        >
          <span style={{ fontSize: "13.5px", color: dk ? "rgba(200,215,235,0.85)" : "#1e3264", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {projectName}
          </span>
          {isGenerating && (
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }} className="flex items-center gap-1">
              <Zap style={{ width: 11, height: 11, color: "#4ade80" }} />
              <span style={{ fontSize: "11px", color: "rgba(74,222,128,0.7)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.01em" }}>
                generating
              </span>
            </motion.div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0 relative z-10"
        style={{ borderLeft: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.12)" }}
      >
        {/* Preview & Code tabs — when side panel is hidden */}
        <AnimatePresence>
          {!showPreview && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 overflow-hidden"
              style={{ marginRight: 6 }}
            >
              <button data-testid="topbar-preview-btn" onClick={onTogglePreview} style={tabStyle(true)}>
                <Eye style={{ width: 12, height: 12 }} />
                Preview
              </button>
              <button
                data-testid="topbar-code-btn"
                onClick={onOpenCode}
                style={tabStyle(false)}
                onMouseEnter={e => { e.currentTarget.style.background = dk ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"; e.currentTarget.style.color = dk ? "#c8d5e4" : "#1e3264"; }}
                onMouseLeave={e => { e.currentTarget.style.background = dk ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.35)"; e.currentTarget.style.color = dk ? "rgba(100,116,139,0.6)" : "rgba(40,70,130,0.5)"; }}
              >
                <Code2 style={{ width: 12, height: 12 }} />
                Code
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share — enabled only when app is ready */}
        <motion.button
          data-testid="share-button"
          onClick={previewReady ? onShare : undefined}
          whileHover={previewReady ? { scale: 1.03 } : {}}
          whileTap={previewReady ? { scale: 0.97 } : {}}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: dk ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
            border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.2)",
            color: previewReady
              ? (dk ? "rgba(180,195,215,0.85)" : "rgba(30,60,120,0.7)")
              : (dk ? "rgba(100,116,139,0.3)" : "rgba(30,60,120,0.25)"),
            cursor: previewReady ? "pointer" : "not-allowed",
            opacity: previewReady ? 1 : 0.5,
          }}
        >
          <Share2 style={{ width: 13, height: 13 }} />
          Share
        </motion.button>

        {/* Deploy button — always opens the Deploy panel; green dot when already deployed */}
        <motion.button
          data-testid="deploy-button"
          onClick={previewReady ? onDeploy : undefined}
          disabled={isGenerating}
          whileHover={previewReady && !isGenerating ? { scale: 1.03 } : {}}
          whileTap={previewReady && !isGenerating ? { scale: 0.97 } : {}}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: isGenerating || !previewReady
              ? (dk ? "rgba(30,41,59,0.5)" : "rgba(0,0,0,0.06)")
              : isLive
              ? "linear-gradient(135deg, #059669, #10b981)"
              : "linear-gradient(135deg,#06b6d4,#0ea5e9)",
            color: isGenerating || !previewReady ? (dk ? "#475569" : "#94a3b8") : "#000",
            boxShadow: !isGenerating && previewReady
              ? isLive
                ? "0 0 16px rgba(16,185,129,0.35)"
                : "0 0 16px rgba(6,182,212,0.3)"
              : "none",
            cursor: isGenerating || !previewReady ? "not-allowed" : "pointer",
          }}
        >
          {isLive && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.85)", boxShadow: "0 0 5px rgba(255,255,255,0.8)", flexShrink: 0 }} />
          )}
          {!isLive && <Rocket style={{ width: 13, height: 13 }} />}
          Deploy
        </motion.button>

        {/* User avatar */}
        {user && (
          <div
            className="flex items-center justify-center flex-shrink-0 ml-1 overflow-hidden"
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: avatarUrl ? "transparent" : "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)",
              boxShadow: "0 2px 8px rgba(14,165,233,0.3)",
              flexShrink: 0,
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={initials}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "10px", color: "#fff", textTransform: "uppercase" }}>
                {initials}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
