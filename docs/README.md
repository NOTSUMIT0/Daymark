# Daymark

Daymark is a calm daily-work record system: capture what was done, what is pending, and the next concrete step. This repository begins with a responsive, local-first application shell for Android and Windows desktop.

## Current milestone

The included app is an interactive Phase 1 prototype. It supports daily task records, status flow, filtering, a daily note, completion tracking, and saved light/dark appearance. Records are currently stored only in the browser/device's local storage; account sync is deliberately not simulated.

## Run it

1. Install Node.js 20 LTS or later.
2. In VS Code, open this folder and run `npm install`.
3. Run `npm run dev` and open the local address shown.
4. Run `npm run build` before sharing a release build.

Read [the product plan](PRODUCT_PLAN.md) and [the execution guide](EXECUTION_GUIDE.md) before beginning Phase 2.

## Project decisions

- **Client:** React + TypeScript + Vite, then wrapped by Capacitor (Android) and Tauri (Windows).
- **Data model:** local-first records with a sync queue. PostgreSQL is planned for the shared backend.
- **Security:** no passwords or secret keys are stored in this repository. Security controls are scoped in the plan and implemented before public release.
- **Cost:** software and self-hostable components are open source. Internet hosting, a domain, push delivery, backups, and store publishing can have real-world costs; free tiers are useful for development but cannot guarantee a permanently free commercial service.
