# Medication Reminder Logic & Database Contract

> Scope: This document defines the meal-based medication reminder logic, database shape, status calculation rules, and UI view-model contract for the full-screen medication reminder screen.
>
> Medical safety note: This logic is a scheduling heuristic for software behaviour. It must not override a doctor, pharmacist, prescription label, or medicine-specific instructions. Some medicines are time-critical and require exact timing.

---

## 1. Product Goal

The medication reminder screen should not simply mark a medicine as `OVERDUE` after a fixed clock time. Instead, it should calculate a **dose window** from:

1. the user’s configured meal time,
2. the medicine’s relation to the meal,
3. the dose schedule,
4. user action state such as taken, snoozed, or skipped.

The core pipeline is:

```text
meal slot -> meal time -> meal relation -> dose window -> dose status -> UI label
```

Example:

```text
EVENING + AFTER_MEAL + dinner at 18:00
=> dose window 18:00-19:00
=> if now is 18:20 and not taken
=> DUE_NOW
```

---

## 2. External Timing Assumptions

Use these as default scheduling heuristics:

| Meal relation | Meaning | Default timing window |
|---|---|---|
| `BEFORE_MEAL` | Take before food | 30-60 minutes before the meal |
| `WITH_MEAL` | Take with food / meal | meal time to 30 minutes after meal time |
| `AFTER_MEAL` | Take after food / meal | meal time to 60 minutes after meal time |
| `EMPTY_STOMACH_BEFORE_MEAL` | Empty stomach before food | about 1 hour before meal |
| `EMPTY_STOMACH_AFTER_MEAL` | Empty stomach after food | about 2 hours after meal |
| `ANYTIME` | No meal dependency | configurable broad slot window |

References:
- Care Quality Commission (CQC): time-sensitive medicines guidance says records should include whether medicines are taken with/just after food, 30-60 minutes before food, or on an empty stomach, defined as an hour before food or two hours after food.
- NHS: ferrous sulfate works best on an empty stomach; if possible, take it 30 minutes before eating or 2 hours after eating, but it may be taken with/after food if it upsets the stomach.
- NHS Specialist Pharmacy Service (SPS): food consistency matters for some medicines, especially high-risk/narrow therapeutic index medicines.
- NHS SPS missed/delayed doses guidance: missed-dose advice depends on frequency and medicine risk; for many once/twice daily medicines, the missed dose can be taken when remembered unless the next dose is due soon.

---

## 3. Core Status Enum

```ts
export type DoseStatus =
  | "DUE_SOON"
  | "DUE_NOW"
  | "LATE"
  | "OVERDUE"
  | "TAKEN"
  | "SNOOZED"
  | "SKIPPED"
  | "MISSED";
```

### Status Definitions

| Status | Meaning | UI tone |
|---|---|---|
| `DUE_SOON` | The dose window has not started yet, but it is near | blue/purple |
| `DUE_NOW` | Current time is inside the valid dose window | blue |
| `LATE` | Dose window has ended recently, but not enough to call it overdue | amber/orange |
| `OVERDUE` | Dose is beyond the late grace period | red/coral |
| `TAKEN` | User confirmed the dose was taken | green |
| `SNOOZED` | User postponed the reminder until a future time | amber/gray |
| `SKIPPED` | User intentionally skipped the dose | gray |
| `MISSED` | Dose was not taken and is too old to safely treat as current | gray/red-muted |

---

## 4. Default Meal Slots

Meal times must be user-configurable. These are only defaults.

```ts
export type MealSlot = "MORNING" | "NOON" | "EVENING";

export type UserMealSettings = {
  breakfastTime: string; // default "07:00"
  lunchTime: string;     // default "12:00"
  dinnerTime: string;    // default "18:00"
  timezone: string;      // e.g. "Asia/Ho_Chi_Minh"
};

export const DEFAULT_MEAL_SETTINGS: UserMealSettings = {
  breakfastTime: "07:00",
  lunchTime: "12:00",
  dinnerTime: "18:00",
  timezone: "Asia/Ho_Chi_Minh",
};
```

### Meal Slot Mapping

```ts
export function getMealTimeBySlot(
  slot: MealSlot,
  settings: UserMealSettings
): string {
  switch (slot) {
    case "MORNING":
      return settings.breakfastTime;
    case "NOON":
      return settings.lunchTime;
    case "EVENING":
      return settings.dinnerTime;
  }
}
```

---

## 5. Meal Relation Enum

