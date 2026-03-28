# Thuocare - Gemini Project Context

## Project Overview
Thuocare is a healthcare-focused mobile application for medication management, built with **Expo (React Native)** and **Supabase**. The project is currently in a "Fresh Root Build" state, with UI-driven development using mock data while the backend infrastructure (Supabase) is being established.

### Core Stack
- **Framework:** Expo (SDK 55) with Expo Router (File-based routing)
- **Language:** TypeScript
- **UI Library:** React Native Paper (Material Design)
- **Backend:** Supabase (Auth, Database, RLS)
- **Styling:** React Native StyleSheets (standard)
- **Package Manager:** pnpm

### Architecture
The project follows a feature-based organization:
- `src/app/`: Expo Router application structure (Tabs, Layouts).
- `src/features/`: Domain-specific logic (e.g., `home`, `meds`, `me`).
- `src/components/`: Reusable UI (`ui/`) and stateful (`state/`) components.
- `src/lib/`: Shared utilities and clients (Supabase, Env).
- `src/mocks/`: Static mock data for repositories.
- `src/types/`: Shared TypeScript interfaces.
- `supabase/`: Database migrations, seed data, and schema definitions.

## Getting Started

### Prerequisites
- Node.js & pnpm
- Expo Go (for development)
- Supabase project (for backend integration)

### Setup
1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Environment Variables:**
    Create a `.env.local` file (based on `.env.example` if available, or manually):
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
3.  **Run the application:**
    ```bash
    pnpm start   # Expo dev server
    pnpm ios     # Run on iOS emulator
    pnpm android # Run on Android emulator
    ```

### Quality Commands
- **Type Checking:** `pnpm typecheck`
- **Linting:** `pnpm lint`
- **Formatting:** `pnpm format`

## Development Conventions

### Feature Pattern
Each feature folder in `src/features/` should contain its own components and a `repository.ts` file. 
- **Repositories:** Use an async repository pattern to fetch data. Currently, these resolve `mockData` from `src/mocks/`. 
- **Backend Migration:** To move from mock to real data, update the repository implementation to use the `supabase` client from `src/lib/supabase/client.ts`.

### UI Components
- **Atomic UI:** Generic UI elements go into `src/components/ui/`.
- **Stateful Components:** Components that manage complex local state or connect to repositories go into `src/components/state/`.

### Database & Schema
- The `supabase/` directory is the source of truth for the database schema.
- `supabase/medication-schema.json` contains a detailed data model for medication, ingredients, and interaction rules.
- RLS (Row Level Security) is heavily used in Supabase migrations (`supabase/migrations/`).

## AI-Assisted Development
This project includes an `.agents/` and `.cursor/` setup, indicating it is optimized for AI-driven workflows (Gemini CLI, Cursor, etc.).
- Custom skills are located in `.agents/skills/`.
- Cursor-specific rules are in `.cursor/rules/`.
- Task-to-agent mapping and orchestrator logic are in `.cursor/agents/orchestrator/`.
