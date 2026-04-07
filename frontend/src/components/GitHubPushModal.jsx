import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch, ChevronDown, Check, Loader2, RefreshCw, Lock, Globe } from "lucide-react";

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

export default function GitHubPushModal({ open, onClose, isDark = false, currentCode = "", projectName = "my-app" }) {
  const dk = isDark;

  const [ghStatus, setGhStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [filePath, setFilePath] = useState("src/App.jsx");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState("");

  const colors = {
    backdrop: dk ? "rgba(0,0,0,0.75)" : "rgba(20,60,160,0.15)",
    modalBg: dk
      ? "linear-gradient(160deg, rgba(10,16,38,0.98) 0%, rgba(3,5,14,0.99) 100%)"
      : "linear-gradient(160deg, rgba(248,252,255,0.99) 0%, rgba(255,255,255,1) 100%)",
    modalBorder: dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(80,120,200,0.15)",
    headerText: dk ? "#fff" : "#080f28",
    text: dk ? "rgba(215,230,250,0.9)" : "#0a1a3e",
    subText: dk ? "rgba(120,145,185,0.55)" : "rgba(40,70,130,0.45)",
    closeBtn: dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    closeBtnHover: dk ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.09)",
    closeIcon: dk ? "rgba(255,255,255,0.4)" : "rgba(40,60,120,0.4)",
    itemBg: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
    itemBorder: dk ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(80,120,200,0.1)",
    dropdownBg: dk ? "rgba(16,24,52,0.98)" : "rgba(255,255,255,0.98)",
    dropdownBorder: dk ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(80,120,200,0.14)",
    dropdownHover: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    inputBg: dk ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
    inputBorder: dk ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(80,120,200,0.16)",
  };

  useEffect(() => {
    if (!open) return;
    setPushResult(null);
    setPushError("");
    setSelectedRepo(null);
    checkStatus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkStatus = async () => {
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

  const loadBranches = useCallback(async (repo) => {
    setBranchesLoading(true);
    const [owner, name] = repo.full_name.split("/");
    try {
      const res = await apiFetch(`/api/github/branches/${owner}/${name}`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        setSelectedBranch(repo.default_branch || "main");
      } else {
        setBranches([{ name: "main" }]);
        setSelectedBranch("main");
      }
    } catch {
      setBranches([{ name: "main" }]);
      setSelectedBranch("main");
    }
    setBranchesLoading(false);
  }, []);

  const handleConnect = () => {
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

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setShowRepoDropdown(false);
    setPushResult(null);
    setPushError("");
    loadBranches(repo);
  };

  const handlePush = async () => {
    if (!selectedRepo || !selectedBranch || !currentCode) return;
    setPushing(true);
    setPushError("");
    setPushResult(null);
    try {
      const res = await apiFetch("/api/github/push", {
        method: "POST",
        body: JSON.stringify({
          repo_full_name: selectedRepo.full_name,
          branch: selectedBranch,
          file_path: filePath || "src/App.jsx",
          content: currentCode,
          commit_message: `✨ Update ${projectName} via Sonar`,
        }),
      });
      const data = await res.json();
      if (res.ok) setPushResult(data);
      else setPushError(data.detail || "Push échoué");
    } catch (e) {
      setPushError(e.message);
    }
    setPushing(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 2000, background: colors.backdrop, backdropFilter: "blur(10px)" }}
          />

          <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2001, padding: "20px" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 18 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: "100%", maxWidth: "520px", background: colors.modalBg, backdropFilter: "blur(60px)", border: colors.modalBorder, borderRadius: "22px", boxShadow: dk ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.85)" : "inset 0 1px 0 rgba(255,255,255,0.9), 0 40px 100px rgba(40,80,180,0.12)", overflow: "hidden" }}
            >
              {/* Header */}
              <div style={{ padding: "18px 22px", borderBottom: dk ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,120,200,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <GitBranch style={{ width: 18, height: 18, color: colors.headerText }} />
                  <div>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "15px", color: colors.headerText, letterSpacing: "-0.02em", margin: 0 }}>
                      Pousser vers GitHub
                    </h2>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: colors.subText, margin: 0, marginTop: 1 }}>
                      Commit le code généré dans un de vos repos
                    </p>
                  </div>
                </div>
                <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: "8px", border: "none", background: colors.closeBtn, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.closeBtnHover}
                  onMouseLeave={e => e.currentTarget.style.background = colors.closeBtn}
                >
                  <X style={{ width: 12, height: 12, color: colors.closeIcon }} />
                </button>
              </div>

              <div style={{ padding: "20px 22px" }}>
                {/* Not logged in to GitHub */}
                {ghStatus === null ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ width: 24, height: 24, border: "3px solid rgba(56,189,248,0.2)", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText }}>Vérification…</p>
                  </div>
                ) : !ghStatus.connected ? (
                  <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                    <GitBranch style={{ width: 40, height: 40, color: dk ? "rgba(200,220,255,0.3)" : "rgba(40,70,130,0.2)", margin: "0 auto 14px", display: "block" }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: colors.text, marginBottom: 6, fontWeight: 500 }}>
                      Connexion GitHub requise
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText, marginBottom: 20, lineHeight: 1.6 }}>
                      Connectez votre compte GitHub pour pousser le code généré directement dans vos repositories.
                    </p>
                    <motion.button
                      onClick={handleConnect}
                      disabled={connecting}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ padding: "11px 24px", borderRadius: "11px", border: "none", background: "linear-gradient(90deg,#38bdf8,#0ea5e9)", color: "#000", fontFamily: "'DM Sans', sans-serif", fontSize: "13.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(14,165,233,0.28)" }}
                    >
                      {connecting ? <Loader2 style={{ width: 15, height: 15, animation: "spin 0.8s linear infinite" }} /> : <GitBranch style={{ width: 15, height: 15 }} />}
                      Connecter GitHub
                    </motion.button>
                  </div>
                ) : (
                  <div>
                    {/* Connected */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 13px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {ghStatus.github_avatar && <img src={ghStatus.github_avatar} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: "#10b981", fontWeight: 600 }}>@{ghStatus.github_login}</span>
                      </div>
                      <button onClick={loadRepos} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(16,185,129,0.5)", padding: 4 }}>
                        <RefreshCw style={{ width: 12, height: 12 }} />
                      </button>
                    </div>

                    {/* Repo selector */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: colors.subText, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <GitBranch style={{ width: 11, height: 11 }} /> Repository
                      </p>
                      <div style={{ position: "relative" }}>
                        <button onClick={() => setShowRepoDropdown(v => !v)} style={{ width: "100%", padding: "10px 13px", borderRadius: "10px", background: colors.itemBg, border: colors.itemBorder, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: selectedRepo ? colors.text : colors.subText }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            {selectedRepo && (selectedRepo.private ? <Lock style={{ width: 11, height: 11, opacity: 0.5 }} /> : <Globe style={{ width: 11, height: 11, opacity: 0.5 }} />)}
                            {selectedRepo ? selectedRepo.full_name : (reposLoading ? "Chargement…" : "Sélectionner un repo")}
                          </span>
                          <ChevronDown style={{ width: 13, height: 13, color: colors.subText, transform: showRepoDropdown ? "rotate(180deg)" : "none", transition: "transform 0.18s" }} />
                        </button>
                        <AnimatePresence>
                          {showRepoDropdown && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                              style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, background: colors.dropdownBg, border: colors.dropdownBorder, borderRadius: "11px", boxShadow: dk ? "0 16px 40px rgba(0,0,0,0.6)" : "0 16px 40px rgba(40,80,180,0.1)", maxHeight: 180, overflowY: "auto", zIndex: 10 }}
                            >
                              {repos.length === 0 ? (
                                <p style={{ padding: "12px", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: colors.subText, textAlign: "center" }}>
                                  {reposLoading ? "Chargement…" : "Aucun repo trouvé"}
                                </p>
                              ) : repos.map((repo, i) => (
                                <button key={repo.id} onClick={() => handleSelectRepo(repo)} style={{ width: "100%", padding: "9px 13px", border: "none", background: selectedRepo?.id === repo.id ? "rgba(6,182,212,0.07)" : "transparent", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: dk ? "rgba(215,230,250,0.9)" : "#0a1a3e", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, borderBottom: i < repos.length - 1 ? (dk ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(80,120,200,0.06)") : "none" }}
                                  onMouseEnter={e => { if (selectedRepo?.id !== repo.id) e.currentTarget.style.background = colors.dropdownHover; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = selectedRepo?.id === repo.id ? "rgba(6,182,212,0.07)" : "transparent"; }}
                                >
                                  {repo.private ? <Lock style={{ width: 10, height: 10, opacity: 0.4, flexShrink: 0 }} /> : <Globe style={{ width: 10, height: 10, opacity: 0.4, flexShrink: 0 }} />}
                                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{repo.full_name}</span>
                                  {selectedRepo?.id === repo.id && <Check style={{ width: 11, height: 11, color: "#06b6d4" }} />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Branch + file path row */}
                    {selectedRepo && (
                      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                        {/* Branch */}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: colors.subText, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                            <GitBranch style={{ width: 11, height: 11 }} /> Branche
                          </p>
                          <div style={{ position: "relative" }}>
                            <button onClick={() => setShowBranchDropdown(v => !v)} style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: colors.itemBg, border: colors.itemBorder, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: colors.text }}>
                              {branchesLoading ? "…" : selectedBranch}
                              <ChevronDown style={{ width: 12, height: 12, color: colors.subText, transform: showBranchDropdown ? "rotate(180deg)" : "none", transition: "transform 0.18s" }} />
                            </button>
                            <AnimatePresence>
                              {showBranchDropdown && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                  style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, background: colors.dropdownBg, border: colors.dropdownBorder, borderRadius: "10px", boxShadow: dk ? "0 12px 30px rgba(0,0,0,0.5)" : "0 12px 30px rgba(40,80,180,0.1)", overflow: "hidden", zIndex: 10 }}
                                >
                                  {branches.map((b, i) => (
                                    <button key={b.name} onClick={() => { setSelectedBranch(b.name); setShowBranchDropdown(false); }} style={{ width: "100%", padding: "9px 12px", border: "none", background: selectedBranch === b.name ? "rgba(6,182,212,0.07)" : "transparent", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: dk ? "rgba(215,230,250,0.9)" : "#0a1a3e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < branches.length - 1 ? (dk ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(80,120,200,0.06)") : "none" }}
                                      onMouseEnter={e => { if (selectedBranch !== b.name) e.currentTarget.style.background = colors.dropdownHover; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = selectedBranch === b.name ? "rgba(6,182,212,0.07)" : "transparent"; }}
                                    >
                                      {b.name}
                                      {selectedBranch === b.name && <Check style={{ width: 11, height: 11, color: "#06b6d4" }} />}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* File path */}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: colors.subText, marginBottom: 6 }}>
                            Fichier cible
                          </p>
                          <input
                            type="text"
                            value={filePath}
                            onChange={e => setFilePath(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", background: colors.inputBg, border: colors.inputBorder, color: colors.text, fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Push result / error */}
                    <AnimatePresence>
                      {pushResult && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "10px 13px", borderRadius: "10px", background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.22)", marginBottom: 12, display: "flex", alignItems: "center", gap: 9 }}>
                          <Check style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: "#10b981", fontWeight: 600 }}>Code poussé !</p>
                            {pushResult.html_url && (
                              <a href={pushResult.html_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(16,185,129,0.65)", textDecoration: "none" }}>
                                Voir sur GitHub →
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                      {pushError && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "10px 13px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 12 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", color: "#fca5a5" }}>{pushError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Push button */}
                    <motion.button
                      onClick={handlePush}
                      disabled={!selectedRepo || !selectedBranch || pushing || !currentCode}
                      whileHover={selectedRepo && selectedBranch && currentCode && !pushing ? { scale: 1.02 } : {}}
                      whileTap={selectedRepo && selectedBranch && currentCode && !pushing ? { scale: 0.97 } : {}}
                      style={{
                        width: "100%", padding: "12px 0", borderRadius: "11px", border: "none",
                        background: (!selectedRepo || !selectedBranch || pushing || !currentCode)
                          ? (dk ? "rgba(40,55,80,0.45)" : "rgba(80,120,200,0.18)")
                          : "linear-gradient(90deg,#38bdf8,#0ea5e9)",
                        color: (!selectedRepo || !selectedBranch || pushing || !currentCode)
                          ? (dk ? "rgba(100,130,170,0.4)" : "rgba(40,80,160,0.35)")
                          : "#000",
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "13.5px", fontWeight: 700,
                        cursor: (!selectedRepo || !selectedBranch || pushing || !currentCode) ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: (!selectedRepo || !selectedBranch || pushing || !currentCode) ? "none" : "0 4px 16px rgba(14,165,233,0.28)",
                        transition: "all 0.18s",
                      }}
                    >
                      {pushing ? (
                        <><Loader2 style={{ width: 15, height: 15, animation: "spin 0.8s linear infinite" }} /> Push en cours…</>
                      ) : (
                        <><GitBranch style={{ width: 15, height: 15 }} /> Pousser le code</>
                      )}
                    </motion.button>
                    {!currentCode && (
                      <p style={{ textAlign: "center", marginTop: 7, fontSize: "11px", color: colors.subText, fontFamily: "'DM Sans', sans-serif" }}>
                        Générez d'abord du code
                      </p>
                    )}
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
