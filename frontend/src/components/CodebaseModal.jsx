import { useState, useEffect, useRef, useCallback } from "react";
import { X, ExternalLink, Copy, Check, Loader2, RefreshCw, Eye, EyeOff, Code2, Cpu } from "lucide-react";
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
 * CodebaseModal — gives the user access to the agent workspace (E2B + code-server).
 * The workspace is always auto-provisioned — there is no manual "create" step.
 *
 * States:
 *  "provisioning" — workspace is being set up (shows real steps)
 *  "loading"      — fetching credentials after provision completes
 *  "ready"        — URL + password shown
 *  "error"        — provision or fetch failed (retry available)
 */
export default function CodebaseModal({
  task,
  onClose,
  isDark = true,
  // From AppBuilder background polling
  provisionId = null,
  provisionStatus = null,
  // Pre-loaded credentials (if already ready)
  initialVsUrl = null,
  initialVsPassword = null,
}) {
  const dk = isDark;

  const getInitialUiStatus = () => {
    if (initialVsUrl) return "ready";
    if (provisionId && provisionStatus && provisionStatus !== "ready" && provisionStatus !== "error") return "provisioning";
    if (provisionStatus === "ready") return "loading";
    // No data yet — auto-start provisioning immediately
    return "provisioning";
  };

  const [uiStatus, setUiStatus] = useState(getInitialUiStatus);
  const [liveStatus, setLiveStatus] = useState(provisionStatus || "starting");
  const [vsUrl, setVsUrl] = useState(initialVsUrl);
  const [vsPassword, setVsPassword] = useState(initialVsPassword);
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const pollTimerRef = useRef(null);

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
    badgeBuilding: "rgba(245,158,11,0.15)",
    badgeBuildingText: "#f59e0b",
    divider: dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    shadow: dk
      ? "0 24px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)"
      : "0 24px 80px rgba(20,80,160,0.12), 0 8px 32px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
  };

  // Fetch credentials once provision is ready
  const fetchCredentials = useCallback(async () => {
    setUiStatus("loading");
    // Try getCodebase first (fast if already attached)
    try {
      const data = await getCodebase(task.id);
      if (data.vscode_url) {
        setVsUrl(data.vscode_url);
        setVsPassword(data.vscode_password);
        setUiStatus("ready");
        return;
      }
    } catch { /* not attached yet */ }

    // Fallback: create-or-get (slower but reliable)
    try {
      const data = await createOrGetCodebase(task.id);
      setVsUrl(data.vscode_url);
      setVsPassword(data.vscode_password);
      setUiStatus("ready");
    } catch (e) {
      setErrorMsg(e?.response?.data?.detail || e.message || "Failed to load workspace credentials");
      setUiStatus("error");
    }
  }, [task.id]);

  // Poll provision status
  const startPolling = useCallback((pId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await getProvisionStatus(pId);
        setLiveStatus(data.status);
        if (data.status === "ready") {
          clearInterval(pollTimerRef.current);
          // Brief delay to let attach complete
          setTimeout(() => fetchCredentials(), 3000);
        } else if (data.status === "error") {
          clearInterval(pollTimerRef.current);
          setErrorMsg("Agent workspace setup failed on the server.");
          setUiStatus("error");
        }
      } catch { /* retry on next tick */ }
    }, 3000);
  }, [fetchCredentials]);

  useEffect(() => {
    // Already have credentials
    if (initialVsUrl) {
      setUiStatus("ready");
      return;
    }

    // Provision just became ready (from parent)
    if (provisionStatus === "ready") {
      fetchCredentials();
      return;
    }

    // Active provision — start polling
    if (provisionId && provisionStatus && provisionStatus !== "ready" && provisionStatus !== "error") {
      setUiStatus("provisioning");
      setLiveStatus(provisionStatus);
      startPolling(provisionId);
      return;
    }

    // No provision data — auto-start via createOrGet
    // This handles old tasks or tasks where provisionId wasn't tracked
    setUiStatus("provisioning");
    setLiveStatus("starting");
    createOrGetCodebase(task.id)
      .then(data => {
        if (data.status === "ready" && data.vscode_url) {
          setVsUrl(data.vscode_url);
          setVsPassword(data.vscode_password);
          setUiStatus("ready");
        } else {
          // Still provisioning — shouldn't normally happen with createOrGet
          // but handle gracefully
          setLiveStatus("installing");
        }
      })
      .catch(e => {
        setErrorMsg(e?.response?.data?.detail || e.message || "Could not access workspace");
        setUiStatus("error");
      });

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    setErrorMsg("");
    setUiStatus("provisioning");
    setLiveStatus("starting");
    fetchCredentials();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    try {
      await deleteCodebase(task.id);
      setVsUrl(null);
      setVsPassword(null);
      // After delete, auto-reprovision (workspace recreated on next open)
      onClose();
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "url") { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
      else { setCopiedPwd(true); setTimeout(() => setCopiedPwd(false), 2000); }
    } catch (e) { console.error("Copy failed:", e); }
  };

  // ── BADGE ──
  const badge = uiStatus === "ready"
    ? <span style={{ fontSize: 11, fontWeight: 600, color: colors.badgeReadyText, background: colors.badgeReady, borderRadius: 20, padding: "2px 8px" }}>Ready</span>
    : <span style={{ fontSize: 11, fontWeight: 600, color: colors.badgeBuildingText, background: colors.badgeBuilding, borderRadius: 20, padding: "2px 8px" }}>Building…</span>;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: colors.overlay, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, borderRadius: 20, background: colors.bg, border: `1px solid ${colors.border}`, boxShadow: colors.shadow, overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${colors.divider}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0078d4 0%, #005a9e 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Code2 style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.headerText, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                Agent Workspace
              </span>
              {badge}
            </div>
            <p style={{ fontSize: 12, color: colors.subText, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.projectName || "Project"} · VS Code environment
            </p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: colors.subText, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>

          {/* ── PROVISIONING (live 4-step progress) ── */}
          {uiStatus === "provisioning" && (
            <div style={{ padding: "4px 0" }}>
              {/* Agent context pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, padding: "8px 12px", borderRadius: 10, background: dk ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)", border: `1px solid ${dk ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.15)"}` }}>
                <Cpu style={{ width: 13, height: 13, color: "#3b82f6", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: dk ? "rgba(148,196,255,0.85)" : "rgba(30,70,180,0.75)", lineHeight: 1.4 }}>
                  The agents are setting up their workspace in parallel with your generation.
                </p>
              </div>

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
                      <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isDone ? (
                          <Check style={{ width: 15, height: 15, color: "#4ade80" }} />
                        ) : isActive ? (
                          <div style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.25)", borderTopColor: "#3b82f6", animation: "spin 0.85s linear infinite" }} />
                        ) : (
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: dk ? "rgba(100,116,139,0.4)" : "rgba(80,140,220,0.3)" }} />
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: isDone ? 500 : isActive ? 600 : 400, color: isDone ? "#4ade80" : isActive ? (dk ? "#e2e8f0" : "#0a1a3e") : (dk ? "rgba(100,116,139,0.5)" : "rgba(40,70,130,0.35)"), letterSpacing: "-0.01em", transition: "color 0.3s", flex: 1 }}>
                        {step.label}
                      </span>
                      {isActive && (
                        <div key={`bar-${liveStatus}`} style={{ width: 80, height: 2, borderRadius: 99, background: dk ? "rgba(255,255,255,0.08)" : "rgba(80,140,220,0.15)", overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", animation: `progressBar ${barDuration}s linear forwards` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
              `}</style>

              <p style={{ fontSize: 11, color: colors.subText, textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
                You can close this and continue — the workspace will be ready when you return.
              </p>
            </div>
          )}

          {/* ── LOADING (fetching credentials) ── */}
          {uiStatus === "loading" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(59,130,246,0.2)", borderTopColor: "#3b82f6", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.headerText, marginBottom: 6 }}>Loading workspace…</p>
              <p style={{ fontSize: 13, color: colors.subText }}>Fetching your access credentials.</p>
            </div>
          )}

          {/* ── ERROR ── */}
          {uiStatus === "error" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <X style={{ width: 22, height: 22, color: "#ef4444" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>Workspace setup failed</p>
              <p style={{ fontSize: 12, color: colors.subText, background: dk ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 16, lineHeight: 1.5, textAlign: "left" }}>
                {errorMsg}
              </p>
              <button onClick={handleRetry} style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: colors.btnPrimary, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
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
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.subText, marginBottom: 6 }}>Workspace URL</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.fieldBg, border: `1px solid ${colors.fieldBorder}`, borderRadius: 12, padding: "10px 12px" }}>
                  <a href={vsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: "#3b82f6", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    <ExternalLink style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {vsUrl}
                  </a>
                  <button onClick={() => copyToClipboard(vsUrl, "url")} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 8, background: copiedUrl ? "rgba(16,185,129,0.15)" : colors.btnSecBg, border: `1px solid ${copiedUrl ? "rgba(16,185,129,0.3)" : colors.btnSecBorder}`, color: copiedUrl ? "#10b981" : colors.btnSecText, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap" }}>
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
                  <button onClick={() => setPasswordVisible(v => !v)} title={passwordVisible ? "Hide" : "Show"} style={{ flexShrink: 0, padding: "4px 8px", borderRadius: 8, background: "none", border: `1px solid ${colors.fieldBorder}`, color: colors.subText, cursor: "pointer", display: "flex", alignItems: "center" }}>
                    {passwordVisible ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
                  </button>
                  <button onClick={() => copyToClipboard(vsPassword, "pwd")} style={{ flexShrink: 0, padding: "4px 10px", borderRadius: 8, background: copiedPwd ? "rgba(16,185,129,0.15)" : colors.btnSecBg, border: `1px solid ${copiedPwd ? "rgba(16,185,129,0.3)" : colors.btnSecBorder}`, color: copiedPwd ? "#10b981" : colors.btnSecText, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s", whiteSpace: "nowrap" }}>
                    {copiedPwd ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                    {copiedPwd ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <a href={vsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: colors.btnPrimary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none", letterSpacing: "-0.01em" }}>
                  <ExternalLink style={{ width: 14, height: 14 }} />
                  Open Workspace
                </a>
                <button onClick={handleDelete} disabled={isDeleting} title="Reset workspace" style={{ padding: "10px 14px", borderRadius: 12, background: "none", border: `1px solid ${dk ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}`, color: "#ef4444", fontSize: 12, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.5 : 1, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                  {isDeleting ? <Loader2 style={{ width: 13, height: 13, animation: "spin 0.8s linear infinite" }} /> : <RefreshCw style={{ width: 13, height: 13 }} />}
                  Reset
                </button>
              </div>

              <p style={{ fontSize: 11, color: colors.subText, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
                Copy the password, open the workspace, then paste it when prompted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
