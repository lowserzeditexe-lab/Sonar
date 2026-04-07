import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0)">
        <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/>
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="71" height="55" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

// ── Theme tokens ──────────────────────────────────────────────────────
const T = {
  dark: {
    pageBg: "linear-gradient(135deg, #050b1f 0%, #000308 100%)",
    leftBg: "linear-gradient(160deg, rgba(14,22,52,0.97) 0%, rgba(4,6,16,0.99) 100%)",
    leftBorder: "1px solid rgba(255,255,255,0.07)",
    logoColor: "#fff",
    tabBg: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
    tabBorder: "1px solid rgba(255,255,255,0.1)",
    tabInner: "inset 0 1px 0 rgba(255,255,255,0.07)",
    tabActive: "rgba(255,255,255,0.12)",
    tabActiveText: "#fff",
    tabInactiveText: "rgba(255,255,255,0.38)",
    tabActiveShadow: "0 1px 4px rgba(0,0,0,0.4)",
    socialBg: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
    socialBorder: "1px solid rgba(255,255,255,0.11)",
    socialShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
    socialText: "#e2e8f0",
    socialHoverBg: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.07) 100%)",
    socialHoverBorder: "rgba(255,255,255,0.18)",
    dividerLine: "rgba(255,255,255,0.08)",
    dividerText: "rgba(255,255,255,0.3)",
    labelColor: "rgba(200,215,235,0.7)",
    inputBg: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
    inputBorder: "1px solid rgba(255,255,255,0.1)",
    inputShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
    inputText: "#e2e8f0",
    inputFocusBorder: "rgba(56,189,248,0.5)",
    inputFocusShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 3px rgba(56,189,248,0.15)",
    inputPlaceholder: "rgba(255,255,255,0.25)",
    switchText: "rgba(255,255,255,0.38)",
    switchLink: "#38bdf8",
    termsText: "rgba(255,255,255,0.22)",
    termsLink: "rgba(255,255,255,0.38)",
    // Right panel
    rightBg: "linear-gradient(160deg, rgba(14,22,52,1) 0%, rgba(3,5,14,1) 100%)",
    rightGlow: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(14,60,160,0.55) 0%, rgba(6,20,70,0.2) 50%, transparent 100%)",
    rightTitle: "#ffffff",
    rightSubtitle: "#ffffff",
    rightDesc: "rgba(180,195,215,0.55)",
    rightScanOpacity: 0.012,
  },
  light: {
    pageBg: "linear-gradient(135deg, #7cc0e6 0%, #a8d4ef 100%)",
    leftBg: "linear-gradient(160deg, rgba(240,247,255,0.99) 0%, rgba(255,255,255,1) 100%)",
    leftBorder: "1px solid rgba(80,120,200,0.15)",
    logoColor: "#080f28",
    tabBg: "linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)",
    tabBorder: "1px solid rgba(80,120,200,0.15)",
    tabInner: "inset 0 1px 0 rgba(255,255,255,0.5)",
    tabActive: "rgba(255,255,255,0.95)",
    tabActiveText: "#080f28",
    tabInactiveText: "rgba(40,60,120,0.45)",
    tabActiveShadow: "0 1px 4px rgba(0,0,0,0.08)",
    socialBg: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.85) 100%)",
    socialBorder: "1px solid rgba(80,120,200,0.18)",
    socialShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    socialText: "#1e3264",
    socialHoverBg: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(235,245,255,1) 100%)",
    socialHoverBorder: "rgba(80,120,200,0.3)",
    dividerLine: "rgba(80,120,200,0.15)",
    dividerText: "rgba(40,60,120,0.4)",
    labelColor: "rgba(30,50,100,0.65)",
    inputBg: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.9) 100%)",
    inputBorder: "1px solid rgba(80,120,200,0.2)",
    inputShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    inputText: "#0a0f25",
    inputFocusBorder: "rgba(14,165,233,0.45)",
    inputFocusShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 3px rgba(14,165,233,0.1)",
    inputPlaceholder: "rgba(80,100,160,0.4)",
    switchText: "rgba(40,60,120,0.5)",
    switchLink: "#0ea5e9",
    termsText: "rgba(30,50,100,0.35)",
    termsLink: "rgba(30,50,100,0.55)",
    // Right panel — sky & water atmosphere
    rightBg: "linear-gradient(to bottom, #4a9fd8 0%, #7cbce6 30%, #a8d5ef 50%, #d0e8f6 60%, #bcdcf0 70%, #8cc5e5 100%)",
    rightGlow: "radial-gradient(ellipse 60% 50% at 70% 10%, rgba(255,235,140,0.3) 0%, rgba(255,210,80,0.1) 40%, transparent 65%)",
    rightTitle: "#ffffff",
    rightSubtitle: "#ffffff",
    rightDesc: "rgba(255,255,255,0.7)",
    rightScanOpacity: 0,
  },
};

