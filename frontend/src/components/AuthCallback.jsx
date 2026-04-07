import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * AuthCallback — handles all OAuth redirects.
 *
 * Detects:
 *  - Google: URL hash  #session_id=xxx  → POST /api/auth/google/callback
 *  - GitHub: URL query ?code=xxx&state=github → POST /api/auth/github/callback
 *  - Discord: URL query ?code=xxx&state=discord → POST /api/auth/discord/callback
 *
 * On success: stores JWT in localStorage and calls onSuccess(userData)
 * On failure: calls onError(message)
 */
export default function AuthCallback({ onSuccess, onError }) {
  const hasProcessed = useRef(false);
  const { login: _login } = useAuth(); // not used directly — we set token manually

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const params = new URLSearchParams(search);

    const sessionId = hash.includes("session_id=")
      ? hash.split("session_id=")[1]?.split("&")[0]
      : null;

    const code = params.get("code");
    const state = params.get("state"); // "github" | "discord" | "github_integration"

    if (sessionId) {
      handleGoogle(sessionId);
    } else if (code && state === "github") {
      handleGitHub(code);
    } else if (code && state === "discord") {
      handleDiscord(code);
    } else if (code && state === "github_integration") {
      handleGitHubIntegration(code);
    } else {
      onError?.("No OAuth parameters found in URL");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storeAndNotify = (data) => {
    localStorage.setItem("sonar-token", data.token);
    // URL cleanup is handled by navigate() in App.js onSuccess handler
    onSuccess?.(data);
  };

  const handleGoogle = async (sessionId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Google auth failed");
      }
      storeAndNotify(await res.json());
    } catch (e) {
      onError?.(e.message);
    }
  };

  const handleGitHub = async (code) => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUri = window.location.origin;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/github/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "GitHub auth failed");
      }
      storeAndNotify(await res.json());
    } catch (e) {
      onError?.(e.message);
    }
  };

  const handleDiscord = async (code) => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUri = window.location.origin;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/discord/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Discord auth failed");
      }
      storeAndNotify(await res.json());
    } catch (e) {
      onError?.(e.message);
    }
  };

  const handleGitHubIntegration = async (code) => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUri = window.location.origin;
    try {
      const token = localStorage.getItem("sonar-token") || "";
      const res = await fetch(`${BACKEND_URL}/api/github/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "GitHub connect failed");
      }
      // Not a login — go back with existing token
      onSuccess?.({ token: localStorage.getItem("sonar-token") || "", github_connected: true });
    } catch (e) {
      onError?.(e.message);
    }
  };

  // Simple loading UI while processing
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #050b1f 0%, #000308 100%)",
      gap: "16px",
    }}>
      <span style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 900,
        fontSize: "2rem",
        letterSpacing: "-0.05em",
        color: "#fff",
        opacity: 0.9,
      }}>
        sonar
      </span>
      <div style={{
        width: 32, height: 32,
        border: "3px solid rgba(56,189,248,0.2)",
        borderTop: "3px solid #38bdf8",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "14px",
        color: "rgba(140,165,200,0.6)",
      }}>
        Connexion en cours…
      </p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
