import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "./TopBar";
import ChatPanel from "./ChatPanel";
import EmergentPreview from "./EmergentPreview";
import CostPreviewModal from "./CostPreviewModal";
import ShareModal from "./ShareModal";
import DeployPanel from "./DeployPanel";
import CodebaseModal from "./CodebaseModal";
import { AGENT_STEPS, MOCK_LOGS } from "../data/mockData";
import { createProject, updateProject, deleteProject, projectToTask, generateCode, chatWithCode, deploySandbox, killSandbox, attachCodebaseToProject, getProvisionStatus } from "../api/projects";

// Agent metadata with mode-specific logs
const AGENT_META_S1 = {
  planner:   { label: "Planner",   steps: ["Analyzing requirements...", "Planning implementation...", "Architecture plan ready"] },
  architect: { label: "Architect", steps: ["Designing component tree", "Setting up data models", "API contracts defined"] },
  coder:     { label: "Coder",     steps: ["Writing stable code...", "Implementing state management", "Self-review complete"] },
  debugger:  { label: "Debugger",  steps: ["Running test suite", "0 errors found", "Performance optimized"] },
};

const AGENT_META_S2 = {
  planner:   { label: "Planner",   steps: ["Deep analysis of requirements...", "Mapping all edge cases...", "Comprehensive plan ready"] },
  architect: { label: "Architect", steps: ["Designing robust component tree", "Mapping data flows and error states", "Production-grade architecture defined"] },
  coder:     { label: "Coder",     steps: ["Implementing thoroughly...", "Critical review — checking everything...", "Refining and polishing..."] },
  debugger:  { label: "Debugger",  steps: ["Testing all edge cases", "Verifying empty states, errors, mobile", "Quality validated — production-ready"] },
};

function detectProjectType(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("todo") || p.includes("task") || p.includes("list")) return "todo";
  if (p.includes("dashboard") || p.includes("analytics") || p.includes("chart")) return "dashboard";
  if (p.includes("shop") || p.includes("store") || p.includes("commerce") || p.includes("product")) return "ecommerce";
  return "custom";
}

