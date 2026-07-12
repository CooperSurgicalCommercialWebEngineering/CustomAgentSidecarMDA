# Agent Sidecar Administration — Session Handoff

## Original objective — keep this as the north star

Create an administrator experience that drives the behavior of the Agent Sidecar for Model-driven Apps.

A System Administrator must be able to:

1. Open the Agent Sidecar Administration Power Apps Code App.
2. Select a Model-driven App.
3. Select eligible tables and active main forms from that app.
4. Select an existing published Copilot Studio agent.
5. Configure pane behavior and delegated Microsoft identity settings.
6. Preview the exact impact.
7. Deploy the sidecar bindings.
8. Validate health, detect/reconcile drift, disable, re-enable, and uninstall safely.

The deliverable is a reusable administration control plane, not another HR-specific launcher. The existing HR sidecar is the compatibility/reference implementation and must remain safe.

## Start the next session with this request

> Continue from HANDOFF.md. Keep the original objective as the north star: finish and validate the administrator experience that controls Agent Sidecar behavior. First repair the current discovery-test type error, then prove that HR Management exposes its seven app tables and active main forms in the authenticated local Power Apps host. Stay read-only in the environment. Do not mutate HR forms and do not deploy the Code App.

## Current position against the objective

| Capability | Status | Notes |
|---|---|---|
| Administration portfolio | Implemented and connected | Authenticated host loads; zero configured apps is currently expected. |
| Administrator authorization | Validated | Current user is recognized as System Administrator. |
| Five-step setup wizard | Implemented | Includes selected-app state, forms-only targeting, validation, review, and exact redirect URI. |
| Model-driven App discovery | Validated (connected) | Apps load; HR Management shows its 7 eligible tables. Root cause of the earlier empty list was the `entity` Retrieve failure below, which rejected the `Promise.all` in `discoverTargetApps`. |
| Table/form discovery | Validated (connected) | Maps app entity components (`componenttype eq 1`) to table metadata via **RetrieveMultiple** on `entity`, then active main forms. HR Management = 7 tables, friendly names, 1 active main form each. |
| Copilot Studio agent resolution | Validated (connected) | **HR Mgmt Classic** (`cr0b1_HRMgmtClassic`, published) resolves read-only in the wizard. |
| Dataverse configuration storage | Provisioned | Organization-owned Sidecar Configuration and Target Binding tables exist with active alternate keys. |
| Dataverse-backed sidecar runtime | Implemented | Existing HR static configuration remains as compatibility fallback. |
| Preview/deploy engine | Preview validated read-only end-to-end | Wizard Review step reached; `previewDeployment` reports 7 tables / 7 active main forms with rollback protection. Deploy not performed. |
| Lifecycle controls | Implemented, not end-to-end validated | Validation, drift detection, reconcile, disable/re-enable, rollback, and scoped uninstall exist. |
| Solution packaging | Validated | Unmanaged export/unpack/repack and ZIP integrity passed. |
| Code App deployment | Deployed to live env | `pac code push -s HRAgentSidecar` succeeded on 2026-07-11. App ID `71d3fa20-9990-4622-9775-11b56f2ed893`. Committed + pushed to `origin/main` (`db90c37`). |
| Live form mutation | Not performed by this administrator | First mutation test must use a controlled non-HR form. |

## Immediate work — COMPLETED this session

The discovery defect is fixed and the read-only connected wizard journey is validated end-to-end (Application → Tables → Agent → Identity → Review). No deploy, no live form mutation.

### Root cause (found via the Dataverse-skills `dv-query` skill, read-only)

- HR Management app ID: `62e8fdf6-e77b-f111-ab0e-000d3a34048c`; app metadata id (`appmoduleidunique`): `9c9d3b51-b988-4d16-9a75-9c2046dc301a`.
- The app has seven `appmodulecomponent` records of component type `1` (entities), no type `60` form components.
- The adapter resolved each entity metadata id with **`EntitiesService.get(id)` (Retrieve)**, but the OOB `entity` table **does not support Retrieve-by-id**: `"The 'Retrieve' method does not support entities of type 'entity'."` That threw during resolution, surfaced as *"Resolve app table metadata failed: [object Object]"*, and — because `discoverTargetApps` runs `Promise.all(targetApp per app)` — rejected the whole list, so **no apps appeared** either.

