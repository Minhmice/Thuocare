# Thuocare Design System & Theme

Last updated: 2026-03-27

## Typography
- **Primary Font**: `Inter` (sans-serif)
- **Weights**: 
  - Regular (`400`) for body text
  - Medium (`500`) for secondary headers and labels
  - Semi-bold (`600`) for buttons and active states
  - Bold (`700`) for primary headings and prominent values

## Color Palette
- **Brand Blue**:
  - `brand`: `#4a65f6` (Primary interactive color)
  - `brand-hover`: `#3a52d6` (Action hover state)
  - `brand-light`: `#dde3ff` (Soft backgrounds, accents)
- **Neutral Stone**:
  - `bg-stone-100` (`#f5f5f4`): Default screen background
  - `text-stone-900` (`#1c1917`): Primary text color
  - `text-stone-500` (`#78716c`): Secondary/muted text
  - `text-stone-400` (`#a8a29e`): Disabled text or soft labels
- **Medication Pastels** (Used for cards and icons):
  - **Blue**: `bg: #f0f4ff`, `icon: #7c8ff2`, `text: #5268de` (e.g., Tablets)
  - **Green**: `bg: #f0fbf0`, `icon: #7ad589`, `text: #4caf50` (e.g., Capsules)
  - **Orange**: `bg: #fff9f0`, `icon: #fca877`, `text: #e88046` (e.g., Liquids/Drops)

## Shapes and Radii
- **App Shells / Screen**: Soft or no radius on desktop, bounded `max-w-md` for mobile frames.
- **Cards**: Large radius `rounded-[20px]` to `rounded-[24px]` to feel friendly and soft.
- **Buttons / Pills**: Fully rounded `rounded-full` for primary actions and notification badges.
- **Inputs**: Softer radius `rounded-xl` (`12px`) or `rounded-2xl` (`16px`) for form fields.

## Motion & Transitions
- **Auth Success Transition**:
  - Slow fade-in and upward settle (approx `200ms` in, `500-900ms` hold).
  - Used when moving between auth and onboarding, or onboarding and home.
- **Onboarding Survey**:
  - Slide left-to-right/right-to-left between questions.
- **Interactions**:
  - Quick hover states for buttons/links (e.g. `transition-colors duration-200`).

## UI Tone
- **Concept**: Clinical Minimal
- **Vibe**: Calm, direct, easy to scan. No dense enterprise forms. Keep cognitive load very low. Let the user focus on their health routine, not the app's structural complexity.
