# Thuocare Mobile - Development Guidelines

## 1. Core Philosophy: The Serene Clinical Aesthetic
This app strictly follows the "Serene Clinical Aesthetic" system.
- **Vibe:** Reassuring, clear, modern, and trustworthy. Like a digital sanatorium.
- **"No-line" Design:** Minimize the use of borders. Use background color shifts (`bg-surface`, `bg-surface-low`, `bg-surface-lowest`, `bg-white/70`, etc.) to create visual hierarchy and separate elements instead of 1px harsh borders.
- **Typography:** Rely on heavy contrast for headers and soft muted colors for secondary text. Never use absolute black (`#000`), always use semantic tokens (`text-text`, `text-text-variant`).

## 2. Styling Rules: NativeWind v4
- **STRICT RULE:** **NEVER USE `StyleSheet.create`**.
- All styling must be achieved using Tailwind utility classes provided by NativeWind v4.
- Use the `cn()` utility (`import { cn } from "@/shared/ui"`) when you need to merge classes logically or conditionally.
- Use values from `global.css` & `tailwind.config.js`. Semantic tokens include:
  - Backgrounds: `bg-surface`, `bg-surface-low`, `bg-surface-lowest`, `bg-primary`, `bg-error-dark`
  - Text: `text-text`, `text-text-variant`, `text-primary`, `text-error-dark`

## 3. UI Primitives
Never use raw `<Text>` or `<TouchableOpacity>` directly for core interface building unless strictly necessary. Always use the predefined primitives from `src/shared/ui`:
- `<Text variant="...">`: Supports variants like `display`, `h1`-`h3`, `body`, `bodySmall`, `label`.
- `<Button label="...">`: Standard action button. It handles states like `disabled` and `loading`.
- `<Card>`: A foundational surface container that automatically follows the "no-line" rule.
- `<Badge>`: For inline alerting and status representation.

## 4. Architecture: Feature-Sliced Design (FSD)
- `app/`: Expo Router routes only. Keep logic minimal here. Pass down to features.
- `features/<name>/`: Contains feature-specific UI, data hooks, and logic.
- `shared/`: Generic, business-agnostic UI primitives, utilities, and constants.

## 5. File Naming Conventions
- **Components & Screens:** `kebab-case.tsx` (e.g., `unified-home-screen.tsx`, `auth-text-field.tsx`). This aligns identically with our Next.js web application structure.
- **Hooks & Utilities:** `camelCase.ts` (e.g., `useCapabilities.ts`, `auth-theme.ts` -> although `auth-theme` is kebab, standard is `kebab-case.ts` for utilities in FSD).
- **Routes:** Handled by Expo Router (`_layout.tsx`, `index.tsx`, `[id].tsx`).

**When adding new code or interacting with UI, future agents MUST read this document to understand the codebase context.**
