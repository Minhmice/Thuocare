# Meds — Claude Implementation Notes

Last updated: 2026-03-28

## Goal

Implement `Meds` as the MVP medication list surface, aligned to:

- `docs/screen_feature/meds.md`
- `docs/phase implement/gemini/meds.md`

Constraints:

- mobile only (iPhone + Android)
- clinical minimal
- no SQL/Supabase dependencies (prototype behavior only)
- keep repository-swap architecture intact
- do not implement filters, grouped sections, or edit medication

---

## Implemented Blocks

### 1. Compact dashboard (above list)

Three metrics in a single `AppCard` row:

| Metric           | Value source                                                          |
| ---------------- | --------------------------------------------------------------------- |
| **Total**        | `items.length`                                                        |
| **Active today** | items where `schedule` is non-empty and not `"—"`                     |
| **Need refill**  | items where `remainingDoses` is known and `≤ LOW_STOCK_THRESHOLD` (5) |

Rule: medications without a known `remainingDoses` are excluded from refill count.
The "Need refill" value turns amber when `> 0`.

### 2. Add medication trigger

- Primary: `+ Add` outlined button in the header row (top right)
- Secondary: full `Add medication` button in the empty state
- Both route to `/meds/add` via `router.push`

### 3. List tiles with accent bar

Each `MedTile` uses a custom `View` (not `AppCard`) with:

- `borderRadius: 20`, `overflow: "hidden"`, `flexDirection: "row"`
- A 4px leading accent bar whose color signals stock health:
  - Primary blue → normal
  - Amber (#A86700) → low stock (≤5)
  - Neutral gray (#9BA0AD) → out of stock (0)
- Background tint:
  - `rgba(0, 88, 188, 0.08)` → newly added highlight (fades after 1.5s)
  - `#E4E4EF` → out of stock (muted)
  - `surfaceVariant` (#ECECF4) → normal

Text hierarchy inside tile:

1. Name — `titleMedium`, 2-line max, dimmed (`onSurfaceVariant`) when out of stock
2. Dosage — `bodyMedium`
3. Schedule — `labelMedium`
4. Stock label (if known) — colored: `#9F1D1D` out / `#A86700` low / `onSurfaceVariant` normal

Badges (Out / Low) appear top-right of the name row.

### 4. Empty state

Shown via `FlatList.ListEmptyComponent` when the list is empty:

- Centered layout with `titleMedium` heading + `bodyMedium` supporting copy
- Primary `Add medication` button to launch the flow

---

## Return-from-add behavior

After `addLocalMedication()` in add.tsx:

1. `setPendingHighlightId(id)` is called on the new item
2. `router.back()` navigates back to Meds
3. `useFocusEffect` fires → `load()` reloads merged data (local + mock)
4. `takePendingHighlightId()` retrieves the saved ID
5. `scrollToIndex` targets the item after 150ms (render settle)
6. `activeHighlightId` is cleared after 1500ms → tile returns to normal state

Loading behavior: `hasLoadedRef` prevents a full-screen loading flash on
re-focus. The list stays visible while silently reloading.

---

## Mock data (`src/mocks/meds.ts`)

14 items covering:

| Dimension      | Coverage                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| Name length    | Short (Cetirizine), medium, long (Acetaminophen & Codeine Phosphate 300/15mg) |
| Dosage form    | Tablet (9), capsule (3), liquid ml (1), powder scoop (1)                      |
| Schedule       | 1×/day (most), 2×/day (Metformin), 3×/day (Amoxicillin), As needed            |
| Stock: high    | 60, 45, 42, 30, 25, 14 remaining                                              |
| Stock: low     | 5, 3, 2 remaining (triggers Low badge)                                        |
| Stock: out     | 0 × 2 (Cetirizine, Ferrous sulfate)                                           |
| Stock: unknown | 3 items (Omeprazole, Lactulose, Protein powder)                               |

---

## Definition of done

- [x] Dashboard exists and remains compact
- [x] List-first layout is easy to scan
- [x] Out-of-stock and low-stock items are clearly distinguished (accent + text + badge)
- [x] Add medication trigger is reachable (header + empty state)
- [x] Return-from-add highlight works (~1.5s fade)
- [x] Mock data is diverse enough to reveal hierarchy, wrapping, and state issues
- [x] TypeScript passes clean
