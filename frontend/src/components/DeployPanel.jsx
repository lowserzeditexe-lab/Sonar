import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cloud, Globe, Upload, Check, ExternalLink, Copy, RefreshCw, Zap } from "lucide-react";

const DEPLOY_STEPS = [
  { label: "Packaging artifacts",      duration: 900 },
  { label: "Pushing to CDN",           duration: 700 },
  { label: "Configuring environment",  duration: 1100 },
  { label: "Running health checks",    duration: 800 },
  { label: "Going live",               duration: 600 },
];

const LIVE_URL = "https://my-app.sonar.sh";

export default function DeployPanel({ isOpen, onClose, projectName, isDark = false }) {
  const dk = isDark;

  // states: "idle" | "deploying" | "done"
  const [phase, setPhase] = useState("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [doneSteps, setDoneSteps] = useState([]);
  const [copied, setCopied] = useState(false);

  // reset when panel opens
  useEffect(() => {
    if (isOpen) {
      setPhase("idle");
      setStepIndex(-1);
      setDoneSteps([]);
      setCopied(false);
    }
  }, [isOpen]);

  // close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const handleDeploy = () => {
    setPhase("deploying");
    setStepIndex(-1);
    setDoneSteps([]);

    let total = 0;
    DEPLOY_STEPS.forEach((step, i) => {
      setTimeout(() => setStepIndex(i), total + 200);
      total += step.duration;
      setTimeout(() => setDoneSteps(prev => [...prev, i]), total + 200);
    });
    setTimeout(() => {
      setStepIndex(-1);
      setPhase("done");
    }, total + 400);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(LIVE_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRedeploy = () => {
    setPhase("idle");
    setStepIndex(-1);
    setDoneSteps([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="deploy-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: dk ? "rgba(0,0,0,0.55)" : "rgba(30,60,140,0.18)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Panel */}
          <motion.div
            key="deploy-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "380px",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              background: dk
                ? "linear-gradient(160deg, #0a0f1e 0%, #060912 100%)"
                : "linear-gradient(160deg, rgba(248,252,255,0.99) 0%, rgba(255,255,255,1) 100%)",
              borderLeft: dk
                ? "1px solid rgba(255,255,255,0.07)"
                : "1px solid rgba(80,140,220,0.18)",
              boxShadow: dk
                ? "-40px 0 80px rgba(0,0,0,0.6)"
                : "-20px 0 60px rgba(20,60,140,0.12)",
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px 16px",
                borderBottom: dk
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid rgba(80,140,220,0.12)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "10px",
                  background: dk
                    ? "rgba(6,182,212,0.12)"
                    : "rgba(6,182,212,0.1)",
                  border: dk
                    ? "1px solid rgba(6,182,212,0.25)"
                    : "1px solid rgba(6,182,212,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Cloud style={{ width: 15, height: 15, color: "#06b6d4" }} />
                </div>
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  letterSpacing: "-0.02em",
                  color: dk ? "#fff" : "#0a1a3e",
                }}>
                  Deployments
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: "8px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.4)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
                  e.currentTarget.style.color = dk ? "#e2e8f0" : "#0a1a3e";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.4)";
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
              <AnimatePresence mode="wait">

                {/* ── IDLE: CTA ── */}
                {phase === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}
                  >
                    {/* Glowing globe */}
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 28px rgba(6,182,212,0.2), 0 0 0 0 rgba(6,182,212,0)",
                          "0 0 48px rgba(6,182,212,0.35), 0 0 80px rgba(6,182,212,0.1)",
                          "0 0 28px rgba(6,182,212,0.2), 0 0 0 0 rgba(6,182,212,0)",
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        width: 96, height: 96, borderRadius: "50%",
                        background: dk
                          ? "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 60%, transparent 100%)"
                          : "radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.04) 60%, transparent 100%)",
                        border: dk
                          ? "1.5px solid rgba(6,182,212,0.3)"
                          : "1.5px solid rgba(6,182,212,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: "16px",
                      }}
                    >
                      <Globe style={{ width: 36, height: 36, color: "#06b6d4" }} />
                    </motion.div>

                    {/* Text */}
                    <div style={{ textAlign: "center" }}>
                      <p style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800,
                        fontSize: "22px",
                        letterSpacing: "-0.03em",
                        color: dk ? "#fff" : "#0a1a3e",
                        marginBottom: "10px",
                      }}>
                        Take your app live!
                      </p>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: "13.5px",
                        lineHeight: 1.65,
                        color: dk ? "rgba(160,180,215,0.7)" : "rgba(40,70,130,0.55)",
                        maxWidth: "260px",
                        margin: "0 auto",
                      }}>
                        Deploy to an Emergent hosted production&#8209;ready environment and get a live URL for your app.
                      </p>
                    </div>

                    {/* Project name pill */}
                    {projectName && projectName !== "untitled-app" && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 14px",
                        borderRadius: "12px",
                        background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.14)",
                        width: "100%",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
                          background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Zap style={{ width: 13, height: 13, color: "#000" }} />
                        </div>
                        <div>
                          <p style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 600, fontSize: "12.5px",
                            color: dk ? "#e2e8f0" : "#0a1a3e",
                            letterSpacing: "-0.01em",
                          }}>{projectName}</p>
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "11px",
                            color: dk ? "rgba(100,116,139,0.6)" : "rgba(40,70,130,0.45)",
                          }}>Prêt pour le déploiement</p>
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(6,182,212,0.35)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeploy}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "13px 20px",
                        borderRadius: "14px",
                        background: dk
                          ? "rgba(255,255,255,0.95)"
                          : "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: dk
                          ? "0 4px 20px rgba(255,255,255,0.1)"
                          : "0 4px 20px rgba(6,182,212,0.25)",
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      <Upload style={{
                        width: 15, height: 15,
                        color: dk ? "#0a1a3e" : "#000",
                      }} />
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        letterSpacing: "-0.01em",
                        color: dk ? "#0a1a3e" : "#000",
                      }}>
                        Démarrer le déploiement
                      </span>
                    </motion.button>
                  </motion.div>
                )}

                {/* ── DEPLOYING: Progress ── */}
                {phase === "deploying" && (
                  <motion.div
                    key="deploying"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "flex", flexDirection: "column", gap: "28px" }}
                  >
                    {/* Pulsing icon */}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                      <motion.div
                        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          width: 72, height: 72, borderRadius: "50%",
                          background: dk
                            ? "rgba(6,182,212,0.12)"
                            : "rgba(6,182,212,0.08)",
                          border: "1.5px solid rgba(6,182,212,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Cloud style={{ width: 28, height: 28, color: "#06b6d4" }} />
                      </motion.div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <p style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700, fontSize: "18px",
                        letterSpacing: "-0.02em",
                        color: dk ? "#fff" : "#0a1a3e",
                        marginBottom: "6px",
                      }}>Déploiement en cours…</p>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "13px",
                        color: dk ? "rgba(160,180,215,0.55)" : "rgba(40,70,130,0.45)",
                      }}>
                        Ça prend généralement moins d'une minute
                      </p>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {DEPLOY_STEPS.map((step, i) => {
                        const isDone   = doneSteps.includes(i);
                        const isActive = stepIndex === i;
                        const isPending = !isDone && !isActive;

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: isPending ? 0.32 : 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.2 }}
                            style={{ display: "flex", alignItems: "center", gap: "12px" }}
                          >
                            {/* Indicator */}
                            <div style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isDone ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.55 }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: "50%",
                                    background: "rgba(74,222,128,0.15)",
                                    border: "1px solid rgba(74,222,128,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <Check style={{ width: 11, height: 11, color: "#4ade80" }} />
                                  </div>
                                </motion.div>
                              ) : isActive ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                                  style={{
                                    width: 16, height: 16, borderRadius: "50%",
                                    border: "2px solid rgba(6,182,212,0.2)",
                                    borderTopColor: "#06b6d4",
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: 7, height: 7, borderRadius: "50%",
                                  background: dk ? "rgba(100,116,139,0.3)" : "rgba(80,140,220,0.2)",
                                }} />
                              )}
                            </div>

                            {/* Label */}
                            <span style={{
                              flex: 1,
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: isDone ? 500 : isActive ? 600 : 400,
                              fontSize: "13px",
                              letterSpacing: "-0.01em",
                              color: isDone
                                ? "#4ade80"
                                : isActive
                                ? (dk ? "#e2e8f0" : "#0a1a3e")
                                : (dk ? "rgba(100,116,139,0.45)" : "rgba(40,70,130,0.3)"),
                              transition: "color 0.3s",
                            }}>
                              {step.label}
                            </span>

                            {/* Progress bar when active */}
                            {isActive && (
                              <div style={{
                                width: "60px", height: "3px", borderRadius: "999px",
                                background: dk ? "rgba(255,255,255,0.06)" : "rgba(80,140,220,0.1)",
                                overflow: "hidden", flexShrink: 0,
                              }}>
                                <motion.div
                                  initial={{ width: "0%" }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: step.duration / 1000, ease: "linear" }}
                                  style={{ height: "100%", background: "linear-gradient(90deg, #06b6d4, #0ea5e9)" }}
                                />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── DONE: Success ── */}
                {phase === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex", flexDirection: "column", gap: "22px" }}
                  >
                    {/* Success badge */}
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                        style={{
                          width: 80, height: 80, borderRadius: "50%",
                          background: "radial-gradient(circle, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0.05) 70%)",
                          border: "1.5px solid rgba(74,222,128,0.35)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 0 40px rgba(74,222,128,0.15)",
                        }}
                      >
                        <Check style={{ width: 32, height: 32, color: "#4ade80" }} />
                      </motion.div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 800, fontSize: "20px",
                          letterSpacing: "-0.03em",
                          color: dk ? "#fff" : "#0a1a3e",
                          marginBottom: "8px",
                        }}
                      >
                        App déployée !
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "13px",
                          color: dk ? "rgba(160,180,215,0.6)" : "rgba(40,70,130,0.5)",
                          lineHeight: 1.6,
                        }}
                      >
                        Ton application est en ligne et accessible à tous.
                      </motion.p>
                    </div>

                    {/* Live URL card */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      style={{
                        padding: "14px 14px",
                        borderRadius: "14px",
                        background: dk
                          ? "rgba(74,222,128,0.06)"
                          : "rgba(74,222,128,0.06)",
                        border: "1px solid rgba(74,222,128,0.2)",
                      }}
                    >
                      <p style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 700, fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#4ade80",
                        marginBottom: "8px",
                      }}>
                        Live URL
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Globe style={{ width: 13, height: 13, color: "#4ade80", flexShrink: 0 }} />
                        <span style={{
                          flex: 1,
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "13px",
                          color: dk ? "rgba(200,220,200,0.85)" : "#166534",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {LIVE_URL}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                          onClick={handleCopy}
                          style={{
                            padding: "5px 10px", borderRadius: "8px",
                            background: copied ? "rgba(74,222,128,0.15)" : (dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"),
                            border: copied ? "1px solid rgba(74,222,128,0.3)" : (dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)"),
                            cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "4px",
                            transition: "all 0.2s",
                          }}
                        >
                          {copied
                            ? <Check style={{ width: 12, height: 12, color: "#4ade80" }} />
                            : <Copy style={{ width: 12, height: 12, color: dk ? "rgba(200,215,235,0.7)" : "rgba(40,70,130,0.5)" }} />
                          }
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "11px",
                            color: copied ? "#4ade80" : (dk ? "rgba(200,215,235,0.7)" : "rgba(40,70,130,0.5)"),
                          }}>
                            {copied ? "Copié !" : "Copier"}
                          </span>
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Open + Redeploy buttons */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      style={{ display: "flex", gap: "10px" }}
                    >
                      <a
                        href={LIVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                          padding: "11px 0",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                          color: "#000",
                          textDecoration: "none",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 700, fontSize: "13px",
                          letterSpacing: "-0.01em",
                          boxShadow: "0 4px 16px rgba(6,182,212,0.3)",
                        }}
                      >
                        <ExternalLink style={{ width: 13, height: 13 }} />
                        Ouvrir
                      </a>
                      <button
                        onClick={handleRedeploy}
                        style={{
                          flex: 1,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                          padding: "11px 0",
                          borderRadius: "12px",
                          background: dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.15)",
                          cursor: "pointer",
                          color: dk ? "rgba(180,195,215,0.7)" : "rgba(40,70,130,0.55)",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 600, fontSize: "13px",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        <RefreshCw style={{ width: 12, height: 12 }} />
                        Redéployer
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
