# Daymark — product and delivery plan

## Product direction

**Working name:** Daymark  
**Promise:** turn an overloaded workday into a reliable, private record of progress and next actions.  
**Tone:** editorial, grounded, deliberate. The interface should feel like a well-made work journal—not a generic SaaS dashboard.

Daymark combines a task flow, daily work log, reminders, recurring routines, and a concise weekly review. Each task must always answer: *what is the outcome, what is its current state, and what happens next?*

## Recommended architecture

| Concern | Choice | Why |
| --- | --- | --- |
| Android + desktop UI | React + TypeScript + Vite | One polished interface with a mature web ecosystem. |
| Android package | Capacitor | Packages the same app for Android and provides native notifications/storage bridges. |
| Windows desktop package | Tauri | Small, secure desktop runtime with a minimal native surface. |
| Offline data | IndexedDB via Dexie | Fast local-first records, works without a connection. |
| API | Fastify + TypeScript + OpenAPI | Small, typed, testable HTTP service. |
| Identity | OIDC-compatible auth (Keycloak self-hosted, or Supabase Auth during prototype) | Password policy, sessions, MFA and recovery should not be improvised. |
| Primary database | PostgreSQL | Strong relational integrity, migrations, backups, and row-level access patterns. |
| Realtime sync | WebSocket sync events + an outbox | Sync only changed records; resolve conflicts predictably. |
| Files/attachments | S3-compatible storage (MinIO self-hosted) | Keeps uploads separate from transactional data. |
| Notifications | Local notifications first; FCM for Android remote reminders | Local reminders stay useful offline. FCM itself is no-cost but needs a Google project. |
| Observability | OpenTelemetry + Sentry-compatible self-hosted error tracking | Diagnosable without putting private daily notes in logs. |

**Why not a single hosted “free forever” service?** A commercial production service needs dependable compute, database disks, off-site backups, email delivery, a domain, and incident response. Open-source software can remove licence fees; it cannot remove infrastructure costs forever. Start on free tiers or a home server for private testing, then budget for a paid host before handling other people’s data.

## Information model (built to avoid later conflicts)

- **User** owns workspaces and settings.
- **Workspace** owns projects, tags, routines, and members.
- **Task** has title, description, state, priority, dates, estimate, project, tags, a next action, and audit timestamps.
- **Work log** records what was actually completed or learned on a date.
- **Flow step** is an ordered, individually completeable process for a task.
- **Reminder** is local or server-scheduled; it stores timezone and delivery outcome.
- Every syncable record has a UUID, `createdAt`, `updatedAt`, `deletedAt`, version, and device mutation ID.

## Delivery phases

### Phase 0 — product foundation (now)

- Define the product, visual direction, record model, privacy boundary, and acceptance criteria.
- Build a local interactive UI shell with light/dark mode, task flow, daily log, and responsive layouts.
- Set repository standards: TypeScript strict mode, linting, formatting, conventional commits, and CI.

**Done when:** the prototype runs locally and a user can add, change, filter, complete, and reopen a daily record without a server.

### Phase 1 — dependable local daily planner

- Replace localStorage with IndexedDB and schema migrations.
- Add projects, tags, due dates, recurring routines, timeline/history, calendar and search.
- Add Android local notifications and desktop reminders.
- Accessibility pass: keyboard navigation, focus states, semantic labels, contrast and reduced motion.
- Package Android debug build and Windows installer for personal testing.

**Done when:** it works offline for a month of use and survives upgrades without data loss.

### Phase 2 — accounts and secure sync

- Implement API, PostgreSQL migrations, account lifecycle, device sessions, and a sync outbox.
- Encrypt transport (HTTPS), hash passwords through the identity provider, add email verification, rate limits, MFA, session revocation, and audit logs.
- Add conflict behaviour: field-level last-write-wins plus an explicit conflict record for simultaneous edits.
- Build export (JSON/CSV), account deletion, and data import.

**Done when:** Android and Windows changes converge reliably after offline edits and account security tests pass.

### Phase 3 — production operations

- Containerize API, worker, PostgreSQL and MinIO; deploy behind Caddy or Nginx TLS reverse proxy.
- Add automated encrypted backups, restore drills, health checks, structured logs, uptime monitoring, error tracking, rate limits and WAF/CDN where applicable.
- Set up CI: type check, unit/component/E2E tests, dependency scan, secret scan, migration checks, signed release artifacts.
- Create privacy policy, terms, support contact, data retention policy, incident response playbook, custom 404 page, SEO metadata, favicon/app icons, Open Graph image, robots.txt and sitemap for the public website.

**Done when:** a restore drill succeeds, monitoring alerts work, and staged releases can roll back.

### Phase 4 — thoughtful power features

- Weekly review, time-blocking, focus sessions, goals, templates, attachments, sharing and team workspaces.
- Optional integrations only after permission and privacy design: calendar import, email-to-task, and automation webhooks.
- Analytics must be privacy-preserving, opt-in, and never record note content.

**Done when:** features solve validated user problems without weakening speed, privacy, or offline use.

## Security baseline

SSH is an infrastructure administration tool, not an app-login mechanism. End users authenticate through the application; only administrators use SSH to maintain a self-hosted server. For servers: disable password SSH login, use unique key pairs, disable root login, allowlist administrators/VPN where possible, patch regularly, firewall unused ports, and monitor access. Do not expose PostgreSQL, MinIO, or admin consoles publicly.

Before public launch: threat-model the application, use HTTPS everywhere, secure cookies/tokens, CSRF protection where applicable, strict CORS/CSP headers, parameterized SQL, authorization checks on every record, rate limits, encrypted backups, secret manager/environment variables, dependency updates, and independent penetration testing. Client-side encryption for private notes should be a separately designed feature because it changes search, recovery, and sharing.

## Visual system

- Use a warm parchment light theme and deep ink dark theme; no gradients, neon, glass panels, decorative grids, oversized iconography, fake social proof, or “three cards in a row” marketing patterns.
- Typography: a restrained literary serif such as **Cormorant Garamond** for the wordmark/display text and an accessible humanist sans (e.g. **Source Sans 3**) for controls and body copy. Do not use Old English for body text—it harms readability; reserve a blackletter-style mark only for a small logo experiment if chosen.
- Use strong layout hierarchy, clear empty/loading/error states, visible focus rings, deliberate borders, and compact tables/lists for real work.
- Every page gets a purpose-specific title and metadata when the public site is built. The installed app needs app icons, an accessible name, and native appearance settings—not SEO.

## Your actions and accounts

1. Install **Node.js 20 LTS**, **Git**, **VS Code**, Android Studio, and later Rust (for Tauri). Do not install production services yet.
2. Open this repository in VS Code, run the prototype, and use it for several days. Keep a list of friction points and must-have fields.
3. Decide your first audience: only you, a small private beta, or public users. This determines legal copy, support, and account work.
4. For Android distribution, create a Google Play Console account when ready (there is a one-time registration fee). For testing outside the store, use signed APKs with careful distribution.
5. When Phase 2 starts, register a domain and an email sending address. Choose either a supported free-tier provider for a prototype or a paid VPS for controlled self-hosting.
6. Never paste API keys, database passwords, signing keys, or SSH private keys into this repository or chat. Store them in a local `.env` file excluded by Git and a production secret manager.

## Release gates

No phase moves to the next until the prior gate passes: code review, automated checks, manual acceptance against the phase definition, backup/restore verification where data is involved, and an explicit security review before public accounts or payments.