```ts
export type MealRelation =
  | "BEFORE_MEAL"
  | "WITH_MEAL"
  | "AFTER_MEAL"
  | "EMPTY_STOMACH_BEFORE_MEAL"
  | "EMPTY_STOMACH_AFTER_MEAL"
  | "ANYTIME";
```

### Recommended Default Windows

Assuming:

```ts
MORNING = 07:00
NOON = 12:00
EVENING = 18:00
```

| Relation | Morning | Noon | Evening |
|---|---:|---:|---:|
| `BEFORE_MEAL` | 06:00-06:30 | 11:00-11:30 | 17:00-17:30 |
| `WITH_MEAL` | 07:00-07:30 | 12:00-12:30 | 18:00-18:30 |
| `AFTER_MEAL` | 07:00-08:00 | 12:00-13:00 | 18:00-19:00 |
| `EMPTY_STOMACH_BEFORE_MEAL` | 06:00-06:30 | 11:00-11:30 | 17:00-17:30 |
| `EMPTY_STOMACH_AFTER_MEAL` | 09:00-09:30 | 14:00-14:30 | 20:00-20:30 |
| `ANYTIME` | configurable | configurable | configurable |

---

## 6. Dose Window Model

```ts
export type DoseWindow = {
  startAt: string; // ISO timestamp
  endAt: string;   // ISO timestamp
  label: string;   // "18:00-19:00"
  source: "MEAL_RELATION" | "CUSTOM" | "PRESCRIPTION_EXACT";
};
```

### Window Generation Rules

```ts
type WindowOffset = {
  startOffsetMin: number;
  endOffsetMin: number;
};

export const MEAL_RELATION_WINDOW_OFFSETS: Record<MealRelation, WindowOffset> = {
  BEFORE_MEAL: {
    startOffsetMin: -60,
    endOffsetMin: -30,
  },
  WITH_MEAL: {
    startOffsetMin: 0,
    endOffsetMin: 30,
  },
  AFTER_MEAL: {
    startOffsetMin: 0,
    endOffsetMin: 60,
  },
  EMPTY_STOMACH_BEFORE_MEAL: {
    startOffsetMin: -60,
    endOffsetMin: -30,
  },
  EMPTY_STOMACH_AFTER_MEAL: {
    startOffsetMin: 120,
    endOffsetMin: 150,
  },
  ANYTIME: {
    startOffsetMin: -30,
    endOffsetMin: 90,
  },
};
```

### Example Window Function

```ts
import { addMinutes, format } from "date-fns";

export function buildDoseWindowFromMeal(params: {
  localDate: Date;
  mealTimeHHmm: string;
  relation: MealRelation;
  customStartOffsetMin?: number;
  customEndOffsetMin?: number;
}): DoseWindow {
  const {
    localDate,
    mealTimeHHmm,
    relation,
    customStartOffsetMin,
    customEndOffsetMin,
  } = params;

  const [hour, minute] = mealTimeHHmm.split(":").map(Number);

  const mealDateTime = new Date(localDate);
  mealDateTime.setHours(hour, minute, 0, 0);

  const defaultOffset = MEAL_RELATION_WINDOW_OFFSETS[relation];

  const startOffsetMin = customStartOffsetMin ?? defaultOffset.startOffsetMin;
  const endOffsetMin = customEndOffsetMin ?? defaultOffset.endOffsetMin;

  const startAt = addMinutes(mealDateTime, startOffsetMin);
  const endAt = addMinutes(mealDateTime, endOffsetMin);

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    label: `${format(startAt, "HH:mm")}-${format(endAt, "HH:mm")}`,
    source: "MEAL_RELATION",
  };
}
```

---

## 7. Status Calculation Logic

### Priority Order

The final status must prioritize explicit user actions before time-based status:

```text
TAKEN > SKIPPED > SNOOZED > time-based status
```

### Status Function

