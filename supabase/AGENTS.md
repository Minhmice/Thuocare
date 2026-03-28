# SUPABASE KNOWLEDGE BASE

## OVERVIEW

`supabase/` is the SQL source-of-truth workspace for schema, RLS policies, helper functions, and local seed data.

## STRUCTURE

```text
supabase/
├── migrations/                  # Ordered SQL migrations
│   ├── README.md                # Naming/order/function-policy conventions
│   └── YYYYMMDDHHMMSS_*.sql     # Timestamped migration files
├── seed.sql                     # Demo dataset for local reset flow
└── medication-schema.json       # Import schema + enum map for medication data
```

## WHERE TO LOOK

| Task                              | Location                                   | Notes                                                    |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Add schema/table/index changes    | `migrations/*.sql`                         | Keep lexicographic timestamp order                       |
| Add helper SQL function           | `migrations/*fn_<name>*.sql`               | One function per migration file                          |
| Update RLS policies               | `migrations/*rls*.sql` or module migration | Use `drop policy if exists` + recreate idempotently      |
| Add/adjust triggers               | `migrations/*trigger*.sql`                 | Ensure trigger function exists in earlier migration      |
| Validate migration conventions    | `migrations/README.md`                     | Canonical rules for this folder                          |
| Seed local patient scenario       | `seed.sql`                                 | Includes demo auth + patient + medication/adherence rows |
| Update medication import contract | `medication-schema.json`                   | Keep enum values aligned with DB enums                   |

## CONVENTIONS

- Filename format: `YYYYMMDDHHMMSS_<slug>.sql`; ordering is execution order.
- Dependency ordering is strict: enums/types -> tables -> functions -> triggers -> RLS policies.
- For security-definer functions, set explicit `search_path`.
- For RLS, enable RLS explicitly and make policy creation idempotent.
- Prefer seed data in `seed.sql` unless data must be migration-time mandatory.

## ANTI-PATTERNS

- Do not place multiple unrelated functions in one migration file.
- Do not add policies without `drop policy if exists` safety.
- Do not create triggers before defining trigger functions.
- Do not rely on implicit migration ordering from non-timestamped names.
- Do not change enum values in JSON import schema without matching SQL enum updates.

## NOTES

- This workspace currently has no `config.toml`; migration ordering and SQL content are the operative contract.
- `migrations/` currently dominates the directory (50+ files), so prefer targeted edits over broad rewrites.
