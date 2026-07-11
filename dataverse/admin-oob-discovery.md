# Agent Sidecar Administration — Existing Schema Discovery

Discovery was performed against `https://carremacodeapps.crm.dynamics.com` before proposing administration schema.

## Proposed concepts

- **Sidecar Configuration** — one desired-state record per target Model-driven App.
- **Target Binding** — one sidecar-owned registration per selected table and active main form.

## Existing assets reviewed

| Existing asset | Finding | Decision |
|---|---|---|
| `appconfig` / `appconfiginstance` | Platform-owned app configuration metadata. It is solution-internal and does not represent sidecar lifecycle or owned form registrations. | Do not extend. |
| `cat_copilotconfiguration` (Agent Configuration) | Custom table from another solution. It contains agent, tenant, client, and environment identifiers, but models telemetry, Direct Line, and agent-analysis settings. | Do not reuse or extend. Avoid a dependency on an unrelated solution. |
| `msdyn_formmapping` | Managed Microsoft mapping table for other platform features. It does not preserve sidecar ownership, deterministic handler IDs, or rollback fingerprints. | Do not extend. |
| `systemform` | Authoritative OOB source for forms and live `formxml`. | Read during discovery, validation, mutation, and rollback; do not duplicate form XML in configuration records. |
| `statecode` / `statuscode` | Platform lifecycle columns available on each custom table. | Reuse for Draft, Deployed, Drift Detected, Disabled, Active, and Inactive lifecycle behavior. |
| `createdby`, `createdon`, `modifiedby`, `modifiedon` | Platform audit columns available automatically. | Reuse; do not create parallel audit columns. |

No existing `maftagsc_` table represents sidecar configuration or target bindings. Existing `maftagsc_` tables are HR-domain records.

## Approved duplication-risk override

The developer selected the dedicated-schema option on 2026-07-10. `cat_copilotconfiguration` was considered and rejected because extending it would create a cross-solution dependency and still would not model app-keyed sidecars, target bindings, drift review, or rollback safety.

## Resulting model

- Create organization-owned `maftagsc_sidecarconfiguration`.
- Create organization-owned `maftagsc_targetbinding` with a required parent lookup and cascade delete.
- Store only form fingerprints, not full `formxml`; `systemform` remains authoritative.
- Recalculate detailed health checks and drift on demand; persist only current summaries and validation timestamps.
- Use an alternate key on target App ID so one Model-driven App cannot have two sidecar configurations.

No schema has been provisioned by this discovery step.