```ts
import { addMinutes, differenceInMinutes, isAfter, isBefore, isWithinInterval } from "date-fns";

export type DoseStatusInput = {
  now: Date;
  windowStartAt: Date;
  windowEndAt: Date;

  takenAt?: Date | null;
  skippedAt?: Date | null;
  snoozedUntil?: Date | null;

  dueSoonThresholdMin?: number; // default 30
  lateGraceMin?: number;        // default 30
  missedAfterMin?: number;      // default 360 (windowEnd + 6h)
};

export function getDoseStatus(input: DoseStatusInput): DoseStatus {
  const {
    now,
    windowStartAt,
    windowEndAt,
    takenAt,
    skippedAt,
    snoozedUntil,
    dueSoonThresholdMin = 30,
    lateGraceMin = 30,
    missedAfterMin = 360,
  } = input;

  if (takenAt) return "TAKEN";
  if (skippedAt) return "SKIPPED";
  if (snoozedUntil && isAfter(snoozedUntil, now)) return "SNOOZED";

  const dueSoonStart = addMinutes(windowStartAt, -dueSoonThresholdMin);
  const lateGraceEnd = addMinutes(windowEndAt, lateGraceMin);
  const missedCutoff = addMinutes(windowEndAt, missedAfterMin);

  if (
    (isAfter(now, dueSoonStart) || now.getTime() === dueSoonStart.getTime()) &&
    isBefore(now, windowStartAt)
  ) {
    return "DUE_SOON";
  }

  if (
    isWithinInterval(now, {
      start: windowStartAt,
      end: windowEndAt,
    })
  ) {
    return "DUE_NOW";
  }

  if (isAfter(now, windowEndAt) && !isAfter(now, lateGraceEnd)) {
    return "LATE";
  }

  if (isAfter(now, lateGraceEnd) && !isAfter(now, missedCutoff)) {
    return "OVERDUE";
  }

  if (isAfter(now, missedCutoff)) {
    return "MISSED";
  }

  return "DUE_SOON";
}
```

---

## 8. Header Status Label Logic

The screen header should display a human label, not raw enum.

```ts
export type StatusTone = "blue" | "amber" | "red" | "green" | "gray";

export type HeaderStatusVM = {
  label: string;
  tone: StatusTone;
};
```

### Label Examples

| Status | Header label |
|---|---|
| `DUE_SOON` | `Due soon · starts in 18m` |
| `DUE_NOW` | `Due now · 42m left` |
| `LATE` | `Late · 12m past window` |
| `OVERDUE` | `Overdue · 1h 10m past window` |
| `TAKEN` | `Taken · 18:24` |
| `SNOOZED` | `Snoozed · reminds at 19:10` |
| `SKIPPED` | `Skipped` |
| `MISSED` | `Missed` |

### Header Label Function

```ts
export function getHeaderStatusVM(params: {
  status: DoseStatus;
  now: Date;
  windowStartAt: Date;
  windowEndAt: Date;
  takenAt?: Date | null;
  snoozedUntil?: Date | null;
}): HeaderStatusVM {
  const { status, now, windowStartAt, windowEndAt, takenAt, snoozedUntil } = params;

  switch (status) {
    case "DUE_SOON":
      return {
        label: `Due soon · starts in ${differenceInMinutes(windowStartAt, now)}m`,
        tone: "blue",
      };

    case "DUE_NOW":
      return {
        label: `Due now · ${differenceInMinutes(windowEndAt, now)}m left`,
        tone: "blue",
      };

    case "LATE":
      return {
        label: `Late · ${differenceInMinutes(now, windowEndAt)}m past window`,
        tone: "amber",
      };

    case "OVERDUE":
      return {
        label: `Overdue · ${differenceInMinutes(now, windowEndAt)}m past window`,
        tone: "red",
      };

    case "TAKEN":
      return {
        label: takenAt ? `Taken · ${format(takenAt, "HH:mm")}` : "Taken",
        tone: "green",
      };

    case "SNOOZED":
      return {
        label: snoozedUntil ? `Snoozed · reminds at ${format(snoozedUntil, "HH:mm")}` : "Snoozed",
        tone: "amber",
      };

    case "SKIPPED":
      return {
        label: "Skipped",
        tone: "gray",
      };

    case "MISSED":
      return {
        label: "Missed",
        tone: "gray",
      };
  }
}
```

---

## 9. Database Design

Assumption: Supabase/Postgres backend with patient-scoped RLS.

### 9.1 Hybrid MVP strategy (locked scope)

MVP uses a hybrid approach:
- **Persist**: meal settings, generated dose occurrences for a date/window, and an immutable event log.
- **Defer**: canonical prescription/prescribed-medicine tables (course, items, schedules).

This keeps reminder logic + adherence history real, while allowing prescriptions to remain app-defined until the prescriptions model is ready.

Tables added now:
- `user_meal_settings`
- `dose_occurrences`
- `dose_events`

Deferred (not created in MVP):
- prescriptions tables (course, items, schedules)
- canonical medicines tables

