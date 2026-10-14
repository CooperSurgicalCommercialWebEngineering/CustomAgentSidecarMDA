# Agent Sidecar Option 1 — Non-Production Pilot Summary

**Deployment date:** October 13, 2026
**Status:** Centralized administration and the final 1.0.0.5 package were validated in an internal
non-production Power Platform environment.

> This repository is public. Tenant, environment, user, app, agent, form, configuration, binding,
> Entra registration, session, activity, and service-request identifiers are intentionally omitted.
> The full environment-specific deployment record is retained as an internal release artifact.

## Purpose

The pilot validated Option 1: keep suggested prompts in Dataverse while replacing the
connection-dependent prompt editor with a model-driven HTML web resource that uses `Xrm.WebApi`.
The release also centralized administration so customers do not need to add Prompt Management to
each Sidecar-enabled business app.

Option 1 does not change Copilot Studio authentication. Sidecar agent invocation still uses
delegated Entra authentication. Silent SSO is a separate future change.

## Tested architecture

### Agent Sidecar Administration

The packaged model-driven app acts as the single administration front door and contains:

- **Setup & Deployment**
  - Resolves the environment-specific Code App from the `canvasapp` table by stable schema name.
  - Opens the imported app's `appopenuri` in a new tab.
  - Contains no source-environment tenant, environment, or app IDs.
- **Prompt Management**
  - Lists active Sidecar configurations.
  - Loads each configuration's enabled Target Bindings.
  - Reads and writes `maftagsc_sidecarconfiguration.maftagsc_prompts`.
  - Uses the signed-in user's existing model-driven app Dataverse session.

The release packages both required components:

- Model-driven app: component type `80`.
- App site map: component type `62`.

### Agent Sidecar Setup & Deployment

The existing Code App remains the deployment and lifecycle workspace. It was renamed to distinguish
it from the central model-driven app. It continues to provide:

- App, table, form, and agent discovery.
- Sidecar deployment.
- Validation and reconciliation.
- Enable, disable, and removal operations.

Its prompt editor is read-only. Prompt authoring belongs in the centralized model-driven app.

## Prompt Management behavior

The editor:

- Uses `Xrm.Utility.getGlobalContext().getCurrentAppProperties()`.
- Uses `Xrm.WebApi.retrieveMultipleRecords`, `retrieveRecord`, and `updateRecord`.
- Uses app-specific mode when hosted by a configured target app.
- Uses central selection mode when hosted by Agent Sidecar Administration.
- Deduplicates bindings for the same table.
- Validates prompt counts and field lengths.
- Uses `modifiedon` and the original JSON for optimistic conflict detection.
- Clears the selected target app's Sidecar session cache after a save.
- Signals open panes through `BroadcastChannel` and a local-storage event.

Prompt limits:

- Maximum six prompts per table.
- Label maximum 60 characters.
- Prompt text maximum 400 characters.
- Role name maximum 100 characters.

## Dataverse security

Option 1 removes separate Dataverse connector consent. It does not bypass authorization.

- Regular Sidecar users require the existing runtime read privileges.
- Prompt administrators require read/write access to Sidecar Configuration and read access to
  Target Binding.
- Calls execute as the current signed-in user.
- No application secret or service identity is used for prompt editing.

## Authentication redirect incident and safeguard

The first pilot package omitted `maftagsc_/copilot/authRedirect.html`, causing the Sidecar sign-in
popup to return HTTP 404. The pilot environment was repaired by creating and publishing the compiled
MSAL redirect resource and adding it to `AgentSidecarCore`.

The release process was then hardened:

- `authRedirect.html` became a required type-61 root component.
- The validator checks for `handleRedirectPromise`.
- The validator checks for the `maftagsc.sidecar.authRequest` local-storage bridge.
- A missing-redirect regression test was added.

The superseded 1.0.0.4 package that omitted the redirect must never be distributed.

## Code App export safeguard

An intermediate 1.0.0.5 export omitted the Code App `index.html`. The complete production build was
pushed to the pilot environment and the solution was re-exported. The final package contains:

- `index.html`
- JavaScript assets
- CSS assets
- Dataverse service assets
- The read-only prompts transition UI

The package validator requires all Code App files to be present and non-empty.

## Final package verification

| Item | Result |
|---|---|
| Package version | `1.0.0.5` |
| Package type | Unmanaged |
| Package size | `464990` bytes |
| SHA-256 | `404DB931C1A074B88FC77CCE86AEAA7F6900CAF4CFED3852035165A5714E143A` |
| Model-driven tests | `21/21` passed |
| Validator tests | `15/15` passed |
| Package validator | `15/15` passed |
| Final same-version pilot re-import | Passed |
| Existing configuration IDs | Preserved |
| Existing binding IDs | Preserved |
| Existing prompt JSON | Preserved |
| Admin site map after import | Both administration pages present |
| Temporary business-app Prompt page | Absent after centralization |
| Customer-neutrality scan | Passed |

The customer-neutrality scan checked for the source tenant, environment, model-driven app, Code App,
Sidecar configuration, Entra registration, agent, and pilot-table identifiers. None were found in
the final ZIP.

## Upgrade-test boundary

No authenticated test environment had `AgentSidecarCore 1.0.0.3`. Therefore, the exact
`1.0.0.3 → 1.0.0.5` update was not fabricated or claimed.

The final package was re-imported with force-overwrite in the pilot environment to validate package
integrity, solution components, site-map persistence, and preservation of existing configuration,
binding, and prompt data. The exact version upgrade must be accepted in an environment that
actually contains 1.0.0.3.

## Remaining end-user acceptance

- Authorized prompt administrators can save.
- Unauthorized users receive a clear Dataverse privilege error.
- An already-open Sidecar pane refreshes prompt chips after a save.
- Sidecar authentication and agent invocation work for intended user roles.
- First-use Entra consent matches the target tenant policy.
- Record navigation and current-record context continue to work.
- Krysta's theme remains intact.

## Rollback

- Retain a pre-import unmanaged solution export.
- Do not uninstall `AgentSidecarCore`.
- Preserve Sidecar Configuration and Target Binding data.
- Use solution-layer and import-history analysis before applying an older package.
- Remove only the central navigation or web-resource layer when a targeted rollback is sufficient.
