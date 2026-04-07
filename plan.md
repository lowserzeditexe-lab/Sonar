# plan.md — Sonar: E2B VS Code (code-server) per Task

## 1) Objectives
- ✅ Replace the blank template in `/app` with the real Sonar codebase from GitHub.
- ✅ Add an **E2B “VS Code per project”** feature:
  - ✅ One E2B sandbox per project running **code-server** on port **8080**.
  - ✅ “Code” button on each task card opens a modal.
  - ✅ Modal shows **VS Code URL** + **random password** (hidden but copyable).
  - ✅ If sandbox already exists, modal opens instantly with stored credentials.
  - ✅ Write the project’s generated code into the sandbox workspace (`/home/user/workspace/App.jsx`).
- ✅ Deliver as an MVP/POC-first flow that is reliable (creation ~30–60s) and doesn’t break existing preview sandbox deploy.

**Current status:** Phase 1 + Phase 2 completed. Sonar is running with the VS Code-per-project feature implemented end-to-end.

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
**Goal:** End-to-end UX: user clicks “Code” on a task → code-server is provisioned (or fetched) → modal shows URL + copyable hidden password.

User stories:
1. ✅ As a user, I see my task cards on the landing page.
2. ✅ As a user, I click “Code” on a task and see a clear “Setting up VS Code…” loading state.
3. ✅ As a user, once ready I see a VS Code URL and can open it in a new tab.
4. ✅ As a user, the password is hidden by default but I can copy it with one click.
5. ✅ As a returning user, clicking “Code” again instantly shows the already-created URL/password.
6. ✅ As a user, if sandbox creation fails, I see an actionable error and can retry.

Steps:
1. **Codebase migration into `/app`**
   - ✅ Cloned `https://github.com/lowserzeditexe-lab/Sonar`.
   - ✅ Replaced `/app/backend` and `/app/frontend` with repo content.
   - ✅ Installed backend + frontend dependencies and confirmed Sonar boots.
   - ✅ Fixed runtime dependency issues (e.g., `framer-motion`, `lucide-react` icon name changes).

2. **Backend: project codebase sandbox endpoints** (FastAPI)
   - ✅ Persisted VS Code environment metadata directly on the Mongo `projects` documents:
     - `vscode_sandbox_id`, `vscode_url`, `vscode_password`, `vscode_created_at`
   - ✅ Implemented auth-protected endpoints:
     - ✅ `POST /api/projects/{project_id}/codebase`
       - Returns stored url/password if present
       - Otherwise provisions a sandbox in a thread (`asyncio.to_thread`) and stores the results
       - Writes the project’s `code` into `/home/user/workspace/App.jsx` (fallback placeholder if missing)
     - ✅ `GET /api/projects/{project_id}/codebase`
     - ✅ `DELETE /api/projects/{project_id}/codebase` (kills sandbox + unsets fields)

3. **Frontend: API + modal + task card button**
   - ✅ Added API functions in `frontend/src/api/projects.js`:
     - `createOrGetCodebase(projectId)`
     - `getCodebase(projectId)`
     - `deleteCodebase(projectId)`
   - ✅ Added `CodebaseModal` component (`frontend/src/components/CodebaseModal.jsx`):
     - Shows URL (clickable), password (masked by default)
     - Copy buttons for URL + password
     - Show/hide password toggle
     - Loading state while provisioning
     - Error state with retry
     - Optional delete environment action
   - ✅ Updated `LandingPage` task cards:
     - Adds “Code” button (only for real tasks; demo tasks excluded)
     - Unauthenticated users are prompted to sign in
   - ✅ Updated `AppBuilder` + `TopBar`:
     - Added a VS Code environment button for active real projects
     - Opens `CodebaseModal` for the active project

4. **Write project code into sandbox**
   - ✅ Backend writes latest stored project `code` to `/home/user/workspace/App.jsx`.
   - ✅ Uses placeholder if project code is empty.

5. **One round E2E test**
   - ✅ Automated test pass:
     - Backend: 90% (only “login with pre-provided credentials” failed because user wasn’t pre-created; registration works)
     - Frontend: 100%

---

### Phase 3 — Hardening + UX polish
**Goal:** Improve reliability, observability, and lifecycle management.

User stories:
1. As a user, I can see “Provisioning”, “Ready”, “Failed” status per task.
2. As a user, I can re-provision if the sandbox expired.
3. As a user, I can terminate my code environment to save resources.
4. As a user, I can re-open the modal and copy credentials reliably.
5. As a user, the app remains fast and doesn’t block other features while provisioning.

Steps (recommended next):
- Add `vscode_status` transitions in DB: `none → provisioning → ready → error`.
- Add backend readiness check + retries:
  - Verify code-server responds before returning `ready`.
  - Handle sandbox expiration (stale `vscode_sandbox_id`/URL).
- Add UI badges per task (status pill) + explicit “Recreate” action.
- Add policy for sandbox timeout and cleanup (document expected lifetime; optionally auto-kill).
- Add minimal backend tests focused on:
  - Permission checks (project ownership)
  - DB persistence for codebase fields
  - Delete endpoint unsets fields even if kill fails
- Documentation polish:
  - Update QA instructions: “register a fresh user” instead of assuming `test@test.com` exists.

---

## 3) Next Actions
1. ✅ Completed: clone/copy Sonar repo into `/app` and verify it runs.
2. ✅ Completed: implement Phase 1 POC and validate code-server URL/password.
3. ✅ Completed: add backend `projects/{id}/codebase` endpoints.
4. ✅ Completed: add frontend “Code” button + `CodebaseModal` + API wiring.
5. ✅ Completed: run end-to-end test and fix build/runtime issues.
6. Next: implement Phase 3 hardening items (status, retries, expiration handling, UI badges, docs).

---

## 4) Success Criteria
- ✅ Repo code fully replaces template; Sonar runs normally.
- ✅ Clicking **Code** on a real project provisions a **unique E2B sandbox** with **code-server**.
- ✅ Modal displays a working **https://{get_host(8080)}** URL and a **random password** (masked, copyable).
- ✅ Re-clicking **Code** for the same project reuses stored sandbox details (fast path).
- ✅ Generated project code is present in the VS Code workspace.
- ✅ Failures are surfaced cleanly (error + retry) and don’t break existing preview/deploy flows.
- ✅ Test status: Backend 90% (credential assumption only), Frontend 100%.