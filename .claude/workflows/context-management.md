# Workflow: Context Management

## Before Large Tasks

Always read these two files first:

1. `.claude/codebase-map.md` — structure, routes, components, integrations
2. `.claude/agent-memory/project-state.md` — what's done, what's missing, tech debt

Do not start implementation until both are read.

---

## Rules

**1. Read before acting**
Read `.claude/codebase-map.md` and `project-state.md` before any task touching more than one file.

**2. Load only what's needed**
Only read files directly relevant to the task. Do not speculatively load entire directories.

**3. Prefer targeted edits**
Use `Edit` over `Write`. Change the minimum number of lines to achieve the goal.

**4. Do not rewrite working code**
If existing code functions correctly, leave it. Refactor only when explicitly asked.

**5. Keep responses concise**
Omit file contents from responses unless the user needs to see them. Summarise changes made, don't echo them back.

**6. Use skills as reference**
Installed skills (`.claude/skills/`) are reference material — consult them before implementing integrations (payments, auth, CI/CD, etc.).

**7. Work incrementally**
Break large tasks into steps. Complete and confirm each step before moving to the next. Do not attempt multiple features in one pass.

**8. Update the map after changes**
After any task that adds features, routes, components, or migrations — follow `.claude/workflows/update-codebase-map.md`.