### Fix (in `src/services/model-driven-app-discovery.ts` + test)

1. Replaced the data-source method `getEntity(metadataId)` with **`listEntities(metadataIds[])`** using **`EntitiesService.getAll`** (RetrieveMultiple) with an `entityid eq … or …` filter — RetrieveMultiple **is** supported on `entity`.
2. `discoverAppForms` chunks metadata ids (`ENTITY_CHUNK_SIZE = 20`) and resolves per chunk.
3. Friendly display name now comes from **`originallocalizedname`** (e.g. "Benefit Plan"), not `name` (which returns the logical name).
4. `componentstate eq 0` on `systemform` was confirmed queryable in-environment — **kept**.

Do not manually edit generated files (`src/generated/**`). The OOB `entity` data source (`EntitiesService`, `EntitiesModel`, `.power/schemas`) and its `power.config.json` `databaseReferences` entry are already registered; the PAC host must be **restarted** after any data-source change so it reloads `power.config.json`.

### Authoritative live result (read-only)

HR Management → 7 tables, each 1 active main form: Benefit Enrollment, Benefit Plan, Expense Line, Expense Report, Time Off Balance, Time Off Request, Time Off Type.

### Baseline

`npm run typecheck`, full `npm test` (26/26), `npm run lint` (0 warnings), and `npm run build` all pass. Only the pre-existing non-blocking main-chunk size warning remains.

## Next session

The immediate discovery objective is complete. The next step in the original objective is the final proof point: **one controlled non-HR lifecycle test** (deploy → validate → drift/reconcile → disable/re-enable → uninstall) against a controlled non-HR form, to demonstrate the administrator — not manual form editing — safely drives sidecar behavior. Requires explicit deploy approval first.

## Active local host

- Vite runs on port `3001` (`npx vite --port 3001`); PAC connection host runs on port `3000` (`pac code run --port 3000 --appUrl http://localhost:3001`).
- Play URL: `https://apps.powerapps.com/play/e/f9b87f8b-0abf-e629-affb-b13195d1ed14/app/local?_localAppUrl=http://localhost:3001&_localConnectionUrl=http://localhost:3000`.
- Browser gotcha: a full URL navigation to the play URL drops the MSAL session; reload the top frame instead. The browser-automation page handles were unreliable this session (they resolve to the hidden MSAL login iframe) — `screenshot_page` is trustworthy; automated clicks are not, so the user drove the wizard clicks.
- Read-only connected validation was done via the Dataverse-skills `dv-query` skill (Python SDK) — the supported path for Dataverse reads.

A new session may not inherit browser-page access or server processes. Verify before assuming they remain available.

## Environment and solution identity

| Item | Value |
|---|---|
| Environment URL | `https://carremacodeapps.crm.dynamics.com` |
| Environment ID | `f9b87f8b-0abf-e629-affb-b13195d1ed14` |
| Organization ID | `a5550e24-4411-f111-afbe-6045bd053d21` |
| Solution unique name | `HRAgentSidecar` |
| Solution display name | `HR Agent Sidecar` |
| Publisher unique name | `agentsidecar` |
| Publisher prefix | `maftagsc` |
| Publisher choice prefix | `70360` |
| PAC auth profile | `pp-custo99c-d-u-6ae3eeaf` |
| Delegated user | `macarrer@msftbapb2bcommercial.onmicrosoft.com` |

Reverify environment identity before any Dataverse write, publish, solution operation, or deployment.

## Safety and scope guardrails

