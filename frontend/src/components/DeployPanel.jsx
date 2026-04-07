import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cloud, Globe, Check, ExternalLink, Copy, RefreshCw, Zap, Rocket } from "lucide-react";
import { deployToVercel } from "../api/projects";

// Each step maps to a real backend SSE event
const STEPS = [
  { id: "packaging",    label: "Packaging artifacts"     },
  { id: "uploading",    label: "Uploading to Vercel CDN" },
  { id: "configuring",  label: "Configuring environment" },
  { id: "health_check", label: "Running health checks"   },
  { id: "live",         label: "Going live"              },
];

export default function DeployPanel({ isOpen, onClose, projectName, isDark = false, projectId, existingVercelUrl }) {
  const dk = isDark;

  // "idle" | "deploying" | "done" | "error"
  const [phase, setPhase]           = useState("idle");
  const [stepStates, setStepStates] = useState({}); // { [id]: "active"|"done"|"error" }
  const [deployedUrl, setDeployedUrl] = useState(null);
  const [errorMsg, setErrorMsg]     = useState("");
  const [copied, setCopied]         = useState(false);
  const abortRef = useRef(null);

  // When panel opens: if already deployed → done; else idle
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setErrorMsg("");
      if (existingVercelUrl) {
        setDeployedUrl(existingVercelUrl);
        setPhase("done");
        const allDone = {};
        STEPS.forEach(s => { allDone[s.id] = "done"; });
        setStepStates(allDone);
      } else {
        setPhase("idle");
        setStepStates({});
        setDeployedUrl(null);
      }
    } else {
      // Panel closing → abort any in-flight deploy
      abortRef.current?.abort();
    }
  }, [isOpen, existingVercelUrl]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const handleDeploy = () => {
    if (!projectId) {
      setErrorMsg("No project to deploy. Generate your app first.");
      setPhase("error");
      return;
    }
    setPhase("deploying");
    setStepStates({});
    setErrorMsg("");
    setDeployedUrl(null);

    const ctrl = deployToVercel(
      projectId,
      // onStep — real SSE event from backend
      ({ step, status, error }) => {
        setStepStates(prev => ({ ...prev, [step]: status === "error" ? "error" : status }));
        if (status === "error") {
          setErrorMsg(error || `Step "${step}" failed`);
          setPhase("error");
          ctrl.abort();
        }
      },
      // onComplete
      ({ url }) => {
        setDeployedUrl(url);
        setPhase("done");
      },
      // onError
      (msg) => {
        setErrorMsg(msg);
        setPhase("error");
      }
    );
    abortRef.current = ctrl;
  };

  const handleCopy = () => {
    if (!deployedUrl) return;
    navigator.clipboard.writeText(deployedUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRedeploy = () => {
    abortRef.current?.abort();
    setPhase("idle");
    setStepStates({});
    setDeployedUrl(null);
    setErrorMsg("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div key="deploy-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: dk ? "rgba(0,0,0,0.55)" : "rgba(30,60,140,0.18)", backdropFilter: "blur(4px)" }}
          />

          {/* Sliding panel */}
          <motion.div key="deploy-panel"
            initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }} transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: 380, zIndex: 50,
              display: "flex", flexDirection: "column",
              background: dk ? "linear-gradient(160deg, #0a0f1e 0%, #060912 100%)" : "linear-gradient(160deg, rgba(248,252,255,0.99) 0%, rgba(255,255,255,1) 100%)",
              borderLeft: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.18)",
              boxShadow: dk ? "-40px 0 80px rgba(0,0,0,0.6)" : "-20px 0 60px rgba(20,60,140,0.12)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 16px", borderBottom: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.12)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: dk ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.1)", border: dk ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(6,182,212,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Cloud style={{ width: 15, height: 15, color: "#06b6d4" }} />
                </div>
                <div>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: dk ? "#fff" : "#0a1a3e" }}>Deploy to Vercel</span>
                  {phase === "done" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                      <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "'DM Sans', sans-serif" }}>Deployed</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
              <AnimatePresence mode="wait">

                {/* ── IDLE ── */}
                {phase === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                    <motion.div
                      animate={{ boxShadow: ["0 0 28px rgba(6,182,212,0.2)", "0 0 48px rgba(6,182,212,0.35)", "0 0 28px rgba(6,182,212,0.2)"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: 96, height: 96, borderRadius: "50%", background: dk ? "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 100%)" : "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 100%)", border: dk ? "1.5px solid rgba(6,182,212,0.3)" : "1.5px solid rgba(6,182,212,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
                      <Globe style={{ width: 36, height: 36, color: "#06b6d4" }} />
                    </motion.div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: dk ? "#fff" : "#0a1a3e", marginBottom: 10 }}>Deploy your app</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, lineHeight: 1.65, color: dk ? "rgba(160,180,215,0.7)" : "rgba(40,70,130,0.55)", maxWidth: 260, margin: "0 auto" }}>
                        Get a permanent <strong style={{ color: dk ? "rgba(200,220,255,0.9)" : "#0a1a3e" }}>vercel.app</strong> URL accessible worldwide.
                      </p>
                    </div>
                    {projectName && projectName !== "untitled-app" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12, background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.14)", width: "100%" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #06b6d4, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Zap style={{ width: 13, height: 13, color: "#000" }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5, color: dk ? "#e2e8f0" : "#0a1a3e", letterSpacing: "-0.01em" }}>{projectName}</p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: dk ? "rgba(100,116,139,0.6)" : "rgba(40,70,130,0.45)" }}>Ready to deploy</p>
                        </div>
                      </div>
                    )}
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(6,182,212,0.35)" }} whileTap={{ scale: 0.98 }} onClick={handleDeploy}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", borderRadius: 14, background: dk ? "rgba(255,255,255,0.95)" : "linear-gradient(135deg, #06b6d4, #0ea5e9)", border: "none", cursor: "pointer", boxShadow: dk ? "0 4px 20px rgba(255,255,255,0.1)" : "0 4px 20px rgba(6,182,212,0.25)" }}>
                      <Rocket style={{ width: 15, height: 15, color: dk ? "#0a1a3e" : "#000" }} />
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: dk ? "#0a1a3e" : "#000" }}>Deploy to Vercel</span>
                    </motion.button>
                  </motion.div>
                )}

                {/* ── DEPLOYING — real SSE steps ── */}
                {phase === "deploying" && (
                  <motion.div key="deploying" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                      <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        style={{ width: 72, height: 72, borderRadius: "50%", background: dk ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.08)", border: "1.5px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Cloud style={{ width: 28, height: 28, color: "#06b6d4" }} />
                      </motion.div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: dk ? "#fff" : "#0a1a3e", marginBottom: 6 }}>Deploying to Vercel…</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: dk ? "rgba(160,180,215,0.55)" : "rgba(40,70,130,0.45)" }}>Each step is a real API call</p>
                    </div>

                    {/* Real steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {STEPS.map((step, i) => {
                        const state = stepStates[step.id]; // "active" | "done" | "error" | undefined
                        const isPending = !state;
                        const isActive  = state === "active";
                        const isDone    = state === "done";
                        const isError   = state === "error";

                        return (
                          <motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: isPending ? 0.32 : 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }}
                            style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isDone ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.55 }}>
                                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Check style={{ width: 11, height: 11, color: "#4ade80" }} />
                                  </div>
                                </motion.div>
                              ) : isError ? (
                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <X style={{ width: 11, height: 11, color: "#ef4444" }} />
                                </div>
                              ) : isActive ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                                  style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(6,182,212,0.2)", borderTopColor: "#06b6d4" }} />
                              ) : (
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: dk ? "rgba(100,116,139,0.3)" : "rgba(80,140,220,0.2)" }} />
                              )}
                            </div>
                            <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: isDone ? 500 : isActive ? 600 : 400, fontSize: 13, letterSpacing: "-0.01em", color: isDone ? "#4ade80" : isError ? "#ef4444" : isActive ? (dk ? "#e2e8f0" : "#0a1a3e") : (dk ? "rgba(100,116,139,0.45)" : "rgba(40,70,130,0.3)"), transition: "color 0.3s" }}>
                              {step.label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── ERROR ── */}
                {phase === "error" && (
                  <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
                      <X style={{ width: 28, height: 28, color: "#ef4444" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 18, color: dk ? "#fff" : "#0a1a3e", marginBottom: 8 }}>Deployment failed</p>
                      <p style={{ fontSize: 13, color: dk ? "rgba(239,68,68,0.8)" : "#dc2626", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "10px 14px", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                        {errorMsg}
                      </p>
                    </div>
                    <button onClick={() => setPhase("idle")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 12, background: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(80,140,220,0.15)", cursor: "pointer", color: dk ? "#e2e8f0" : "#0a1a3e", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
                      <RefreshCw style={{ width: 13, height: 13 }} /> Try again
                    </button>
                  </motion.div>
                )}

                {/* ── DONE ── */}
                {phase === "done" && deployedUrl && (
                  <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                    style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                        style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0.05) 70%)", border: "1.5px solid rgba(74,222,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(74,222,128,0.15)" }}>
                        <Check style={{ width: 32, height: 32, color: "#4ade80" }} />
                      </motion.div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: dk ? "#fff" : "#0a1a3e", marginBottom: 8 }}>App deployed!</motion.p>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: dk ? "rgba(160,180,215,0.6)" : "rgba(40,70,130,0.5)", lineHeight: 1.6 }}>
                        Your app is live on Vercel, accessible worldwide.
                      </motion.p>
                    </div>

                    {/* Live URL */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      style={{ padding: 14, borderRadius: 14, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
                      <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4ade80", marginBottom: 8 }}>Live URL</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Globe style={{ width: 13, height: 13, color: "#4ade80", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: dk ? "rgba(200,220,200,0.85)" : "#166534", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {deployedUrl}
                        </span>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={handleCopy}
                          style={{ padding: "5px 10px", borderRadius: 8, background: copied ? "rgba(74,222,128,0.15)" : (dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"), border: copied ? "1px solid rgba(74,222,128,0.3)" : (dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)"), cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
                          {copied ? <Check style={{ width: 12, height: 12, color: "#4ade80" }} /> : <Copy style={{ width: 12, height: 12, color: dk ? "rgba(200,215,235,0.7)" : "rgba(40,70,130,0.5)" }} />}
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: copied ? "#4ade80" : (dk ? "rgba(200,215,235,0.7)" : "rgba(40,70,130,0.5)") }}>
                            {copied ? "Copied!" : "Copy"}
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ display: "flex", gap: 10 }}>
                      <a href={deployedUrl} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", borderRadius: 12, background: "linear-gradient(135deg, #06b6d4, #0ea5e9)", color: "#000", textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "-0.01em", boxShadow: "0 4px 16px rgba(6,182,212,0.3)" }}>
                        <ExternalLink style={{ width: 13, height: 13 }} /> Open app
                      </a>
                      <button onClick={handleRedeploy}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", borderRadius: 12, background: dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.15)", cursor: "pointer", color: dk ? "rgba(180,195,215,0.7)" : "rgba(40,70,130,0.55)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}>
                        <RefreshCw style={{ width: 12, height: 12 }} /> Redeploy
                      </button>
                    </motion.div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
