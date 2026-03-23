# @thuocare/contracts

Single source of truth for Phase 1 lifecycle core: enums, row/domain/DTO shapes, Zod validation, and deterministic mappers. Schema authority is the Supabase migrations:

- `20260322020100_phase_1_lifecycle_core_supabase.sql`
- `20260322020200_phase_1_lifecycle_core_rls_policies.sql`
- `20260322020300_phase_1_auth_onboarding_helpers.sql`

## Layout

| Area | Path | Purpose |
|------|------|---------|
| Primitives | `src/primitives.ts` | ISO dates, entity IDs, decimal strings for `numeric` columns |
| Enums | `src/enums.ts` | Literal unions + const arrays mirroring PostgreSQL enums (+ onboarding text enums) |
| Tables | `src/tables/*.ts` | `*Row` (DB), domain alias, `Create*Input`, `Update*Input`, `*Summary` where useful |
| Summaries | `src/summaries.ts` | Cross-entity read models (e.g. `TreatmentEpisodeDetail`) |
| Actor | `src/actor.ts` | Auth binding JSON shape, capability helpers, claim/onboarding metadata |
| Constants | `src/constants.ts` | Status sets, role capability presets (UI hints — RLS remains authoritative) |
| Schemas | `src/schemas/*.ts` | Zod for create/update payloads and RPC-related objects |
| Mappers | `src/mappers/*.ts` | Row→domain identity maps + assembly helpers for nested DTOs |

## Row vs domain vs DTO vs schema

- **Row** — Matches `public.*` columns, including nullability and auth bridge fields (`auth_user_id`).
- **Domain** — Currently 1:1 with row types (type alias). Prefer extending domain later with computed fields instead of bloating row types.
- **Summary / Detail** — Narrow projections for lists and joined reads (`*Summary`, `*Detail`); no persistence implied.
- **Schema** — Runtime validation for inserts/updates and external payloads; encodes important SQL check constraints (PRN reason, date ordering, refill ratios, appointment window).

## Naming

- SQL `snake_case` is preserved on **row** types.
- Domain aliases keep the same shape for traceability.
- Enum TypeScript names are `PascalCase`; values stay identical to Postgres.

## Extending safely

1. Change SQL first, then align `*Row` and enums.
2. Add nullable columns as optional on create schemas when DB default exists.
3. Prefer new summary/detail interfaces over widening row types for UI-specific fields.
4. Do not encode business workflows here — only shapes and validation.

## Imports

```ts
import {
  PrescriptionRow,
  createPrescriptionSchema,
  mapPrescriptionRow,
  assemblePrescriptionDetail,
} from "@thuocare/contracts";
```
