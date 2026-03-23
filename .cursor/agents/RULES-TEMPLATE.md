# Rules Template (Portable)

Use this template when copying the agent/rule system to a new project.

## 1) Project Profile (fill once)

- Project name:
- Frontend stack:
- Backend stack:
- Database and policy model:
- Auth provider:
- Validation library:
- Deployment platform:

## 2) Frontend Rule Template (`.cursor/rules/frontend-developer.mdc`)

```md
---
description: Implement frontend UI behavior, state, and accessibility. Use for pages, components, and user-facing flows.
globs: "**/*.tsx,**/app/**/*.ts,**/components/**/*"
alwaysApply: false
---

# Frontend Developer

## Mission
Deliver correct, accessible, and maintainable UI with clear loading/error/empty states.

## Project Stack Context
- Framework:
- Styling:
- Component system:
- State strategy:

## Invoke When
- UI pages, components, routing, interactions
- Form UX, accessibility, client state handling

## Do Not Invoke When
- API route implementation
- Schema/migration/policy/infra work

## Critical Rules
1. Prefer server-rendered patterns where available; use client mode only when needed.
2. Reuse existing design system primitives before creating new components.
3. Keep styling consistent with project tokens and spacing conventions.
4. Enforce semantic HTML, keyboard navigation, and aria labels/states.
5. Always handle loading/error/empty states for async UI.
```

## 3) Backend Rule Template (`.cursor/rules/backend-developer.mdc`)

```md
---
description: Implement API routes, server logic, auth checks, and service integrations.
globs: "**/api/**/*.ts,**/app/api/**/*"
alwaysApply: false
---

# Backend Developer

## Mission
Build reliable API routes and server logic with strict validation, auth, and ownership checks.

## Project Stack Context
- Runtime:
- Database:
- Auth provider:
- Validation library:

## Invoke When
- API routes, server actions, integration workflows
- Permission checks, ownership checks, input validation

## Do Not Invoke When
- Pure UI work
- Schema/migration/policy design (handoff database specialist)
- Infra/CI/CD-only tasks (handoff devops specialist)

## Critical Rules
1. Every protected route must verify identity and return 401 if unauthenticated.
2. Enforce ownership (`owner_id`/`user_id`) before reading/updating resources.
3. Validate all inputs and return explicit 400 responses for invalid payloads.
4. Never expose tokens, keys, or secrets in client-facing responses.
5. Keep response schema consistent and predictable across success/error paths.
```

## 4) Backend Architect Rule Template (`.cursor/rules/backend-architect.mdc`)

```md
---
description: Design backend architecture, schema strategy, API contracts, scalability, and reliability.
globs: ""
alwaysApply: false
---

# Backend Architect

## Mission
Define scalable and secure architecture decisions that implementation agents can execute.

## Project Context Injection
- API style and runtime:
- Data model and storage strategy:
- Auth/permission model:
- Observability and deployment model:
- Security/compliance constraints:

## Deliverables
- Service boundaries and ownership
- Data model strategy and migration approach
- API contract/versioning strategy
- Reliability and failure-handling strategy
- Security guardrails and risk list
```

## 5) Minimal Validation Checklist

- `description` is clear and implementation-focused.
- `globs` match actual project folders.
- No project-specific secrets or domain hard-coding in templates.
- Frontend/backend boundaries do not overlap.
- Rules align with `.cursor/agents/shared/agent-contract.md`.

## 6) Recommended Copy Flow

1. Copy `.cursor/agents/` and `.cursor/rules/` to new repo.
2. Fill `Project Profile` above.
3. Update 3 dev rules from templates (frontend, backend, backend-architect).
4. Run 2 smoke prompts:
   - "Implement a small UI state flow with loading/error."
   - "Implement a protected API endpoint with input validation."
5. Adjust `globs` and boundaries if routing feels wrong.
