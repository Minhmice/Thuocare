# Auth & Access Overview — @thuocare/auth

## 1. The Three Layers

This package provides three distinct but related concerns:

```
Authentication → Actor Resolution → Authorization
```

**Do not conflate them.** Each layer has a specific job.

---

### Layer 1: Authentication (`session/`)

**Question:** Is there a valid logged-in user?

```ts
const session = await requireAuthenticatedSession(supabase);
// session.authUserId — auth.users.id from Supabase JWT
// session.email      — lowercase email
```

`requireAuthenticatedSession()` calls `supabase.auth.getUser()`, which re-validates the JWT against the Supabase Auth server. **Do not use `getSession()`** on the server side — it trusts the local cache and is not server-safe.

**Output:** `SessionData` — the minimal auth identity. No business data yet.

---

### Layer 2: Actor Resolution (`actor/`)

**Question:** WHO is this user in the business domain?

```ts
const actor = await buildRequestActorContext(supabase);
// actor.kind === "staff"    → ResolvedStaffActorContext
// actor.kind === "patient"  → ResolvedPatientActorContext
// actor.kind === "unresolved" → UnresolvedActorContext
```

Internally this calls the `my_auth_binding_status()` SQL RPC, which resolves:
- `current_staff_user_account_id()`
- `current_staff_role()`
- `current_doctor_profile_id()`
- `current_patient_id()`
- `current_organization_id()`

**Resolve actor context ONCE per request.** Pass the result down. Do not call `buildRequestActorContext()` multiple times per handler — it makes a DB call.

**Output:** `AnyActorContext` with `kind`, `organizationId`, role/patientId, and pre-computed `FullCapabilities`.

---

### Layer 3: Authorization (`guards/`, `access/`)

**Question:** Can this actor do THIS specific thing with THIS specific resource?

Two sub-levels:

#### 3a. Role / capability guards (no DB needed)
```ts
requireCapability(actor, "canWritePrescriptions");
requireRole(actor, "doctor");
requireStaffActor(actor);
```

These check the `FullCapabilities` object already on the actor context.

#### 3b. Resource access evaluators (DB lookup per resource)
```ts
const result = await canActorAccessPrescription(supabase, prescriptionId, actor);
assertResourceAccess(result); // throws on denial
```

These verify org boundary + patient scope for a specific resource.

---

## 2. Actor Model

### Staff Actor

A staff actor has:
- A `user_account` row with `auth_user_id` linked.
- An `organization_id` (their org scope).
- A `role` — one of: `doctor`, `nurse`, `pharmacist`, `admin`, `care_coordinator`.
- Optionally a `doctor_profile` (only for `role === "doctor"`).
- Optionally a `clinic_id` (for clinic-scoped staff; null = org-wide).

Staff can access all patient data within their organization. Stricter doctor-level restrictions (e.g., "is this doctor the primary for this episode?") require additional checks via `doctor-scope.ts`.

### Patient Actor

A patient actor has:
- A `patient` row with `auth_user_id` linked.
- A `patientId` — only their own record.
- An `organization_id` — their clinic's org.
- No write capabilities to clinical data.
- Read access is limited to their own treatment data (enforced by RLS).

### Unresolved Actor

An unresolved actor has:
- A valid session (`authUserId`) but no linked `user_account` or `patient` row.
- A `bindingState` indicating why (`pending_claim`, `partial_binding`, `unknown`).

**Unresolved actors must not access any clinical or patient data.** Route them to the onboarding/claim flow.

---

## 3. Capability Derivation

Capabilities are derived from role at actor resolution time and stored on the context object.

```ts
actor.capabilities.canWritePrescriptions // boolean
actor.capabilities.isDoctor              // boolean
```

The mapping is in `capabilities/capability-map.ts` and mirrors the SQL helpers:

| SQL Helper | TypeScript Capability |
|---|---|
| `is_staff()` | `isStaff` |
| `is_doctor()` | `isDoctor` |
| `is_admin()` | `isAdmin` |
| `can_write_clinical_data()` | `canWriteClinicalData` |
| `can_write_prescriptions()` | `canWritePrescriptions` |
| `can_manage_refills()` | `canManageRefills` |
| `can_manage_medication_catalog()` | `canManageMedicationCatalog` |

Additional app-layer capabilities (not in SQL):

| Capability | Who has it |
|---|---|
| `canReadOrganizationData` | All staff roles |
| `canReadClinicData` | All staff roles |
| `canReadPatientProfile` | All staff + patient (self only via RLS) |
| `canReadTreatmentEpisode` | All staff + patient (self only via RLS) |
| `canReadPrescription` | All staff + patient (self only via RLS) |
| `canManageAppointments` | doctor, nurse, care_coordinator, admin |
| `canResolveOnboardingIssues` | admin only |

**Important:** These flags are application-layer checks. The DB RLS is the authoritative enforcement layer. Never rely solely on these flags — they exist for early-exit and clear error messages, not as the only security boundary.

---

## 4. How This Complements DB RLS

The DB has two enforcement layers:

1. **RLS SELECT policies** — prevent unauthorized reads at the query level.
2. **RLS INSERT/UPDATE policies** — prevent unauthorized writes at the mutation level.

The application layer provides:

1. **Early exit** — deny bad requests before they hit the DB.
2. **Clear error messages** — throw typed errors with codes (not generic DB errors).
3. **Composable guards** — reusable across Next.js server actions, API routes, and mobile API calls.
4. **Business-level checks** — "is this doctor the author of this prescription?" (hard to express purely in SQL policy).

