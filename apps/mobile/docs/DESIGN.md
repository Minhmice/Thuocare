# Thuocare Mobile Design System

## Purpose
This document is the working design contract for `apps/mobile`.

It exists to keep product, design, and implementation aligned around one visual language:

- calm, clinical, premium
- personal-first, never cold
- high clarity without dashboard clutter
- function-first UI that can scale from self-care to managed care

The system name for this direction is:

> The Serene Clinical Aesthetic

## Creative North Star
The visual reference is a digital sanatorium rather than hospital software.

We avoid:

- crowded admin panels
- hard dividers everywhere
- generic card stacks
- aggressive warning styling
- utilitarian “database” layouts

We aim for:

- editorial spacing
- premium restraint
- soft hierarchy
- clear medication priorities
- strong value-label contrast

The product should feel like a high-trust care concierge, not a record system.

## Core Design Principles

### 1. Personal-first calm
Even when the workflow is clinical, the interface should still feel human and reassuring.

### 2. Intentional asymmetry
Do not center everything by default. Important headers can sit against generous negative space. Hero content should feel composed, not templated.

### 3. Tonal layering over lines
Hierarchy comes from surface changes, spacing, and type contrast. Avoid visible separators unless accessibility requires them.

### 4. One visual grammar across contexts
`Home`, `Meds`, `People`, and `Me` should share the same materials and spacing system. Personal, family, and clinical contexts may differ in content, but not in visual quality.

### 5. Progressive disclosure
If the screen starts feeling dense, split content into sections, sheets, or deeper pages. Do not compress spacing just to fit more content.

## Color System

### Base palette
- `primary`: `#0058BC`
- `primary-container`: `#0070EB`
- `surface`: `#F9F9FE`
- `surface-container-low`: `#F3F3F8`
- `surface-container-lowest`: `#FFFFFF`
- `surface-container-high`: `#E8E8ED`
- `surface-container-highest`: `#E2E2E7`
- `on-surface`: `#1A1C1F`
- `on-surface-variant`: `#414755`
- `outline-variant`: `#C1C6D7`
- `tertiary`: `#BC000A`
- `tertiary-container`: `#E2241F`

### Usage rules
- App background uses `surface`.
- Grouped secondary areas use `surface-container-low`.
- Primary interactive cards use `surface-container-lowest`.
- Inactive or backgrounded states may dim toward `surface-dim` when focus needs to tighten.

### No-Line Rule
Do not use `1px` solid borders to separate content blocks.

Use one of these instead:

- a surface tier shift
- more vertical space
- type contrast
- icon or accent placement

Exception:

- focus states
- input affordance
- explicit accessibility need

When a border is required, use `outline-variant` at low opacity, never a hard full-opacity stroke.

## Surfaces, Glass, and Texture

### Surface hierarchy
The UI should feel like stacked physical layers:

1. `surface` for the page
2. `surface-container-low` for grouped sections
3. `surface-container-lowest` for lifted cards and active content

### Glass rule
Floating bars, modal headers, or sticky controls may use:

- `surface-container-lowest` with about `80%` opacity
- `backdrop blur` around `20px`

The goal is a soft floating layer, not a frosted gimmick.

### Gradient rule
Primary CTAs should use a subtle gradient:

- angle: `135deg`
- start: `primary`
- end: `primary-container`

Do not use flat bright blue when the element is a key action surface.

## Typography

### Font roles
- `Plus Jakarta Sans`: display moments, hero numbers, large section titles
- `Inter`: body text, labels, metadata, controls

### Practical rules
- Use `Plus Jakarta Sans` for hero time, large dashboard values, major home headers.
- Use `Inter` for descriptive copy and control labels.
- Avoid visual noise from too many sizes; rely more on weight and spacing than on excessive scale variation.

### Editorial contrast
Important medical values should use value-label pairing:

- value: large, bold, high contrast
- label: small, uppercase or muted

Examples:

- dosage and unit
- number of remaining doses
- refill countdown
- medication adherence summary

## Spacing and Rhythm

Spacing should feel editorial and breathable.

### Mobile rules
- Horizontal page margin: `24px` minimum, `32px` when the composition can support it
- Related element gaps: `16px` to `20px`
- Major section gaps: `32px` to `56px`
- Card padding: default `24px`

### Rhythm rules
- Use generous space between major sections.
- Never collapse a screen to “make more fit.”
- If information density increases, move secondary controls behind a deeper action.

## Elevation and Depth

### Default hierarchy
Prefer tonal separation first:

- off-white group
- white lifted card
- restrained shadow only when needed

