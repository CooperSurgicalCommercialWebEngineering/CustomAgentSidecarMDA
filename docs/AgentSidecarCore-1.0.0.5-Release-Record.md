# AgentSidecarCore 1.0.0.5 Release Record

**Release date:** October 13, 2026

**Solution:** `AgentSidecarCore`

**Release type:** Unmanaged in-place update

**Status:** Package built, validated, re-imported, and accepted through an exact unmanaged
`1.0.0.3 → 1.0.0.5` update in separate non-production environments.

## Source control and ownership

The authoritative working repository is:

- Repository: `CooperSurgicalCommercialWebEngineering/CustomAgentSidecarMDA`
- URL: <https://github.com/CooperSurgicalCommercialWebEngineering/CustomAgentSidecarMDA>
- Visibility: Public
- Default branch: `main`
- Working branch: `chore/agentsidecarcore-release-safeguards`
- Branch base commit: `db5d40c34b742e3594aa31c30d21a0dc9e598043`

The local checkout is:

`C:\VSCodeProjects\sidecar-trouble\CustomAgentSidecarMDA`

This checkout has an `origin` remote pointing to the CooperSurgical repository. No new GitHub
repository is required.

The following repositories were reviewed as historical references only:

- <https://github.com/martycarreras-psnl/CustomAgentMDA>
- <https://github.com/martycarreras-psnl/CopilotStudioAgentMDA>

Neither Marty repository contains the completed prompts, centralized administration, authentication
redirect, or final release safeguards. They must not be used as the source for the 1.0.0.5 package.

At the time of this record, the 1.0.0.5 work is present in the local working tree but is not yet
committed beyond `db5d40c`. The branch must be reviewed and committed before it can be treated as a
reproducible GitHub release source.

## Delivered administration architecture

The release keeps two underlying Power Apps runtimes while providing administrators one starting
point.

### Agent Sidecar Administration

Type: model-driven app

This is the single administration front door. Its **Agent Sidecar** navigation group contains:

1. **Setup & Deployment**
   - Hosts `maftagsc_/copilot/adminLauncher.html`.
   - Queries the environment's `canvasapp` record by the stable schema name
     `maftagsc_agentsidecar_4b928`.
   - Uses the imported Code App's environment-specific `appopenuri`.
   - Opens the Code App in a new tab.
   - Does not embed source tenant, environment, or app IDs.
2. **Prompt Management**
   - Hosts `maftagsc_/copilot/promptEditor.html`.
   - Lists active Sidecar configurations when opened from the central Admin app.
   - Uses the signed-in administrator's model-driven app Dataverse session through `Xrm.WebApi`.
   - Does not request a separate Power Apps Dataverse connector connection.

The Admin app and its site map are both solution roots:

- Model-driven app component type: `80`
- Site map component type: `62`

### Agent Sidecar Setup & Deployment

Type: Power Apps Code App

This is the existing deployment and lifecycle workspace, renamed from **Agent Sidecar** so its
purpose is clear. It continues to provide:

- Target model-driven app selection.
- Copilot Studio agent selection.
- Table and form binding selection.
- Deployment and form-handler updates.
- Validation and health checks.
- Reconciliation.
- Enable, disable, and removal operations.

The Code App prompt editor remains read-only. Suggested-prompt authoring belongs in the centralized
model-driven Admin app.

### Sidecar end-user experience

Regular users continue working in their normal business model-driven apps. They do not need either
administration app. Their Sidecar pane continues to use:

- `maftagsc_/copilot/agentSidePane.js`
- `maftagsc_/copilot/agentSidePane.html`
- `maftagsc_/copilot/agentGuideLibrary.svg`
- `maftagsc_/copilot/authRedirect.html`

## Prompt Management behavior

Prompt storage remains:

`maftagsc_sidecarconfiguration.maftagsc_prompts`

Limits:

- Maximum six prompts per table.
- Label maximum 60 characters.
- Prompt text maximum 400 characters.
- Security-role name maximum 100 characters.

The editor:

- Uses `Xrm.Utility.getGlobalContext().getCurrentAppProperties()`.
- Uses `Xrm.WebApi` for reads and writes.
- Selects the unique active configuration for an app-specific host.
- Shows a configuration selector when hosted by the central Admin app.
- Deduplicates form bindings that target the same table.
- Uses `modifiedon` and the original prompt JSON for optimistic conflict detection.
- Signals open panes through `BroadcastChannel` and a local-storage event.
- Invalidates the selected target app's Sidecar session cache.

## Authentication

Prompt administration and Sidecar conversation authentication remain separate:

- Prompt Management executes as the signed-in Dataverse user.
- Sidecar agent invocation uses a single-tenant Entra SPA/public client.
- The delegated permission is `CopilotStudio.Copilots.Invoke`.
- No client secret is created or distributed.
- The redirect URI must use:
  `https://<environment-host>/WebResources/maftagsc_/copilot/authRedirect.html`.
- Silent SSO is not part of 1.0.0.5.

The authentication redirect web resource is a mandatory release component. The package validator
requires its MSAL redirect handler and local-storage bridge.

## Final package

| Item | Value |
|---|---|
| File | `AgentSidecarCore-unmanaged-1.0.0.5.zip` |
| Storage location | Session artifact folder |
| Size | `464990` bytes |
| SHA-256 | `404DB931C1A074B88FC77CCE86AEAA7F6900CAF4CFED3852035165A5714E143A` |
| Solution unique name | `AgentSidecarCore` |
| Solution version | `1.0.0.5` |
| Package type | Unmanaged |

Do not distribute either 1.0.0.4 package. The original omitted `authRedirect.html`; the corrected
1.0.0.4 package predates the centralized Admin app and portable Setup & Deployment launcher.

