import { useState, useEffect, useRef, useCallback } from "react";
import { X, ExternalLink, Copy, Check, Loader2, RefreshCw, Terminal, Eye, EyeOff, Code2 } from "lucide-react";
import { createOrGetCodebase, deleteCodebase, getProvisionStatus, getCodebase } from "../api/projects";

// Step definitions that map to real E2B provisioning status values
const PROVISION_STEPS = [
  {
    label: "Loading cloud environment",
    activeOn: "starting",
    doneOn: ["sandbox_created", "installing", "configuring", "ready"],
  },
  {
    label: "Allocating resources",
    activeOn: "sandbox_created",
    doneOn: ["installing", "configuring", "ready"],
  },
  {
    label: "Configuring environment",
    activeOn: ["installing", "configuring"],
    doneOn: ["ready"],
  },
  {
    label: "Starting agents",
    activeOn: null,
    doneOn: ["ready"],
  },
];

function getStepState(step, currentStatus) {
  if (!currentStatus || currentStatus === "idle") return "pending";
  if (Array.isArray(step.doneOn) && step.doneOn.includes(currentStatus)) return "done";
  if (step.activeOn) {
    const active = Array.isArray(step.activeOn) ? step.activeOn : [step.activeOn];
    if (active.includes(currentStatus)) return "active";
  }
  return "pending";
}

const STEP_BAR_DURATIONS = {
  starting: 1200,
  sandbox_created: 800,
  installing: 35000,
  configuring: 6000,
};

/**
 * CodebaseModal — shows VS Code (code-server) environment for a project.
 *
 * Modes:
 *  1. Ready with credentials (initialVsUrl + initialVsPassword) — show directly
 *  2. Provisioning in-progress — shows live 4-step progress (provisionId + provisionStatus props)
 *  3. Standard — create-on-demand or show existing credentials
 */