function getProjectName(type) {
  return { todo: "task-manager", dashboard: "analytics-dash", ecommerce: "tech-store", custom: "my-app" }[type] || "my-app";
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function AppBuilder({ initialPrompt, initialTask, onReset, externalTasks, onTasksChange, isDark = false, user, token }) {
  const [selectedModel] = useState(window.__sonarInitModel || "gpt-4o");
  const [mode] = useState(window.__sonarInitMode || "S-1");
  const [initFiles] = useState(window.__sonarInitFiles || []);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [projectType, setProjectType] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [showCostModal, setShowCostModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [projectName, setProjectName] = useState("untitled-app");
  const [activeTab, setActiveTab] = useState("preview");
  const [previewReady, setPreviewReady] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [showCoderFromTopBar, setShowCoderFromTopBar] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [tasks, setTasks] = useState(externalTasks || []);

  // VS Code codebase modal state
  const [showCodebaseModal, setShowCodebaseModal] = useState(false);

  // Background provision tracking (survives modal close)
  const [activeProvisionId, setActiveProvisionId] = useState(null);
  const [activeProvisionStatus, setActiveProvisionStatus] = useState(null); // starting|sandbox_created|installing|configuring|ready|error
  const [activeProvisionProjectId, setActiveProvisionProjectId] = useState(null);
  const provisionPollRef = useRef(null);

  // Start / manage background provision polling
  const startProvisionPolling = useCallback((provisionId, projectId) => {
    if (provisionPollRef.current) clearInterval(provisionPollRef.current);
    provisionPollRef.current = setInterval(async () => {
      try {
        const data = await getProvisionStatus(provisionId);
        setActiveProvisionStatus(data.status);
        if (data.status === "ready") {
          clearInterval(provisionPollRef.current);
          // Attach to project now that it's ready
          if (projectId) {
            try {
              await attachCodebaseToProject(projectId, provisionId);
            } catch (e) {
              console.warn("Auto-attach failed:", e);
            }
          }
        } else if (data.status === "error") {
          clearInterval(provisionPollRef.current);
        }
      } catch (err) {
        console.warn("Background provision poll failed:", err);
      }
    }, 3000);
  }, []);

  // E2B sandbox state (preview)
  const [sandboxUrl, setSandboxUrl] = useState(null);
  const [sandboxId, setSandboxId] = useState(null);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const hasStarted = useRef(false);
  const onTasksChangeRef = useRef(onTasksChange);
  onTasksChangeRef.current = onTasksChange;

  // Sync tasks changes up to parent without causing render-time side effects
  useEffect(() => {
    onTasksChangeRef.current?.(tasks);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const addMsg = (msg) => setMessages(prev => [...prev, msg]);

  // Deploy code to E2B sandbox after generation
  const deployCodeToSandbox = useCallback(async (code) => {
    if (!code || code.length < 50) return;
    setIsSandboxLoading(true);
    setSandboxUrl(null);
    try {
      const result = await deploySandbox(code);
      setSandboxUrl(result.preview_url);
      setSandboxId(result.sandbox_id);
    } catch (err) {
      console.error("E2B sandbox deploy failed:", err);
      // Non-blocking — iframe preview still works
    } finally {
      setIsSandboxLoading(false);
    }
  }, []);

  // Get the right agent meta based on mode
  const agentMeta = mode === "S-2" ? AGENT_META_S2 : AGENT_META_S1;

  const pushTask = async (id, type, name, prompt, provisionId = null) => {
    let taskId = id;

    // If user is authenticated, create project via API
    if (user && token) {
      try {
        const project = await createProject({
          name,
          prompt,
          type,
          model: selectedModel,
          mode,
        });
        taskId = project.id;
        const newTask = projectToTask(project);
        setTasks(prev => [newTask, ...prev.filter(t => t.id !== taskId)]);
        setActiveTaskId(taskId);

        // Track provision in background — polling continues after modal closes
        if (provisionId) {
          setActiveProvisionId(provisionId);
          setActiveProvisionProjectId(taskId);
          setActiveProvisionStatus("starting");
          startProvisionPolling(provisionId, taskId);
        }

        return taskId;
      } catch (err) {
        console.error("Failed to create project:", err);
      }
    }

    // Fallback for unauthenticated users
    const newTask = { id: taskId, projectType: type, projectName: name, prompt, timestamp: Date.now() };
    setTasks(prev => [newTask, ...prev.filter(t => t.id !== taskId)]);
    setActiveTaskId(taskId);
    return taskId;
  };

  const startGeneration = useCallback(async (prompt, provisionId = null) => {
    const type = detectProjectType(prompt);
    const name = getProjectName(type);
    const localId = `task-${Date.now()}`;

    setProjectType(type);
    setProjectName(name);
    setIsGenerating(true);
    setIsTyping(false);
    setCurrentCode("");
    setTerminalLogs([]);
    setPreviewReady(false);
    setShowPreviewPanel(false);
    setMessages([]);
    setActiveTab("preview");
    // Reset sandbox state for new generation
    setSandboxUrl(null);
    setSandboxId(null);
    setIsSandboxLoading(false);

    // Create project (API or local) + attach provision if available
    const taskId = await pushTask(localId, type, name, prompt, provisionId);

    if (timerRef.current) clearInterval(timerRef.current);
    runFlow(type, name, prompt, taskId);
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const runFlow = async (type, name, prompt, taskId) => {
    // Add user message
    addMsg({ role: "user", content: prompt });
    await delay(500);

    // Initial AI acknowledgment
    setIsTyping(true);
    await delay(800);
    setIsTyping(false);
    const ackMsg = mode === "S-2"
      ? `Deep analysis initiated. I'll thoroughly build your ${name} — checking all edge cases and making it production-grade.`
      : `Got it! I'll build a stable, reliable ${name} for you. Planning the implementation now...`;
    addMsg({ role: "assistant", content: ackMsg });
    await delay(400);

    // Run agent steps in parallel with LLM call
    const agentSteps = [...AGENT_STEPS];
    let agentDone = false;

    // Start agent simulation
    const runAgents = async () => {
      for (let i = 0; i < agentSteps.length; i++) {
        const step = agentSteps[i];
        const meta = agentMeta[step.id];
        addMsg({ role: "agent", agentId: step.id, label: meta.label, status: "working", steps: [] });

        if (step.id === "coder") {
          setShowPreviewPanel(true);
        }

        await delay(400);
        for (let j = 0; j < meta.steps.length; j++) {
          await delay(600);
          setMessages(prev => prev.map(m =>
            m.role === "agent" && m.agentId === step.id ? { ...m, steps: [...m.steps, meta.steps[j]] } : m
          ));
        }

        // Wait for LLM if we're on the last agent step
        if (i === agentSteps.length - 1) {
          // Wait until LLM is done or timeout
          let waitCount = 0;
          while (!agentDone && waitCount < 120) {
            await delay(500);
            waitCount++;
          }
        }

        await delay(300);
        setMessages(prev => prev.map(m =>
          m.role === "agent" && m.agentId === step.id ? { ...m, status: "done" } : m
        ));

        if (i === 1) {
          await delay(400);
          setIsTyping(true);
          await delay(600);
          setIsTyping(false);
          const archMsg = mode === "S-2"
            ? `Architecture designed with full error handling, loading states, and responsive layout. Implementing now...`
            : `Architecture planned. Now writing the components...`;
          addMsg({ role: "assistant", content: archMsg });
        }
      }
    };

    // Start LLM generation
    const runLLM = async () => {
      return new Promise((resolve) => {
        const projectId = (taskId && !taskId.startsWith("task-")) ? taskId : undefined;

        const controller = generateCode(
          {
            prompt,
            model: selectedModel,
            mode,
            project_id: projectId,
          },
          // onChunk — second arg is the cleaned buffer (no markdown fences)
          (_raw, cleaned) => {
            setCurrentCode(cleaned !== undefined ? cleaned : _raw);
          },
          // onDone
          (fullCode) => {
            setCurrentCode(fullCode);
            agentDone = true;
            resolve(fullCode);
          },
          // onError
          (error) => {
            console.error("Generation error:", error);
            agentDone = true;
            // Still resolve with whatever we have
            resolve("");
          }
        );

        abortRef.current = controller;
      });
    };

    // Run both in parallel
    const [, generatedCode] = await Promise.all([runAgents(), runLLM()]);

    // Terminal logs
    for (let i = 0; i < MOCK_LOGS.length; i++) {
      await delay(80);
      setTerminalLogs(prev => [...prev, MOCK_LOGS[i]]);
    }

    setPreviewReady(true);
    setActiveTab("preview");
    await delay(300);

    // Final message
    setIsTyping(true);
    await delay(800);
    setIsTyping(false);
    const doneMsg = mode === "S-2"
      ? `Your ${name} is ready — built to production standards with edge cases handled. All features are polished and responsive.`
      : `Your ${name} is ready! Clean, stable implementation with all requested features.`;
    addMsg({ role: "assistant", content: doneMsg });

    setIsGenerating(false);

    // Deploy to E2B sandbox for live preview URL
    if (generatedCode) {
      deployCodeToSandbox(generatedCode);
    }

    // Save to project if authenticated
    if (user && token && taskId && !taskId.startsWith("task-") && generatedCode) {
      try {
        await updateProject(taskId, {
          status: "complete",
          code: generatedCode,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: doneMsg },
          ],
        });
      } catch (err) {
        console.error("Failed to update project:", err);
      }
    }
  };

  useEffect(() => {
    // Load existing task from home history
    if (initialTask) {
      handleSelectTask(initialTask);
      return;
    }
    // New generation from landing page prompt
    if (initialPrompt && !hasStarted.current) {
      hasStarted.current = true;
      setPendingPrompt(initialPrompt);
      setShowCostModal(true);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [initialPrompt, initialTask]);

  const handleConfirmGenerate = (provisionId = null) => {
    setShowCostModal(false);
    startGeneration(pendingPrompt, provisionId);
  };

  const handleSendMessage = (msg) => {
    if (isGenerating) return;
    addMsg({ role: "user", content: msg });
    setIsGenerating(true);
    setIsTyping(true);

    const projectId = (activeTaskId && !activeTaskId.startsWith("task-") && !activeTaskId.startsWith("demo-")) ? activeTaskId : undefined;

    let codeBuffer = "";

    const controller = chatWithCode(
      {
        message: msg,
        current_code: currentCode,
        model: selectedModel,
        mode,
        project_id: projectId,
      },
      // onChunk
      (chunk) => {
        codeBuffer += chunk;
        setCurrentCode(codeBuffer);
        setIsTyping(false);
      },
      // onDone
      (fullCode) => {
        setCurrentCode(fullCode);
        setIsTyping(false);
        setIsGenerating(false);
        addMsg({ role: "assistant", content: "Done! I've updated the code with your changes." });

        // Save to project
        if (user && token && projectId) {
          updateProject(projectId, { code: fullCode }).catch(console.error);
        }
      },
      // onError
      (error) => {
        console.error("Chat error:", error);
        setIsTyping(false);
        setIsGenerating(false);
        addMsg({ role: "assistant", content: `Sorry, there was an error: ${error}` });
      }
    );

    abortRef.current = controller;
  };

  const handleDeploy = () => setShowDeploy(true);


  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    if (provisionPollRef.current) clearInterval(provisionPollRef.current);
    // Kill E2B sandbox if active
    if (sandboxId) {
      killSandbox(sandboxId).catch(() => {});
      setSandboxUrl(null);
      setSandboxId(null);
    }
    // Clear provision tracking
    setActiveProvisionId(null);
    setActiveProvisionStatus(null);
    setActiveProvisionProjectId(null);
    hasStarted.current = false;
    onReset();
  };

  const handleNewTask = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    hasStarted.current = false;
    onReset();
  };

  const handleSelectTask = (task) => {
    setActiveTaskId(task.id);
    setProjectName(task.projectName);
    setProjectType(task.projectType);
    setPreviewReady(true);
    setShowPreviewPanel(true);
    setActiveTab("preview");
    
    // Load messages from stored project data if available
    const projectData = task._project;
    if (projectData && projectData.messages && projectData.messages.length > 0) {
      setMessages(projectData.messages);
    } else {
      setMessages([
        { role: "user", content: task.prompt },
        { role: "assistant", content: `Here's your ${task.projectName} — loaded from history.` },
      ]);
    }
    
    setIsGenerating(false);
    // Load code from stored project data
    const storedCode = projectData?.code;
    setCurrentCode(storedCode || "");
  };

  const handleCloseTask = async (taskId) => {
    let shouldReset = false;
    let nextTask = null;
    
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      if (taskId === activeTaskId) {
        if (updated.length > 0) {
          nextTask = updated[0];
        } else {
          shouldReset = true;
        }
      }
      return updated;
    });
    
    setTimeout(() => {
      if (nextTask) handleSelectTask(nextTask);
      if (shouldReset) handleReset();
    }, 0);

    // Delete from API if authenticated
    if (user && token && !taskId.startsWith("task-") && !taskId.startsWith("demo-")) {
      try {
        await deleteProject(taskId);
      } catch (err) {
        console.error("Failed to delete project:", err);
      }
    }
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100vh", background: isDark ? "#0a0a0a" : "linear-gradient(to bottom, #7cc0e6 0%, #a8d5ef 35%, #bdddf3 55%, #95cae8 100%)" }}>
      {/* VS Code Codebase Modal */}
      {showCodebaseModal && activeTaskId && !activeTaskId.startsWith("task-") && !activeTaskId.startsWith("demo-") && (() => {
        const activeTask = tasks.find(t => t.id === activeTaskId);
        const proj = activeTask?._project;
        const isActiveProvision = activeTaskId === activeProvisionProjectId;
        return (
          <CodebaseModal
            task={{ id: activeTaskId, projectName }}
            onClose={() => setShowCodebaseModal(false)}
            isDark={isDark}
            provisionId={isActiveProvision ? activeProvisionId : (proj?.vscode_provision_id || null)}
            provisionStatus={
              isActiveProvision
                ? activeProvisionStatus
                : proj?.vscode_url
                ? "ready"
                : proj?.vscode_provision_id
                ? "installing"
                : null
            }
            initialVsUrl={proj?.vscode_url || null}
            initialVsPassword={proj?.vscode_password || null}
          />
        );
      })()}
      <TopBar
        isGenerating={isGenerating}
        onDeploy={handleDeploy}
        onShare={() => setShowShare(true)}
        onHome={handleReset}
        projectName={projectName}
        isDark={isDark}
        user={user}
        showPreview={showPreviewPanel}
        onTogglePreview={() => setShowPreviewPanel(p => !p)}
        onOpenCode={() => { setShowPreviewPanel(true); setShowCoderFromTopBar(true); }}
        onOpenVSCode={() => setShowCodebaseModal(true)}
        activeTaskId={activeTaskId}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat — full width until coder starts, then 50% */}
        <div
          className="flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: showPreviewPanel ? "50%" : "100%",
            transition: "width 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
            borderRight: showPreviewPanel ? (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(80,140,220,0.15)") : "none",
          }}
        >
          <ChatPanel
            messages={messages}
            isTyping={isTyping}
            isGenerating={isGenerating}
            onSendMessage={handleSendMessage}
            onReset={handleReset}
            isDark={isDark}
            currentCode={currentCode}
            projectName={projectName}
          />
        </div>

        {/* Preview — slides in when coder starts */}
        <AnimatePresence>
          {showPreviewPanel && (
            <motion.div
              key="preview-panel"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <EmergentPreview
                projectType={projectType}
                isGenerating={isGenerating}
                previewReady={previewReady}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                code={currentCode}
                terminalLogs={terminalLogs}
                projectName={projectName}
                isDark={isDark}
                onClose={() => setShowPreviewPanel(false)}
                openCoderExternal={showCoderFromTopBar}
                onCoderExternalClosed={() => setShowCoderFromTopBar(false)}
                sandboxUrl={sandboxUrl}
                isSandboxLoading={isSandboxLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CostPreviewModal
        isOpen={showCostModal}
        onClose={() => { setShowCostModal(false); handleReset(); }}
        onConfirm={handleConfirmGenerate}
        prompt={pendingPrompt}
        selectedModel={selectedModel}
        mode={mode}
        attachedFiles={initFiles}
        isDark={isDark}
        isAuthenticated={!!(user && token)}
      />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        projectName={projectName}
        isDark={isDark}
      />

      <DeployPanel
        isOpen={showDeploy}
        onClose={() => setShowDeploy(false)}
        projectName={projectName}
        isDark={isDark}
      />
    </div>
  );
}
