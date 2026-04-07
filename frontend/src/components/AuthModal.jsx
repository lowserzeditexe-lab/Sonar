import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ── Theme tokens ──────────────────────────────────────────────────────────────
const TH = {
  dark: {
    backdrop: "rgba(0,0,0,0.72)",
    cardBg: "linear-gradient(160deg, rgba(14,22,52,0.98) 0%, rgba(4,6,18,0.99) 100%)",
    cardBorder: "1px solid rgba(255,255,255,0.11)",
    cardShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 48px 120px rgba(0,0,0,0.9), 0 0 80px rgba(6,40,160,0.12)",
    closeColor: "rgba(255,255,255,0.35)",
    closeHoverColor: "#fff",
    closeBg: "rgba(255,255,255,0.06)",
    closeHoverBg: "rgba(255,255,255,0.12)",
    logoText: "#fff",
    logoBg: "rgba(255,255,255,0.07)",
    logoBorder: "1px solid rgba(255,255,255,0.1)",
    tabBg: "rgba(255,255,255,0.04)",
    tabBorder: "1px solid rgba(255,255,255,0.08)",
    tabActiveBg: "rgba(255,255,255,0.1)",
    tabActiveText: "#fff",
    tabInactiveText: "rgba(255,255,255,0.38)",
    labelColor: "rgba(180,200,230,0.65)",
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "1px solid rgba(255,255,255,0.1)",
    inputFocusBorder: "rgba(56,189,248,0.5)",
    inputFocusShadow: "0 0 0 3px rgba(56,189,248,0.12)",
    inputText: "#e2e8f0",
    inputPlaceholder: "rgba(255,255,255,0.22)",
    switchText: "rgba(255,255,255,0.35)",
    switchLink: "#38bdf8",
    errorBg: "rgba(239,68,68,0.1)",
    errorBorder: "rgba(239,68,68,0.25)",
    errorText: "#fca5a5",
    divider: "rgba(255,255,255,0.07)",
    termsText: "rgba(255,255,255,0.22)",
  },
  light: {
    backdrop: "rgba(80,120,200,0.2)",
    cardBg: "linear-gradient(160deg, rgba(245,250,255,0.99) 0%, rgba(255,255,255,1) 100%)",
    cardBorder: "1px solid rgba(80,120,200,0.18)",
    cardShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 48px 120px rgba(30,70,180,0.18)",
    closeColor: "rgba(40,60,120,0.4)",
    closeHoverColor: "#1e3264",
    closeBg: "rgba(0,0,0,0.04)",
    closeHoverBg: "rgba(0,0,0,0.09)",
    logoText: "#080f28",
    logoBg: "rgba(0,0,0,0.04)",
    logoBorder: "1px solid rgba(80,120,200,0.15)",
    tabBg: "rgba(0,0,0,0.03)",
    tabBorder: "1px solid rgba(80,120,200,0.12)",
    tabActiveBg: "rgba(255,255,255,0.85)",
    tabActiveText: "#0a1a3e",
    tabInactiveText: "rgba(10,40,90,0.4)",
    labelColor: "rgba(30,60,120,0.65)",
    inputBg: "rgba(255,255,255,0.7)",
    inputBorder: "1px solid rgba(80,120,200,0.2)",
    inputFocusBorder: "rgba(14,165,233,0.5)",
    inputFocusShadow: "0 0 0 3px rgba(14,165,233,0.1)",
    inputText: "#0a1a3e",
    inputPlaceholder: "rgba(10,40,90,0.3)",
    switchText: "rgba(10,40,90,0.4)",
    switchLink: "#0ea5e9",
    errorBg: "rgba(239,68,68,0.06)",
    errorBorder: "rgba(239,68,68,0.18)",
    errorText: "#dc2626",
    divider: "rgba(80,120,200,0.1)",
    termsText: "rgba(10,40,90,0.28)",
  },
};