export default function CodebaseModal({
  task,
  onClose,
  isDark = true,
  // Live provision props (from AppBuilder background polling)
  provisionId = null,
  provisionStatus = null,   // starting|sandbox_created|installing|configuring|ready|error
  // Pre-loaded credentials (from task._project)
  initialVsUrl = null,
  initialVsPassword = null,
}) {
  const dk = isDark;

  // ── Determine initial uiStatus based on props
  const getInitialStatus = () => {
    if (initialVsUrl) return "ready";
    if (provisionId && provisionStatus && provisionStatus !== "ready" && provisionStatus !== "error") {
      return "provisioning";
    }
    if (provisionStatus === "ready") return "loading"; // fetch credentials
    return "idle";
  };

  const [uiStatus, setUiStatus] = useState(getInitialStatus);

  const [liveStatus, setLiveStatus] = useState(provisionStatus || "idle");
  const [vsUrl, setVsUrl] = useState(initialVsUrl);
  const [vsPassword, setVsPassword] = useState(initialVsPassword);
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pollTimerRef = useRef(null);

  // Colors based on theme
  const colors = {
    overlay: "rgba(0,0,0,0.65)",
    bg: dk
      ? "linear-gradient(160deg, rgba(10,18,42,0.97) 0%, rgba(5,9,22,0.99) 100%)"
      : "linear-gradient(160deg, rgba(245,250,255,0.98) 0%, rgba(255,255,255,0.99) 100%)",
    border: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    headerText: dk ? "#e8ecf4" : "#0a1a3e",
    subText: dk ? "rgba(150,170,210,0.8)" : "rgba(50,80,140,0.7)",
    fieldBg: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    fieldBorder: dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    fieldText: dk ? "#c8d8f0" : "#1a2a5e",
    btnPrimary: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    btnPrimaryText: "#fff",
    btnSecBg: dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    btnSecBorder: dk ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
    btnSecText: dk ? "rgba(180,200,240,0.85)" : "rgba(30,60,120,0.8)",
    badgeReady: "rgba(16,185,129,0.15)",
    badgeReadyText: "#10b981",
    badgeLoading: "rgba(245,158,11,0.15)",
    badgeLoadingText: "#f59e0b",
    divider: dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    shadow: dk
      ? "0 24px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)"
      : "0 24px 80px rgba(20,80,160,0.12), 0 8px 32px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
  };

  // ── Poll live provision status until ready ──
  const startLivePolling = useCallback((pId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await getProvisionStatus(pId);
        setLiveStatus(data.status);
        if (data.status === "ready") {
          clearInterval(pollTimerRef.current);
          // Transition to fetching credentials
          setUiStatus("loading");
          try {
            const codebase = await getCodebase(task.id);
            setVsUrl(codebase.vscode_url);
            setVsPassword(codebase.vscode_password);
            setUiStatus("ready");
          } catch {
            // Codebase might not be attached yet, retry
            setTimeout(async () => {
              try {
                const codebase = await getCodebase(task.id);
                setVsUrl(codebase.vscode_url);
                setVsPassword(codebase.vscode_password);
                setUiStatus("ready");
              } catch {
                // Fallback to createOrGet
                try {
                  const result = await createOrGetCodebase(task.id);
                  setVsUrl(result.vscode_url);
                  setVsPassword(result.vscode_password);
                  setUiStatus("ready");
                } catch (e2) {
                  setErrorMsg(e2?.response?.data?.detail || e2.message || "Failed to load credentials");
                  setUiStatus("error");
                }
              }
            }, 4000);
          }
        } else if (data.status === "error") {
          clearInterval(pollTimerRef.current);
          setLiveStatus("error");
          setErrorMsg("Environment provisioning failed on the server.");
          setUiStatus("error");
        }
      } catch {
        // Silently retry
      }
    }, 3000);
  }, [task.id]);

  // On mount: decide initial behavior
  useEffect(() => {
    // If we already have credentials, nothing to do
    if (initialVsUrl) {
      setUiStatus("ready");
      return;
    }

    if (provisionId && provisionStatus && provisionStatus !== "ready" && provisionStatus !== "error") {
      // Active provision — start polling for live progress
      setUiStatus("provisioning");
      setLiveStatus(provisionStatus);
      startLivePolling(provisionId);
    } else if (provisionStatus === "ready") {
      // Provision just finished — fetch credentials
      setUiStatus("loading");
      getCodebase(task.id)
        .then(data => {
          setVsUrl(data.vscode_url);
          setVsPassword(data.vscode_password);
          setUiStatus("ready");
        })
        .catch(() => {
          // Try create/get
          createOrGetCodebase(task.id)
            .then(data => {
              setVsUrl(data.vscode_url);
              setVsPassword(data.vscode_password);
              setUiStatus("ready");
            })
            .catch(e => {
              setErrorMsg(e?.response?.data?.detail || e.message);
              setUiStatus("error");
            });
        });
    }
    // else: idle — user will click "Create"
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Standard provision (user clicks "Create VS Code Environment")
  const handleProvision = async () => {
    setUiStatus("loading");
    setErrorMsg("");
    try {
      const result = await createOrGetCodebase(task.id);
      setVsUrl(result.vscode_url);
      setVsPassword(result.vscode_password);
      setUiStatus("ready");
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err.message || "Failed to create VS Code environment");
      setUiStatus("error");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    try {
      await deleteCodebase(task.id);
      setVsUrl(null);
      setVsPassword(null);
      setUiStatus("idle");
      setLiveStatus("idle");
    } catch (err) {
      console.error("Failed to delete codebase:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedPwd(true);
        setTimeout(() => setCopiedPwd(false), 2000);
      }
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  // ── STATUS BADGE ──
  const badgeEl = uiStatus === "ready"
    ? <span style={{ fontSize: 11, fontWeight: 600, color: colors.badgeReadyText, background: colors.badgeReady, borderRadius: 20, padding: "2px 8px" }}>Ready</span>
    : uiStatus === "provisioning" || uiStatus === "loading"
    ? <span style={{ fontSize: 11, fontWeight: 600, color: colors.badgeLoadingText, background: colors.badgeLoading, borderRadius: 20, padding: "2px 8px" }}>Setting up…</span>
    : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: colors.overlay,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          borderRadius: 20,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${colors.divider}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #0078d4 0%, #005a9e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Code2 style={{ width: 18, height: 18, color: "#fff" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.headerText, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                VS Code Environment
              </span>
              {badgeEl}
            </div>
            <p style={{ fontSize: 12, color: colors.subText, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.projectName || "Project"} · Isolated codebase
            </p>
          </div>

          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: colors.subText, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>

          {/* ── IDLE ── */}
          {uiStatus === "idle" && (
            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.08) 100%)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Terminal style={{ width: 26, height: 26, color: "#3b82f6" }} />
              </div>
              <p style={{ fontSize: 14, color: colors.headerText, fontWeight: 600, marginBottom: 6 }}>Launch your VS Code environment</p>
              <p style={{ fontSize: 13, color: colors.subText, lineHeight: 1.6, marginBottom: 20 }}>
                Create a dedicated cloud codebase with your generated app pre-loaded. Takes about 30–60 seconds to set up.
              </p>
              <button
                onClick={handleProvision}
                style={{ width: "100%", padding: "11px 0", borderRadius: 12, background: colors.btnPrimary, border: "none", color: colors.btnPrimaryText, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "-0.01em" }}
              >
                <Code2 style={{ width: 15, height: 15 }} />
                Create VS Code Environment
              </button>
            </div>
          )}

          {/* ── PROVISIONING (live 4-step progress) ── */}
          {uiStatus === "provisioning" && (
            <div style={{ padding: "4px 0" }}>
              <p style={{ fontSize: 13, color: colors.headerText, fontWeight: 600, marginBottom: 16, textAlign: "center" }}>
                Setting up your VS Code environment…
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PROVISION_STEPS.map((step, i) => {
                  const state = getStepState(step, liveStatus);
                  const isDone   = state === "done";
                  const isActive = state === "active";
                  const isPending = state === "pending";

                  const activeKey = Array.isArray(step.activeOn) ? step.activeOn[0] : step.activeOn;
                  const barDuration = (STEP_BAR_DURATIONS[activeKey] || 5000) / 1000;

                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: isPending ? 0.35 : 1, transition: "opacity 0.3s" }}>
                      {/* Icon */}
                      <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isDone ? (
                          <div style={{ animation: "scaleIn 0.3s ease" }}>
                            <Check style={{ width: 15, height: 15, color: "#4ade80" }} />
                          </div>
                        ) : isActive ? (
                          <div style={{
                            width: 15, height: 15, borderRadius: "50%",
                            border: "2px solid rgba(59,130,246,0.25)",
                            borderTopColor: "#3b82f6",
                            animation: "spin 0.85s linear infinite",
                          }} />
                        ) : (
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: dk ? "rgba(100,116,139,0.4)" : "rgba(80,140,220,0.3)" }} />
                        )}
                      </div>

                      {/* Label */}
                      <span style={{
                        fontSize: 13,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: isDone ? 500 : isActive ? 600 : 400,
                        color: isDone ? "#4ade80" : isActive ? (dk ? "#e2e8f0" : "#0a1a3e") : (dk ? "rgba(100,116,139,0.5)" : "rgba(40,70,130,0.35)"),
                        letterSpacing: "-0.01em",
                        transition: "color 0.3s",
                        flex: 1,
                      }}>
                        {step.label}
                      </span>

                      {/* Active progress bar */}
                      {isActive && (
                        <div key={`bar-${liveStatus}`} style={{ width: 80, height: 2, borderRadius: 99, background: dk ? "rgba(255,255,255,0.08)" : "rgba(80,140,220,0.15)", overflow: "hidden", flexShrink: 0 }}>
                          <div
                            style={{
                              height: "100%",
                              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                              animation: `progressBar ${barDuration}s linear forwards`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
                @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
              `}</style>

              <p style={{ fontSize: 11, color: colors.subText, textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
                This runs in parallel with your code generation — no waiting required.
              </p>
            </div>
          )}

          {/* ── LOADING (fetching credentials after provision done) ── */}
          {uiStatus === "loading" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "3px solid rgba(59,130,246,0.2)",
                borderTopColor: "#3b82f6",
                animation: "spin 0.9s linear infinite",
                margin: "0 auto 16px",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.headerText, marginBottom: 6 }}>Loading credentials…</p>
              <p style={{ fontSize: 13, color: colors.subText }}>Almost there, fetching your VS Code URL.</p>
            </div>
          )}

          {/* ── ERROR ── */}
          {uiStatus === "error" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <X style={{ width: 22, height: 22, color: "#ef4444" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>Environment creation failed</p>
              <p style={{ fontSize: 12, color: colors.subText, background: dk ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 16, lineHeight: 1.5, textAlign: "left" }}>
                {errorMsg}
              </p>
              <button
                onClick={handleProvision}
                style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: colors.btnPrimary, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                Retry
              </button>
            </div>
          )}

          {/* ── READY ── */}
          {uiStatus === "ready" && vsUrl && (
            <div>
              {/* VS Code URL */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.subText, marginBottom: 6 }}>VS Code URL</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.fieldBg, border: `1px solid ${colors.fieldBorder}`, borderRadius: 12, padding: "10px 12px" }}>
                  <a href={vsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: "#3b82f6", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    <ExternalLink style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {vsUrl}
                  </a>
                  <button
                    onClick={() => copyToClipboard(vsUrl, "url")}
                    style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 8, background: copiedUrl ? "rgba(16,185,129,0.15)" : colors.btnSecBg, border: `1px solid ${copiedUrl ? "rgba(16,185,129,0.3)" : colors.btnSecBorder}`, color: copiedUrl ? "#10b981" : colors.btnSecText, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap" }}
                  >
                    {copiedUrl ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                    {copiedUrl ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.subText, marginBottom: 6 }}>Password</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.fieldBg, border: `1px solid ${colors.fieldBorder}`, borderRadius: 12, padding: "10px 12px" }}>
                  <span style={{ flex: 1, fontSize: 13, color: colors.fieldText, fontFamily: "monospace", letterSpacing: passwordVisible ? "0.05em" : "0.25em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {passwordVisible ? vsPassword : vsPassword?.replace(/./g, "•")}
                  </span>
                  <button
                    onClick={() => setPasswordVisible(v => !v)}
                    title={passwordVisible ? "Hide password" : "Show password"}
                    style={{ flexShrink: 0, padding: "4px 8px", borderRadius: 8, background: "none", border: `1px solid ${colors.fieldBorder}`, color: colors.subText, cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {passwordVisible ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(vsPassword, "pwd")}
                    style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 8, background: copiedPwd ? "rgba(16,185,129,0.15)" : colors.btnSecBg, border: `1px solid ${copiedPwd ? "rgba(16,185,129,0.3)" : colors.btnSecBorder}`, color: copiedPwd ? "#10b981" : colors.btnSecText, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap" }}
                  >
                    {copiedPwd ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                    {copiedPwd ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href={vsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: colors.btnPrimary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none", letterSpacing: "-0.01em" }}
                >
                  <ExternalLink style={{ width: 14, height: 14 }} />
                  Open VS Code
                </a>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="Delete VS Code environment"
                  style={{ padding: "10px 14px", borderRadius: 12, background: "none", border: `1px solid ${dk ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}`, color: "#ef4444", fontSize: 12, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.5 : 1, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}
                >
                  {isDeleting ? <Loader2 style={{ width: 13, height: 13, animation: "spin 0.8s linear infinite" }} /> : <X style={{ width: 13, height: 13 }} />}
                  Delete
                </button>
              </div>

              <p style={{ fontSize: 11, color: colors.subText, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
                Copy the password, open VS Code, then paste it when prompted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