export default function AuthPage({ onBack, isDark = true }) {
  const [tab, setTab] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, login } = useAuth();
  const t = T[isDark ? "dark" : "light"];

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "12px",
    background: t.inputBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: t.inputBorder,
    boxShadow: t.inputShadow,
    color: t.inputText,
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
    caretColor: "#38bdf8",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (tab === "signup") {
        await register(name || email.split("@")[0], email, password);
      } else {
        await login(email, password);
      }
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocial = (provider) => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUri = window.location.origin;

    if (provider === "Google") {
      // Emergent Auth — Google OAuth via proxy
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUri)}`;
    } else if (provider === "GitHub") {
      const githubClientId = "Ov23liG7ztOB5QJuPoP1";
      const params = new URLSearchParams({
        client_id: githubClientId,
        redirect_uri: redirectUri,
        scope: "repo,user:email",
        state: "github",
      });
      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
    } else if (provider === "Discord") {
      const discordClientId = "1479937550998179970";
      const params = new URLSearchParams({
        client_id: discordClientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "identify email",
        state: "discord",
      });
      window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }
  };

  return (
    <div
      data-testid="auth-page"
      style={{
        display: "grid",
        gridTemplateColumns: "46fr 54fr",
        minHeight: "100vh",
        background: t.pageBg,
      }}
    >
      {/* ── Left panel: form ── */}
      <div
        style={{
          background: t.leftBg,
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRight: t.leftBorder,
          display: "flex",
          flexDirection: "column",
          padding: "52px 56px 48px",
          position: "relative",
        }}
      >
        {/* Logo */}
        <button
          onClick={onBack}
          data-testid="auth-logo-home"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: "1.1rem",
              letterSpacing: "-0.05em",
              color: t.logoColor,
            }}
          >
            sonar
          </span>
        </button>

        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            background: t.tabBg,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: t.tabBorder,
            borderRadius: "14px",
            padding: "4px",
            marginBottom: 28,
            gap: 4,
            boxShadow: t.tabInner,
          }}
        >
          {["signup", "signin"].map((v) => (
            <button
              key={v}
              data-testid={`auth-tab-${v}`}
              onClick={() => setTab(v)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "9px",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.18s",
                background: tab === v ? t.tabActive : "transparent",
                color: tab === v ? t.tabActiveText : t.tabInactiveText,
                boxShadow: tab === v ? t.tabActiveShadow : "none",
              }}
            >
              {v === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        {/* Social buttons */}
        <button
          data-testid="auth-google"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "13px 0",
            borderRadius: "12px",
            background: t.socialBg,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: t.socialBorder,
            boxShadow: t.socialShadow,
            color: t.socialText,
            fontSize: "14px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 10,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = t.socialHoverBg; e.currentTarget.style.borderColor = t.socialHoverBorder; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = t.socialBg; e.currentTarget.style.borderColor = t.socialBorder.replace("1px solid ", ""); }}
          onClick={() => handleSocial("Google")}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[
            { id: "github", label: "GitHub", Icon: GitBranch, iconColor: isDark ? "rgba(255,255,255,0.85)" : "#1e3264" },
            { id: "discord", label: "Discord", Icon: DiscordIcon, iconColor: "#5865F2" },
          ].map(({ id, label, Icon, iconColor }) => (
            <button
              key={id}
              data-testid={`auth-${id}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 0",
                borderRadius: "12px",
                background: t.socialBg,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: t.socialBorder,
                boxShadow: t.socialShadow,
                color: t.socialText,
                fontSize: "14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.socialHoverBg; e.currentTarget.style.borderColor = t.socialHoverBorder; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = t.socialBg; e.currentTarget.style.borderColor = t.socialBorder.replace("1px solid ", ""); }}
              onClick={() => handleSocial(label)}
            >
              <Icon style={{ width: 17, height: 17, color: iconColor }} />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: t.dividerLine }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: t.dividerText, whiteSpace: "nowrap" }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: 1, background: t.dividerLine }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence initial={false}>
            {tab === "signup" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: t.labelColor, marginBottom: 7 }}>
                  Full name
                </label>
                <input
                  data-testid="auth-input-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
                  onBlur={(e) => { e.target.style.borderColor = t.inputBorder.replace("1px solid ", ""); e.target.style.boxShadow = t.inputShadow; }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: t.labelColor, marginBottom: 7 }}>
              Email
            </label>
            <input
              data-testid="auth-input-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
              onBlur={(e) => { e.target.style.borderColor = t.inputBorder.replace("1px solid ", ""); e.target.style.boxShadow = t.inputShadow; }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: t.labelColor, marginBottom: 7 }}>
              Password
            </label>
            <input
              data-testid="auth-input-password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = t.inputFocusBorder; e.target.style.boxShadow = t.inputFocusShadow; }}
              onBlur={(e) => { e.target.style.borderColor = t.inputBorder.replace("1px solid ", ""); e.target.style.boxShadow = t.inputShadow; }}
            />
          </div>

          {error && (
            <p data-testid="auth-error" style={{
              color: "#f87171", fontSize: "13px", fontFamily: "'DM Sans', sans-serif",
              textAlign: "center", marginBottom: 12, padding: "8px 12px",
              background: "rgba(248,113,113,0.1)", borderRadius: "8px",
              border: "1px solid rgba(248,113,113,0.2)"
            }}>
              {error}
            </p>
          )}

          <button
            data-testid="auth-submit"
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: "12px",
              background: "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 60%, #7dd3fc 100%)",
              color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 24px rgba(14,165,233,0.4), 0 0 0 1px rgba(56,189,248,0.2)",
              transition: "opacity 0.15s, box-shadow 0.15s",
              marginBottom: 18,
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(14,165,233,0.5), 0 0 0 1px rgba(56,189,248,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(14,165,233,0.4), 0 0 0 1px rgba(56,189,248,0.2)";
              }
            }}
          >
            {isLoading ? "Please wait..." : (tab === "signup" ? "Create account" : "Sign in")}
          </button>
        </form>

        <p style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: t.switchText, marginBottom: 10 }}>
          {tab === "signup" ? "Already have an account? " : "No account yet? "}
          <span
            data-testid="auth-switch-tab"
            onClick={() => setTab(tab === "signup" ? "signin" : "signup")}
            style={{ color: t.switchLink, cursor: "pointer", fontWeight: 600 }}
          >
            {tab === "signup" ? "Sign in" : "Sign up"}
          </span>
        </p>

        {tab === "signup" && (
          <p style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: t.termsText, lineHeight: 1.5 }}>
            By continuing you agree to our{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer", color: t.termsLink }}>Terms</span>
            {" & "}
            <span style={{ textDecoration: "underline", cursor: "pointer", color: t.termsLink }}>Privacy</span>
          </p>
        )}
      </div>

      {/* ── Right panel: branding ── */}
      <div
        style={{
          background: t.rightBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            height: "60%",
            background: t.rightGlow,
            pointerEvents: "none",
          }}
        />
        {/* Scan lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,${t.rightScanOpacity}) 2px, rgba(255,255,255,${t.rightScanOpacity}) 4px)`,
            pointerEvents: "none",
          }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(5rem, 12vw, 9rem)",
            fontWeight: 900,
            letterSpacing: "-0.055em",
            color: t.rightTitle,
            textShadow: isDark ? "0 4px 32px rgba(0,0,0,0.8)" : "none",
          }}
        >
          sonar
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
            fontWeight: 700,
            color: t.rightSubtitle,
            letterSpacing: "-0.025em",
            marginBottom: 12,
            position: "relative",
          }}
        >
          The future is here
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
            fontWeight: 400,
            color: t.rightDesc,
            lineHeight: 1.55,
            maxWidth: 280,
            position: "relative",
          }}
        >
          Create your own app without coding a line.
        </motion.p>
      </div>
    </div>
  );
}
