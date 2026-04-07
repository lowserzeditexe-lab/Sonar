import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

const TH = {
  dark: {
    backdrop: "rgba(0,0,0,0.65)",
    cardBg: "linear-gradient(160deg, rgba(16,26,65,0.92) 0%, rgba(6,8,22,0.97) 100%)",
    cardBorder: "1px solid rgba(255,255,255,0.13)",
    cardShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 40px 100px rgba(0,0,0,0.85), 0 0 80px rgba(6,40,160,0.12)",
    closeBg: "rgba(255,255,255,0.06)",
    closeHoverBg: "rgba(255,255,255,0.12)",
    closeColor: "rgba(255,255,255,0.4)",
    closeHoverColor: "#fff",
    logoBg: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
    logoBorder: "1px solid rgba(255,255,255,0.14)",
    logoShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
    logoText: "#fff",
    titleColor: "#fff",
    descColor: "rgba(160,178,200,0.65)",
    footerColor: "rgba(255,255,255,0.25)",
  },
  light: {
    backdrop: "rgba(100,130,200,0.25)",
    cardBg: "linear-gradient(160deg, rgba(245,250,255,0.98) 0%, rgba(255,255,255,0.99) 100%)",
    cardBorder: "1px solid rgba(80,120,200,0.18)",
    cardShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 40px 100px rgba(40,80,180,0.15)",
    closeBg: "rgba(0,0,0,0.04)",
    closeHoverBg: "rgba(0,0,0,0.1)",
    closeColor: "rgba(40,60,120,0.4)",
    closeHoverColor: "#1e3264",
    logoBg: "linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)",
    logoBorder: "1px solid rgba(80,120,200,0.18)",
    logoShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
    logoText: "#080f28",
    titleColor: "#080f28",
    descColor: "rgba(40,60,120,0.55)",
    footerColor: "rgba(40,60,120,0.35)",
  },
};

export default function LoginModal({ open, onClose, onGoToAuth, isDark = true }) {
  const t = TH[isDark ? "dark" : "light"];

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            data-testid="login-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: t.backdrop,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Card */}
          <motion.div
            key="modal"
            data-testid="login-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <div
              data-testid="login-modal-inner"
              style={{
                width: "100%",
                maxWidth: "380px",
                background: t.cardBg,
                backdropFilter: "blur(48px)",
                WebkitBackdropFilter: "blur(48px)",
                border: t.cardBorder,
                borderRadius: "24px",
                boxShadow: t.cardShadow,
                padding: "40px 36px 36px",
                textAlign: "center",
                position: "relative",
                pointerEvents: "all",
              }}
            >
            {/* Close */}
            <button
              data-testid="login-modal-close"
              onClick={onClose}
              style={{
                position: "absolute", top: 14, right: 14,
                width: 28, height: 28, borderRadius: "8px",
                border: "none", background: t.closeBg,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", color: t.closeColor,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = t.closeHoverBg; e.currentTarget.style.color = t.closeHoverColor; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.closeBg; e.currentTarget.style.color = t.closeColor; }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>

            {/* Sonar logo */}
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "10px 20px",
              background: t.logoBg,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: t.logoBorder,
              borderRadius: "14px",
              boxShadow: t.logoShadow,
              margin: "0 auto 22px",
            }}>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: "1.15rem",
                letterSpacing: "-0.05em",
                color: t.logoText,
              }}>
                sonar
              </span>
            </div>

            {/* Text */}
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700, fontSize: "1.25rem",
              letterSpacing: "-0.03em", color: t.titleColor,
              marginBottom: 10,
            }}>
              Connectez-vous pour continuer
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13.5px",
              color: t.descColor,
              lineHeight: 1.6,
              marginBottom: 28,
            }}>
              Sonar est réservé aux membres. Créez un compte gratuit ou connectez-vous pour commencer à builder.
            </p>

            {/* CTA */}
            <motion.button
              data-testid="login-modal-cta"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { onClose(); onGoToAuth(); }}
              style={{
                width: "100%", padding: "13px 0",
                borderRadius: "12px", border: "none",
                background: "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 60%, #7dd3fc 100%)",
                color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700, fontSize: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, boxShadow: "0 4px 24px rgba(14,165,233,0.35)",
                marginBottom: 12,
              }}
            >
              Se connecter <ArrowRight style={{ width: 15, height: 15 }} />
            </motion.button>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: t.footerColor,
            }}>
              Gratuit · Aucune carte bancaire requise
            </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
