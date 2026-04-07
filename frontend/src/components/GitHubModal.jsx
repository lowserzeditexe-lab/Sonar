import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, Lock, Globe, ChevronDown, Check, Loader2, Link, RefreshCw, Search } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("sonar-token") || "";
  return fetch(`${BACKEND_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
}

function parseGitHubUrl(input) {
  const clean = input.trim().replace(/\/$/, "");
  const match = clean.match(/(?:github\.com\/)?([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/);
  return match ? match[1] : null;
}

export default function GitHubModal({ open, onClose, isDark = true, onRepoSelected }) {
  const dk = isDark;

  const [activeTab, setActiveTab] = useState("public");

  // URL input (both tabs)
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  // GitHub connection
  const [ghStatus, setGhStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");

  const colors = {
    backdrop: dk ? "rgba(0,0,0,0.72)" : "rgba(80,120,200,0.18)",
    modalBg: dk
      ? "linear-gradient(160deg, rgba(12,20,45,0.98) 0%, rgba(4,6,16,0.99) 100%)"
      : "linear-gradient(160deg, rgba(248,252,255,0.99) 0%, rgba(255,255,255,1) 100%)",
    modalBorder: dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(80,120,200,0.15)",
    headerText: dk ? "#fff" : "#080f28",
    closeBtn: dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    closeBtnHover: dk ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.09)",
    closeIcon: dk ? "rgba(255,255,255,0.4)" : "rgba(40,60,120,0.4)",
    tabBg: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    tabBorder: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,120,200,0.1)",
    tabActiveBg: dk ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.85)",
    tabActiveText: dk ? "#fff" : "#0a1a3e",
    tabInactiveText: dk ? "rgba(160,185,220,0.5)" : "rgba(30,60,120,0.5)",
    sectionLabel: dk ? "rgba(120,145,185,0.5)" : "rgba(40,70,130,0.45)",
    text: dk ? "rgba(215,230,250,0.9)" : "#0a1a3e",
    subText: dk ? "rgba(120,145,185,0.55)" : "rgba(40,70,130,0.45)",
    itemBg: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
    itemBorder: dk ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(80,120,200,0.1)",
    inputBg: dk ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
    inputBorder: dk ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(80,120,200,0.16)",
    inputFocus: dk ? "rgba(56,189,248,0.4)" : "rgba(14,165,233,0.45)",
    dropdownBg: dk ? "rgba(16,24,52,0.99)" : "rgba(255,255,255,0.99)",
    dropdownBorder: dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(80,120,200,0.14)",
    dropdownHover: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    divider: dk ? "rgba(255,255,255,0.06)" : "rgba(80,120,200,0.08)",
  };

  useEffect(() => {
    if (!open) return;
    setUrlInput(""); setUrlError(""); setSelectedRepo(null); setSearch("");
    checkGhStatus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkGhStatus = async () => {
    setGhStatus(null);
    try {
      const res = await apiFetch("/api/github/status");
      if (res.ok) {
        const data = await res.json();
        setGhStatus(data);
        if (data.connected) loadRepos();
      } else {
        setGhStatus({ connected: false });
      }
    } catch {
      setGhStatus({ connected: false });
    }
  };

  const loadRepos = useCallback(async () => {
    setReposLoading(true);
    try {
      const res = await apiFetch("/api/github/repos");
      if (res.ok) setRepos(await res.json());
    } catch { /* ignore */ }
    setReposLoading(false);
  }, []);

  const handleConnectGitHub = () => {
    setConnecting(true);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUri = window.location.origin;
    const params = new URLSearchParams({
      client_id: "Ov23liG7ztOB5QJuPoP1",
      redirect_uri: redirectUri,
      scope: "repo,user:email",
      state: "github_integration",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  const handleUrlSubmit = () => {
    setUrlError("");
    const full = parseGitHubUrl(urlInput);
    if (!full) { setUrlError("URL invalide — ex: https://github.com/user/repo"); return; }
    onRepoSelected?.({ type: activeTab === "public" ? "public" : "private", full_name: full, url: `https://github.com/${full}` });
    onClose();
  };

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setShowDropdown(false);
    onRepoSelected?.({ type: repo.private ? "private" : "public", full_name: repo.full_name, url: `https://github.com/${repo.full_name}` });
    onClose();
  };

  // Filtered repos per tab
  const tabRepos = repos.filter(r => activeTab === "public" ? !r.private : r.private)
    .filter(r => !search || r.full_name.toLowerCase().includes(search.toLowerCase()));

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 1200, background: colors.backdrop, backdropFilter: "blur(12px)" }}
          />
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1201, padding: "20px" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: "100%", maxWidth: "560px", background: colors.modalBg, backdropFilter: "blur(60px)", border: colors.modalBorder, borderRadius: "22px", boxShadow: dk ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 48px 120px rgba(0,0,0,0.85)" : "inset 0 1px 0 rgba(255,255,255,0.9), 0 48px 120px rgba(40,80,180,0.14)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            >
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,120,200,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <GitBranch style={{ width: 20, height: 20, color: colors.headerText }} />
                  <div>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "16px", color: colors.headerText, letterSpacing: "-0.02em", margin: 0 }}>
                      Intégrer un repo GitHub
                    </h2>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText, margin: 0, marginTop: 1 }}>
                      Utilisé comme contexte pour la génération de votre app
                    </p>
                  </div>
                </div>
                <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: "8px", border: "none", background: colors.closeBtn, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.closeBtnHover}
                  onMouseLeave={e => e.currentTarget.style.background = colors.closeBtn}
                >
                  <X style={{ width: 13, height: 13, color: colors.closeIcon }} />
                </button>
              </div>

              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 5, marginBottom: 20, background: colors.tabBg, border: colors.tabBorder, borderRadius: "12px", padding: "3px" }}>
                  {[{ id: "public", icon: Globe, label: "Repos publics" }, { id: "private", icon: Lock, label: "Repos privés" }].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => { setActiveTab(id); setUrlInput(""); setUrlError(""); setSelectedRepo(null); }} style={{ flex: 1, padding: "9px 0", borderRadius: "9px", border: "none", background: activeTab === id ? colors.tabActiveBg : "transparent", color: activeTab === id ? colors.tabActiveText : colors.tabInactiveText, fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: activeTab === id ? 600 : 400, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Icon style={{ width: 12, height: 12 }} /> {label}
                    </button>
                  ))}
                </div>

                {/* ── URL section (both tabs) ── */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: colors.sectionLabel, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Link style={{ width: 11, height: 11 }} />
                    {activeTab === "public" ? "Coller une URL de repo public" : "Coller une URL de repo (public ou privé)"}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={e => { setUrlInput(e.target.value); setUrlError(""); }}
                      onKeyDown={e => { if (e.key === "Enter") handleUrlSubmit(); }}
                      placeholder="https://github.com/user/repo"
                      style={{ flex: 1, padding: "10px 13px", borderRadius: "10px", background: colors.inputBg, border: colors.inputBorder, color: colors.text, fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none", transition: "border 0.15s" }}
                      onFocus={e => e.currentTarget.style.border = `1px solid ${colors.inputFocus}`}
                      onBlur={e => e.currentTarget.style.border = colors.inputBorder}
                    />
                    <motion.button
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      whileHover={urlInput.trim() ? { scale: 1.02 } : {}}
                      whileTap={urlInput.trim() ? { scale: 0.97 } : {}}
                      style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: urlInput.trim() ? "linear-gradient(90deg,#38bdf8,#0ea5e9)" : (dk ? "rgba(40,55,80,0.5)" : "rgba(80,120,200,0.15)"), color: urlInput.trim() ? "#000" : colors.subText, fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 700, cursor: urlInput.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap", boxShadow: urlInput.trim() ? "0 3px 12px rgba(14,165,233,0.25)" : "none", transition: "all 0.18s" }}
                    >
                      Intégrer
                    </motion.button>
                  </div>
                  {urlError && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", color: "#fca5a5", marginTop: 6 }}>{urlError}</p>}
                </div>

                {/* ── Divider ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: colors.divider }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: colors.subText, whiteSpace: "nowrap" }}>
                    {ghStatus?.connected ? "ou choisir depuis vos repos" : activeTab === "private" ? "ou connecter GitHub pour vos repos privés" : "ou choisir depuis vos repos (connexion requise)"}
                  </span>
                  <div style={{ flex: 1, height: 1, background: colors.divider }} />
                </div>

                {/* ── Repos section ── */}
                {ghStatus === null ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: 22, height: 22, border: "3px solid rgba(56,189,248,0.2)", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText }}>Vérification…</p>
                  </div>
                ) : !ghStatus.connected ? (
                  /* Not connected */
                  <div style={{ padding: "14px 16px", borderRadius: "12px", background: colors.itemBg, border: colors.itemBorder, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: colors.text, fontWeight: 500, marginBottom: 2 }}>
                        Connectez GitHub pour accéder à vos repos
                      </p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", color: colors.subText }}>
                        {activeTab === "private" ? "Repos privés et publics disponibles" : "Repos publics et privés disponibles"}
                      </p>
                    </div>
                    <motion.button
                      onClick={handleConnectGitHub}
                      disabled={connecting}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ padding: "9px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg,#38bdf8,#0ea5e9)", color: "#000", fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 3px 12px rgba(14,165,233,0.25)", flexShrink: 0, marginLeft: 12 }}
                    >
                      {connecting ? <Loader2 style={{ width: 13, height: 13, animation: "spin 0.8s linear infinite" }} /> : <GitBranch style={{ width: 13, height: 13 }} />}
                      Connecter
                    </motion.button>
                  </div>
                ) : (
                  /* Connected — show repos */
                  <div>
                    {/* Connected banner */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {ghStatus.github_avatar && <img src={ghStatus.github_avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(16,185,129,0.35)" }} />}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: "#10b981", fontWeight: 600 }}>@{ghStatus.github_login}</span>
                        <span style={{ fontSize: "10px", color: "rgba(16,185,129,0.6)", fontFamily: "'DM Sans', sans-serif" }}>Connecté</span>
                      </div>
                      <button onClick={loadRepos} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(16,185,129,0.5)", padding: 4, borderRadius: 6 }}>
                        <RefreshCw style={{ width: 12, height: 12 }} />
                      </button>
                    </div>

                    {/* Search */}
                    {repos.length > 5 && (
                      <div style={{ position: "relative", marginBottom: 10 }}>
                        <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: colors.subText }} />
                        <input
                          type="text" value={search} onChange={e => setSearch(e.target.value)}
                          placeholder="Rechercher un repo…"
                          style={{ width: "100%", padding: "8px 12px 8px 30px", borderRadius: "9px", background: colors.inputBg, border: colors.inputBorder, color: colors.text, fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    )}

                    {/* Repo list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                      {reposLoading ? (
                        <p style={{ textAlign: "center", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText }}>Chargement…</p>
                      ) : tabRepos.length === 0 ? (
                        <p style={{ textAlign: "center", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText }}>
                          {search ? `Aucun résultat pour "${search}"` : `Aucun repo ${activeTab === "private" ? "privé" : "public"} trouvé`}
                        </p>
                      ) : tabRepos.map(repo => (
                        <motion.button
                          key={repo.id}
                          onClick={() => handleSelectRepo(repo)}
                          whileHover={{ scale: 1.01 }}
                          style={{ width: "100%", padding: "10px 13px", borderRadius: "10px", border: selectedRepo?.id === repo.id ? "1px solid rgba(6,182,212,0.3)" : colors.itemBorder, background: selectedRepo?.id === repo.id ? "rgba(6,182,212,0.08)" : colors.itemBg, display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                          onMouseEnter={e => { if (selectedRepo?.id !== repo.id) { e.currentTarget.style.background = dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = dk ? "rgba(255,255,255,0.12)" : "rgba(80,120,200,0.18)"; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = selectedRepo?.id === repo.id ? "rgba(6,182,212,0.08)" : colors.itemBg; e.currentTarget.style.borderColor = selectedRepo?.id === repo.id ? "rgba(6,182,212,0.3)" : colors.itemBorder.replace("1px solid ", ""); }}
                        >
                          {repo.private ? <Lock style={{ width: 12, height: 12, color: colors.subText, flexShrink: 0 }} /> : <Globe style={{ width: 12, height: 12, color: colors.subText, flexShrink: 0 }} />}
                          <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {repo.full_name}
                          </span>
                          {repo.description && (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: colors.subText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                              {repo.description}
                            </span>
                          )}
                          {selectedRepo?.id === repo.id && <Check style={{ width: 13, height: 13, color: "#06b6d4", flexShrink: 0 }} />}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}
