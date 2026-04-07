import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check } from "lucide-react";
import { MODELS } from "../data/mockData";
import { ChatGPTIcon, ClaudeIcon, GeminiIcon } from "./AIIcons";

const LOADING_STEPS = [
  { label: "Loading cloud environment", duration: 800 },
  { label: "Allocating resources",      duration: 700 },
  { label: "Configuring environment",   duration: 900 },
  { label: "Starting agents",           duration: 600 },
];

function ModelBigIcon({ provider, size = 72 }) {
  if (provider === "openai")     return <span style={{ color: "#fff", opacity: 0.92, display: "flex" }}><ChatGPTIcon size={size} /></span>;
  if (provider === "anthropic")  return <span style={{ color: "#D97757", display: "flex" }}><ClaudeIcon size={size} /></span>;
  return <GeminiIcon size={size} />;
}

function getFileIcon(file) {
  if (!file || !file.type) return "📎";
  if (file.type.startsWith("image/")) return "🖼";
  if (file.type.startsWith("video/")) return "▶";
  if (file.type.startsWith("audio/")) return "♪";
  if (file.type.includes("pdf")) return "📄";
  if (file.type.includes("zip") || file.type.includes("compressed")) return "📦";
  if (file.type.includes("text") || (file.name && (file.name.endsWith(".js") || file.name.endsWith(".jsx") || file.name.endsWith(".ts")))) return "{ }";
  return "📎";
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function CostPreviewModal({ isOpen, onClose, onConfirm, prompt, selectedModel, mode = "S-1", attachedFiles = [], isDark = false }) {
  const model = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const dk = isDark;

  const [stepIndex, setStepIndex] = useState(-1);
  const [doneSteps, setDoneSteps] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(-1);
    setDoneSteps([]);
    setReady(false);

    let total = 0;
    LOADING_STEPS.forEach((step, i) => {
      setTimeout(() => setStepIndex(i), total);
      total += step.duration;
      setTimeout(() => setDoneSteps(prev => [...prev, i]), total);
    });
    setTimeout(() => { setStepIndex(-1); setReady(true); }, total + 200);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: dk ? "rgba(0,0,0,0.82)" : "rgba(100,140,210,0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.22, type: "spring", bounce: 0.28 }}
            className="w-full rounded-2xl overflow-hidden"
            style={{
              maxWidth: "380px",
              background: dk ? "#0a0d14" : "linear-gradient(160deg, rgba(248,252,255,0.99) 0%, rgba(255,255,255,1) 100%)",
              border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.18)",
              boxShadow: dk ? "0 40px 80px rgba(0,0,0,0.7)" : "0 40px 80px rgba(20,60,140,0.15)",
            }}
          >
            {/* Close */}
            <div className="flex justify-end px-5 pt-4">
              <button onClick={onClose} className="p-1 rounded-lg transition-colors"
                style={{ color: dk ? "#64748b" : "rgba(40,70,130,0.4)" }}
                onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Model icon + Agent type badge side by side */}
            <div className="flex flex-col items-center px-6 pb-2 pt-1">

              {/* Row: logo + big S-1/S-2 */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.35, type: "spring", bounce: 0.4 }}
                style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: 16 }}
              >
                {/* AI logo box */}
                <div style={{
                  width: 92, height: 92,
                  borderRadius: "22px",
                  background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <ModelBigIcon provider={model.provider} size={56} />
                </div>

                {/* Divider */}
                <div style={{
                  width: 1, height: 60, flexShrink: 0,
                  background: dk ? "rgba(255,255,255,0.08)" : "rgba(80,140,220,0.15)",
                }} />

                {/* Big S-1 / S-2 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                  <span style={{
                    fontSize: "48px",
                    fontWeight: 900,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    background: mode === "S-2"
                      ? "linear-gradient(135deg, #a78bfa, #7c3aed)"
                      : "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    {mode}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    fontFamily: "'Manrope', sans-serif",
                    letterSpacing: "0.08em",
                    color: mode === "S-2"
                      ? (dk ? "rgba(167,139,250,0.7)" : "rgba(109,40,217,0.55)")
                      : (dk ? "rgba(6,182,212,0.7)" : "rgba(6,182,212,0.75)"),
                    textTransform: "uppercase",
                  }}>
                    {mode === "S-2" ? "Profond · Tenace" : "Stable · Approfondi"}
                  </span>
                </div>
              </motion.div>

              {/* Model name + provider */}
              <p style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                letterSpacing: "-0.02em",
                color: dk ? "#fff" : "#0a1a3e",
                marginBottom: "3px",
                lineHeight: 1.15,
              }}>
                {model.label}
              </p>
              <p style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                letterSpacing: "0.01em",
                color: dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.45)",
                marginBottom: 20,
              }}>
                {model.provider === "openai" ? "OpenAI" : model.provider === "anthropic" ? "Anthropic" : "Google DeepMind"}
              </p>

              {/* Prompt pill */}
              <div className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.12)",
                  marginBottom: attachedFiles.length > 0 ? 0 : 20,
                  borderRadius: attachedFiles.length > 0 ? "12px 12px 0 0" : "12px",
                  borderBottom: attachedFiles.length > 0 ? "none" : undefined,
                }}>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: dk ? "rgba(180,195,215,0.65)" : "rgba(30,60,120,0.55)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {prompt}
                </p>
              </div>

              {/* Attached Files — same style as home */}
              {attachedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.22 }}
                  className="w-full"
                  style={{
                    padding: "12px 14px",
                    background: dk ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                    border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.12)",
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {attachedFiles.map((file, idx) => {
                      const isImage = file.type.startsWith("image/");
                      const isVideo = file.type.startsWith("video/");
                      const previewUrl = isImage ? URL.createObjectURL(file) : null;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + idx * 0.05, duration: 0.2 }}
                          style={{
                            position: "relative",
                            width: "76px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            background: dk ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.06)",
                            border: dk ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(80,120,200,0.18)",
                          }}
                        >
                          {/* Thumbnail */}
                          <div style={{
                            width: "100%",
                            height: "76px",
                            background: previewUrl
                              ? `url(${previewUrl}) center/cover`
                              : (dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}>
                            {!previewUrl && (
                              <span style={{
                                fontSize: isVideo ? "26px" : "22px",
                                color: isVideo ? "#ef4444" : (dk ? "rgba(200,220,245,0.6)" : "rgba(40,70,130,0.5)"),
                                background: isVideo ? "rgba(239,68,68,0.15)" : (dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                                borderRadius: isVideo ? "8px" : "0",
                                width: isVideo ? "38px" : "auto",
                                height: isVideo ? "38px" : "auto",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                padding: isVideo ? "0" : "4px",
                              }}>
                                {getFileIcon(file)}
                              </span>
                            )}
                            {isVideo && previewUrl && (
                              <div style={{
                                position: "absolute", inset: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(0,0,0,0.3)",
                              }}>
                                <div style={{
                                  width: "28px", height: "28px", borderRadius: "6px",
                                  background: "#ef4444", display: "flex",
                                  alignItems: "center", justifyContent: "center",
                                  color: "#fff", fontSize: "12px",
                                }}>▶</div>
                              </div>
                            )}
                          </div>
                          {/* File info */}
                          <div style={{
                            padding: "5px 7px",
                            background: dk ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.07)",
                          }}>
                            <p style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "9.5px",
                              fontWeight: 500,
                              color: dk ? "rgba(220,235,250,0.9)" : "#0a1a3e",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginBottom: "1px",
                              letterSpacing: "0.01em",
                            }}>{file.name}</p>
                            <p style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "8.5px",
                              fontWeight: 400,
                              color: dk ? "rgba(160,185,220,0.45)" : "rgba(40,70,130,0.45)",
                              letterSpacing: "0.01em",
                            }}>{formatFileSize(file.size)}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Loading steps */}
            <div className="px-6 pb-5 space-y-2">
              {LOADING_STEPS.map((step, i) => {
                const isDone    = doneSteps.includes(i);
                const isActive  = stepIndex === i;
                const isPending = stepIndex < i && !isDone;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <div style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isDone ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                          <Check style={{ width: 14, height: 14, color: "#4ade80" }} />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                          style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: "2px solid rgba(6,182,212,0.2)",
                            borderTopColor: "#06b6d4",
                          }}
                        />
                      ) : (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dk ? "rgba(100,116,139,0.35)" : "rgba(80,140,220,0.25)" }} />
                      )}
                    </div>

                    <span style={{
                      fontSize: "13px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: isDone ? 500 : isActive ? 600 : 400,
                      letterSpacing: "-0.01em",
                      color: isDone ? "#4ade80" : isActive ? (dk ? "#e2e8f0" : "#0a1a3e") : (dk ? "rgba(100,116,139,0.5)" : "rgba(40,70,130,0.35)"),
                      transition: "color 0.3s",
                    }}>
                      {step.label}
                    </span>

                    {isActive && (
                      <motion.div
                        className="flex-1 h-px rounded-full ml-2"
                        style={{ background: dk ? "rgba(255,255,255,0.06)" : "rgba(80,140,220,0.12)", overflow: "hidden" }}
                      >
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: step.duration / 1000, ease: "linear" }}
                          style={{ height: "100%", background: "linear-gradient(90deg, #06b6d4, #0ea5e9)" }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl transition-all"
                style={{
                  background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.15)",
                  color: dk ? "#64748b" : "rgba(40,70,130,0.5)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "13.5px",
                  letterSpacing: "-0.01em",
                }}
              >
                Cancel
              </button>
              <motion.button
                data-testid="confirm-generate-btn"
                onClick={ready ? onConfirm : undefined}
                animate={ready ? { opacity: 1 } : { opacity: 0.4 }}
                transition={{ duration: 0.4 }}
                whileHover={ready ? { scale: 1.02 } : {}}
                whileTap={ready ? { scale: 0.98 } : {}}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                  color: "#000",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "-0.01em",
                  boxShadow: ready ? "0 0 20px rgba(6,182,212,0.35)" : "none",
                  cursor: ready ? "pointer" : "not-allowed",
                }}
              >
                {ready ? (
                  <> Generate <ArrowRight style={{ width: 14, height: 14 }} /> </>
                ) : (
                  <span style={{
                    color: "rgba(0,0,0,0.45)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: "13px",
                  }}>Preparing...</span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
