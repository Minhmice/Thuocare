# External Skill Conflict Resolution

## Purpose

Prevent imported skills from breaking core routing, safety, and quality behavior.

## Conflict Signals

- Imported skill recommends actions outside assigned scope.
- Imported output does not follow standard agent contract.
- Imported skill conflicts with routing rules or quality gates.
- Multiple imported skills provide contradictory ownership.

## Resolution Order

1. Apply core safety and routing rules.
2. Apply shared contract requirements.
3. Apply internal specialist boundary rules.
4. Apply imported skill style/format guidance.

## Operational Procedure

1. Detect conflict and label the conflict type.
2. Preserve internal owner for the decision domain.
3. Convert imported output into standard contract format.
4. If still conflicting, downgrade import mode:
   - `replace` -> `augment`
   - `augment` -> `subordinate`
5. If unresolved, disable that imported skill for auto-routing and require manual invocation.

## Guardrails

- Imported skills cannot bypass `code-reviewer` or `qa-tester` gates.
- Imported skills cannot expand scope without orchestrator approval.
- Imported skills must include explicit assumptions and risks.
