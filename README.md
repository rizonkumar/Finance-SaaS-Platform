# Fintrack

A personal finance workspace built on Next.js 16 and Postgres. Track accounts and
transactions, watch net worth move day by day, import statements from CSV, set
budgets per category, move money between accounts, plan a debt payoff, and
schedule recurring transactions that enter themselves.

Built as a full-stack showcase: type-safe end to end (Drizzle → Hono RPC → React
Query), a Geist-derived design system with real dark mode, and a lint gate that
enforces SonarQube-style rules.

---

## Features

| | |
|---|---|
| **Accounts** | Savings, cash, wallets, investments, fixed deposits, PPF, EPF, cards and loans — each with an opening balance, so every account carries a live balance |
| **Net worth** | Assets, liabilities and net worth as of any date, plus a daily trend built from real balances rather than cash flow |
| **Categories** | Group spending and see where the money actually goes |
| **Transactions** | Full CRUD, bulk delete, sorting, filtering, pagination |
| **CSV import** | Map arbitrary columns onto amount/date/payee, then bulk-create |
| **Dashboard** | A balance sheet on top of income / expenses / remaining with period-over-period change, plus seven chart types |
| **Budget goals** | Per-category or overall limits on weekly, monthly, yearly or custom periods, with live progress and on-track / warning / over states |
| **Savings goals** | A target, a deadline and a contribution ledger, with pace measured against the time elapsed |
| **Transfers** | Move money between your own accounts as one linked pair of entries, kept out of income, expenses and budgets |
| **Debt payoff** | Loans and cards with APR and minimum payment, projected payoff date and interest, plus a snowball vs avalanche comparison for any extra payment |
| **Recurring transactions** | Daily, weekly, monthly or yearly schedules that materialise into real transactions — no cron, no queue, no extra infrastructure. Give one a destination account and it becomes a scheduled transfer, so a monthly SIP runs itself |
| **Portfolio** | Stocks and mutual funds per broker account, with weighted-average cost, market value and realised / unrealised P&L from a trade ledger |
| **Command palette** | `⌘K` from anywhere to jump between routes, open any create sheet or switch theme |
| **Theming** | Light, dark and system, on a fully tokenised design system |

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, React 19) | RSC for the shell, client components where interactivity actually lives |
| API | **Hono** on a catch-all route handler | One fluent chain produces `AppType`, giving the frontend a fully typed RPC client with zero codegen |
| Database | **Neon Postgres** + **Drizzle ORM** | Serverless-friendly HTTP driver; Drizzle's schema doubles as the zod validation source via `drizzle-zod` |
| Auth | **Clerk** | Middleware-level route protection plus per-request `getAuth` inside Hono |
| Data fetching | **TanStack Query v5** | Centralised query-key factory, cross-feature invalidation |
| Tables | **TanStack Table v9** | Opt-in feature set, so only the row models used get bundled |
| Charts | **Recharts 3** | Every colour bound to a CSS variable, so charts theme with the app |
| Styling | **Tailwind v4** + shadcn/ui | CSS-first config; all design tokens live in `app/globals.css` |
| Validation | **Zod 4** | Shared between the API validators and the react-hook-form resolvers, behind a global error map so no internal message reaches a user |
| Command palette | **cmdk** | Dialog-free: anchored to the topbar search field rather than floating mid-screen |
| Testing | **Vitest** | Pure logic (recurrence maths, budget periods, CSV mapping) covered without a database |

