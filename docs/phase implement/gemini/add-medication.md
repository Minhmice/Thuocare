# Add Medication UX and Flow Definition

## Screen objective
Fast, low-friction multi-step entry from `Meds` to add a medication to a personal routine with low cognitive load. Maintain the **clinical minimal** aesthetic and avoid forcing clinical detail beyond MVP needs.

Locked constraints (do not change here):

- multi-step flow
- `medicine identity` and `schedule` are separate steps
- schedule moments are preset: `Morning`, `Noon`, `Evening`
- stock and date range are optional and appear near the end
- after save: return to `Meds` and highlight the new item
- do not introduce backend or database search behavior in MVP

## Layout + navigation
- **Progress indicator**: always visible. Prefer a subtle linear bar plus `Step X of 5` in the header for orientation.
- **Step container**: one focused form per step, generous whitespace, no dense “settings” feeling.
- **Sticky footer**:
  - **Back**: secondary action; always available except on Step 1.
  - **Continue**: primary action for Steps 1–4; enabled only when the step’s required inputs are satisfied.
  - **Save**: primary action on Step 5 (Review).

## Full step breakdown (MVP)
Step order must remain:

1) Medication identity  
2) Schedule  
3) Stock + optional timing support  
4) Optional date range  
5) Review + save

### Step 1: Medication identity (required) + dosage form (required) + dose quantity (required)
**Purpose**: identify the medication and capture the per-dose quantity in human-friendly language.

**Field hierarchy**
- **Medication name** (required, single-line text)
  - placeholder: “e.g., Paracetamol”
- **What is it for?** (optional, single-line text)
  - placeholder: “e.g., Headache”
- **Dosage form** (required selection)
  - options: `Tablet/Capsule`, `Liquid`, `Powder`
- **Dose quantity** (required; adapts to dosage form; see rules below)

**Dosage-form adaptation rules**
- **Tablet/Capsule**:
  - label: “How many pills per dose?”
  - input: numeric (stepper permitted)
  - display language: “1 tablet”, “2 capsules” (user-friendly, not clinical)
- **Liquid**:
  - label: “Quantity per dose (ml)”
  - input: numeric
  - unit: fixed `ml`
- **Powder**:
  - label: “Quantity per dose”
  - input: free text for a user label (example: “1 scoop”)
- **General**:
  - do not add a separate “strength” field in MVP
  - do not require compound units beyond the above

### Step 2: Schedule (required) + meal relation (optional per selected moment)
**Purpose**: capture when the user takes the medication using coarse moments, not exact time.

**Field hierarchy**
- **Schedule moments** (required; multi-select)
  - `Morning`, `Noon`, `Evening`
- **Meal relation** (optional; shown per selected moment)
  - options: `Before Meal`, `With Meal`, `After Meal`

**Schedule + meal interaction rules**
- The user can select **one or more** moments.
- **At least one** moment must be selected to continue.
- Meal relation controls:
  - are **hidden** until their parent moment is selected
  - are **independent per moment** (Morning relation does not affect Evening)
  - default state is **unset** (no forced choice for MVP)
  - if a moment is deselected, its meal relation value is cleared.
- Provide small helper text: meal relation is guidance, not a mandatory constraint.

### Step 3: Stock + optional timing support (optional step; skippable)
**Purpose**: capture optional metadata without blocking creation.

**Field hierarchy**
- **Stock quantity** (optional; numeric)
  - placeholder example: “e.g., 30”
- **Optional action**: “Use a specific time instead”
  - MVP behavior: presents an informational placeholder only (do not build advanced exact-time scheduling).

**Stock/date handling rules (part 1)**
- Stock is optional; absence should not show errors.
- Keep numeric keyboard for stock entry.
- Do not introduce refill thresholds or out-of-stock workflows here (deferred).

### Step 4: Optional date range (optional step; skippable)
**Purpose**: record an optional start/end window without slowing basic entry.

**Field hierarchy**
- **Start date** (optional; date picker)
- **End date** (optional; date picker)

**Stock/date handling rules (part 2)**
- Date range is optional; user can leave both empty.
- If only one date is set, accept it (do not force both).
- If an end date is chosen earlier than start date, show a clear inline error and block continue until corrected.

### Step 5: Review + save
**Purpose**: final verification, fast editing, then return to `Meds`.

**Review-step behavior**
- Present a **single scrollable summary** with blocks in this order:
  1. Identity (name + what-for)
  2. Dosage (form + quantity)
  3. Schedule (moments + meal relation per moment when set)
  4. Stock (if provided)
  5. Date range (if provided)
- Each block is tappable and navigates back to its step (editing preserves other values).
- The Save button is enabled when required fields from Steps 1–2 remain satisfied.

## Return to `Meds` after save
After tapping **Save**:
- close the flow and return to `Meds`
- the medication list should **scroll/focus** the newly created item into view
- apply a **calm highlight** / entry animation on that tile so the user immediately sees what was added
  - acceptable treatments: brief background tint, subtle “appear” motion, or both
  - keep duration short and non-flashy (a few seconds), then fully revert to normal styling

## Progress-indicator guidance
- Do not hide progress on keyboard open.
- Use consistent naming: “Add medication” title + “Step X of 5”.
- Progress should reflect the fixed step order even if optional steps are skipped (skipping advances progress accordingly).

## iPhone vs Android notes (MVP)
- **Transitions**: use native-feeling navigation (iOS horizontal push; Android standard push). Avoid bespoke motion that breaks parity.
- **Date pickers**: use native platform pickers; ensure the same validation rules apply on both platforms.
- **Keyboard**: numeric keyboard for stock + numeric quantities; smooth focus handling so the sticky footer remains usable.

## Deferred (do not implement in MVP)
- medication database search/autocomplete while typing medication name
- “what is it for” recommendations
- exact-time scheduling (e.g., “08:30”) as a full feature
- strength field (e.g., “500mg”)
- refill / out-of-stock flows
- edit medication flow
