import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight, ChevronDown, Check, X, Clock, LogOut, Settings, Globe, GitBranch, Sun, Moon, Paperclip, Code2 } from "lucide-react";
import { PROJECT_TEMPLATES, MODELS } from "../data/mockData";
import { ChatGPTIcon, ClaudeIcon, GeminiIcon } from "./AIIcons";
import LoginModal from "./LoginModal";
import SettingsModal from "./SettingsModal";
import GitHubModal from "./GitHubModal";
import SkyWaterOverlay from "./SkyWaterOverlay";
import CodebaseModal from "./CodebaseModal";

// ── Profile dropdown ──────────────────────────────────────────────────────────
function ProfileMenu({ user, onLogout, onClose, onOpenSettings, isDark = true, profilePhoto }) {
  const items = [
    { icon: Settings, label: "Paramètres de compte",  action: "settings", suffix: null },
    { icon: Globe,    label: "Langues",                action: "preferences", suffix: "FR" },
    { icon: GitBranch,   label: "Se connecter à GitHub",  action: "github", suffix: null },
  ];

  const handleItemClick = (action) => {
    onClose();
    if (action === "settings") {
      onOpenSettings();
    } else if (action === "preferences") {
      onOpenSettings("preferences");
    } else if (action === "github") {
      onOpenSettings("github");
    }
  };

  const dk = isDark;
  return (
    <motion.div
      data-testid="profile-menu"
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 230,
        background: dk
          ? "linear-gradient(160deg, rgba(16,26,65,0.97) 0%, rgba(6,8,22,0.99) 100%)"
          : "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.98) 100%)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: dk ? "1px solid rgba(255,255,255,0.11)" : "1px solid rgba(255,255,255,0.5)",
        borderRadius: "18px",
        boxShadow: dk
          ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.75)"
          : "inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px rgba(30,80,160,0.15)",
        overflow: "hidden",
        zIndex: 200,
      }}
    >
      {/* User info header */}
      <div style={{ padding: "15px 16px 13px", borderBottom: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,120,200,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            overflow: "hidden",
          }}>
            {!profilePhoto && (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "11px", color: "#fff", textTransform: "uppercase" }}>
                {(user.name || user.email || "U").slice(0, 2)}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: "13px", color: dk ? "#fff" : "#0a1a3e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name || "Utilisateur"}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: dk ? "rgba(140,165,200,0.55)" : "rgba(40,70,130,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "6px" }}>
        {items.map(({ icon: Icon, label, action, suffix }) => (
          <button
            key={label}
            onClick={() => handleItemClick(action)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: "10px", border: "none",
              background: "transparent", cursor: "pointer", transition: "background 0.13s",
              textAlign: "left",
            }}
            onMouseEnter={e => e.currentTarget.style.background = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Icon style={{ width: 15, height: 15, color: dk ? "rgba(160,185,220,0.6)" : "rgba(40,80,150,0.5)", flexShrink: 0 }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: dk ? "rgba(215,225,240,0.85)" : "#1e3264", flex: 1 }}>
              {label}
            </span>
            {suffix && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: dk ? "rgba(120,145,180,0.5)" : "rgba(40,70,130,0.45)", background: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", padding: "2px 7px", borderRadius: "6px" }}>
                {suffix}
              </span>
            )}
          </button>
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: dk ? "rgba(255,255,255,0.07)" : "rgba(80,120,200,0.1)", margin: "5px 8px" }} />

        {/* Logout */}
        <button
          data-testid="profile-menu-logout"
          onClick={() => { onClose(); onLogout(); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: "10px", border: "none",
            background: "transparent", cursor: "pointer", transition: "background 0.13s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut style={{ width: 15, height: 15, color: "#f87171", flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#f87171" }}>
            Déconnexion
          </span>
        </button>
      </div>
    </motion.div>
  );
}

