# Thuocare Phase Prompts

Use one prompt per phase. Each prompt assumes README is the product source of truth and the SQL schema is already aligned.

## Phase 1 Prompt

```text
Read README.md and treat it as the product source of truth. Implement Phase 1: Workflow Realignment.

Rules:
- Think in personal / family / hospital intents, not patient / doctor first.
- Keep SQL untouched unless absolutely required.
- Prefer lane-aware routing and onboarding fixes over cosmetic changes.
- Keep pnpm typecheck green at the end.

Tasks:
1. Audit all entry points: root route, login, signup, onboarding, and mobile home.
2. Replace actor-type-first wording and routing with intent-first workflow.
3. Make landing routes and placeholders explicit for personal, family, and hospital.
4. Fix any compile or package-graph issues blocking the new flow.
5. Summarize what changed, what remains placeholder, and what should happen in Phase 2.
```

## Phase 2 Prompt

```text
Read README.md and implement Phase 2: Personal Lane Completion.

Goal:
- A user can start without a doctor, clinic, or prescription and still manage medication end to end.

Tasks:
1. Improve personal medication CRUD and routine editing.
2. Make personal reminders, history, and stock visibility coherent.
3. Use the existing personal tables and services as the foundation.
4. Upgrade UI flows so personal lane feels production-oriented, not experimental.
5. Add or improve checks/tests where the workflow could regress.

Deliver a short summary with:
- flows completed,
- data assumptions,
- follow-up work for Phase 3.
```

## Phase 3 Prompt

```text
Read README.md and implement Phase 3: Family Lane App Layer.

Goal:
- Turn the family lane from route placeholder/schema support into a usable household workflow.

Tasks:
1. Build a family workspace shell with member switching.
2. Add role-based household concepts: owner, coordinator, caregiver, dependent.
3. Surface shared reminders and delegated care tasks.
4. Keep the family lane distinct from both personal and hospital UX.
5. Keep pnpm typecheck green and document any remaining backend gaps clearly.

At the end, list:
- implemented family workflows,
- backend gaps that still need app support,
- exact entry points for family users.
```

## Phase 4 Prompt

```text
Read README.md and implement Phase 4: Hospital Lane Patient Experience.

Goal:
- Hospital-linked patients should see one coherent workflow across adherence, prescriptions, refill, and follow-up.

Tasks:
1. Build a meaningful hospital patient home/dashboard.
2. Connect prescription, refill, appointment, and follow-up states into one journey.
3. Remove placeholder or QA-only views in patient-facing hospital flows.
4. Preserve doctor workspace behavior while improving patient continuity.
5. Add targeted checks for the updated hospital patient flow.

Return:
- completed workflow map,
- changed entry points,
- remaining gaps for Phase 5.
```

## Phase 5 Prompt

```text
Read README.md and implement Phase 5: Cross-Lane Consent and Bridges.

Goal:
- Personal, family, and hospital data should connect only through explicit, inspectable consent.

Tasks:
1. Build consent creation, revoke, and review flows.
2. Surface bridge relationships between lanes in the app.
3. Mirror SQL lane/consent rules in UI guardrails and app behavior.
4. Avoid hidden cross-lane reads or writes.
5. Keep the user-facing explanation clear: who can see what, and why.

End with:
- consent flows shipped,
- guardrails added,
- unresolved consent edge cases.
```

## Phase 6 Prompt

```text
Read README.md and implement Phase 6: Medication Knowledge and Safety.

Goal:
- Use the medication knowledge base in runtime workflows across personal, family, and hospital lanes.

Tasks:
1. Add shared interaction / contraindication / allergy checks.
2. Invoke safety checks from medication add, refill, and prescription flows.
3. Render explainable guidance, not only warning severity.
4. Reuse one shared safety service across lanes.
5. Add checks/tests around high-risk combinations and explainability.

Deliver:
- runtime touchpoints for safety logic,
- user-visible alert patterns,
- remaining knowledge-base integration gaps.
```

## Phase 7 Prompt

```text
Read README.md and implement Phase 7: Advanced Care Intelligence.

Goal:
- Layer predictive and condition-specific care intelligence on top of the stable three-lane foundation.

Tasks:
1. Add risk prioritization and stockout/adherence scoring.
2. Introduce condition-specific pathways where the data already supports them.
3. Connect workflow outcomes back into patient and clinician views.
4. Keep every advanced feature traceable to stable upstream workflow data.
5. Do not start this phase until earlier lane workflows are already coherent.

Return:
- new intelligence features,
- data dependencies,
- risks and monitoring needs.
```
