# Design System Specification: The Serene Clinical Aesthetic (v2.0)
## 1. Overview & Creative North Star
**Creative North Star: "The Digital Sanatorium"**
This design system rejects the cluttered, anxiety-inducing interface of traditional medical software. Instead, it draws inspiration from high-end editorial layouts and the calming precision of modern health initiatives. We move beyond mere "utility" to create an environment of **reassurance, clarity, and safety.**
To break the "template" look, we utilize **Intentional Asymmetry**. Significant headers are offset against generous negative space, and content is organized in high-contrast "Value-Label" pairings. We prioritize breathability over density; every element must earn its place on the canvas. The goal is a UI that feels less like a database and more like a bespoke wellness concierge.
---

## 2. Colors & Surface Philosophy
The palette is rooted in clinical purity, using high-chroma blues and soft neutrals to establish a hierarchy of trust.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Separation must be achieved through background shifts (e.g., a `surface-container-low` card on a `surface` background) or vertical rhythm.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers. Use the surface-container tiers to create "nested" depth:
* **Base Layer:** `surface` (#F9F9FE) for global backgrounds.
* **Secondary Layer:** `surface-container-low` (#F3F3F8) for grouping secondary content.
* **Elevated Layer:** `surface-container-lowest` (#FFFFFF) for the primary interactive cards. This creates a "lifted" effect without heavy shadows.
### Dark Mode Philosophy: "Midnight Ward"
Pure black (#000000) causes eye strain for patients checking medications at 2 AM.
* Use deep Charcoal (#121418) or dark Navy (#0B101A) for the base layer.
* Invert the surface logic: elevated layers become slightly *lighter* shades of the base color to maintain the nested depth without blinding the user.
### The Glass & Gradient Rule
* **Glassmorphism:** Use `surface-container-lowest` at 80% opacity with a `20px backdrop-blur` for floating navigation bars or modal headers.
* **Graceful Degradation:** For low-end Android devices or web browsers that struggle with blur, fallback to 95% opacity solid color to prevent performance lag.
* **Signature Textures:** Primary CTAs should apply a subtle linear gradient from `primary` (#0058BC) to `primary-container` (#0070EB) at a 135-degree angle to provide a "jewel-like" depth.
---

## 3. Typography: The Editorial Voice
Our typography leverages the contrast between the structural clarity of **Inter** and the modern personality of **Plus Jakarta Sans**.

* **Display & Headlines (Plus Jakarta Sans):** Used for "Hero" moments (e.g., "Good morning, David").
* **Body & Labels (Inter):** Used for all functional data.
* **Editorial Contrast:** To highlight medication dosages, use `headline-lg` for the value (e.g., "500mg") and `label-md` in `on-surface-variant` for the label (e.g., "DOSAGE").
* **Text Overflow & Truncation:** Medical terms can be long (e.g., *Acetaminophen & Codeine Phosphate*). All card titles must enforce a 2-line maximum (`line-clamp: 2`) with an ellipsis (`...`) to prevent the card structure from breaking.
---

## 4. Elevation, Depth & Accessibility
Hierarchy is conveyed through **Tonal Layering**, but it must never compromise accessibility (WCAG 2.1 AA).
* **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle shift creates a natural edge.
* **Ambient Shadows:** When an element must "float", use a shadow with a `48px` blur and `4%` opacity, tinted with the `primary` color (#0058BC).
* **Focus States (Accessibility Fix):** To ensure visually impaired users or those experiencing cognitive fatigue can see active inputs, focus rings must use `outline` at **min 40% opacity** of the primary color, accompanied by a subtle background tint shift. *Never rely on sub-20% ghost borders for interaction states.*
---

## 5. Component Guidelines

### Buttons & Interaction
* **Primary:** Rounded `full` (9999px). Uses the signature Blue Gradient. High-end feel with `1.4rem` (4) horizontal padding.
* **Secondary:** `surface-container-high` background with `primary` text. No border.

### Cards & Lists
* **The Card Primitive:** Minimum radius `lg` (2rem). Padding must follow the `6` (2rem) scale.
* **The "Medication Tile":** A card using `surface-container-lowest` with a thick leading accent bar of the `primary` color (4px width) to denote importance.
### Alerts & Warning Hierarchy
* **Soft Nudge (Missed Dose):** Use `tertiary-container` (#E2241F) with 15% opacity background, but text and icons must be a dark, high-contrast `tertiary-dark` to pass WCAG standards. It feels gentle but remains legible.
* **Critical Alert (Drug Interaction):** Abandons the "soft" aesthetic for safety. Uses an opaque `error` background with stark white text, a prominent warning icon, and requires explicit user dismissal.
---

## 6. Motion & Micro-interactions
The aesthetic of calm requires smooth, deliberate motion. No jarring cuts.
* **Durations:** * Micro-interactions (Hover, Focus): `200ms`.
* Macro-interactions (Modals opening, Page transitions): `400ms`.
* **Easing:** Use `ease-in-out` (or cubic-bezier equivalent) for all transitions to mimic physical momentum.
* **Task Completion:** When a medication is marked as taken, the card should gracefully fade and slide down (`opacity: 0`, `transform: translateY(10px)`) over 300ms, rather than instantly vanishing.
---
## 7. Iconography
To ensure visual consistency across iOS, Android, and Web platforms without licensing issues:
* **Primary Library:** Use **Phosphor Icons** or **Material Symbols Rounded**.
* **Styling:** Set the weight to "Regular" or "Medium" to perfectly match the stroke width of the `Inter` typeface. Do not mix filled and outlined icons unless denoting active/inactive states.
---
## 8. Spacing & Rhythm
Rhythm is dictated by the **1.4rem (4)** base unit.
* **Horizontal Margins:** Always `6` (2rem) or `8` (2.75rem) on mobile to create a "letterboxed" editorial feel.
* **Vertical Gaps:** Use `5` (1.7rem) for related elements and `10` (3.5rem) for new sections.
* **Strict Negative Space Enforcement:** If content exceeds the screen height, *do not shrink padding to make it fit*. Always utilize vertical scrolling. Protect the negative space at all costs.
---
## 9. Do’s and Don’ts
### Do
* **Do** use `xl` (3rem) spacing between major sections to create a sense of calm.
* **Do** test all text-to-background contrast ratios to ensure a minimum of 4.5:1.
* **Do** leverage "Surface-Dim" for backgrounded modals to focus the user's eye.
### Don’t
* **Don’t** use black (#000000) for text or dark mode backgrounds. Use `on-surface` (#1A1C1F) or deep charcoal.
* **Don’t** use sharp corners. Minimum radius for any container is `sm` (0.5rem).
* **Don’t** crowd the screen. Use progressive disclosure (e.g., a "Read More" bottom sheet) for dense medical information.