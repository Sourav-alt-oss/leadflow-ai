# LeadFlow AI — VS Code build guide

An animated CRM demonstration using entirely fictional records. No database, API keys, paid services, or real sign-in required. Never enter real customer data or passwords. This is a learning project, not a production CRM.

## 1. Set up Windows

Install a supported Node.js LTS release (22 or newer), VS Code, and optionally Git. Open PowerShell or Command Prompt. Verify:

```powershell
node --version
npm --version
code --version
```

Extract the ZIP, open its `leadflow-ai` folder in VS Code (File > Open Folder), and open Terminal > New Terminal. Run the following from the folder containing `package.json`:

```powershell
npm install
npm run dev
```

Open http://localhost:3000. If port 3000 is busy, use `npm run dev -- --port 3001` and open that port instead. If PowerShell blocks npm.ps1, run `npm.cmd install` and `npm.cmd run dev`, or select Command Prompt in VS Code. Do not change system execution policy just to run npm.

This archive is already initialized; do not run create-next-app over it. For a separate from-scratch exercise, run `npx create-next-app@15 leadflow-ai-practice --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"`, then copy the provided source and config files into the practice folder and install its dependencies.

## 2. Project structure and build order

```text
leadflow-ai/
  package.json                  Dependencies and scripts
  tsconfig.json                 Strict TypeScript and @/ aliases
  postcss.config.mjs            Tailwind CSS 4
  eslint.config.mjs             Next.js ESLint configuration
  src/
    app/
      layout.tsx                Root layout and providers
      globals.css               Tokens, responsive UI, reduced motion
      page.tsx                  Marketing home
      [page]/page.tsx           Features, pricing, about, contact
      demo/page.tsx             Redirect to demo login
      demo/[section]/page.tsx   Validated CRM routes
      error.tsx                 Error boundary
      not-found.tsx             Invalid route fallback
    components/
      providers.tsx             Theme, motion, state, toast providers
      shared.tsx                Logo, theme switch, counters, animated cards
      marketing.tsx             Landing sections, mini product preview
      workspace.tsx             Login, sidebar, top bar, global search
      dashboard.tsx             KPIs and Recharts reports
      records.tsx               Shared CRUD editor, filters, CSV, pagination
      pipeline.tsx              dnd-kit board and stage selector
      extras.tsx                Calendar, assistant, activities, team-related settings, rules
    demo/
      model.ts                  Zod schema and record types
      seed.ts                   Fictional dataset generator
      logic.ts                  Pure calculations and simulated AI
      store.tsx                 Shared React context and local persistence
  tests/
    logic.test.ts               Vitest unit tests
    workflows.spec.ts           Playwright browser tests
```

### Phase 1: Foundation

Read `src/demo/model.ts` first. `recordSchema` defines a shared record envelope and `RecordItem` is inferred using Zod. `DemoState` groups collections. `blank()` supplies default fields for the forms. `validate()` checks record values and selected statuses. IDs are strings, and links use `companyId`, `ownerId`, or `relatedId` instead of duplicating company and agent names.

Next read `src/demo/seed.ts`. It generates 80 leads, 30 contacts, 15 companies, 25 deals, 40 tasks, 10 members, 30 activities, 15 notifications, 6 sample meetings and 5 automation rules. The email addresses use example.com. Dates are generated relative to first load.

Then read `src/demo/store.tsx`. It starts with null data on the server and loads the browser state in a client effect. Zod checks persisted JSON; if invalid, it falls back to a fresh seed. A second effect saves state after changes. `save()`, `remove()`, `convert()`, and `reset()` are shared mutation methods. Activity and notifications are recorded with changes. Relationships are protected by blocking deletes of referenced records. No database connection is needed.

### Phase 2: Theme and marketing

Open `src/app/globals.css`. Change `--primary`, `--accent`, and `--bg` to customize the theme. The `.light` class contains the light palette. `providers.tsx` wraps the app with next-themes, MotionConfig, the store, and Sonner.

Open `marketing.tsx`. The hero uses staggered word animation; GSAP ScrollTrigger reveals sections. `Preview()` has its own illustrative interactive sample rather than changing the CRM records. `shared.tsx` contains the reusable animated card and counter. Open `/`, `/features`, `/pricing`, `/about`, `/contact` to inspect all marketing pages.

### Phase 3: Workspace and dashboard

`workspace.tsx` maps sidebar labels to routes, handles demo persona selection and global search, and dispatches each section to its component. `demo/[section]/page.tsx` validates the route before rendering. Login is deliberately not real authentication; the admin shortcut goes straight to the workspace. Viewer disables shared record mutations, but manager and agent roles are illustrative only.

`dashboard.tsx` uses `metrics()` in `logic.ts` and chart series derived from the same data. Example formula: conversion rate = converted leads / all leads × 100, rounded; active pipeline = sum of deal values excluding Won and Lost. Won value grouped by expected close month is an estimate, not actual cash receipts. Date filters refer to creation dates. Change a deal, open analytics, and observe the updated totals.

