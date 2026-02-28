# Workflow: Keep Codebase Map Updated

## Triggers

Run this workflow whenever any of the following occur:

- New feature added (component, page, or server action)
- New folder created under `src/`
- Major refactor (files moved, renamed, or deleted)
- New API route or server action added
- New DB migration created

---

## Steps

### 1. Update `.claude/codebase-map.md`

Edit only the affected section(s):

| Change type | Section to update |
|-------------|------------------|
| New page | §2 Core Features, §9 Routing Summary |
| New component | §5 UI Components |
| New server action | §4 API Routes (add row + line range) |
| New DB migration | §3 Database Layer (add row to migration table) |
| New folder | §1 Directory Structure |
| New env var | §7 Environment Variables |
| New integration | §8 External Integrations |

Update the `Last updated` date at the top.

### 2. Update `.claude/agent-memory/project-state.md`

- Move feature from **Incomplete** → **Implemented** if it's now done
- Add new tech debt entries if shortcuts were taken
- Update `Last updated` date at the top

### 3. Note affected files

At the bottom of your response (or in a commit message), list:

```
Map updated:
- .claude/codebase-map.md → [section name]
- .claude/agent-memory/project-state.md → [Implemented / Incomplete / Tech Debt]
Affected source files: [list]
```

---

## Rules

- **Do not rewrite the entire map** — patch only changed sections
- **Keep line count under 500** in `codebase-map.md`
- **One migration = one row** in the DB migration table; never edit existing rows
- If a feature is partially complete, add it to **Partially Missing** in `project-state.md`, not Implemented
- Update memory file `~/.claude/projects/.../memory/MEMORY.md` if stack or architecture changes
