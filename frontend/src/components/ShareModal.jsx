import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Globe, Lock, ChevronDown, Link2, QrCode } from "lucide-react";

const SHARE_URL = "https://sonar.app/share/abc123";

export default function ShareModal({ isOpen, onClose, projectName, isDark = false }) {
  const [copied, setCopied] = useState(false);
  const [access, setAccess] = useState("anyone"); // anyone | restricted
  const [showAccess, setShowAccess] = useState(false);
  const dk = isDark;

  const handleCopy = () => {
    navigator.clipboard.writeText(SHARE_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

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
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.22, type: "spring", bounce: 0.28 }}
            className="w-full rounded-2xl overflow-hidden"
            style={{
              maxWidth: "420px",
              background: dk ? "#0a0d14" : "linear-gradient(160deg, rgba(248,252,255,0.99) 0%, rgba(255,255,255,1) 100%)",
              border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.18)",
              boxShadow: dk ? "0 40px 80px rgba(0,0,0,0.7)" : "0 40px 80px rgba(20,60,140,0.15)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4"
              style={{ borderBottom: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.12)" }}>
              <h2 className="font-bold"
                style={{ fontSize: "16px", color: dk ? "#fff" : "#0a1a3e", fontFamily: "'Cabinet Grotesk',sans-serif" }}>
                Share project
              </h2>
              <button onClick={onClose} className="p-1 rounded-lg transition-colors"
                style={{ color: dk ? "#64748b" : "rgba(40,70,130,0.4)" }}
                onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Project info */}
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.12)",
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #0ea5e9)" }}>
                  <Globe style={{ width: 16, height: 16, color: "#000" }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ fontSize: "13px", color: dk ? "#e2e8f0" : "#0a1a3e", fontFamily: "'Manrope',sans-serif" }}>
                    {projectName || "untitled-app"}
                  </p>
                  <p style={{ fontSize: "11px", color: dk ? "rgba(100,116,139,0.6)" : "rgba(40,70,130,0.45)", fontFamily: "'Manrope',sans-serif" }}>
                    Published to sonar.app
                  </p>
                </div>
              </div>

              {/* Access control */}
              <div>
                <p className="mb-2" style={{ fontSize: "12px", fontWeight: 600, color: dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.5)", fontFamily: "'Manrope',sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Access
                </p>
                <div className="relative">
                  <button onClick={() => setShowAccess(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                    style={{
                      background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.15)",
                    }}>
                    <div className="flex items-center gap-2">
                      {access === "anyone"
                        ? <Globe style={{ width: 13, height: 13, color: dk ? "#06b6d4" : "#0284c7" }} />
                        : <Lock style={{ width: 13, height: 13, color: dk ? "#f59e0b" : "#d97706" }} />
                      }
                      <span style={{ fontSize: "13px", color: dk ? "#e2e8f0" : "#0a1a3e", fontFamily: "'Manrope',sans-serif" }}>
                        {access === "anyone" ? "Anyone with the link" : "Restricted access"}
                      </span>
                    </div>
                    <ChevronDown style={{ width: 14, height: 14, color: dk ? "#64748b" : "rgba(40,70,130,0.4)", transition: "transform 0.2s", transform: showAccess ? "rotate(180deg)" : "none" }} />
                  </button>

                  <AnimatePresence>
                    {showAccess && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-10"
                        style={{
                          background: dk ? "rgba(16,20,30,0.98)" : "rgba(255,255,255,0.98)",
                          border: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,140,220,0.18)",
                          boxShadow: dk ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(20,60,140,0.1)",
                        }}>
                        {[
                          { id: "anyone", icon: Globe, label: "Anyone with the link", iconColor: dk ? "#06b6d4" : "#0284c7" },
                          { id: "restricted", icon: Lock, label: "Restricted", iconColor: dk ? "#f59e0b" : "#d97706" },
                        ].map(({ id, icon: Ic, label, iconColor }) => (
                          <button key={id}
                            onClick={() => { setAccess(id); setShowAccess(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors"
                            style={{ background: access === id ? (dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") : "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background = access === id ? (dk ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") : "transparent"}>
                            <Ic style={{ width: 13, height: 13, color: iconColor }} />
                            <span style={{ fontSize: "13px", color: dk ? "#e2e8f0" : "#0a1a3e", fontFamily: "'Manrope',sans-serif" }}>{label}</span>
                            {access === id && <Check style={{ width: 12, height: 12, color: "#06b6d4", marginLeft: "auto" }} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Share link */}
              <div>
                <p className="mb-2" style={{ fontSize: "12px", fontWeight: 600, color: dk ? "rgba(100,116,139,0.7)" : "rgba(40,70,130,0.5)", fontFamily: "'Manrope',sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Share link
                </p>
                <div className="flex items-center gap-2 p-2 rounded-xl"
                  style={{
                    background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,140,220,0.12)",
                  }}>
                  <Link2 style={{ width: 14, height: 14, color: dk ? "#64748b" : "rgba(40,70,130,0.4)", flexShrink: 0, marginLeft: 4 }} />
                  <span className="flex-1 text-xs truncate" style={{ color: dk ? "rgba(180,195,215,0.8)" : "rgba(30,60,120,0.6)", fontFamily: "'Manrope',sans-serif" }}>
                    {SHARE_URL}
                  </span>
                  <motion.button onClick={handleCopy}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{
                      background: copied ? "rgba(16,185,129,0.12)" : "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                      color: copied ? "#10b981" : "#000",
                      border: copied ? "1px solid rgba(16,185,129,0.3)" : "none",
                    }}>
                    {copied ? <><Check style={{ width: 12, height: 12 }} /> Copied!</> : <><Copy style={{ width: 12, height: 12 }} /> Copy</>}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