### 9.2 `user_meal_settings`

Stores configurable meal times per user.

```sql
create table user_meal_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  breakfast_time time not null default '07:00',
  lunch_time time not null default '12:00',
  dinner_time time not null default '18:00',
  timezone text not null default 'Asia/Ho_Chi_Minh',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id)
);
```

### 9.3 `dose_occurrences`

Generated occurrences for a specific date/time window.

```sql
create table dose_occurrences (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  -- MVP: "doseId" comes from app domain; prescriptions tables are deferred.
  dose_id text not null,

  local_date date not null,
  meal_slot text not null
    check (meal_slot in ('MORNING', 'NOON', 'EVENING')),

  scheduled_at timestamptz not null,
  window_start_at timestamptz not null,
  window_end_at timestamptz not null,

  status text not null default 'pending'
    check (status in ('pending', 'taken', 'snoozed', 'skipped', 'missed')),

  taken_at timestamptz,
  snoozed_until timestamptz,
  skipped_at timestamptz,
  skip_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, dose_id, local_date, meal_slot)
);
```

### 9.4 `dose_events`

Immutable event log for adherence/history.

```sql
create table dose_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  dose_occurrence_id uuid not null references dose_occurrences(id) on delete cascade,

  event_type text not null
    check (event_type in ('taken', 'snoozed', 'skipped', 'missed', 'edited', 'reopened')),

  event_at timestamptz not null default now(),
  metadata jsonb not null default '{}',

  created_at timestamptz not null default now()
);
```

---

## 10. Indexes

```sql
create index idx_user_meal_settings_user
  on user_meal_settings(user_id);

create index idx_dose_occurrences_user_date
  on dose_occurrences(user_id, local_date);

create index idx_dose_occurrences_user_window
  on dose_occurrences(user_id, window_start_at, window_end_at);

create index idx_dose_occurrences_user_status
  on dose_occurrences(user_id, status);

create index idx_dose_events_user_occurrence
  on dose_events(user_id, dose_occurrence_id);
```

---

## 11. RLS Policy Sketch

Use your existing authenticated patient actor model if available. Example only:

```sql
alter table user_meal_settings enable row level security;
alter table dose_occurrences enable row level security;
alter table dose_events enable row level security;

create policy "user can read own meal settings"
on user_meal_settings
for select
using (user_id = auth.uid());

create policy "user can read own dose occurrences"
on dose_occurrences
for select
using (user_id = auth.uid());

create policy "user can update own dose occurrences"
on dose_occurrences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user can insert own dose events"
on dose_events
for insert
with check (user_id = auth.uid());
```

If your project uses a `profiles`, `patient_memberships`, or actor context table, replace `auth.uid()` with your existing actor authorization function.

---

## 12. Dose Occurrence Generation

Dose occurrences can be generated:

1. lazily when the Today screen loads,
2. daily via a scheduled job,
3. when a prescription is created/edited.

Recommended MVP: lazy generation for the visible date.

### Generation Algorithm

```text
for each active dose (from app domain):
  for each meal slot attached to dose:
    read user meal time
    compute meal datetime for local date
    compute window using meal relation
    upsert dose_occurrence(user_id, dose_id, local_date, meal_slot)
```

### Pseudocode

```ts
export async function ensureDoseOccurrencesForDate(params: {
  userId: string;
  localDate: Date;
}) {
  const mealSettings = await getUserMealSettings(params.userId);
  const activeDoses = await getActiveDosesFromAppDomain(params.userId);

  for (const dose of activeDoses) {
    for (const slot of dose.mealSlots) {
      const mealTime = slot.customTime ?? getMealTimeBySlot(slot.mealSlot, mealSettings);

      const window = buildDoseWindowFromMeal({
        localDate: params.localDate,
        mealTimeHHmm: mealTime,
        relation: dose.mealRelation,
        customStartOffsetMin: slot.customWindowStartOffsetMin,
        customEndOffsetMin: slot.customWindowEndOffsetMin,
      });

      await upsertDoseOccurrence({
        userId: params.userId,
        doseId: dose.id,
        localDate: params.localDate,
        mealSlot: slot.mealSlot,
        scheduledAt: window.startAt,
        windowStartAt: window.startAt,
        windowEndAt: window.endAt,
      });
    }
  }
}
```

---

## 13. Reminder Screen View Model

The UI should render a prepared VM, not calculate medical/schedule logic directly.