**The app layer does not replace RLS. Both must be present.**

---

## 5. Guard Usage Patterns

### Server action (staff only)
```ts
async function createPrescription(supabase, input) {
  // 1. Require authenticated staff actor
  const actor = await requireStaffSession(supabase);
  // 2. Require write capability
  requireCapability(actor, "canWritePrescriptions");
  // 3. Require doctor role specifically
  const doctor = requireDoctorActor(actor);
  // 4. Verify org scope on the episode this prescription will belong to
  await assertResourceInActorOrg(supabase, "treatment_episode", input.episodeId, actor);
  // 5. Proceed with business logic
}
```

### Patient-facing action (self-access)
```ts
async function getMyMedications(supabase) {
  // Require patient actor — staff calling this endpoint would throw
  const actor = await requirePatientSession(supabase);
  // actor.patientId is guaranteed; use it to scope queries
  return loadMedicationsForPatient(supabase, actor.patientId);
}
```

### Onboarding / claim flow
```ts
async function onboardPage(supabase) {
  // Load actor WITHOUT requiring resolution (handles unresolved state)
  const actor = await loadActorContext(supabase);
  const state = await resolveOnboardingState(supabase, actor);
  if (state.status === "complete") redirect("/dashboard");
  if (state.status === "pending_claim") showClaimForm(state);
}
```

### Resource-level access check
```ts
async function getRefillRequest(supabase, refillRequestId) {
  const actor = await requireResolvedActor(supabase);
  const result = await canActorAccessRefillRequest(supabase, refillRequestId, actor);
  assertResourceAccess(result); // throws ForbiddenError / PatientScopeMismatchError / etc.
  // proceed
}
```

---

## 6. Common Pitfalls

### ❌ Don't call `buildRequestActorContext()` multiple times per request
Each call makes a DB round-trip. Resolve once, pass down.

### ❌ Don't check only capabilities without org scope
A doctor's `canWritePrescriptions` is true, but they should not write prescriptions for a patient in a different org. Always combine capability + scope checks.

### ❌ Don't treat `kind === "unresolved"` as an error to swallow
Unresolved actors must be routed to onboarding. Silently allowing them access is a security gap.

### ❌ Don't use `getSession()` server-side
`getSession()` trusts the local JWT cache. Use `getUser()` (which `requireAuthenticatedSession` wraps) for server-side validation.

### ❌ Don't put access logic inside data repositories
Access guards belong in the guard/access layer, not inside query helpers. Keep them separate so they are reusable, testable, and visible.

### ❌ Don't expose `rawBinding` or `rawUser` to client code
These are internal diagnostic objects. Extract only the fields you need.

---

## 7. File Map

```
packages/auth/src/
├── errors/
│   ├── auth-errors.ts        AuthError hierarchy (unauthenticated, unresolved, etc.)
│   └── access-errors.ts      AccessError hierarchy (forbidden, org mismatch, etc.)
├── session/
│   └── session-resolver.ts   getCurrentSession, requireAuthenticatedSession
├── actor/
│   ├── actor-types.ts         FullCapabilities, ResolvedStaffActorContext, etc.
│   └── actor-resolver.ts      resolveActorContext, buildRequestActorContext
├── capabilities/
│   ├── capability-map.ts      STAFF_CAPABILITY_MAP, PATIENT_CAPABILITIES
│   └── capability-resolver.ts resolveFullCapabilities, hasCapability
├── onboarding/
│   └── onboarding-state.ts   resolveOnboardingState, claimStaffAccount, claimPatientAccount
├── guards/
│   ├── auth-guards.ts         requireAuthenticated, requireStaffSession, requirePatientSession
│   ├── role-guards.ts         requireRole, requireCapability, requireDoctorActor
│   └── scope-guards.ts        requireOrganizationScope, requireClinicScope, requireDoctorScope
├── access/
│   ├── organization-scope.ts  assertActorInOrg, assertResourceInActorOrg
│   ├── clinic-scope.ts        assertActorClinicScope, assertResourceInActorClinic
│   ├── patient-scope.ts       requirePatientAccess, isSelfPatientAccess
│   ├── doctor-scope.ts        requireDoctorContext, requireDoctorPrimaryForEpisode
│   ├── caregiver-scope.ts     loadPatientCaregiverLinks (caregiver has no login yet)
│   └── resource-access.ts     canActorAccess{Patient,Episode,Prescription,...}
├── data/
│   └── actor-data.ts          loadUserAccountByAuthId, loadPatientById, etc.
└── internal/
    └── supabase-client.ts     callRpc, selectOne, selectMany (DB type workaround)
```

---

## 8. Post-MVP Watchpoints

| Area | Risk | Recommended Action |
|---|---|---|
| `my_auth_binding_status()` RPC | Returns first-match if email exists in multiple orgs | Disambiguate with org code in signup metadata |
| Caregiver login | Schema has no `auth_user_id` on `caregiver_link` | Add column + `CaregiverActorContext` when needed |
| Doctor-patient assignment | No explicit assignment table; relies on episode `primary_doctor_id` | Consider `doctor_patient_assignment` table for stricter control |
| `clinicId` on actor context | Populated from `user_account.clinic_id`; may be null for org-wide staff | Confirm clinic-level access model before building clinic-filtered views |
| Ungenerated DB types | `database.types.ts` is a placeholder | Run `supabase gen types typescript --local` before production; remove `internal/supabase-client.ts` cast |
| Multi-patient per auth user | Patient table has unique index on `(auth_user_id, organization_id)` — one per org | If a patient belongs to multiple orgs, context must include org selection |