function relativeTime(ts) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}j`;
}

const TYPE_COLORS = { todo: "#10b981", dashboard: "#06b6d4", ecommerce: "#f59e0b" };
const TYPE_LABELS = { todo: "Todo App", dashboard: "Dashboard", ecommerce: "Store" };

function TaskCard({ task, onSelect, onClose, onCode, T = THEMES.dark }) {
  const [hovered, setHovered] = useState(false);
  const color = TYPE_COLORS[task.projectType] || "#64748b";
  const label = TYPE_LABELS[task.projectType] || "App";
  // Only show Code button for real (non-demo) tasks
  const isRealTask = !task.id.startsWith("demo-");
  return (
    <motion.div
      data-testid={`home-task-${task.id}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => onSelect(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", padding: "14px 16px 12px", borderRadius: "16px",
        background: hovered ? T.cardBgHover : T.cardBg,
        border: `1px solid ${hovered ? T.cardBorderHover : T.cardBorder}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        cursor: "pointer", transition: "all 0.2s", overflow: "hidden",
        boxShadow: hovered ? (T.cardShadowHover || "inset 0 1px 0 rgba(255,255,255,0.09), 0 12px 40px rgba(0,0,0,0.2)") : (T.cardShadow || "inset 0 1px 0 rgba(255,255,255,0.05)"),
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: hovered ? 1 : 0.5, transition: "opacity 0.2s" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 5 }}>
        <p style={{
          fontSize: "13.5px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: T.text1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "78%",
          lineHeight: 1.2,
        }}>
          {task.projectName}
        </p>
        <button
          data-testid={`home-close-task-${task.id}`}
          onClick={e => { e.stopPropagation(); onClose(task.id); }}
          style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, background: "none", border: "none", color: T.labelColor, opacity: hovered ? 1 : 0, transition: "opacity 0.15s", cursor: "pointer" }}
        >
          <X style={{ width: 10, height: 10 }} />
        </button>
      </div>
      <p style={{
        fontSize: "11.5px",
        color: T.labelColor,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        lineHeight: 1.6,
        marginBottom: 10,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        letterSpacing: "0.005em",
      }}>
        {task.prompt}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "10px",
          color,
          background: `${color}18`,
          padding: "2px 8px",
          borderRadius: 99,
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Code button — only for real (authenticated) tasks */}
          {isRealTask && (
            <button
              data-testid={`home-code-task-${task.id}`}
              onClick={e => { e.stopPropagation(); onCode && onCode(task); }}
              title="Open VS Code environment"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 8,
                background: hovered ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.08)",
                border: `1px solid ${hovered ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.2)"}`,
                color: "#3b82f6",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.01em",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              <Code2 style={{ width: 9, height: 9 }} />
              Code
            </button>
          )}
          <span style={{
            fontSize: "10px",
            color: T.labelColor,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}>{relativeTime(task.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Theme constants ──────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    pageBg: "linear-gradient(to bottom, #0c1f4a 0%, #060d1e 35%, #010408 65%, #000000 100%)",
    // ── Nav: dark frosted glass ──
    navBg: "rgba(8,14,30,0.55)",
    navBorder: "rgba(255,255,255,0.08)",
    navShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
    logoText: "#fff",
    logoHoverBg: "rgba(255,255,255,0.06)",
    text1: "#ffffff",
    text2: "rgba(180,190,210,0.7)",
    text3: "rgba(120,135,160,0.7)",
    // ── Input: deep dark glass ──
    inputBg: "linear-gradient(160deg, rgba(18,30,70,0.55) 0%, rgba(8,12,28,0.65) 100%)",
    inputBorderNormal: "rgba(255,255,255,0.1)",
    inputBorderFocus: "rgba(56,189,248,0.35)",
    inputShadowNormal: "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 2px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.35), 0 20px 60px -10px rgba(0,0,0,0.25)",
    inputShadowFocus: "inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 4px rgba(56,189,248,0.08), 0 12px 40px rgba(0,0,0,0.4), 0 24px 70px -10px rgba(0,0,0,0.3)",
    textareaColor: "#e8ecf4",
    // ── Pills: dark glass micro-cards ──
    pillBg: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
    pillBorder: "rgba(255,255,255,0.1)",
    pillShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
    pillText: "rgba(160,180,215,0.7)",
    pillTextHover: "rgba(56,189,248,0.95)",
    pillBorderHover: "rgba(56,189,248,0.3)",
    pillBgHover: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)",
    pillShadowHover: "0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
    // ── Cards: elevated dark glass ──
    cardBg: "linear-gradient(160deg, rgba(14,22,50,0.5) 0%, rgba(6,9,20,0.6) 100%)",
    cardBorder: "rgba(255,255,255,0.08)",
    cardShadow: "0 4px 16px rgba(0,0,0,0.25), 0 12px 40px -8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
    cardBorderHover: "rgba(255,255,255,0.14)",
    cardBgHover: "linear-gradient(160deg, rgba(20,35,75,0.6) 0%, rgba(10,14,30,0.7) 100%)",
    cardShadowHover: "0 8px 24px rgba(0,0,0,0.3), 0 20px 60px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
    labelColor: "rgba(100,116,139,0.45)",
    // ── Sign-in: dark glass button ──
    signInText: "rgba(255,255,255,0.6)",
    signInBorder: "rgba(255,255,255,0.1)",
    signInBg: "rgba(255,255,255,0.05)",
    signInShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
    signInTextHover: "rgba(255,255,255,0.9)",
    signInBgHover: "rgba(255,255,255,0.1)",
    signInShadowHover: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
    // ── Dropdown: elevated dark glass ──
    dropdownBg: "linear-gradient(160deg, rgba(16,26,60,0.88) 0%, rgba(6,9,20,0.92) 100%)",
    dropdownBorder: "rgba(255,255,255,0.1)",
    dropdownShadow: "0 12px 40px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)",
    dropdownText: "rgba(160,185,215,0.85)",
    separator: "rgba(50,70,100,0.7)",
    themeIconColor: "rgba(200,220,255,0.75)",
    heroGlow: "0 2px 4px rgba(0,0,0,0.9), 0 8px 32px rgba(0,0,0,0.7), 0 0 120px rgba(20,60,160,0.35)",
  },
  light: {
    pageBg: "transparent",  // SkyWaterOverlay gère le fond
    // ── Nav: frosted glass avec profondeur ──
    navBg: "rgba(255,255,255,0.35)",
    navBorder: "rgba(255,255,255,0.55)",
    navShadow: "0 4px 30px rgba(20,80,160,0.08), 0 1px 0 rgba(255,255,255,0.7) inset",
    logoText: "#0a2a5e",
    logoHoverBg: "rgba(255,255,255,0.2)",
    text1: "#0a1a3e",
    text2: "rgba(10,40,90,0.7)",
    text3: "rgba(30,70,130,0.5)",
    // ── Input: deep glass avec ombres multi-couches ──
    inputBg: "linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(220,240,255,0.5) 100%)",
    inputBorderNormal: "rgba(255,255,255,0.65)",
    inputBorderFocus: "rgba(56,189,248,0.55)",
    inputShadowNormal: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 2px rgba(20,80,160,0.04), 0 8px 32px rgba(20,80,160,0.1), 0 2px 8px rgba(20,80,160,0.06), 0 20px 60px -10px rgba(20,80,160,0.08)",
    inputShadowFocus: "inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 4px rgba(56,189,248,0.12), 0 12px 40px rgba(20,80,160,0.14), 0 24px 70px -10px rgba(20,80,160,0.1)",
    textareaColor: "#0a1a3e",
    // ── Pills: glass micro-cards ──
    pillBg: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(220,240,255,0.45) 100%)",
    pillBorder: "rgba(255,255,255,0.6)",
    pillShadow: "0 2px 8px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
    pillText: "rgba(20,60,120,0.75)",
    pillTextHover: "rgba(10,80,200,0.95)",
    pillBorderHover: "rgba(56,189,248,0.4)",
    pillBgHover: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(200,230,255,0.65) 100%)",
    pillShadowHover: "0 4px 16px rgba(20,80,160,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
    // ── Cards: elevated glass ──
    cardBg: "linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(215,238,255,0.5) 100%)",
    cardBorder: "rgba(255,255,255,0.55)",
    cardShadow: "0 4px 16px rgba(20,80,160,0.07), 0 12px 40px -8px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.85)",
    cardBorderHover: "rgba(255,255,255,0.8)",
    cardBgHover: "linear-gradient(160deg, rgba(255,255,255,0.78) 0%, rgba(205,232,255,0.68) 100%)",
    cardShadowHover: "0 8px 24px rgba(20,80,160,0.1), 0 20px 60px -10px rgba(20,80,160,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
    labelColor: "rgba(30,70,140,0.5)",
    // ── Sign-in button: glass ──
    signInText: "rgba(10,30,80,0.75)",
    signInBorder: "rgba(255,255,255,0.55)",
    signInBg: "rgba(255,255,255,0.35)",
    signInShadow: "0 2px 8px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
    signInTextHover: "rgba(10,20,60,0.95)",
    signInBgHover: "rgba(255,255,255,0.6)",
    signInShadowHover: "0 4px 16px rgba(20,80,160,0.1), inset 0 1px 0 rgba(255,255,255,0.85)",
    // ── Dropdown: elevated glass panel ──
    dropdownBg: "linear-gradient(160deg, rgba(240,250,255,0.92) 0%, rgba(255,255,255,0.95) 100%)",
    dropdownBorder: "rgba(255,255,255,0.6)",
    dropdownShadow: "0 12px 40px rgba(20,80,160,0.12), 0 4px 16px rgba(20,80,160,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    dropdownText: "rgba(15,45,100,0.85)",
    separator: "rgba(80,140,220,0.35)",
    themeIconColor: "rgba(255,200,50,0.95)",
    heroGlow: "0 2px 4px rgba(255,255,255,0.4), 0 0 80px rgba(255,255,255,0.2), 0 0 160px rgba(56,189,248,0.08)",
  },
};