### Ambient shadow rule
Floating elements may use a soft blue-tinted shadow:

- large blur
- very low opacity
- never heavy black elevation

This should suggest medical-grade material and light, not standard Android card shadowing.

## Component Rules

### Buttons

#### Primary
- full pill radius
- blue gradient
- bold label
- generous horizontal padding

Use for:

- confirm dose
- primary progression
- create/add actions

#### Secondary
- `surface-container-high` background
- `primary` text
- no border

Use for:

- navigate within current context
- supporting actions inside cards

#### Tertiary/Ghost
- text-only or very soft transparent fill
- `primary` text

Use for:

- skip
- cancel
- less important route changes

### Cards

#### Card primitive
- radius should generally be large
- padding should generally be `24px`
- no visible dividers inside unless absolutely needed

#### Medication tile
When a medication item needs stronger emphasis, use:

- white card
- a strong leading accent bar in `primary`
- clean content stack

Do not turn the entire tile into a saturated color block unless it is a hero moment.

### Lists
- Separate items with spacing, not divider lines.
- Group dense rows inside a softer section background when necessary.
- Use compact metadata, but keep the item title visually dominant.

### Inputs
- `surface-container-low` fill
- outside label
- soft radius
- focus ring uses low-opacity `outline-variant` or blue tint

### Selection chips
- full rounded
- active: `primary-container` with high-contrast text
- inactive: `surface-container-highest`

### Warning banners
Warnings are nudges, not errors.

Use:

- `tertiary-container` at low opacity
- `tertiary` for icon/text emphasis

Avoid:

- bright red full-fill banners
- alert boxes that feel like system failure

## Home Screen Grammar
The `Home` tab should follow this visual sequence by default:

1. compact floating-feel header
2. soft contextual alert if needed
3. lightweight stat strip
4. hero card for the most important dose or care priority
5. editorial timeline sections

### Header
- title on the left
- compact date beside or below
- time chip on the right
- optional action chips below

### Hero
- saturated blue or premium primary treatment
- very large time or key value
- minimal, high-contrast supporting copy
- one primary action only

### Timeline
- section title uses `Plus Jakarta Sans`
- dayparts use small uppercase labels
- no boxed table layout

## Meds Screen Grammar
`Meds` should feel operational but still calm.

Preferred composition:

1. clear medication summary at the top
2. grouped medication cards
3. refill/supply/safety sections below
4. progressive disclosure for details

Avoid turning the screen into a long form-like index without visual hierarchy.

## People Screen Grammar
`People` should signal broader responsibility without looking like an admin dashboard.

Preferred composition:

- strong overview card
- managed people tiles with clear status accents
- responsibility summaries
- only surface the most relevant alerts first

Use summary and prioritization before detail.

## Me Screen Grammar
`Me` should feel lighter and more private than operational surfaces.

Preferred composition:

- identity summary
- account preferences
- consent/privacy blocks
- linked memberships or scopes

Keep this screen simple and generous. Do not overload it with management data.

## Motion and Interaction
- Motion should be soft and purposeful.
- Prefer staggered reveal or gentle fade/slide on entry.
- Avoid hyperactive microinteractions.
- Swipe actions should feel deliberate, not playful.

## Accessibility
- Never rely on color alone for health-critical state.
- Maintain strong text contrast on colored cards.
- Keep labels explicit for time-sensitive medication actions.
- Large numeric values must remain readable under fatigue or stress conditions.

## Implementation Guidance

### Folder placement
- Reusable cross-feature visual primitives go in `src/shared/ui`.
- Reusable home-specific composition blocks go in `src/features/home/components`.
- Page-only compositions stay in `pages/<page>/sections`.

### CSS and React Native translation
When translating the system into React Native:

- use surface color shifts instead of borders
- favor padding and gap over nesting wrappers
- keep shadow usage light and consistent
- use one typography scale across the app, not per screen experiments

### Review checklist
Before shipping a screen, verify:

- Does it feel calm or crowded?
- Are sections separated by space and tone rather than lines?
- Is the primary action obvious?
- Is there a clear hero moment?
- Are typography roles consistent?
- Does it still feel premium without adding decorative noise?

## Anti-Patterns
Do not introduce:

- hard grey divider lines
- flat generic cards stacked endlessly
- pure black text
- sharp corners
- tiny tap targets
- heavy red warning states
- dense dashboard tables on mobile
- visually different lane-specific UIs that break the shared product identity

## Current Reference
For the current intended `Home` direction, use:

- `/Users/minhmice/Documents/Projects/Thuocare/example/home.html`

Treat it as a visual reference, not a literal DOM pattern to copy line-by-line.
