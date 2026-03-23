# `.cursor/rules` — Minimal auto-context only

This folder is intentionally **small**. Rules exist only to provide **automatic context** based on opened files (via `globs`) and to keep the **orchestrator always-on**.

## What should live here

- **Always-on orchestrator**: `always-orchestrator-skill.mdc` (points to `.cursor/agents/orchestrator/SKILL.md`)
- **Core file-context rules**:
  - `frontend-developer.mdc`
  - `backend-developer.mdc`

## What should *not* live here

- Large persona libraries or specialist playbooks. Those belong under `.cursor/agents/` (specialists + field skills + curated data).

## Source of truth

- **Orchestrator**: `.cursor/agents/orchestrator/SKILL.md`
- **Task mapping**: `.cursor/agents/orchestrator/task-to-agent-mapping-rules.md`
- **Field skills**: `.cursor/agents/skills/*.md`