---

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        RSC["React Server Components<br/>layouts · pages"]
        CC["Client Components<br/>charts · tables · sheets"]
        RQ["TanStack Query cache"]
        RPC["Hono RPC client<br/>lib/hono.ts"]
    end

    subgraph Server["Next.js server"]
        MW["Clerk middleware<br/>proxy.ts"]
        API["Hono app<br/>app/api/[[...route]]"]
        AUTH["requireAuth middleware"]
        ERR["onError handler"]
        LIB["Domain logic<br/>lib/recurrence · lib/budgets"]
        ORM["Drizzle ORM"]
    end

    DB[("Neon Postgres")]
    CLERK["Clerk"]

    CC --> RQ --> RPC --> MW --> API
    RSC --> API
    API --> AUTH --> LIB --> ORM --> DB
    API --> ERR
    AUTH -.verifies session.-> CLERK
    MW -.protects routes.-> CLERK

    style DB fill:#0F62E6,color:#fff
    style CLERK fill:#6C47FF,color:#fff
```

`AppType` is exported from the route chain and consumed by `hc<AppType>()`, so a
change to any handler's response shape becomes a compile error in the component
that renders it.

### Data model

```mermaid
erDiagram
    ACCOUNTS ||--o{ TRANSACTIONS : "has"
    ACCOUNTS ||--o{ RECURRING_TRANSACTIONS : "has"
    CATEGORIES ||--o{ TRANSACTIONS : "classifies"
    CATEGORIES ||--o{ BUDGETS : "limits"
    CATEGORIES ||--o{ RECURRING_TRANSACTIONS : "classifies"
    RECURRING_TRANSACTIONS ||--o{ TRANSACTIONS : "generates"
    ACCOUNTS ||--o{ GOALS : "holds"
    GOALS ||--o{ GOAL_CONTRIBUTIONS : "funded by"
    ACCOUNTS ||--o{ DEBTS : "pays from"
    DEBTS ||--o{ DEBT_PAYMENTS : "cleared by"
    ACCOUNTS ||--o{ HOLDINGS : "custodies"
    HOLDINGS ||--o{ TRADES : "built from"
    TRANSACTIONS ||--o| DEBT_PAYMENTS : "is the cash movement for"
    TRANSACTIONS ||--o| TRADES : "is the cash movement for"

    ACCOUNTS {
        text id PK
        text user_id
        text name
        text plaid_id
        enum type "savings cash wallet investment fixed_deposit ppf epf credit loan"
        integer opening_balance "miliunits, signed"
    }
    CATEGORIES {
        text id PK
        text user_id
        text name
        text plaid_id
    }
    TRANSACTIONS {
        text id PK
        integer amount "miliunits, signed"
        text payee
        text notes
        timestamp date
        text account_id FK "cascade"
        text category_id FK "set null"
        text recurring_id FK "set null"
        text transfer_id "shared by both legs"
    }
    BUDGETS {
        text id PK
        text user_id
        text category_id FK "null = overall"
        integer amount "miliunits, positive"
        enum period "weekly monthly yearly custom"
        timestamp start_date
        timestamp end_date
    }
    RECURRING_TRANSACTIONS {
        text id PK
        text user_id
        integer amount "miliunits, signed"
        text payee
        text account_id FK "cascade"
        text category_id FK "set null"
        text to_account_id FK "set = a scheduled transfer"
        enum frequency "daily weekly monthly yearly"
        integer interval
        timestamp start_date "anchor"
        timestamp end_date
        timestamp last_generated_at "watermark"
        boolean is_active
    }
    GOALS {
        text id PK
        text user_id
        text name
        integer target_amount "miliunits"
        text account_id FK "set null"
        timestamp start_date
        timestamp target_date
    }
    GOAL_CONTRIBUTIONS {
        text id PK
        text goal_id FK "cascade"
        integer amount "miliunits, signed"
        timestamp date
    }
    DEBTS {
        text id PK
        text user_id
        text name
        enum kind "loan credit-card other"
        integer principal "miliunits, opening balance"
        integer apr_basis_points
        integer minimum_payment "miliunits"
        text account_id FK "set null"
        timestamp start_date
        timestamp target_date
    }
    HOLDINGS {
        text id PK
        text user_id
        text account_id FK "cascade"
        text symbol
        text name
        bigint last_price "miliunits per unit"
        timestamp last_price_at
    }
    TRADES {
        text id PK
        text holding_id FK "cascade"
        text transaction_id FK "cascade"
        enum side "buy sell"
        bigint quantity "micro-units, fractional funds"
        bigint price "miliunits per unit"
        bigint fees "miliunits"
        timestamp date
    }
    DEBT_PAYMENTS {
        text id PK
        text debt_id FK "cascade"
        text transaction_id FK "cascade"
        integer amount "miliunits, + clears, - borrows"
        timestamp date
    }
```

An account balance is `opening_balance` plus every transaction on it. Transfer
legs are deliberately counted here — moving your own money changes two balances
even though it is neither income nor spending — which is the one place the rule
inverts from summaries and budgets.

Net worth splits those balances by **sign**, not by account type: anything above
zero is an asset, anything below it is a liability, and outstanding debt is added
to the liability side. An overdrawn current account is then a real liability and
an overpaid card is real money owed back to you, with no special cases. The type
only decides how a row reads and which way the opening balance is signed, so a
card or loan is entered as the amount owed and stored below zero. The trend walks the
window forward one day at a time carrying a running balance per account, so every
point is a balance sheet rather than a cumulative sum of cash flow — all of it
pure maths in `lib/net-worth.ts`, tested without a database.

Money is stored as **miliunits** (integer thousandths) so no float ever touches a
balance, in `bigint` columns — `integer` caps at ₹21,47,483.65, which a single home
loan clears. Holding quantities use the same trick at **micro-units** (×10⁶) so a
fractional mutual fund unit stays an integer too. `transactions.recurring_id` is `ON DELETE SET NULL` on purpose: deleting a
schedule must never erase months of real financial history.

A transfer is not a table. It is a pair of transactions — one negative on the
source account, one positive on the destination — sharing a `transfer_id`. Every
account-scoped view and balance then stays correct with no special cases; the only
rule to remember is that summaries and budgets filter `transfer_id is null`,
because moving your own money is neither income nor spending. Both legs are
written in one statement and deleted together, so the ledger is never half a
transfer.

Debts run the same way as savings goals but in reverse: `principal` is the opening
balance and stays put, while `debt_payments` records what has been paid off (and,
as a negative amount, anything freshly borrowed). Rates live in basis points so
they stay integers, and every projection — payoff date, total interest, the
snowball and avalanche simulations — is pure maths in `lib/debts.ts`, tested
without a database.

**`transactions` is the only ledger for money that actually moves.** Paying a debt
is cash leaving an account, so each `debt_payments` row carries a `transaction_id`
and both are written inside one `db.transaction`; the transaction amount is the
negation of the payment. A goal contribution is deliberately *not* a movement — it
earmarks money you already hold, which is why linking a goal to an account is a
label and nothing more. Without that link the two tables were parallel
ledgers, and the arithmetic gave it away: net worth is
`account balances − (principal − payments)`, so a payment shrank the liability
without shrinking the cash that covered it, inflating net worth by the full amount.
Goals never had that bug, because goals are not an asset on the balance sheet —
giving them a transaction would have made an earmark destroy money instead.
The foreign key cascades — delete the transaction and the entry goes with it, because
an entry whose money never moved is worse than no entry. The same rule makes budget
progress derived rather than stored: `spentByBudget` sums outflow transactions by
category, so the only way to move a budget is to record a transaction, which is why
each budget card offers **Add spend** rather than a field to type a number into.

Holdings keep that single ledger honest. Buying a stock is cash leaving the
account, so a trade writes its `transactions` row and its `trades` row in one
`db.transaction` — the account's balance stays *cash*, while cost basis lives in
the trade ledger. A purchase converts cash into an asset rather than consuming
it, so summaries and budgets skip trade-backed rows for the same reason they skip
transfer legs; account balances and the forecast still count them, because the
cash genuinely moved. Quantity and weighted-average cost are **derived from trades**,
never stored, the same way budget and goal progress are; `lib/holdings.ts` holds
that arithmetic and is tested without a database. Net worth adds market value to
assets, and the trend values each day's quantity at the latest recorded price —
"your portfolio at today's prices" — because no price history is stored.

A scheduled transfer reuses the same idempotency trick as any other recurring
entry. When a template carries a `to_account_id`, each occurrence emits **two**
rows with deterministic ids (`rt_{id}_{date}_out` / `_in`) sharing a deterministic
`transferId`, so two tabs loading at once still collapse to one insert.

### A mutation, end to end

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant Q as TanStack Query
    participant H as Hono route
    participant K as Clerk
    participant Z as Zod validator
    participant D as Drizzle
    participant P as Postgres

    U->>C: Submits the form
    C->>Q: mutate(values)
    Q->>H: POST /api/budgets
    H->>K: getAuth(c)
    K-->>H: userId
    Note over H: 401 via HTTPException if absent
    H->>Z: zValidator("json", budgetBody)
    Z-->>H: parsed values
    H->>D: insert().returning()
    D->>P: INSERT
    P-->>D: row
    D-->>H: row
    H-->>Q: { data }
    Q->>Q: invalidate budgets + summary + transactions
    Q-->>C: refetched state
    C-->>U: Toast, sheet closes
```

### Recurring transactions without a cron

The hard constraint: the app must deploy with **no extra infrastructure** — no cron
provider, no queue, no new environment variables. Occurrences are therefore
materialised lazily, on read.

```mermaid
flowchart TD
    A["GET /transactions, /summary or /recurring"] --> B{"Ran for this user<br/>in the last 30s?"}
    B -- yes --> Z["Serve the query"]
    B -- no --> C["Probe: active templates<br/>indexed on user_id, is_active"]
    C --> D{"Any due?"}
    D -- no --> Z
    D -- yes --> E["Walk occurrences from the anchor<br/>capped at 60/template, 300/run"]
    E --> F["Build deterministic ids<br/>rt_{templateId}_{yyyy-MM-dd}"]
    F --> G["INSERT ... ON CONFLICT (id) DO NOTHING"]
    G --> H["Bump watermark with greatest(...)"]
    H --> Z

    style G fill:#28a948,color:#fff
    style F fill:#0F62E6,color:#fff
```

Four decisions carry this design:

1. **Deterministic primary keys are the idempotency mechanism.** The Neon HTTP
   driver has no interactive transactions, so `BEGIN … COMMIT` and advisory locks
   are unavailable. Every occurrence hashes to the same id in every process, and a
   single multi-row `INSERT … ON CONFLICT DO NOTHING` is atomic on its own. Two tabs
   loading at once produce identical ids; the loser is a silent no-op.
2. **Occurrence *N* is computed from the original anchor, never from *N−1*.**
   Iterating `addMonths(previous)` turns `Jan 31 → Feb 28 → Mar 28 → Apr 28`,
   permanently losing the "last day of the month" intent. Anchoring gives
   `Jan 31, Feb 28, Mar 31, Apr 30` — correct, and self-healing.
3. **All calendar maths runs on UTC fields, not date-fns.** `addMonths` and `format`
   read the process time zone, so a UTC-midnight date reads back as the previous
   local day on a negative-offset machine — generating different ids in development
   than in production. Instants are stored at 12:00 UTC so every real-world offset
   renders the intended calendar day.
4. **Nothing is ever generated past today.** The dashboard computes income and
   expenses straight from `transactions`; materialising next month's rent today
   would show money as already spent. The next date is derived from the rule for
   display instead.

`lastGeneratedAt` is a performance hint, never a correctness mechanism — if that
write is lost, the next run recomputes the same occurrences and the insert no-ops.

---

## Project Structure

```
app/
  (auth)/              Sign-in and sign-up, themed to match the app
  (dashboard)/         Sidebar shell, one folder per route
  api/[[...route]]/    Hono app: _middleware, _resource, and one file per resource
components/            App shell, charts, shared states, shadcn primitives in ui/
db/                    Drizzle schema and connection
features/<name>/       api/ (React Query hooks) · hooks/ (zustand sheet state) · components/
lib/                   Domain logic, constants, query keys, formatting
drizzle/               Generated SQL migrations
scripts/               migrate, seed and reset
```

Each feature owns its data hooks, sheet state and forms. Shared behaviour is
factored out rather than duplicated: `createResourceRoutes` generates the CRUD
endpoints for accounts and categories, `ResourcePage` renders both list pages, and
`createNewSheetStore` / `createOpenSheetStore` back every sheet.

---

## Getting Started

**Prerequisites:** [Bun](https://bun.sh), a [Neon](https://neon.tech) database, and a
[Clerk](https://clerk.com) application.

```bash
git clone https://github.com/rizonkumar/Finance-SaaS-Platform.git
cd Finance-SaaS-Platform
bun install

cp .env.example .env    # then fill in the values

bun run db:migrate      # apply migrations
bun run db:seed         # optional sample data
bun run dev
```

Open <http://localhost:3000>.

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` | Auth route paths |
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Base URL the RPC client targets |

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Development server |
| `bun run build` / `start` | Production build and serve |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` / `lint:fix` | ESLint with `typescript-eslint` and `eslint-plugin-sonarjs` |
| `bun run format` / `format:check` | Prettier |
| `bun run test` / `test:watch` / `test:coverage` | Vitest |
| `bun run db:generate` | Generate a migration from the schema |
| `bun run db:migrate` | Apply migrations |
| `bun run db:seed` | Seed sample data |
| `bun run db:reset` | Show what is in the database. `-- --yes` empties every table; `-- --drop --yes` also drops the tables, enum types and migration journal |
| `bun run db:studio` | Drizzle Studio |

---

## Code Quality

The quality gate is enforced, not aspirational — CI runs typecheck, lint, format
check, tests and build on every push.

- **`eslint-plugin-sonarjs`** for cognitive complexity, duplicated string literals,
  identical functions, nested ternaries and redundant optionals.
- **`typescript-eslint`** with `strict` plus `noUncheckedIndexedAccess`,
  `noUnusedLocals`, `noUnusedParameters` and `noImplicitOverride`.
- **No `any`** anywhere in the codebase, and no `@ts-ignore` / `eslint-disable`
  escape hatches.
- **Comments are rare and load-bearing.** Names and structure carry the meaning,
  so anything that needed a comment to explain got extracted instead. The handful
  that remain exist to stop a future reader "fixing" a deliberate choice — why a
  bar's width and its `aria-valuenow` disagree, why a Tailwind class map must stay
  literal, why a date picker refuses to clear itself.
- **Prettier** with Tailwind class sorting, enforced by a `lint-staged` pre-commit hook.
- **Vitest** covers the logic where bugs actually live: month-end and leap-year
  recurrence, budget period boundaries, miliunit round-tripping and CSV mapping.

---

## Design System

A Geist-derived system, deliberately not a clone. Every colour, radius, shadow and
motion value is a token in `app/globals.css`; no component uses a raw hex.

- **Ten-step scales** in `oklch` where the step encodes intent: `100` background,
  `400` border, `700` solid fill, `900` secondary text, `1000` primary text.
- **Financial semantics** — green for income and under-budget, red for expenses and
  overspend, amber for approaching a limit. Never colour alone: every state also
  carries an icon or a label.
- **Dark mode** resolves through both the class the toggle sets and
  `prefers-color-scheme`, so it is correct before the user ever opens the toggle.
- **Geist Sans and Geist Mono**, with tabular figures on every currency and date so
  numeric columns align.
- **Motion** is short and physical, and disabled wholesale under
  `prefers-reduced-motion`.

---

## Licence

MIT
