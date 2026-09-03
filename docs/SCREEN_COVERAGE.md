# Screen Coverage Register

All controlled GINFINA UX/UI screens from Volume 3 are implemented as React routes. Action branches are routable sub-screens at `/ginfina/ui-branch/:screenId/:branchKey`.

| Screen ID | Screen | Controlled Route | GX1 Layout | Density | Action Branches |
|---|---|---|---|---:|---:|
| GIN-UI-001 | Secure Login, SSO and MFA | `/ginfina/login` | GX1-L6 / authentication pattern | 40% | 3 |
| GIN-UI-002 | Consultant Profile and Engineering Readiness | `/ginfina/consultants/:consultantId/readiness` | GX1-L2 Record Detail | 50% | 4 |
| GIN-UI-003 | Engineering Workbench Home | `/ginfina/workbench` | GX1-L4 Executive Dashboard | 55% | 4 |
| GIN-UI-004 | My Work, Reviews and Approvals | `/ginfina/my-work` | GX1-L1 ERP Workbench | 60% | 4 |
| GIN-UI-005 | Project Register | `/ginfina/projects` | GX1-L1 ERP Workbench | 58% | 3 |
| GIN-UI-006 | Project Engineering Workspace | `/ginfina/projects/:projectId` | GX1-L7 Master-Detail Intelligence | 56% | 4 |
| GIN-UI-007 | Site Engineering Context and Location | `/ginfina/projects/:projectId/sites/:siteId` | GX1-L2 Record Detail | 48% | 3 |
| GIN-UI-008 | Engineering Work Package Register | `/ginfina/ewp` | GX1-L1 ERP Workbench | 60% | 4 |
| GIN-UI-009 | Create and Baseline Engineering Work Package | `/ginfina/ewp/new` | GX1-L3 Guided Wizard | 50% | 3 |
| GIN-UI-010 | Engineering Work Package Control Centre | `/ginfina/ewp/:ewpId` | GX1-L2 + GX1-L7 | 58% | 5 |
| GIN-UI-011 | Issue Engineering Work Order | `/ginfina/ewp/:ewpId/ewo/issue` | GX1-L3 Guided Wizard | 48% | 4 |
| GIN-UI-012 | Consultant EWO Acceptance and Clarification | `/ginfina/consultant/ewo/:ewoId` | GX1-L6 Portal Self-Service | 45% | 4 |
| GIN-UI-013 | Engineering Input Register | `/ginfina/ewp/:ewpId/inputs` | GX1-L1 ERP Workbench | 58% | 4 |
| GIN-UI-014 | Input Readiness and Design Start Gate | `/ginfina/ewp/:ewpId/readiness` | GX1-L2 Record Detail | 45% | 3 |
| GIN-UI-015 | Engineering RFI and Technical Query | `/ginfina/ewp/:ewpId/rfis` | GX1-L2 Record Detail | 48% | 4 |
| GIN-UI-016 | Engineering Deliverable Register | `/ginfina/ewp/:ewpId/deliverables` | GX1-L1 ERP Workbench | 60% | 4 |
| GIN-UI-017 | Document Upload and Revision Registration | `/ginfina/ewp/:ewpId/documents/upload` | GX1-L3 Guided Wizard | 46% | 3 |
| GIN-UI-018 | Document Detail and Revision History | `/ginfina/documents/:documentId` | GX1-L2 Record Detail | 52% | 4 |
| GIN-UI-019 | Formal Submission and Transmittal | `/ginfina/ewp/:ewpId/submissions/new` | GX1-L3 Guided Wizard | 50% | 4 |
| GIN-UI-020 | Review Cycle Configuration and Routing | `/ginfina/submissions/:submissionId/review/setup` | GX1-L3 Guided Wizard | 48% | 3 |
| GIN-UI-021 | Engineering Review Workspace | `/ginfina/reviews/:reviewCycleId` | GX1-L7 Master-Detail Intelligence | 60% | 5 |
| GIN-UI-022 | Comment Response, Verification and Closure | `/ginfina/review-comments/:commentId` | GX1-L2 Record Detail | 48% | 4 |
| GIN-UI-023 | Engineering Approval and Technical Sign-Off | `/ginfina/ewp/:ewpId/approval` | GX1-L2 Record Detail | 44% | 4 |
| GIN-UI-024 | Controlled Engineering Release - IFR / IFA / IFC | `/ginfina/ewp/:ewpId/releases/new` | GX1-L3 + GX1-L2 | 50% | 3 |
| GIN-UI-025 | Current Released Engineering Set | `/ginfina/ewp/:ewpId/releases/current` | GX1-L1 + GX1-L2 | 56% | 3 |
| GIN-UI-026 | Engineering Bill of Materials (EBOM) Workspace | `/ginfina/ewp/:ewpId/ebom` | GX1-L1 ERP Workbench | 60% | 5 |
| GIN-UI-027 | Engineering Bill of Quantities (BOQ) Workspace | `/ginfina/ewp/:ewpId/boq` | GX1-L1 ERP Workbench | 60% | 4 |
| GIN-UI-028 | Procurement Engineering Package | `/ginfina/ewp/:ewpId/procurement-package` | GX1-L3 + GX1-L9 | 52% | 4 |
| GIN-UI-029 | Technical Substitution and Deviation Request | `/ginfina/procurement-packages/:pepId/deviations` | GX1-L2 Record Detail | 50% | 4 |
| GIN-UI-030 | Technical Completion Certification | `/ginfina/ewp/:ewpId/completion` | GX1-L2 + GX1-L9 | 46% | 3 |
| GIN-UI-031 | Invoice Eligibility and Commercial Handoff | `/ginfina/ewp/:ewpId/invoice-eligibility` | GX1-L2 Record Detail | 42% | 3 |
| GIN-UI-032 | Standards, Design Basis and Applicable Requirements | `/ginfina/governance/design-basis` | GX1-L1 + GX1-L2 | 56% | 4 |
| GIN-UI-033 | Engineering Authority and Reviewer Matrix | `/ginfina/governance/authority-matrix` | GX1-L1 ERP Workbench | 55% | 4 |
| GIN-UI-034 | Technical Exception, Deviation and Waiver Control | `/ginfina/governance/exceptions` | GX1-L1 + GX1-L2 | 54% | 4 |
| GIN-UI-035 | Audit and Immutable Engineering Evidence | `/ginfina/governance/audit` | GX1-L7 Master-Detail Intelligence | 58% | 4 |
| GIN-UI-036 | Notifications, Escalations and GCONNECT Actions | `/ginfina/notifications` | GX1-L1 ERP Workbench | 50% | 4 |
| GIN-UI-037 | Management Engineering Command Dashboard | `/ginfina/management` | GX1-L10 Command Centre | 60% | 4 |
| GIN-UI-038 | AI Evidence and Human Disposition Ledger | `/ginfina/ai/evidence` | GX1-L5 AI Studio | 50% | 4 |
| GIN-UI-039 | Access, Role and Scope Administration | `/ginfina/admin/access` | GX1-L1 ERP Workbench | 50% | 4 |
