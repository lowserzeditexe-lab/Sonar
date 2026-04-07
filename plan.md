# plan.md — Sonar: E2B VS Code (code-server) per Task

## 1) Objectives
- ✅ Replace the blank template in `/app` with the real Sonar codebase from GitHub.
- ✅ Add an **E2B “VS Code per project”** feature:
  - ✅ One E2B sandbox per project running **code-server** on port **8080**.
  - ✅ “Code” button on each task card opens a modal.
  - ✅ Modal shows **VS Code URL** + **random password** (hidden but copyable).
  - ✅ If sandbox already exists, modal opens instantly with stored credentials.
  - ✅ Write the project’s generated code into the sandbox workspace (`/home/user/workspace/App.jsx`).
- ✅ Create VS Code environment **in parallel with project generation**:
  - ✅ Start E2B provisioning as soon as the pre-generation modal opens.
  - ✅ The pre-generation modal displays **real provisioning progress** (not a simulated timer).
  - ✅ The provisioning continues even if the modal closes; attachment happens automatically when ready.
- ✅ Ensure the **Code modal** shows **live provisioning progress** if the environment is still setting up.
- ✅ Keep existing E2B preview sandbox deploy (`/api/sandbox/deploy`) working.

**Current status:** Phase 1 + Phase 2 completed, including **real-time pre-provisioning** and **continuous polling**. Sonar runs end-to-end with the intended UX.

---

## 2) Implementation Steps

### Phase 1 — Core POC (E2B code-server sandbox in isolation)
**Goal:** Prove we can create an E2B sandbox, install/configure code-server with a password, expose URL via `get_host(8080)`, and write project code to disk.

User stories:
1. ✅ As a developer, I can run a single script that provisions a sandbox and returns a working code-server URL.
2. ✅ As a developer, I can set a random password and confirm code-server prompts for it.
3. ✅ As a developer, I can write a file (e.g., `/home/user/workspace/App.jsx`) and see it in VS Code.
4. ✅ As a developer, I can re-run the script and it cleans up (kills) the sandbox.
5. ✅ As a developer, I can measure time-to-ready and handle failures with clear logs.

Steps:
- ✅ Implemented and executed POC script (`/app/backend/test_e2b_vscode_poc.py`) that:
  - Creates `Sandbox.create(timeout=...)`
  - Installs code-server via install script (`--method=standalone`)
  - Writes `/home/user/.config/code-server/config.yaml` with `auth: password`, `password: <generated>`, `cert: false`, `bind-addr: 0.0.0.0:8080`
  - Starts `code-server` in background
  - Writes a sample file into `/home/user/workspace`
  - Validated URL format: `https://8080-{sandbox_id}.e2b.app`

Deliverable: ✅ Working POC script + validated commands/timeouts.

---

### Phase 2 — V1 App Development (integrate into Sonar)
**Goal:** End-to-end UX: user creates a project → VS Code environment is provisioned (in parallel) → user can open VS Code and copy credentials.

User stories:
1. ✅ As a user, I see my task cards on the landing page.
2. ✅ As a user, I can open a Code modal from a task card.
3. ✅ As a user, the Code modal either:
   - shows a clear loading experience while provisioning, or
   - shows URL + password immediately if already ready.
4. ✅ As a user, the password is hidden by default but copyable.
5. ✅ As a returning user, clicking “Code” again is instant.
6. ✅ As a user, failures are surfaced clearly and I can retry.

Steps:

1. **Codebase migration into `/app`**
   - ✅ Cloned `https://github.com/lowserzeditexe-lab/Sonar`.
   - ✅ Replaced `/app/backend` and `/app/frontend` with repo content.
   - ✅ Installed backend + frontend dependencies and confirmed Sonar boots.
   - ✅ Fixed runtime dependency issues (e.g., `framer-motion`, `lucide-react` icon name changes).

2. **Backend: VS Code codebase endpoints per project** (FastAPI)
   - ✅ Persisted VS Code environment metadata on Mongo `projects`:
     - `vscode_sandbox_id`, `vscode_url`, `vscode_password`, `vscode_created_at`
   - ✅ Implemented auth-protected endpoints:
     - ✅ `POST /api/projects/{project_id}/codebase` (create-or-get)
     - ✅ `GET /api/projects/{project_id}/codebase`
     - ✅ `DELETE /api/projects/{project_id}/codebase`

3. **Frontend: Code button + CodebaseModal**
   - ✅ Added API functions in `frontend/src/api/projects.js`:
     - `createOrGetCodebase(projectId)`, `getCodebase(projectId)`, `deleteCodebase(projectId)`
   - ✅ Added `CodebaseModal` (`frontend/src/components/CodebaseModal.jsx`):
     - URL (clickable), password (masked by default)
     - Copy buttons (URL + password)
     - Show/hide password toggle
     - Error state + retry
     - Optional delete environment action
   - ✅ Updated `LandingPage` task cards:
     - Adds “Code” button (only for real tasks; demo tasks excluded)
   - ✅ Updated `AppBuilder` + `TopBar`:
     - Added VS Code environment button for active real projects

4. **Write project code into sandbox**
   - ✅ Backend writes latest stored project `code` to `/home/user/workspace/App.jsx`.
   - ✅ Uses placeholder if project code is empty.

