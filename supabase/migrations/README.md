## Supabase migrations (Thuocare)

This folder contains **ordered SQL migrations** executed by Supabase CLI.

### File naming
- **Format**: `YYYYMMDDHHMMSS_<slug>.sql`
- **Ordering**: migrations run in **lexicographic order**, so timestamps must increase.

Recommended slugs:
- **Schema parts**: `part_<nn>_<module>.sql`
- **One function per file**: `fn_<function_name>.sql`
- **RLS/policies** (grouped by table/module): `rls_<module>.sql`
- **Seeds**: prefer `supabase/seed.sql` (not migrations) unless the data is truly a required migration.

### Conventions
- **One function per file**:
  - Exactly one `create or replace function public.<name>(...) ...;`
  - Keep its `grant execute on function ... to ...;` in the **same file**.
  - If you need `revoke`, keep it in the same file too.
- **Security definer functions**:
  - Always set `search_path` explicitly, e.g. `set search_path = public` or `public, auth`.
- **RLS**:
  - Enable RLS explicitly: `alter table ... enable row level security;`
  - Policies should be idempotent:
    - `drop policy if exists <policy_name> on <table>;`
    - `create policy ...;`
- **Triggers**:
  - `drop trigger if exists <trigger_name> on <table>;`
  - `create trigger ... execute function ...;`

### Dependency rules (important)
Run order must satisfy:
1) **Types/enums** before any table/function that references them
2) **Tables** before indexes, triggers, RLS policies, and functions that query them
3) **Trigger functions** before triggers that use them
4) **RLS enable** before creating policies (best practice)

### Adding a new migration (checklist)
- Decide the module: schema / function / rls / seed.
- Ensure dependencies exist in earlier migrations.
- If adding a function:
  - put it in its own `fn_<name>.sql`
  - include `grant execute` in the same file
- If adding/adjusting policies:
  - use `drop policy if exists` then `create policy`
- Run local verification:
  - `supabase db reset` (or your repo’s DB reset command)
  - confirm migrations apply cleanly from scratch.