## Package contents and release gates

The 15 release checks require:

1. Readable solution ZIP.
2. `solution.xml`.
3. `customizations.xml`.
4. Correct `AgentSidecarCore` unique name.
5. Rejection of the `HRAgentSidecar` reference solution.
6. Administration Code App as type `300`.
7. Central model-driven Admin app as type `80`.
8. Admin app site map as type `62`, containing both administration pages.
9. Complete, non-empty Code App package including `index.html`.
10. `maftagsc_prompts` column.
11. Prompts-enabled Code App bundle.
12. Prompt-chip Sidecar runtime.
13. `Xrm.WebApi` Prompt Management web resource.
14. Compiled MSAL authentication redirect.
15. Portable Setup & Deployment launcher.

Final result: **15/15 passed**.

## Validation evidence

| Validation | Result |
|---|---|
| Code App type-check and production build | Passed |
| Model-driven TypeScript type-check | Passed |
| Model-driven build/tests | `21/21` passed |
| Package-validator tests | `15/15` passed |
| Final package validation | `15/15` passed |
| Customer-neutrality scan | Passed |
| Final non-production same-version re-import | Passed |
| Exact unmanaged `1.0.0.3 → 1.0.0.5` update | Passed |

The customer-neutrality scan found no source tenant ID, environment ID, pilot app ID, Sidecar
configuration ID, Entra client ID, agent name, or pilot-table logical name in the package.

## Non-production acceptance results

After final package import:

- The existing Sidecar configuration ID was preserved.
- All four existing Target Binding IDs were preserved.
- Existing prompt JSON was preserved.
- Agent Sidecar Administration retained **Setup & Deployment** and **Prompt Management**.
- The Code App display name remained **Agent Sidecar Setup & Deployment**.
- The Setup launcher resolved an `apps.powerapps.com` `appopenuri`.
- The temporary Prompt Management page remained absent from the pilot business app.
- The authentication redirect remained packaged and published.

On October 14, 2026, the exact unmanaged `1.0.0.3 → 1.0.0.5` customer-style update was validated
in a separate non-production environment:

- `1.0.0.3` was imported first and configured against an existing model-driven app and published
  Copilot Studio agent.
- The final `1.0.0.5` ZIP was imported over `1.0.0.3` without uninstalling the solution.
- The existing Sidecar configuration, target table/form binding, enabled state, agent selection,
  and stored Agents SDK connection string were preserved.
- The Sidecar completed delegated sign-in and returned an agent response after the update.
- **Agent Sidecar Administration**, **Prompt Management**, and **Setup & Deployment** were present
  and opened successfully.

## Customer update procedure

The customer performs an import-only update:

1. Export the current `AgentSidecarCore` as an unmanaged backup.
2. Import the supplied 1.0.0.5 ZIP as an update.
3. Do not uninstall the existing solution.
4. Use **Overwrite unmanaged customizations** when the release owner instructs it, particularly
   when an older manually uploaded Sidecar HTML layer exists.
5. Publish all customizations.
6. Confirm Agent Sidecar Administration contains both administration pages.
7. Verify Prompt Management, Setup & Deployment, Sidecar authentication, prompt chips, and record
   navigation.

The customer does not run npm, Python, `pac code push`, provisioning scripts, solution export, or
solution repacking.

## Build and release reproduction

From the repository root:

```powershell
npm run typecheck
npm run build
npm run typecheck:model-driven
npm run build:model-driven
npm run test:model-driven
npm run test:solution-package
```

Push the Code App and publish the compiled web resources in the release-owner development
environment. Confirm the Admin app and site map are solution roots. Then export:

```powershell
pac solution export `
  --environment <DEVELOPMENT_ENVIRONMENT_URL> `
  --name AgentSidecarCore `
  --path .\AgentSidecarCore-unmanaged-1.0.0.5.zip `
  --async `
  --max-async-wait-time 60
```

Validate the exact exported file:

```powershell
npm run validate:solution-package -- .\AgentSidecarCore-unmanaged-1.0.0.5.zip
```

Never rebuild or alter the ZIP between test approval and customer delivery.

## Rollback

- Retain the target environment's pre-import unmanaged export.
- Do not uninstall `AgentSidecarCore` to roll back.
- Preserve Sidecar Configuration and Target Binding data.
- If rollback is required, assess solution layers and import history before applying an older
  package.
- Remove only newly added navigation or web-resource layers when a targeted rollback is sufficient.

## Documentation set

- `docs/AgentSidecarCore-Customer-Update-Runbook.md`
  - Customer import-only instructions and post-import acceptance.
- `docs/AgentSidecar-Option1-Skunkworks-Pilot-Deployment.md`
  - Public-safe pilot implementation, incident, import evidence, and remaining-test summary.
- `docs/AgentSidecarCore-Recovery-Runbook.md`
  - Recovery and release-production safeguards.
- `docs/AgentSidecarStylingAndReleaseGuide.html`
  - Styling, packaging, and acceptance guidance.
- `docs/setup-guide/AgentSidecarSetupGuide.html`
  - Setup and troubleshooting guidance.
- `docs/Message-to-Chris.txt`
  - Customer-facing explanation of build versus import responsibilities.

## GitHub publication checklist

Before opening the pull request:

- Review all 1.0.0.5 source and generated files.
- Confirm the public-safe pilot summary is included while the full environment-specific record
  remains an internal artifact.
- Confirm no token, client secret, credential, or private customer data is present.
- Commit the source, generated web resources, tests, and general documentation.
- Open a pull request from `chore/agentsidecarcore-release-safeguards` to `main`.
- Attach or link the validated ZIP according to the repository's release policy.
- After pull-request approval and merge, tag the approved commit as `v1.0.0.5`.