5. **Enable LLM generation key for testing**
   - ✅ Added `EMERGENT_LLM_KEY` in `/app/backend/.env` so `/api/generate` works.

6. **E2E testing**
   - ✅ Initial E2E tests passed for codebase creation and Code modal.

---

### Phase 2.5 — Parallel provisioning + real progress (CostPreviewModal)
**Goal:** VS Code environment starts provisioning **at the same time** as the user starts project generation, and the modal shows **real** progress.

User stories:
1. ✅ As a user, when I click Build and the pre-generation modal opens, it immediately begins provisioning a VS Code cloud environment.
2. ✅ As a user, I see real step progress:
   - Loading cloud environment
   - Allocating resources
   - Configuring environment
   - Starting agents
3. ✅ As a user, I can click Generate quickly (after resources are allocated) without waiting for the full ~60s setup.
4. ✅ As a user, provisioning continues even if the modal closes.

Backend steps:
- ✅ Added pre-provisioning endpoints:
  - `POST /api/sandbox/vscode/provision` → returns `provision_id` immediately; continues setup in background.
  - `GET /api/sandbox/vscode/provision/{provision_id}/status` → polling endpoint.
  - `POST /api/projects/{project_id}/codebase/attach` → attaches provisioned sandbox to project.
- ✅ Status transitions implemented: `starting → sandbox_created → installing → configuring → ready`.

Frontend steps:
- ✅ Reworked `CostPreviewModal.jsx`:
  - Starts provisioning on modal open (authenticated users)
  - Polls status every 2s
  - Steps reflect real status updates
  - Generate button becomes active after `sandbox_created` (fast path)
- ✅ Updated `AppBuilder.jsx` to accept `provisionId` from modal.

---

### Phase 2.6 — Continuous polling after modal close + live progress in Code modal
**Goal:** Provisioning status remains visible and accurate even after the pre-generation modal closes.

User stories:
1. ✅ As a user, if I close the pre-generation modal, provisioning keeps running and keeps updating.
2. ✅ As a user, if I open the Code modal while provisioning is in progress, I see the same real progress steps.
3. ✅ As a user, once provisioning becomes ready, the project is auto-attached and credentials become available.

Steps:
- ✅ AppBuilder now maintains **background polling** (every ~3s) for the active provision:
  - Poll continues after CostPreviewModal closes
  - Auto-attaches to the project when status becomes `ready`
- ✅ CodebaseModal supports:
  - `initialVsUrl` / `initialVsPassword` (instant display)
  - `provisionId` / `provisionStatus` (live progress mode)
  - Internal polling fallback for tasks opened from LandingPage when a provision_id exists
- ✅ LandingPage passes stored `vscode_provision_id` / credentials into CodebaseModal.

---

### Phase 3 — Hardening + UX polish (recommended next)
**Goal:** Improve reliability, observability, and lifecycle management.

User stories:
1. As a user, I can see a persistent “Provisioning / Ready / Failed” status badge per task.
2. As a user, I can re-provision if the sandbox expired or was lost after a server restart.
3. As a user, I can terminate my environment to save resources.
4. As a user, I can always recover credentials from the project page.

Steps (recommended):
- Persist provisioning state in DB (instead of in-memory only):
  - Add `vscode_status`, `vscode_provision_id`, `vscode_last_update_at`.
- Handle backend restarts:
  - If provision_id no longer exists but project has no URL, allow “Recreate environment”.
- Add backend readiness checks:
  - Verify code-server responds before declaring `ready`.
- Add cleanup policies:
  - Auto-kill after X hours or expose explicit “Stop environment” action.
- Add tests:
  - Permission checks (project ownership)
  - Attach flow + polling correctness
  - Delete unsets fields even if kill fails
- Documentation polish:
  - QA instructions: use “register fresh user” instead of assuming fixed credentials.

---

## 3) Next Actions
1. ✅ Completed: clone/copy Sonar repo into `/app` and verify it runs.
2. ✅ Completed: implement Phase 1 POC and validate code-server URL/password.
3. ✅ Completed: add backend `projects/{id}/codebase` endpoints.
4. ✅ Completed: add frontend “Code” button + `CodebaseModal` + API wiring.
5. ✅ Completed: implement real provisioning progress in `CostPreviewModal` and run it in parallel with generation.
6. ✅ Completed: add background polling in AppBuilder + live provisioning progress in Code modal.
7. Next: implement Phase 3 hardening items (persist statuses in DB, restart resilience, cleanup policies).

---

## 4) Success Criteria
- ✅ Repo code fully replaces template; Sonar runs normally.
- ✅ Clicking **Build** starts VS Code provisioning immediately (in parallel with generation).
- ✅ Pre-generation modal shows **real** provisioning progress and activates Generate quickly.
- ✅ Provisioning continues after modal close; project auto-attaches when ready.
- ✅ Clicking **Code** on a project either:
  - shows live provisioning progress (if still setting up), or
  - shows URL + password instantly (if ready).
- ✅ Modal displays a working **https://{get_host(8080)}** URL and a **random password** (masked, copyable).
- ✅ Generated project code is present in the VS Code workspace.
- ✅ Failures are surfaced cleanly (error + retry) and don’t break existing preview/deploy flows.