```ts
export type ReminderDoseVM = {
  doseGroupId: string;

  scheduledTimeLabel: string; // "18:00"
  doseLabel: string;          // "Evening dose"
  windowLabel: string;        // "18:00-19:00"
  medicineCount: number;

  headerStatus: {
    status: DoseStatus;
    label: string; // "Due now · 42m left"
    tone: StatusTone;
  };

  medicines: ReminderMedicineVM[];

  actions: {
    canConfirmAll: boolean;
    canSnooze: boolean;
    canSkip: boolean;
  };
};

export type ReminderMedicineVM = {
  doseOccurrenceId: string;
  prescriptionItemId: string;

  medicineName: string;
  doseLabel: string; // "500mg"
  tipLabel?: string; // "Take with water"

  status: DoseStatus;
  statusLabel: string; // "DUE NOW"
  statusTone: StatusTone;

  imageUrl?: string;
  iconName?: string;

  detail: {
    instructionText?: string;
    warningText?: string;
    windowLabel: string;
    lastTakenLabel?: string;
    prescriptionLabel?: string;
  };
};
```

### Card Display Rule

Collapsed medicine card should show:

```text
[STATUS TAG]
Medicine name
Dose label · optional medicine-specific tip
[image/icon on right]
```

Do not duplicate group-level context.

Example:
- Header says: `After dinner · 18:00-19:00 · 2 medicines`
- Metformin instruction is also `After dinner`
- Card should show only: `500mg`
- Atorvastatin has specific tip `Take with water`
- Card can show: `20mg · Take with water`

---

## 14. Confirm / Snooze / Skip Actions

### 14.1 Confirm All

Confirming all should mark every dose occurrence in the visible group as taken.

```ts
export type ConfirmDoseGroupInput = {
  userId: string;
  doseOccurrenceIds: string[];
  takenAt: string; // ISO
};
```

Rules:
- Idempotent: confirming twice must not create duplicate taken events.
- If already taken, return success.
- If skipped, either block or require reopen/edit flow.
- Write to `dose_occurrences`.
- Append to `dose_events`.

SQL sketch:

```sql
update dose_occurrences
set
  status = 'taken',
  taken_at = coalesce(taken_at, now()),
  snoozed_until = null,
  updated_at = now()
where user_id = :user_id
  and id = any(:dose_occurrence_ids)
  and status in ('pending', 'snoozed');
```

Then insert events:

```sql
insert into dose_events (
  user_id,
  dose_occurrence_id,
  event_type,
  event_at,
  metadata
)
select
  user_id,
  id,
  'taken',
  now(),
  jsonb_build_object('source', 'reminder_screen', 'action', 'confirm_all')
from dose_occurrences
where user_id = :user_id
  and id = any(:dose_occurrence_ids);
```

### 14.2 Snooze Dose Group

```ts
export type SnoozeDoseGroupInput = {
  userId: string;
  doseOccurrenceIds: string[];
  snoozedUntil: string; // ISO
};
```

Rules:
- Can snooze `pending`, `late`, or `overdue` doses.
- Do not snooze taken/skipped doses.
- **Locked scope**: snooze is **always 10 minutes** for the current dose group (`doseId` group). **No hard limit** (user can snooze again when it fires).
- Set `snoozed_until = now + 10 minutes` for the provided group occurrences.
- UI header becomes `Snoozed · reminds at HH:mm`.

### 14.3 Skip Dose Group

```ts
export type SkipDoseGroupInput = {
  userId: string;
  doseOccurrenceIds: string[];
  skippedAt: string; // ISO
  reason?: "not_available" | "side_effect" | "doctor_instruction" | "forgot" | "other";
};
```

Rules:
- Should ask for confirmation.
- Reason is optional in MVP, recommended later.
- Do not skip already taken doses without an edit/reopen flow.
- **Locked scope**: skip applies to the **current dose group only** (the current set of occurrences passed in). It must not alter future occurrences for the same `doseId`.

---

## 15. UI Mapping

### Status Tag Text

```ts
export function getStatusTagLabel(status: DoseStatus): string {
  switch (status) {
    case "DUE_SOON":
      return "DUE SOON";
    case "DUE_NOW":
      return "DUE NOW";
    case "LATE":
      return "LATE";
    case "OVERDUE":
      return "OVERDUE";
    case "TAKEN":
      return "TAKEN";
    case "SNOOZED":
      return "SNOOZED";
    case "SKIPPED":
      return "SKIPPED";
    case "MISSED":
      return "MISSED";
  }
}
```

