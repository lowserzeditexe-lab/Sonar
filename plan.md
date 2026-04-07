# plan.md — Sonar: E2B VS Code (code-server) per Task

## 1) Objectives
- Replace the blank template in `/app` with the real Sonar codebase from GitHub.
- Add an **E2B “VS Code per project”** feature:
  - One E2B sandbox per project running **code-server** on port **8080**.
  - “Code” button on each task card opens a modal.
  - Modal shows **VS Code URL** + **random password** (hidden but copyable).
  - If sandbox already exists, modal opens instantly with stored credentials.
  - Write the project’s generated code into the sandbox workspace.
- Deliver as an MVP/POC-first flow that is reliable (creation ~60s) and doesn’t break existing preview sandbox deploy.

---

## 2) Implementation Steps

### Phase 1 — Core POC (E2B code-server sandbox in isolation)
**Goal:** Prove we can create an E2B sandbox, install/configure code-server with a password, expose URL via `get_host(8080)`, and write project code to disk.

User stories:
1. As a developer, I can run a single script that provisions a sandbox and returns a working code-server URL.
2. As a developer, I can set a random password and confirm code-server prompts for it.
3. As a developer, I can write a file (e.g., `/home/user/workspace/App.jsx`) and see it in VS Code.
4. As a developer, I can re-run the script and it cleans up (kills) the sandbox.
5. As a developer, I can measure time-to-ready and handle failures with clear logs.

Steps:
- Web search/check E2B best practice for exposing long-running services (port proxying) + code-server install approach.
- Add `backend/scripts/e2b_vscode_poc.py` (or similar) that:
  - Creates `Sandbox.create(timeout=...)`
  - Installs code-server (install script)
  - Writes `~/.config/code-server/config.yaml` with `auth: password`, `password: <generated>`, `cert: false`, `bind-addr: 0.0.0.0:8080`
  - Starts `code-server` in background
  - Writes a sample file into workspace
  - Prints `https://{sandbox.get_host(8080)}` and password
  - Kills sandbox on exit (or optional)
- Run until it works reliably (retry/wait loop until port responds).

Deliverable: POC script + notes on exact commands/timeouts.

---

### Phase 2 — V1 App Development (integrate into Sonar)
**Goal:** End-to-end UX: user clicks “Code” on a task → code-server is provisioned (or fetched) → modal shows URL + copyable hidden password.

User stories:
1. As a user, I see my task cards on the landing page.
2. As a user, I click “Code” on a task and see a clear “Setting up VS Code…” loading state.
3. As a user, once ready I see a VS Code URL and can open it in a new tab.
4. As a user, the password is hidden by default but I can copy it with one click.
5. As a returning user, clicking “Code” again instantly shows the already-created URL/password.
6. As a user, if sandbox creation fails, I see an actionable error and can retry.

Steps:
1. **Codebase migration into `/app`**
   - Clone `https://github.com/lowserzeditexe-lab/Sonar` into a temp dir.
   - Replace `/app/backend` and `/app/frontend` with repo content (preserve environment-specific `.env` as needed).
   - Install backend/frontend deps, confirm Sonar boots.

2. **Backend: project codebase sandbox endpoints** (FastAPI)
   - Add new fields in project documents (Mongo):
     - `vscode_sandbox_id`, `vscode_url`, `vscode_password`, `vscode_created_at`, `vscode_status`.
   - Add endpoints (auth-protected like existing project CRUD):
     - `POST /api/projects/{project_id}/codebase`:
       - If exists and sandbox assumed alive: return stored url/password.
       - Else: create sandbox in thread (`asyncio.to_thread`) using proven POC steps.
       - Write generated project code into workspace (best-effort):
         - `App.jsx` or `src/App.jsx` depending on chosen structure.
       - Store sandbox_id/url/password in DB and return.
     - `GET /api/projects/{project_id}/codebase`: return stored info (404 if none).
     - `DELETE /api/projects/{project_id}/codebase`: kill sandbox + clear fields.
   - Add server-side logging + explicit timeouts; wait loop to ensure code-server started.

3. **Frontend: API + modal + task card button**
   - Add API functions in `frontend/src/api/projects.js`:
     - `createOrGetCodebase(projectId)` (POST)
     - `getCodebase(projectId)` (GET)
     - `deleteCodebase(projectId)` (DELETE) (optional in V1)
   - Add `CodebaseModal` component:
     - Shows URL (clickable), password (masked), Copy buttons for both.
     - Loading state during provisioning.
     - Error state with Retry.
   - Update `LandingPage` task cards:
     - Add “Code” button on each task card.
     - If task is demo/unauthenticated: show prompt to sign in (since DB storage is required).

4. **Write project code into sandbox**
   - When provisioning, fetch latest project code from DB; write to sandbox.
   - If no code yet, write a placeholder README or the latest generated code if present.

5. **One round E2E test**
   - Create project → generate code → click Code → wait → open VS Code URL → verify password works → verify files exist.

---

### Phase 3 — Hardening + UX polish
User stories:
1. As a user, I can see “Provisioning”, “Ready”, “Failed” status per task.
2. As a user, I can re-provision if the sandbox expired.
3. As a user, I can terminate my code environment to save resources.
4. As a user, I can re-open the modal and copy credentials reliably.
5. As a user, the app remains fast and doesn’t block other features while provisioning.

Steps:
- Add `vscode_status` transitions: `none → provisioning → ready → error`.
- Add backend retry/backoff + better readiness check (poll `http://127.0.0.1:8080` inside sandbox or external HEAD to URL).
- Add UI badge per task + “Recreate” and “Delete environment” actions.
- Consider sandbox timeouts/cleanup policy (DB field + optional scheduled cleanup).
- Add minimal backend tests for endpoints (mock-free where possible, unit around DB updates).

---

## 3) Next Actions
1. Clone/copy Sonar repo into `/app` and verify it runs.
2. Implement Phase 1 POC script and run it until code-server URL + password work.
3. Add backend `projects/{id}/codebase` endpoints using the proven POC logic.
4. Add frontend “Code” button + `CodebaseModal` + API wiring.
5. Run an end-to-end test of the full flow and fix any breakages.

---

## 4) Success Criteria
- Repo code fully replaces template; Sonar runs normally.
- Clicking **Code** on a real project provisions a **unique E2B sandbox** with **code-server**.
- Modal displays a working **https://{get_host(8080)}** URL and a **random password** (masked, copyable).
- Re-clicking **Code** for the same project reuses stored sandbox details (fast path).
- Generated project code is present in the VS Code workspace.
- Failures are surfaced cleanly (error + retry) and don’t break existing preview/deploy flows.
