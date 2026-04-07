import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { fetchProjects, projectToTask, deleteProject, setAuthToken } from "./api/projects";
import LandingPage from "./components/LandingPage";
import AppBuilder from "./components/AppBuilder";
import AuthPage from "./components/AuthPage";
import AuthCallback from "./components/AuthCallback";
import "./App.css";

const DEMO_TASKS = [
  { id: "demo-1", projectType: "todo", projectName: "task-manager", prompt: "Build a beautiful todo app with priority levels, due dates, and categories", timestamp: Date.now() - 420000 },
  { id: "demo-2", projectType: "dashboard", projectName: "analytics-dash", prompt: "Create a real-time analytics dashboard with interactive charts and KPI cards", timestamp: Date.now() - 2700000 },
  { id: "demo-3", projectType: "ecommerce", projectName: "tech-store", prompt: "Build a modern e-commerce store with product grid, cart, and checkout flow", timestamp: Date.now() - 7200000 },
];

function SonarApp() {
  const [view, setView] = useState("landing");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [initialTask, setInitialTask] = useState(null);
  const { user, token, logout, loading, restoreFromToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("sonar-theme") === "dark"; } catch { return false; }
  });

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Detect OAuth callback — check synchronously during render
  const isOAuthCallback = (() => {
    const hash = location.hash || "";
    const search = location.search || "";
    const params = new URLSearchParams(search);
    const state = params.get("state");
    return hash.includes("session_id=") ||
      (!!params.get("code") && (state === "github" || state === "discord" || state === "github_integration"));
  })();

  // Set auth token for API calls whenever token changes
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Load projects from API when user is logged in, or show demo tasks
  useEffect(() => {
    if (loading) return;
    if (user && token) {
      loadProjectsFromAPI();
    } else {
      setTasks(DEMO_TASKS);
    }
  }, [user, token, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProjectsFromAPI = useCallback(async () => {
    setTasksLoading(true);
    try {
      const projects = await fetchProjects();
      const apiTasks = projects.map(projectToTask);
      setTasks(apiTasks.length > 0 ? apiTasks : []);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem("sonar-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  const handleStart = (prompt, model, mode, attachedFiles = []) => {
    setInitialTask(null);
    setInitialPrompt(prompt);
    setView("builder");
    window.__sonarInitModel = model || "gpt-4o";
    window.__sonarInitMode = mode || "S-1";
    window.__sonarInitFiles = attachedFiles || [];
  };

  const handleSelectTaskFromHome = (task) => {
    setInitialPrompt("");
    setInitialTask(task);
    setView("builder");
  };

  const handleCloseTaskFromHome = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (user && token && !taskId.startsWith("demo-")) {
      try {
        await deleteProject(taskId);
      } catch (err) {
        console.error("Failed to delete project:", err);
        loadProjectsFromAPI();
      }
    }
  };

  const handleReset = () => {
    setInitialPrompt("");
    setInitialTask(null);
    setView("landing");
    if (user && token) {
      loadProjectsFromAPI();
    }
  };

  const handleTasksChange = (updatedTasks) => {
    setTasks(updatedTasks);
  };

  // Handle OAuth callback — store token and restore session
  const handleOAuthSuccess = useCallback(async (data) => {
    // CRITICAL: Use navigate to clear URL params — window.history.replaceState
    // does NOT update React Router's location, so isOAuthCallback would stay true
    navigate("/", { replace: true });

    if (data?.token && restoreFromToken) {
      await restoreFromToken(data.token);
    }
    setView("landing");
  }, [restoreFromToken, navigate]);

  const handleOAuthError = useCallback((msg) => {
    console.error("OAuth error:", msg);
    // Navigate to clear URL params first
    navigate("/", { replace: true });
    setView("landing");
  }, [navigate]);

  // Render OAuth callback screen
  if (isOAuthCallback) {
    return (
      <AuthCallback
        onSuccess={handleOAuthSuccess}
        onError={handleOAuthError}
      />
    );
  }

  // Show loading screen while restoring auth session
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#060c14" : "linear-gradient(135deg, #7cc0e6 0%, #a8d4ef 100%)",
      }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 900,
          fontSize: "2rem",
          letterSpacing: "-0.05em",
          color: isDark ? "#fff" : "#0a2a5e",
          opacity: 0.6,
        }}>
          sonar
        </span>
      </div>
    );
  }

  if (view === "auth") {
    return <AuthPage onBack={() => setView("landing")} isDark={isDark} />;
  }

  if (view === "builder") {
    return (
      <AppBuilder
        initialPrompt={initialPrompt}
        initialTask={initialTask}
        onReset={handleReset}
        externalTasks={tasks}
        onTasksChange={handleTasksChange}
        isDark={isDark}
        user={user}
        token={token}
      />
    );
  }

  return (
    <LandingPage
      onStart={handleStart}
      tasks={tasks}
      onSelectTask={handleSelectTaskFromHome}
      onCloseTask={handleCloseTaskFromHome}
      onShowAuth={() => setView("auth")}
      user={user}
      onLogout={logout}
      isDark={isDark}
      onToggleTheme={handleToggleTheme}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<SonarApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