### Status Tone

```ts
export function getStatusTone(status: DoseStatus): StatusTone {
  switch (status) {
    case "DUE_SOON":
    case "DUE_NOW":
      return "blue";
    case "LATE":
    case "SNOOZED":
      return "amber";
    case "OVERDUE":
      return "red";
    case "TAKEN":
      return "green";
    case "SKIPPED":
    case "MISSED":
      return "gray";
  }
}
```

---

## 16. Route Integration

Recommended Expo Router route:

```text
src/app/reminder/[doseGroupId].tsx
```

This route should:
- be full-screen,
- hide app header,
- not live inside the tab layout,
- receive `doseGroupId` or reconstruct group by date + meal slot,
- fetch `ReminderDoseVM`,
- render the UI.

Example stack config:

```tsx
<Stack.Screen
  name="reminder/[doseGroupId]"
  options={{
    headerShown: false,
    presentation: "fullScreenModal",
  }}
/>
```

Navigation:

```ts
router.push(`/reminder/${doseGroupId}`);
```

---

## 17. Edge Cases

### Multiple medicines in one meal slot

Group by:

```text
user_id + local_date + meal_slot + window_start_at/window_end_at
```

If medicines have slightly different windows, use a dose group strategy:
- strict: separate groups by exact window,
- practical MVP: group by meal slot and display each medicine’s own window in expanded detail.

### Time-critical medicines

For `is_time_critical = true`:
- do not use generic late/overdue thresholds blindly,
- use custom grace values,
- surface stronger warning copy,
- consider disabling generic skip without confirmation.

### Missed dose

`MISSED` should not be triggered too early. Use:
- custom medicine rule if available,
- otherwise `windowEnd + 6 hours`,
- or when next same medicine dose becomes active.

### Timezone

Always store timestamps as `timestamptz`. Use the patient’s timezone to generate local meal times and local dates.

### Daylight saving

Use timezone-aware date libraries where available. Avoid manually adding hours across DST boundaries without timezone context.

---

## 18. MVP Implementation Order

1. Add database tables:
   - `user_meal_settings`
   - `dose_occurrences`
   - `dose_events`

2. Add TypeScript enums:
   - `DoseStatus`
   - `MealSlot`
   - `MealRelation`

3. Add default meal settings:
   - breakfast `07:00`
   - lunch `12:00`
   - dinner `18:00`

4. Implement:
   - `buildDoseWindowFromMeal`
   - `getDoseStatus`
   - `getHeaderStatusVM`

5. Implement occurrence generation:
   - `ensureDoseOccurrencesForDate`

6. Implement VM builder:
   - `getReminderDoseVM`

7. Wire UI:
   - route `src/app/reminder/[doseGroupId].tsx`
   - no app shell
   - render VM

8. Wire actions:
   - confirm all
   - snooze
   - skip with confirmation

9. Add real-time/minute ticking:
   - update header label every 60 seconds

10. Later:
   - tap-to-expand medicine details
   - per-medicine confirm/skip
   - caregiver notification
   - refill logic
   - adherence analytics

---

## 19. Example Scenario

Patient meal settings:

```json
{
  "breakfastTime": "07:00",
  "lunchTime": "12:00",
  "dinnerTime": "18:00",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

Prescription item:

```json
{
  "medicineName": "Metformin Hydrochloride",
  "doseLabel": "500mg",
  "mealSlot": "EVENING",
  "mealRelation": "AFTER_MEAL",
  "instructionText": "Take after dinner"
}
```

Generated window:

```json
{
  "windowStartAt": "2026-04-25T18:00:00+07:00",
  "windowEndAt": "2026-04-25T19:00:00+07:00",
  "label": "18:00-19:00"
}
```

If current time is `18:20`:

```json
{
  "status": "DUE_NOW",
  "headerLabel": "Due now · 40m left",
  "tagLabel": "DUE NOW"
}
```

If current time is `19:12`:

```json
{
  "status": "LATE",
  "headerLabel": "Late · 12m past window",
  "tagLabel": "LATE"
}
```

If current time is `19:45`:

```json
{
  "status": "OVERDUE",
  "headerLabel": "Overdue · 45m past window",
  "tagLabel": "OVERDUE"
}
```

If current time is `01:30` next day:

```json
{
  "status": "MISSED",
  "headerLabel": "Missed",
  "tagLabel": "MISSED"
}
```