const MODEL_ICON_COLORS = {
  openai: "#ffffff",
  anthropic: "#D97757",
  google: "url(#gemini-gradient)",
};

function ModelIcon({ provider, size = 15 }) {
  if (provider === "openai") return <span style={{ color: "#fff", opacity: 0.9 }}><ChatGPTIcon size={size} /></span>;
  if (provider === "anthropic") return <span style={{ color: "#D97757" }}><ClaudeIcon size={size} /></span>;
  return <GeminiIcon size={size} />;
}

const MODE_INFO = {
  "S-1": { label: "S-1", desc: "S-1  •  Stable", cost: { todo: "$0.08", dashboard: "$0.12", ecommerce: "$0.16", default: "$0.09" }, tooltip: "L'agent analyse en profondeur, valide chaque étape et livre un résultat stable." },
  "S-2": { label: "S-2", desc: "S-2  •  Tenace", cost: { todo: "$0.14", dashboard: "$0.19", ecommerce: "$0.24", default: "$0.18" }, tooltip: "L'agent insiste, essaie plusieurs approches et ne s'arrête que quand c'est vraiment bon." },
};

const TYPING_PROMPTS = [
  "Build a todo app with priorities and deadlines",
  "Create an analytics dashboard with real-time charts",
  "Make an e-commerce store with cart and checkout",
  "Design a SaaS landing page with pricing tiers",
  "Build a blog platform with markdown support",
];

