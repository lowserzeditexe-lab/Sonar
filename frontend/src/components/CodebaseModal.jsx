import { useState } from "react";
import { X, ExternalLink, Copy, Check, Loader2, RefreshCw, Terminal, Eye, EyeOff, Code2 } from "lucide-react";
import { createOrGetCodebase, deleteCodebase } from "../api/projects";

/**
 * CodebaseModal — shows VS Code (code-server) environment for a project.
 * - URL is shown as a clickable link
 * - Password is hidden by default but can be revealed and copied
 * - Matches Emergent's "Code" button UX
 */
export default function CodebaseModal({ task, onClose, isDark = true }) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [vsUrl, setVsUrl] = useState(null);
  const [vsPassword, setVsPassword] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dk = isDark;

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
    vscodeLogo: dk ? "rgba(0,122,204,1)" : "rgba(0,100,175,1)",
  };

  const handleProvision = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await createOrGetCodebase(task.id);
      setVsUrl(result.vscode_url);
      setVsPassword(result.vscode_password);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err.message || "Failed to create VS Code environment");
      setStatus("error");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCodebase(task.id);
      setVsUrl(null);
      setVsPassword(null);
      setStatus("idle");
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

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: colors.overlay,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 20,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: `1px solid ${colors.divider}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* VS Code Icon */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0078d4 0%, #005a9e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Code2 style={{ width: 18, height: 18, color: "#fff" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.headerText,
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                VS Code Environment
              </span>
              {status === "ready" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.badgeReadyText,
                    background: colors.badgeReady,
                    borderRadius: 20,
                    padding: "2px 8px",
                  }}
                >
                  Ready
                </span>
              )}
              {status === "loading" && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.badgeLoadingText,
                    background: colors.badgeLoading,
                    borderRadius: 20,
                    padding: "2px 8px",
                  }}
                >
                  Setting up…
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 12,
                color: colors.subText,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {task.projectName || "Project"} · Isolated codebase
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.subText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
          {/* IDLE — not yet provisioned */}
          {status === "idle" && (
            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.08) 100%)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Terminal style={{ width: 26, height: 26, color: "#3b82f6" }} />
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: colors.headerText,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Launch your VS Code environment
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: colors.subText,
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                Create a dedicated cloud codebase with your generated app pre-loaded.
                Takes about 30–60 seconds to set up.
              </p>
              <button
                onClick={handleProvision}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 12,
                  background: colors.btnPrimary,
                  border: "none",
                  color: colors.btnPrimaryText,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                <Code2 style={{ width: 15, height: 15 }} />
                Create VS Code Environment
              </button>
            </div>
          )}

          {/* LOADING */}
          {status === "loading" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "3px solid rgba(59,130,246,0.2)",
                  borderTopColor: "#3b82f6",
                  animation: "spin 0.9s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontSize: 14, fontWeight: 600, color: colors.headerText, marginBottom: 6 }}>
                Setting up your environment…
              </p>
              <p style={{ fontSize: 13, color: colors.subText, lineHeight: 1.6 }}>
                Installing VS Code, configuring workspace,<br />
                and loading your project code. Please wait.
              </p>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <X style={{ width: 22, height: 22, color: "#ef4444" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>
                Environment creation failed
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: colors.subText,
                  background: dk ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 16,
                  lineHeight: 1.5,
                  textAlign: "left",
                }}
              >
                {errorMsg}
              </p>
              <button
                onClick={handleProvision}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 12,
                  background: colors.btnPrimary,
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                Retry
              </button>
            </div>
          )}

          {/* READY */}
          {status === "ready" && vsUrl && (
            <div>
              {/* VS Code URL */}
              <div style={{ marginBottom: 14 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: colors.subText,
                    marginBottom: 6,
                  }}
                >
                  VS Code URL
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: colors.fieldBg,
                    border: `1px solid ${colors.fieldBorder}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <a
                    href={vsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#3b82f6",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ExternalLink style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {vsUrl}
                  </a>
                  <button
                    onClick={() => copyToClipboard(vsUrl, "url")}
                    style={{
                      flexShrink: 0,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: copiedUrl ? "rgba(16,185,129,0.15)" : colors.btnSecBg,
                      border: `1px solid ${copiedUrl ? "rgba(16,185,129,0.3)" : colors.btnSecBorder}`,
                      color: copiedUrl ? "#10b981" : colors.btnSecText,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copiedUrl ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                    {copiedUrl ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: colors.subText,
                    marginBottom: 6,
                  }}
                >
                  Password
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: colors.fieldBg,
                    border: `1px solid ${colors.fieldBorder}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: colors.fieldText,
                      fontFamily: "monospace",
                      letterSpacing: passwordVisible ? "0.05em" : "0.25em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {passwordVisible ? vsPassword : vsPassword?.replace(/./g, "•")}
                  </span>

                  {/* Show/hide toggle */}
                  <button
                    onClick={() => setPasswordVisible((v) => !v)}
                    title={passwordVisible ? "Hide password" : "Show password"}
                    style={{
                      flexShrink: 0,
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: "none",
                      border: `1px solid ${colors.fieldBorder}`,
                      color: colors.subText,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {passwordVisible ? (
                      <EyeOff style={{ width: 13, height: 13 }} />
                    ) : (
                      <Eye style={{ width: 13, height: 13 }} />
                    )}
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => copyToClipboard(vsPassword, "pwd")}
                    style={{
                      flexShrink: 0,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: copiedPwd ? "rgba(16,185,129,0.15)" : colors.btnSecBg,
                      border: `1px solid ${copiedPwd ? "rgba(16,185,129,0.3)" : colors.btnSecBorder}`,
                      color: copiedPwd ? "#10b981" : colors.btnSecText,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copiedPwd ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                    {copiedPwd ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                {/* Open in browser */}
                <a
                  href={vsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 12,
                    background: colors.btnPrimary,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <ExternalLink style={{ width: 14, height: 14 }} />
                  Open VS Code
                </a>

                {/* Delete environment */}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="Delete VS Code environment"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "none",
                    border: `1px solid ${dk ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}`,
                    color: "#ef4444",
                    fontSize: 12,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    opacity: isDeleting ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 600,
                  }}
                >
                  {isDeleting ? (
                    <Loader2 style={{ width: 13, height: 13, animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <X style={{ width: 13, height: 13 }} />
                  )}
                  Delete
                </button>
              </div>

              {/* Hint */}
              <p
                style={{
                  fontSize: 11,
                  color: colors.subText,
                  textAlign: "center",
                  marginTop: 14,
                  lineHeight: 1.5,
                }}
              >
                Copy the password, open VS Code, then paste it when prompted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