function InputField({ label, type = "text", value, onChange, placeholder, isDark, error, autoFocus = false, children }) {
  const t = TH[isDark ? "dark" : "light"];
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "14px" }}>
      {label && (
        <label style={{
          display: "block", marginBottom: "6px",
          fontSize: "12px", fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500, color: t.labelColor,
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "11px 14px",
            paddingRight: children ? "42px" : "14px",
            background: t.inputBg,
            border: focused ? `1px solid ${t.inputFocusBorder}` : t.inputBorder,
            borderRadius: "10px",
            boxShadow: focused ? t.inputFocusShadow : "none",
            color: t.inputText,
            fontSize: "13.5px",
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            transition: "border 0.15s, box-shadow 0.15s",
            backdropFilter: "blur(8px)",
          }}
        />
        {children && (
          <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
            {children}
          </div>
        )}
      </div>
      {error && (
        <p style={{ marginTop: "5px", fontSize: "11.5px", color: t.errorText, fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function AuthModal({ open, onClose, isDark = true, defaultTab = "login" }) {
  const t = TH[isDark ? "dark" : "light"];
  const { login, register } = useAuth();

  const [tab, setTab] = useState(defaultTab);   // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Reset form on tab change
  useEffect(() => { setError(""); }, [tab]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Sync defaultTab when modal opens
  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    setError("");
    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) return;
    if (regPassword.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setError("");
    setLoading(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="auth-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 1100,
              background: t.backdrop,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          {/* Modal card */}
          <motion.div
            key="auth-modal"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1101,
              pointerEvents: "none",
              padding: "20px",
            }}
          >
            <div
              data-testid="auth-modal"
              style={{
                width: "100%",
                maxWidth: "420px",
                background: t.cardBg,
                backdropFilter: "blur(48px)",
                WebkitBackdropFilter: "blur(48px)",
                border: t.cardBorder,
                borderRadius: "24px",
                boxShadow: t.cardShadow,
                padding: "36px 36px 32px",
                position: "relative",
                pointerEvents: "all",
              }}
            >
              {/* Close button */}
              <button
                data-testid="auth-modal-close"
                onClick={onClose}
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 30, height: 30, borderRadius: "9px",
                  border: "none", background: t.closeBg,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", color: t.closeColor,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = t.closeHoverBg; e.currentTarget.style.color = t.closeHoverColor; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.closeBg; e.currentTarget.style.color = t.closeColor; }}
              >
                <X style={{ width: 13, height: 13 }} />
              </button>

              {/* Logo */}
              <div style={{ textAlign: "center", marginBottom: "22px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "8px 18px",
                  background: t.logoBg,
                  border: t.logoBorder,
                  borderRadius: "12px",
                  marginBottom: "16px",
                }}>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                    fontSize: "1.1rem", letterSpacing: "-0.05em", color: t.logoText,
                  }}>
                    sonar
                  </span>
                </div>
                <h2 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700, fontSize: "1.15rem",
                  letterSpacing: "-0.03em",
                  color: tab === "login"
                    ? (isDark ? "#fff" : "#0a1a3e")
                    : (isDark ? "#fff" : "#0a1a3e"),
                  margin: 0,
                }}>
                  {tab === "login" ? "Bon retour parmi nous" : "Créez votre compte"}
                </h2>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
                  color: isDark ? "rgba(140,165,200,0.55)" : "rgba(40,70,130,0.5)",
                  marginTop: "5px",
                }}>
                  {tab === "login"
                    ? "Connectez-vous pour continuer à builder"
                    : "Gratuit · Aucune carte bancaire requise"}
                </p>
              </div>

              {/* Tabs */}
              <div style={{
                display: "flex",
                background: t.tabBg,
                border: t.tabBorder,
                borderRadius: "12px",
                padding: "3px",
                marginBottom: "22px",
              }}>
                {[
                  { key: "login", label: "Se connecter" },
                  { key: "register", label: "Créer un compte" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    data-testid={`auth-tab-${key}`}
                    onClick={() => setTab(key)}
                    style={{
                      flex: 1, padding: "8px 0",
                      borderRadius: "9px", border: "none",
                      background: tab === key ? t.tabActiveBg : "transparent",
                      color: tab === key ? t.tabActiveText : t.tabInactiveText,
                      fontSize: "12.5px",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: tab === key ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.18s",
                      boxShadow: tab === key
                        ? "0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)"
                        : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: t.errorBg,
                      border: `1px solid ${t.errorBorder}`,
                      borderRadius: "10px",
                      padding: "10px 14px",
                      marginBottom: "16px",
                      fontSize: "12.5px",
                      color: t.errorText,
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Login form ── */}
              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleLogin}
                  >
                    <InputField
                      label="Email"
                      type="email"
                      value={loginEmail}
                      onChange={e => { setLoginEmail(e.target.value); setError(""); }}
                      placeholder="vous@exemple.com"
                      isDark={isDark}
                      autoFocus
                    />
                    <InputField
                      label="Mot de passe"
                      type={showLoginPwd ? "text" : "password"}
                      value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      isDark={isDark}
                    >
                      <button
                        type="button"
                        onClick={() => setShowLoginPwd(v => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(150,175,210,0.5)" : "rgba(40,80,150,0.4)", padding: 0, display: "flex" }}
                      >
                        {showLoginPwd
                          ? <EyeOff style={{ width: 15, height: 15 }} />
                          : <Eye style={{ width: 15, height: 15 }} />}
                      </button>
                    </InputField>

                    <motion.button
                      type="submit"
                      data-testid="auth-modal-submit-login"
                      disabled={loading || !loginEmail.trim() || !loginPassword}
                      whileHover={(!loading && loginEmail.trim() && loginPassword) ? { scale: 1.02 } : {}}
                      whileTap={(!loading && loginEmail.trim() && loginPassword) ? { scale: 0.98 } : {}}
                      style={{
                        width: "100%", padding: "12px 0",
                        borderRadius: "11px", border: "none",
                        background: (loading || !loginEmail.trim() || !loginPassword)
                          ? (isDark ? "rgba(40,55,80,0.5)" : "rgba(80,120,200,0.25)")
                          : "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 60%, #7dd3fc 100%)",
                        color: (loading || !loginEmail.trim() || !loginPassword)
                          ? (isDark ? "rgba(100,130,170,0.5)" : "rgba(40,80,160,0.4)")
                          : "#fff",
                        fontSize: "14px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        cursor: (loading || !loginEmail.trim() || !loginPassword) ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        marginTop: "6px",
                        boxShadow: (loading || !loginEmail.trim() || !loginPassword)
                          ? "none"
                          : "0 4px 24px rgba(14,165,233,0.35)",
                        transition: "all 0.2s",
                      }}
                    >
                      {loading ? (
                        <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                      ) : (
                        <>Se connecter <ArrowRight style={{ width: 15, height: 15 }} /></>
                      )}
                    </motion.button>

                    <p style={{
                      textAlign: "center", marginTop: "14px",
                      fontSize: "12px", color: t.switchText,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Pas de compte ?{" "}
                      <button
                        type="button"
                        onClick={() => setTab("register")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: t.switchLink, fontWeight: 500, padding: 0, fontSize: "12px" }}
                      >
                        Créer un compte
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  /* ── Register form ── */
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleRegister}
                  >
                    <InputField
                      label="Nom complet"
                      type="text"
                      value={regName}
                      onChange={e => { setRegName(e.target.value); setError(""); }}
                      placeholder="Jean Dupont"
                      isDark={isDark}
                      autoFocus
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={regEmail}
                      onChange={e => { setRegEmail(e.target.value); setError(""); }}
                      placeholder="vous@exemple.com"
                      isDark={isDark}
                    />
                    <InputField
                      label="Mot de passe"
                      type={showRegPwd ? "text" : "password"}
                      value={regPassword}
                      onChange={e => { setRegPassword(e.target.value); setError(""); }}
                      placeholder="6 caractères minimum"
                      isDark={isDark}
                    >
                      <button
                        type="button"
                        onClick={() => setShowRegPwd(v => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: isDark ? "rgba(150,175,210,0.5)" : "rgba(40,80,150,0.4)", padding: 0, display: "flex" }}
                      >
                        {showRegPwd
                          ? <EyeOff style={{ width: 15, height: 15 }} />
                          : <Eye style={{ width: 15, height: 15 }} />}
                      </button>
                    </InputField>

                    <motion.button
                      type="submit"
                      data-testid="auth-modal-submit-register"
                      disabled={loading || !regName.trim() || !regEmail.trim() || !regPassword}
                      whileHover={(!loading && regName.trim() && regEmail.trim() && regPassword) ? { scale: 1.02 } : {}}
                      whileTap={(!loading && regName.trim() && regEmail.trim() && regPassword) ? { scale: 0.98 } : {}}
                      style={{
                        width: "100%", padding: "12px 0",
                        borderRadius: "11px", border: "none",
                        background: (loading || !regName.trim() || !regEmail.trim() || !regPassword)
                          ? (isDark ? "rgba(40,55,80,0.5)" : "rgba(80,120,200,0.25)")
                          : "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 60%, #7dd3fc 100%)",
                        color: (loading || !regName.trim() || !regEmail.trim() || !regPassword)
                          ? (isDark ? "rgba(100,130,170,0.5)" : "rgba(40,80,160,0.4)")
                          : "#fff",
                        fontSize: "14px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        cursor: (loading || !regName.trim() || !regEmail.trim() || !regPassword) ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        marginTop: "6px",
                        boxShadow: (loading || !regName.trim() || !regEmail.trim() || !regPassword)
                          ? "none"
                          : "0 4px 24px rgba(14,165,233,0.35)",
                        transition: "all 0.2s",
                      }}
                    >
                      {loading ? (
                        <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                      ) : (
                        <>Créer mon compte <ArrowRight style={{ width: 15, height: 15 }} /></>
                      )}
                    </motion.button>

                    <p style={{
                      textAlign: "center", marginTop: "14px",
                      fontSize: "12px", color: t.termsText,
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.6,
                    }}>
                      Déjà membre ?{" "}
                      <button
                        type="button"
                        onClick={() => setTab("login")}
                        style={{ background: "none", border: "none", cursor: "pointer", color: t.switchLink, fontWeight: 500, padding: 0, fontSize: "12px" }}
                      >
                        Se connecter
                      </button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* CSS for spinner */}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