### Phase 4: CRM records and pipeline

`records.tsx` is a shared CRUD page for leads, companies, contacts, deals, tasks and team. Read `Editor()` to see controlled inputs, link selectors, validation and the Radix focus-managed dialog. Read `Records()` for search, filters, sorting, 10-row pagination, delete confirmation and undo. CSV import accepts a header with `name` plus optional `email,phone,value,tags,notes`; imported leads start with default status and source. Export includes the filtered result set. Try this CSV in a file called `sample.csv`:

```csv
name,email,phone,value,tags,notes
Demo Alpha,alpha@example.com,,25000,Inbound,Sample record
Demo Beta,beta@example.com,,60000,B2B,Follow up
```

Add a fictional lead, edit it, assign an agent, convert it to a contact and deal, then open `/demo/pipeline`. `pipeline.tsx` uses draggable deal cards and droppable stages with dnd-kit. The stage selector is a keyboard-friendly alternative. The store saves stage changes and recalculates related metrics.

### Phase 5: Productivity

Open `/demo/tasks` and add a task with a due date. Complete it. Check `/demo/calendar`, `/demo/activities` and `/demo/notifications`. Calendar month/week views display tasks, lead follow-ups, and demo meetings. Choose a date to create a meeting. The notification count tracks stored unread events; task reminders are additionally derived from current task state.

### Phase 6: Assistant and automations

`logic.ts` contains `score()` and `answer()`. The score is a transparent illustrative rule, not a predicted conversion probability. `answer()` recognizes supported keywords and reads the current state. Try “Which deals are in negotiation?”, “Show the largest open opportunities” or “Draft a follow-up email.” Drafts are editable and copyable; nothing is sent.

In `/demo/automations`, enable or disable sample rules, edit their descriptions, and manually evaluate them. Evaluations log matching record counts rather than executing real background jobs. In `/demo/settings`, switch theme, select persona, or reset the fictional dataset.

### Phase 7: Improve and extend

The source uses reusable CSS and Tailwind utilities, Radix dialogs, Motion, GSAP, Recharts, dnd-kit and Zod. It deliberately uses native tables and controlled forms instead of TanStack Table, React Hook Form and generated shadcn/ui components. Suggested practice: replace `Records` with TanStack Table; migrate `Editor` to React Hook Form with Zod resolver; add shadcn/ui buttons and inputs; split the common model into entity-specific schemas; add real role-specific visibility; extend calendar events and automation conditions; add cross-tab synchronization only after testing.

Other master-prompt details not fully implemented: full marketing testimonial/benefit sections, advanced animation suite including parallax and confetti, all per-module advanced filters and analytics reports, full CSV round-trip, background automation triggers, real-time cross-tab synchronization, and granular manager/agent permissions. There are no production API routes or authentication. Current local state is not secure for real customer data.

## 3. Run checks before deployment

In a new terminal (or stop the dev server with Ctrl+C):

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

After a successful build, `npm start` runs the production-mode demo. Playwright assumes port 3000. Stop any unrelated server on that port first or change its config.

Manual checklist:
- Marketing routes and mobile navigation work.
- Create, edit, filter, delete and restore an unlinked lead.
- Refresh and confirm the lead persists. Convert another lead and inspect new contact/deal.
- Move a deal via drag and stage selector; verify the pipeline value changes when marked Won.
- Create and complete a task; verify calendar, notifications, and activity.
- Try simulated AI supported and unsupported questions.
- Switch light/dark theme and Viewer role.
- Confirm reset restores the original counts.
- Check keyboard navigation, dialogs and reduced motion.

Verification disclosure: source syntax was checked using the available TypeScript transpiler, but npm registry DNS was unavailable in the authoring environment. Dependencies, full typechecking, lint, build and browser tests have NOT been executed there. No package-lock is included; npm install creates it. Run the checks above locally before presenting or publishing the project. Check current Next.js security advisories and install the latest patched release in the chosen major line.

## 4. Publish on Vercel

After successful checks, create a GitHub repository and push the source (not node_modules or .next):

```powershell
git init
git add .
git commit -m "Build LeadFlow AI demo"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leadflow-ai.git
git push -u origin main
```

Create the empty remote repository first; replace YOUR_USERNAME. Then sign in to Vercel, import the repository, select Next.js if needed, leave build settings at their defaults, and deploy. No environment variables are required. Use a plan appropriate to your use; personal demo projects may qualify for Vercel Hobby subject to current terms. Never treat this public demo as a secure CRM.

## 5. Future full-stack version

After the demo works, introduce a server-side data-access layer and route handlers, MongoDB models and indexes, real authentication, tenant isolation, role checks on every server operation, secure validation, audit logs, rate limits, and actual API integrations. Keep the current demo as a separate fictional-data environment. Do not use localStorage as the source of truth for real credentials or customer records.
