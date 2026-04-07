import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

// Set auth header for all requests
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Convert API project to frontend task format
export function projectToTask(project) {
  return {
    id: project.id,
    projectType: project.type,
    projectName: project.name,
    prompt: project.prompt,
    timestamp: new Date(project.updated_at).getTime(),
    // Keep full project data for AppBuilder
    _project: project,
  };
}

// ── CRUD Operations ──

export async function fetchProjects() {
  const res = await api.get("/api/projects");
  return res.data;
}

export async function createProject({ name, prompt, type, model, mode }) {
  const res = await api.post("/api/projects", {
    name: name || "untitled-app",
    prompt,
    type: type || "custom",
    model: model || "gpt-4o",
    mode: mode || "S-1",
  });
  return res.data;
}

export async function getProject(projectId) {
  const res = await api.get(`/api/projects/${projectId}`);
  return res.data;
}

export async function updateProject(projectId, updates) {
  const res = await api.patch(`/api/projects/${projectId}`, updates);
  return res.data;
}

export async function deleteProject(projectId) {
  const res = await api.delete(`/api/projects/${projectId}`);
  return res.data;
}

// ── E2B Sandbox Deployment ──

/**
 * Deploy generated React code to an E2B sandbox.
 * Returns { sandbox_id, preview_url }
 */
export async function deploySandbox(code) {
  const res = await api.post("/api/sandbox/deploy", { code });
  return res.data;
}

/**
 * Kill an E2B sandbox to free resources.
 */
export async function killSandbox(sandboxId) {
  const res = await api.delete(`/api/sandbox/${sandboxId}`);
  return res.data;
}

/**
 * Sync latest generated code to the agent's VS Code workspace.
 * Called after each generation/chat. Fire-and-forget (non-blocking).
 */
export async function syncCodeToWorkspace(projectId) {
  try {
    const res = await api.post(`/api/projects/${projectId}/codebase/sync-code`);
    return res.data;
  } catch (e) {
    // Non-blocking — silently ignore errors
    console.warn("Workspace sync skipped:", e?.response?.data?.detail || e.message);
    return null;
  }
}

// ── E2B VS Code Pre-Provisioning (for CostPreviewModal) ──

/**
 * Start pre-provisioning a VS Code sandbox (before project exists).
 * Returns { provision_id, status: "starting" }
 */
export async function provisionVSCode() {
  const res = await api.post("/api/sandbox/vscode/provision");
  return res.data;
}

/**
 * Poll the status of a VS Code pre-provisioning request.
 * Returns { provision_id, status: "starting"|"sandbox_created"|"installing"|"configuring"|"ready"|"error", error? }
 */
export async function getProvisionStatus(provisionId) {
  const res = await api.get(`/api/sandbox/vscode/provision/${provisionId}/status`);
  return res.data;
}

/**
 * Attach a pre-provisioned VS Code sandbox to a project.
 */
export async function attachCodebaseToProject(projectId, provisionId) {
  const res = await api.post(`/api/projects/${projectId}/codebase/attach`, {
    provision_id: provisionId,
  });
  return res.data;
}

// ── E2B VS Code Codebase per project ──

/**
 * Create or get existing VS Code (code-server) sandbox for a project.
 * Returns { sandbox_id, vscode_url, vscode_password, status }
 */
export async function createOrGetCodebase(projectId) {
  const res = await api.post(`/api/projects/${projectId}/codebase`);
  return res.data;
}

/**
 * Get existing VS Code sandbox info for a project.
 * Returns { sandbox_id, vscode_url, vscode_password, status }
 */
export async function getCodebase(projectId) {
  const res = await api.get(`/api/projects/${projectId}/codebase`);
  return res.data;
}

/**
 * Delete (kill) VS Code sandbox for a project.
 */
export async function deleteCodebase(projectId) {
  const res = await api.delete(`/api/projects/${projectId}/codebase`);
  return res.data;
}

// ── LLM Generation (SSE) ──

/**
 * Call /api/generate with SSE streaming.
 * @param {Object} params - { prompt, model, mode, project_id }
 * @param {Function} onChunk - Called with each code chunk string
 * @param {Function} onDone - Called with the full generated code
 * @param {Function} onError - Called with error message
 * @returns {AbortController} - Call .abort() to cancel
 */
/**
 * Strip leading markdown code fence tokens (```jsx, ```javascript, ```) from streaming buffer.
 * Returns cleaned string safe to display in the code editor.
 */
function stripStreamingFences(text) {
  // Remove leading ``` with optional language identifier
  return text.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```\s*$/, "");
}

export function generateCode({ prompt, model, mode, project_id }, onChunk, onDone, onError) {
  const controller = new AbortController();

  const token = api.defaults.headers.common["Authorization"]?.replace("Bearer ", "") || "";

  // Accumulate raw chunks so we can clean fences before forwarding
  let rawBuffer = "";

  fetch(`${BACKEND_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt, model: model || "gpt-4o", mode: mode || "S-1", project_id }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                rawBuffer += data.content;
                // Pass cleaned version to UI so editor never shows ``` fences
                const cleaned = stripStreamingFences(rawBuffer);
                onChunk?.(data.content, cleaned);
              } else if (data.type === "done") {
                onDone?.(data.full_code);
              } else if (data.type === "error") {
                onError?.(data.message);
              }
            } catch (e) {
              // Ignore parse errors for partial data
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError?.(err.message);
      }
    });

  return controller;
}

/**
 * Call /api/chat with SSE streaming.
 * @param {Object} params - { message, current_code, model, mode, project_id }
 * @param {Function} onChunk - Called with each code chunk string
 * @param {Function} onDone - Called with the full modified code
 * @param {Function} onError - Called with error message
 * @returns {AbortController} - Call .abort() to cancel
 */
export function chatWithCode({ message, current_code, model, mode, project_id }, onChunk, onDone, onError) {
  const controller = new AbortController();

  const token = api.defaults.headers.common["Authorization"]?.replace("Bearer ", "") || "";

  fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, current_code: current_code || "", model: model || "gpt-4o", mode: mode || "S-1", project_id }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                onChunk?.(data.content);
              } else if (data.type === "done") {
                onDone?.(data.full_code);
              } else if (data.type === "error") {
                onError?.(data.message);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError?.(err.message);
      }
    });

  return controller;
}
