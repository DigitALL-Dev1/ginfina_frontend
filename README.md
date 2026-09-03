# GINFINA Engineering Workbench — React.js Front-end Pack

Controlled front-end implementation pack for **R1.0 D0.1**.

## Coverage

- **39/39 controlled main UI screens** (`GIN-UI-001` to `GIN-UI-039`)
- **148 routable action branches** generated from every primary and secondary action in the controlled Volume 3 screen specification
- responsive Web / Tablet / Mobile shell behaviour
- Mantine `AppShell` + nested `NavLink` navigation
- GX1 layout archetypes: Workbench, Record Detail, Guided Wizard, Executive Dashboard, Portal Self-Service, Master-Detail Intelligence, AI Studio and Command Centre
- mandatory states: ready, loading, empty, error, permission denied
- mock UNICEF pilot records and evidence
- API adapter ready for FastAPI integration
- route/screen/branch coverage validation and Vitest registry tests

## Run

```bash
npm install
npm run validate
npm run dev
```

Open `http://localhost:4173`. Demo login is illustrative; use **Sign in**, then the MFA step.

## Important developer routes

- `/ginfina/ui-catalog` — full 39-screen catalog
- Any controlled route with `?state=loading`, `?state=empty`, `?state=error`, or `?state=denied` — state branch
- `/ginfina/ui-branch/:screenId/:branchKey` — action sub-screen/branch

## Source structure

- `src/config/screenSpecs.json` — controlled screen truth from Volume 3
- `src/config/branches.json` — all primary/secondary action branches
- `src/components/shell` — AppShell and nested navbar
- `src/layouts` — GX1 layout compositions
- `src/screens` — controlled route rendering, UI catalog, branch pages
- `src/theme` — GREEN/GX1 Mantine theme and responsive rules
- `design-reference/` — source responsive boards and component mapping
- `docs/SCREEN_COVERAGE.md` — 39-screen release coverage register

## Package decisions

The executable baseline uses React 19.2.7, Vite 8.1.5, Mantine 9.5.0 and React Router DOM 7.18.1. See `docs/GX1_MANTINE_IMPLEMENTATION.md` for the GX1 package-version note.

## Production boundary

This is a complete front-end implementation/demo pack, not a claim that backend business logic, authentication, engineering approval authority or persistence is implemented. Production mutation authority must remain in the FastAPI/GINFINA backend with RBAC/ABAC and immutable audit controls.