- Do not deploy the Code App without separate explicit confirmation.
- Before deployment ask exactly: **“Ready to deploy to `https://carremacodeapps.crm.dynamics.com`? This will update the live app.”**
- Do not use an HR form for the first metadata mutation test.
- Do not edit `src/generated/`.
- Do not edit solution XML while fixing app discovery.
- Some solution XML files changed externally during the prior work; reread current contents before any later solution edit.
- Keep generated services behind adapters; components must not call them directly.
- Preserve delegated Microsoft identity and user-scoped authorization.
- Do not add secrets, direct database clients, a custom backend, or non-Power-Platform hosting.
- Avoid renewed MCP/token-broker investigation unless it directly blocks the administration journey.
- Do not broaden scope into further packaging or lifecycle hardening until discovery and the read-only wizard journey pass.

## Implemented administration architecture

- React 18, TypeScript, Vite, Fluent UI v9, TanStack Query.
- `HashRouter`, Power Apps host port 3000, production `base: './'`.
- Components render; hooks orchestrate; provider/services abstract data; generated services stay behind adapters.
- Mock and connected providers implement the same contract.
- `src/services/real-sidecar-admin-provider.ts` handles connected discovery and lifecycle operations.
- `src/services/sidecar-provider-factory.ts` selects mock data in tests or when `VITE_USE_MOCK=true`, otherwise loads the connected provider.
- Dataverse tables:
  - `maftagsc_sidecarconfiguration`
  - `maftagsc_targetbinding`
- Alternate keys:
  - `maftagsc_sidecarconfiguration_appid_key`
  - `maftagsc_targetbinding_form_key`
- Exact redirect URI:
  - `https://carremacodeapps.crm.dynamics.com/WebResources/maftagsc_/copilot/authRedirect.html`
- Runtime library/function:
  - `maftagsc_/copilot/hrAgentSidePane.js`
  - `AgentSidecar.initializeGuide`

## Previously passing validation baseline

Before the partial discovery change:

- Code App typecheck passed.
- Model-driven TypeScript passed.
- ESLint passed.
- UI tests passed: 24/24.
- Model-driven tests passed: 6/6.
- Production build passed with a non-blocking main-chunk size warning.
- Both administration alternate keys were active.
- Solution export/unpack/repack and ZIP integrity passed.
- Connected host rendered successfully.
- Administrator authorization and empty configuration listing passed.

The new discovery source and adapter have not yet restored this complete green baseline.

## Key files

- `AGENTS.md` — repository-wide constraints.
- `CONTEXT.md` — canonical business glossary.
- `HANDOFF.md` — this focused handoff.
- `src/components/SidecarWizard/SidecarWizard.tsx` — administrator setup journey.
- `src/services/real-sidecar-admin-provider.ts` — connected provider and lifecycle engine.
- `src/services/model-driven-app-discovery.ts` — new discovery adapter under active development.
- `src/services/model-driven-app-discovery.test.ts` — current regression tests and type failure.
- `src/generated/services/EntitiesService.ts` — generated metadata client; read-only.
- `src/services/dataverse-custom-api.ts` — generated operation wrappers.
- `src/services/sidecar-admin-contracts.ts` — provider contract.
- `src/types/sidecar-admin-models.ts` — administration domain models.
- `dataverse/planning-payload.json` — reusable platform plan.
- `dataverse/prototype-feedback.md` — prototype and implementation decisions; update after connected validation.
- `docs/adr/0005-use-code-app-for-sidecar-administration.md` — administrator technology decision.
- `docs/adr/0006-use-dedicated-sidecar-configuration-schema.md` — schema decision.

## Definition of done for the immediate continuation

The next session should consider its immediate task complete only when:

- The partial discovery implementation typechecks.
- Its regression tests pass.
- The complete validation baseline is green.
- The authenticated wizard shows HR Management with seven eligible tables and correct active main-form counts.
- Friendly labels are shown.
- HR Mgmt Classic resolves read-only.
- No Code App deployment or live form mutation has occurred.

After that, the project returns to the original objective’s final proof point: one controlled non-HR lifecycle test demonstrating that the administrator—not manual form editing—can safely drive Agent Sidecar behavior.