export default function LandingPage({ onStart, tasks = [], onSelectTask, onCloseTask, onShowAuth, user, onLogin, onLogout, isDark = true, onToggleTheme }) {
  const [inputValue, setInputValue] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("account");
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(() => {
    return localStorage.getItem("sonar-profile-photo") || null;
  });

  // VS Code codebase modal state
  const [codebaseTask, setCodebaseTask] = useState(null);

  const handleCodeButtonClick = (task) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setCodebaseTask(task);
  };

  // Sync avatar_url from OAuth providers automatically
  useEffect(() => {
    if (user?.avatar_url) {
      setProfilePhoto(user.avatar_url);
    }
  }, [user?.avatar_url]);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [isRepoConnected, setIsRepoConnected] = useState(false);
  const [repoContext, setRepoContext] = useState(null); // { full_name, url, type }
  const T = THEMES[isDark ? "dark" : "light"];

  const handleProfilePhotoChange = (photoUrl) => {
    setProfilePhoto(photoUrl);
    if (photoUrl) {
      localStorage.setItem("sonar-profile-photo", photoUrl);
    } else {
      localStorage.removeItem("sonar-profile-photo");
    }
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('video/')) return '▶';
    if (file.type.startsWith('audio/')) return '♪';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('zip') || file.type.includes('compressed')) return '📦';
    if (file.type.includes('text') || file.name.endsWith('.js') || file.name.endsWith('.jsx') || file.name.endsWith('.ts')) return '{ }';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Close profile menu on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfileMenu]);

  // Options state
  const [selectedMode, setSelectedMode] = useState("S-1");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [modelOpen, setModelOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const inputRef = useRef(null);
  const modelRef = useRef(null);
  const modeRef = useRef(null);

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  // Estimate cost based on mode
  const estimatedCost = MODE_INFO[selectedMode].cost.default;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modelRef.current && !modelRef.current.contains(e.target)) setModelOpen(false);
      if (modeRef.current && !modeRef.current.contains(e.target)) setModeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isFocused) return;
    const currentPrompt = TYPING_PROMPTS[typingIndex];
    const speed = isDeleting ? 28 : 55;

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < currentPrompt.length) {
        setCharIndex(c => c + 1);
        setInputValue(currentPrompt.slice(0, charIndex + 1));
      } else if (isDeleting && charIndex > 0) {
        setCharIndex(c => c - 1);
        setInputValue(currentPrompt.slice(0, charIndex - 1));
      } else if (!isDeleting && charIndex === currentPrompt.length) {
        setTimeout(() => setIsDeleting(true), 2200);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setTypingIndex(i => (i + 1) % TYPING_PROMPTS.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, typingIndex, isFocused]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    const prompt = repoContext
      ? `${inputValue.trim()}\n\n[GitHub context repo: ${repoContext.url}]`
      : inputValue.trim();
    onStart(prompt, selectedModel, selectedMode, attachedFiles);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleFocus = () => {
    if (!user) {
      // Block input — show login modal instead
      setShowLoginModal(true);
      return;
    }
    setIsFocused(true);
    setInputValue("");
    setCharIndex(0);
    setIsDeleting(false);
  };

  const handleBlur = () => {
    if (!inputValue.trim()) {
      setIsFocused(false);
      // Resume animation from start
      setCharIndex(0);
      setIsDeleting(false);
    }
  };

  const handleSuggestion = (template) => {
    if (!user) { setShowLoginModal(true); return; }
    setIsFocused(true);
    setInputValue(template.prompt);
    setTimeout(() => onStart(template.prompt, selectedModel, selectedMode, []), 300);
  };

  return (
    <div
      className="w-full flex flex-col relative"
      style={{ background: T.pageBg }}
    >
      {/* VS Code Codebase Modal */}
      {codebaseTask && (
        <CodebaseModal
          task={codebaseTask}
          onClose={() => setCodebaseTask(null)}
          isDark={isDark}
        />
      )}
      {/* Login modal */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onGoToAuth={() => { setShowLoginModal(false); onShowAuth && onShowAuth(); }}
        isDark={isDark}
      />
      {/* Settings modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        initialTab={settingsInitialTab}
        profilePhoto={profilePhoto}
        onProfilePhotoChange={handleProfilePhotoChange}
      />
      
      {/* GitHub modal */}
      <GitHubModal
        open={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        isDark={isDark}
        onRepoSelected={(repo) => {
          setRepoContext(repo);
          setIsRepoConnected(true);
        }}
      />
      
      {/* Sky & Water overlay for light mode */}
      {!isDark ? null : null}
      {!isDark && <SkyWaterOverlay />}

      {/* Subtle horizontal scan lines for depth (dark only) */}
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
          }}
        />
      )}

      {/* Blue glow at top center (dark only) */}
      {isDark && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 55% at 50% 5%, rgba(12,60,150,0.65) 0%, rgba(5,20,70,0.3) 45%, transparent 100%)",
            filter: "blur(2px)",
          }}
        />
      )}

      {/* Minimal top nav — glass bar, sticky */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="z-20 flex items-center justify-between px-10 py-3"
        style={{
          position: "sticky",
          top: isDark ? 12 : 12,
          margin: "12px 16px 0",
          borderRadius: "18px",
          background: T.navBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${T.navBorder}`,
          boxShadow: T.navShadow || "none",
        }}
      >
        <span
          className="select-none"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.15rem",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: T.logoText,
          }}
        >
          sonar
        </span>
        <div className="flex items-center gap-7">
          {user ? (
            /* ── Avatar + theme toggle + profile dropdown ── */
            <div className="flex items-center gap-2">

              {/* Day / Night toggle */}
              <button
                data-testid="theme-toggle"
                onClick={onToggleTheme}
                title={isDark ? "Mode clair" : "Mode sombre"}
                style={{
                  width: 32, height: 32, borderRadius: "9px",
                  border: `1px solid ${T.inputBorderNormal}`,
                  background: T.pillBg,
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.span key="moon" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.18 }}>
                      <Moon style={{ width: 14, height: 14, color: "rgba(200,220,255,0.75)" }} />
                    </motion.span>
                  ) : (
                    <motion.span key="sun" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.18 }}>
                      <Sun style={{ width: 14, height: 14, color: "rgba(255,200,80,0.9)" }} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Avatar — opens dropdown */}
              <div ref={profileRef} style={{ position: "relative" }}>
                <button
                  data-testid="nav-user-avatar"
                  onClick={() => setShowProfileMenu(v => !v)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)",
                    border: showProfileMenu ? "2px solid rgba(14,165,233,0.6)" : "2px solid transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "border-color 0.15s",
                    boxShadow: showProfileMenu ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
                    padding: 0,
                    overflow: "hidden",
                  }}
                >
                  {!profilePhoto && (
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "11px", color: "#fff", textTransform: "uppercase" }}>
                      {(user.name || user.email || "U").slice(0, 2)}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <ProfileMenu
                      user={user}
                      onLogout={onLogout}
                      onClose={() => setShowProfileMenu(false)}
                      onOpenSettings={(tab = "account") => { 
                        setShowProfileMenu(false); 
                        setSettingsInitialTab(tab);
                        setShowSettings(true); 
                      }}
                      isDark={isDark}
                      profilePhoto={profilePhoto}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <button
              data-testid="nav-sign-in"
              className="text-sm px-5 py-2 rounded-lg transition-all"
              onClick={() => onShowAuth && onShowAuth()}
              style={{
                color: T.signInText,
                border: `1px solid ${T.signInBorder}`,
                background: T.signInBg,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: T.signInShadow || "none",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = T.signInTextHover; e.currentTarget.style.background = T.signInBgHover; e.currentTarget.style.boxShadow = T.signInShadowHover || ""; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.signInText; e.currentTarget.style.background = T.signInBg; e.currentTarget.style.boxShadow = T.signInShadow || "none"; }}
            >
              Sign in
            </button>
          )}
        </div>
      </motion.nav>

      {/* HERO — full viewport height */}
      <div
        className="flex flex-col items-center justify-center relative z-10"
        style={{ minHeight: "100vh", overflow: "hidden" }}
      >

        {/* Giant SONAR text */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(4rem, 12vw, 8rem)",
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: "-0.055em",
            color: "#ffffff",
            textShadow: [
              "0 2px 4px rgba(0,0,0,0.9)",
              "0 8px 32px rgba(0,0,0,0.7)",
              "0 0 120px rgba(20,60,160,0.35)",
            ].join(", "),
            textShadow: T.heroGlow,
            userSelect: "none",
          }}
        >
          sonar
        </motion.h1>

        {/* Subtitle block — slightly overlapping, matching reference */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mt-1"
        >
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: "clamp(1.6rem, 4.5vw, 3.2rem)",
              fontWeight: 700,
              color: T.text1,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
            }}
          >
            The future is here
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(1rem, 2.5vw, 1.45rem)",
              fontWeight: 500,
              color: T.text2,
              letterSpacing: "-0.015em",
            }}
          >
            Create your own app without coding a line.
          </p>
        </motion.div>

        {/* File Previews — shown when files are attached */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full px-6"
              style={{ maxWidth: "680px", marginTop: "48px" }}
            >
              <div style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                padding: "14px 16px",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.65)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : T.inputBorderNormal}`,
                borderBottom: "none",
                borderRadius: "20px 20px 0 0",
              }}>
                {attachedFiles.map((file, index) => {
                  const preview = getFilePreview(file);
                  const isVideo = file.type.startsWith('video/');
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "relative",
                        width: "90px",
                        background: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.06)",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(80,120,200,0.18)",
                      }}
                    >
                      {/* Preview thumbnail */}
                      <div style={{
                        width: "100%",
                        height: "90px",
                        background: preview 
                          ? `url(${preview}) center/cover` 
                          : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}>
                        {!preview && (
                          <span style={{
                            fontSize: isVideo ? "28px" : "24px",
                            color: isVideo ? "#ef4444" : (isDark ? "rgba(200,220,245,0.6)" : "rgba(40,70,130,0.5)"),
                            background: isVideo ? "rgba(239,68,68,0.15)" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                            width: isVideo ? "42px" : "auto",
                            height: isVideo ? "42px" : "auto",
                            borderRadius: isVideo ? "10px" : "0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: isVideo ? "0" : "6px",
                          }}>
                            {getFileIcon(file)}
                          </span>
                        )}
                        {isVideo && preview && (
                          <div style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0,0,0,0.3)",
                          }}>
                            <div style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              background: "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "14px",
                            }}>
                              ▶
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* File info */}
                      <div style={{
                        padding: "6px 7px",
                        background: isDark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.08)",
                      }}>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "10px",
                          fontWeight: 500,
                          color: isDark ? "rgba(220,235,250,0.9)" : "#0a1a3e",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "1px",
                        }}>
                          {file.name}
                        </p>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "9px",
                          color: isDark ? "rgba(160,185,220,0.5)" : "rgba(40,70,130,0.5)",
                        }}>
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveFile(index)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.65)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.95)";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(0,0,0,0.65)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <X style={{ width: 11, height: 11, color: "#fff" }} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box — large, centered, below text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full px-6"
          style={{ maxWidth: "680px", marginTop: attachedFiles.length > 0 ? "0" : "48px" }}
        >
          <div
            className="relative transition-all duration-500"
            style={{
              background: T.inputBg,
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: `1px solid ${isFocused ? T.inputBorderFocus : T.inputBorderNormal}`,
              borderRadius: attachedFiles.length > 0 ? "0 0 20px 20px" : "20px",
              borderTop: attachedFiles.length > 0 ? `1px solid ${isFocused ? T.inputBorderFocus : T.inputBorderNormal}` : `1px solid ${isFocused ? T.inputBorderFocus : T.inputBorderNormal}`,
              boxShadow: isFocused ? T.inputShadowFocus : T.inputShadowNormal,
            }}
          >
            <textarea
              ref={inputRef}
              data-testid="landing-idea-input"
              value={inputValue}
              onChange={e => { if (user) setInputValue(e.target.value); }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder=""
              rows={3}
              readOnly={!user}
              className="w-full bg-transparent outline-none resize-none"
              style={{
                padding: "22px 24px 56px",
                color: T.textareaColor,
                fontSize: "1rem",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                lineHeight: 1.6,
                outline: "none",
                cursor: user ? "text" : "pointer",
              }}
            />

            {/* Animated placeholder when not focused */}
            {!isFocused && !inputValue && (
              <div
                className="absolute pointer-events-none flex items-center gap-0.5"
                style={{ top: "22px", left: "24px", color: T.text3, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}
              >
                <span>{inputValue}</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{ width: "2px", height: "18px", background: "rgba(6,182,212,0.8)", display: "inline-block", borderRadius: "1px", marginLeft: "1px", verticalAlign: "text-bottom" }}
                />
              </div>
            )}

            {/* Bottom row of input */}
            <div
              className="absolute flex items-center justify-between"
              style={{ bottom: "12px", left: "16px", right: "16px" }}
            >
              <div className="flex items-center gap-1.5">

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachedFiles(prev => [...prev, ...files]);
                    console.log("Fichiers attachés:", files.map(f => f.name));
                  }}
                />

                {/* Integration button (icon only) */}
                <button
                  data-testid="landing-btn-integration"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center rounded-full transition-all relative"
                  title={`Intégration${attachedFiles.length > 0 ? ` (${attachedFiles.length})` : ''}`}
                  style={{
                    width: 32, height: 32,
                    fontSize: "11px",
                    color: attachedFiles.length > 0 ? "#0ea5e9" : (isDark ? "rgba(180,200,230,0.8)" : "rgba(30,60,120,0.75)"),
                    background: attachedFiles.length > 0 ? "rgba(14,165,233,0.15)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)"),
                    border: attachedFiles.length > 0 ? "1px solid rgba(14,165,233,0.3)" : (isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)"),
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = attachedFiles.length > 0 ? "rgba(14,165,233,0.25)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.75)");
                    e.currentTarget.style.borderColor = attachedFiles.length > 0 ? "rgba(14,165,233,0.4)" : (isDark ? "rgba(255,255,255,0.18)" : "rgba(100,160,240,0.35)");
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = attachedFiles.length > 0 ? "rgba(14,165,233,0.15)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)");
                    e.currentTarget.style.borderColor = attachedFiles.length > 0 ? "rgba(14,165,233,0.3)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)");
                  }}
                >
                  <Paperclip style={{ width: 14, height: 14 }} />
                  {attachedFiles.length > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -4, right: -4,
                      width: 16, height: 16,
                      borderRadius: "50%",
                      background: "#0ea5e9",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {attachedFiles.length}
                    </span>
                  )}
                </button>

                {/* GitBranch button with dropdown arrow */}
                <button
                  data-testid="landing-btn-github"
                  onClick={() => setShowGitHubModal(true)}
                  className="flex items-center gap-1 rounded-full transition-all relative"
                  title="Github"
                  style={{
                    height: 32,
                    padding: "0 10px",
                    fontSize: "11px",
                    color: isRepoConnected ? "#10b981" : (isDark ? "rgba(180,200,230,0.8)" : "rgba(30,60,120,0.75)"),
                    background: isRepoConnected ? "rgba(16,185,129,0.15)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)"),
                    border: isRepoConnected ? "1px solid rgba(16,185,129,0.3)" : (isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)"),
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    if (isRepoConnected) {
                      e.currentTarget.style.background = "rgba(16,185,129,0.25)";
                      e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                    } else {
                      e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.75)";
                      e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(100,160,240,0.35)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (isRepoConnected) {
                      e.currentTarget.style.background = "rgba(16,185,129,0.15)";
                      e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                    } else {
                      e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)";
                      e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)";
                    }
                  }}
                >
                  <GitBranch style={{ width: 14, height: 14 }} />
                  <ChevronDown style={{ width: 10, height: 10 }} />
                  {isRepoConnected && (
                    <span style={{
                      position: "absolute",
                      top: -3, right: -3,
                      width: 10, height: 10,
                      borderRadius: "50%",
                      background: "#10b981",
                      border: "2px solid " + (isDark ? "#060c14" : "#f0f9ff"),
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                    }} />
                  )}
                </button>

                <span style={{ color: T.text3, fontSize: "12px" }}>·</span>

                {/* Mode selector */}
                <div ref={modeRef} className="relative">
                  <button
                    data-testid="landing-mode-selector"
                    onClick={() => { setModeOpen(o => !o); setModelOpen(false); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md transition-all"
                    style={{
                      fontSize: "11px",
                      fontFamily: "'DM Sans', sans-serif",
                      color: modeOpen ? "#06b6d4" : (isDark ? "rgba(110,130,165,0.9)" : "rgba(30,60,120,0.7)"),
                      background: modeOpen
                        ? "rgba(6,182,212,0.08)"
                        : (isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.35)"),
                      border: modeOpen
                        ? "1px solid rgba(6,182,212,0.25)"
                        : (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.4)"),
                    }}
                  >
                    <span className="font-semibold">{selectedMode}</span>
                    <ChevronDown style={{ width: "10px", height: "10px", opacity: 0.6 }} />
                  </button>
                  <AnimatePresence>
                    {modeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 left-0 rounded-2xl overflow-hidden z-50"
                        style={{
                          width: "280px",
                          background: isDark
                            ? "linear-gradient(160deg, rgba(16,26,60,0.96) 0%, rgba(6,9,20,0.98) 100%)"
                            : "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(240,248,255,0.98) 100%)",
                          backdropFilter: "blur(24px)",
                          WebkitBackdropFilter: "blur(24px)",
                          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(100,160,230,0.2)",
                          boxShadow: isDark
                            ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.75)"
                            : "inset 0 1px 0 rgba(255,255,255,0.8), 0 20px 50px rgba(20,60,140,0.15)",
                        }}
                      >
                        {Object.entries(MODE_INFO).map(([key, info]) => (
                          <button
                            key={key}
                            data-testid={`landing-mode-${key.toLowerCase().replace("-","")}`}
                            onClick={() => { setSelectedMode(key); setModeOpen(false); }}
                            className="w-full flex items-start justify-between px-4 py-3 transition-colors text-left"
                            style={{ background: selectedMode === key ? "rgba(6,182,212,0.07)" : "transparent" }}
                            title={info.tooltip}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                            onMouseLeave={e => e.currentTarget.style.background = selectedMode === key ? "rgba(6,182,212,0.07)" : "transparent"}
                          >
                            <div>
                              <p className="font-semibold" style={{ fontSize: "12px", color: selectedMode === key ? (key === "S-2" ? "#a78bfa" : "#06b6d4") : (isDark ? "#e2e8f0" : "#1e3264") }}>{info.desc}</p>
                              <p style={{ fontSize: "10px", color: isDark ? "rgba(100,120,160,0.6)" : "rgba(40,70,130,0.45)", marginTop: "3px", lineHeight: 1.4 }}>{info.tooltip}</p>
                            </div>
                            {selectedMode === key && <Check style={{ width: "12px", height: "12px", color: key === "S-2" ? "#a78bfa" : "#06b6d4", marginTop: "2px", flexShrink: 0 }} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span style={{ color: T.text3, fontSize: "12px" }}>·</span>

                {/* Model selector */}
                <div ref={modelRef} className="relative">
                  <button
                    data-testid="landing-model-selector"
                    onClick={() => { setModelOpen(o => !o); setModeOpen(false); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all"
                    style={{
                      fontSize: "11px",
                      fontFamily: "'DM Sans', sans-serif",
                      color: modelOpen ? "#06b6d4" : (isDark ? "rgba(110,130,165,0.9)" : "rgba(30,60,120,0.7)"),
                      background: modelOpen
                        ? "rgba(6,182,212,0.08)"
                        : (isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.35)"),
                      border: modelOpen
                        ? "1px solid rgba(6,182,212,0.25)"
                        : (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.4)"),
                    }}
                  >
                    <ModelIcon provider={currentModel.provider} size={13} />
                    <span>{currentModel.label}</span>
                    <ChevronDown style={{ width: "10px", height: "10px", opacity: 0.6 }} />
                  </button>
                  <AnimatePresence>
                    {modelOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 left-0 rounded-2xl overflow-hidden z-50"
                        style={{
                          width: "185px",
                          background: isDark
                            ? "linear-gradient(160deg, rgba(16,26,60,0.96) 0%, rgba(6,9,20,0.98) 100%)"
                            : "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(240,248,255,0.98) 100%)",
                          backdropFilter: "blur(24px)",
                          WebkitBackdropFilter: "blur(24px)",
                          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(100,160,230,0.2)",
                          boxShadow: isDark
                            ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 50px rgba(0,0,0,0.75)"
                            : "inset 0 1px 0 rgba(255,255,255,0.8), 0 20px 50px rgba(20,60,140,0.15)",
                        }}
                      >
                        <p style={{ fontSize: "10px", color: isDark ? "rgba(80,110,150,0.8)" : "rgba(40,70,130,0.5)", padding: "10px 14px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Model</p>
                        {MODELS.map(m => (
                          <button
                            key={m.id}
                            data-testid={`landing-model-${m.id}`}
                            onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 transition-colors"
                            style={{ background: selectedModel === m.id ? "rgba(6,182,212,0.07)" : "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                            onMouseLeave={e => e.currentTarget.style.background = selectedModel === m.id ? "rgba(6,182,212,0.07)" : "transparent"}
                          >
                            <div className="flex items-center gap-2.5">
                              <ModelIcon provider={m.provider} size={15} />
                              <span style={{ fontSize: "12px", color: selectedModel === m.id ? "#06b6d4" : (isDark ? "#e2e8f0" : "#1e3264") }}>{m.label}</span>
                            </div>
                            {selectedModel === m.id && <Check style={{ width: "12px", height: "12px", color: "#06b6d4", flexShrink: 0 }} />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Build button */}
              <motion.button
                data-testid="landing-submit-btn"
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                whileHover={inputValue.trim() ? { scale: 1.04 } : {}}
                whileTap={inputValue.trim() ? { scale: 0.97 } : {}}
                className="flex items-center gap-2 font-semibold transition-all duration-300"
                style={{
                  padding: "7px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  background: inputValue.trim()
                    ? "linear-gradient(135deg, #06b6d4, #0ea5e9)"
                    : "rgba(40,55,80,0.6)",
                  color: inputValue.trim() ? "#000" : "rgba(80,100,130,0.7)",
                  boxShadow: inputValue.trim() ? "0 0 18px rgba(6,182,212,0.35)" : "none",
                  cursor: inputValue.trim() ? "pointer" : "not-allowed",
                  border: "none",
                }}
              >
                Build <ArrowRight style={{ width: "13px", height: "13px" }} />
              </motion.button>
            </div>
          </div>

          {/* Suggestion pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="flex flex-wrap gap-2 justify-center mt-4"
          >
            {Object.values(PROJECT_TEMPLATES).map((t) => (
              <button
                key={t.name}
                data-testid={`suggestion-${t.preview}`}
                onClick={() => handleSuggestion(t)}
                className="flex items-center gap-1 transition-all duration-200"
                style={{
                  padding: "5px 14px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  color: T.pillText,
                  border: `1px solid ${T.pillBorder}`,
                  background: T.pillBg,
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: T.pillShadow || "inset 0 1px 0 rgba(255,255,255,0.08)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = T.pillTextHover;
                  e.currentTarget.style.borderColor = T.pillBorderHover;
                  e.currentTarget.style.background = T.pillBgHover;
                  e.currentTarget.style.boxShadow = T.pillShadowHover || T.pillShadow || "";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = T.pillText;
                  e.currentTarget.style.borderColor = T.pillBorder;
                  e.currentTarget.style.background = T.pillBg;
                  e.currentTarget.style.boxShadow = T.pillShadow || "inset 0 1px 0 rgba(255,255,255,0.08)";
                }}
              >
                <ChevronRight style={{ width: "11px", height: "11px" }} /> {t.name}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Projets récents — inline sous l'input, sans fond */}
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="w-full mt-8 px-6"
            style={{ maxWidth: "680px" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock style={{ width: 9, height: 9, color: T.labelColor }} />
              <span style={{
                fontSize: "10px",
                color: T.labelColor,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
                Projets récents
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {tasks.slice(0, 3).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.06, duration: 0.2 }}
                >
                  <TaskCard task={task} onSelect={onSelectTask} onClose={onCloseTask} onCode={handleCodeButtonClick} T={T} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
