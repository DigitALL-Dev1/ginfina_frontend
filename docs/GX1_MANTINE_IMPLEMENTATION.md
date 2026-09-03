# GX1 / Mantine Implementation Contract

## Controlled UI rules

- React client application with Mantine components as the UI framework.
- Mantine `AppShell` is the root shell for all authenticated screens.
- Navigation is implemented with nested Mantine `NavLink` children, matching the Mantine UI nested-navbar interaction model.
- Desktop: 260 px expanded nested navbar. Tablet: 72 px compact rail. Mobile: collapsed AppShell navbar controlled by Mantine `Burger`.
- Neutral-first surfaces. GREEN is used for identity, active navigation, positive/approved states and primary actions. Error/warning/AI semantics remain separate.
- Primary task-region density target remains 40–60% from the controlled screen specification. Accessibility overrides density.
- Mobile touch targets use Mantine control sizing and a sticky primary action where safe.
- Every controlled screen supports demonstrable loading, empty, error and permission-denied states through the `state` query parameter.
- All material actions are represented by routable UI branches and an API/audit contract.

## Mantine package baseline

This implementation pins Mantine 9.5.0 because it is the current verified published release used for this executable pack. The earlier Volume 3 text named a GX1 controlled 9.4.1 baseline; package-version governance should be reconciled under change control before production freeze. No GX1 visual or authority rule is weakened by this implementation choice.

## Design source

- Volume 3 UX/UI and Screen Specification R1.0 D0.1
- GX1 UI Screen Design Pack R1.0 D0.1
- Figma Prototype Download Pack R1.0 D0.1
