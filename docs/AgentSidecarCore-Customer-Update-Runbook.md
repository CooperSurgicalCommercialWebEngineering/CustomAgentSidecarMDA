# Agent Sidecar Core — Customer Update Runbook

**Audience:** Chris or another CooperSurgical Power Platform administrator updating an existing
Agent Sidecar installation.

**Purpose:** update the existing `AgentSidecarCore` solution using a completed, validated solution
ZIP supplied by the release owner.

The unmanaged `1.0.0.3 → 1.0.0.5` update procedure in this runbook was validated successfully in
a non-production environment on October 14, 2026. Existing configuration and form-binding data
were preserved, and post-update agent sign-in and message exchange succeeded.

## What you do — and do not need to do

You are performing a **solution update**, not producing a release.

You **do not** need to:

- Run `npm install`, `npm run build`, or `pnpm install`.
- Resolve the `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` npm error.
- Build the Code App or side-pane web resources.
- Run Python provisioning scripts.
- Push the Code App with `pac code push`.
- Export or repack a solution.
- Clone, merge, or modify source code.
- Delete or uninstall the existing solution.

Those are release-producer tasks. The supplied `AgentSidecarCore-unmanaged.zip` has already been
built and validated.

The npm certificate error is normally caused by a corporate proxy or TLS inspection certificate
that Node.js does not trust. It does not block this installation because npm is not part of the
customer update procedure.

## Prerequisites

- The supplied `AgentSidecarCore-unmanaged.zip`.
- System Administrator or equivalent solution-import permissions in the target Power Platform
  environment.
- Access to [Power Apps](https://make.powerapps.com).
- The supplied package version must be higher than the installed `AgentSidecarCore` version.

Power Platform CLI is optional. It is not required when importing through the Maker portal.

## Identity and consent boundaries

The Prompt Management page and the Sidecar conversation use different authentication paths:

- **Prompt Management** uses `Xrm.WebApi` and the signed-in model-driven app user's existing
  Dataverse session. It does not require a separate Power Apps Dataverse connector connection.
- **Copilot Studio invocation** uses a single-tenant Entra SPA/public-client registration with the
  delegated `CopilotStudio.Copilots.Invoke` permission. Do not create or distribute a client secret.
- The SPA redirect URI must exactly match:
  `https://<environment-host>/WebResources/maftagsc_/copilot/authRedirect.html`.
- Option 1 removes the connector-consent prompt; it does not bypass Dataverse privileges and does
  not implement silent SSO for the Sidecar conversation.
- For production, review tenant consent policy and grant administrator consent when required.
  Without tenant-wide consent, a user may receive an Entra consent prompt on first authentication
  if user consent is permitted.

## Important safety rules

1. **Do not delete or uninstall the current `AgentSidecarCore` solution.**
   Deleting an unmanaged solution can remove tables, configuration records, and components used by
   other apps.
2. **Do not modify or re-zip the supplied package.**
3. **Do not import the repository's `HRAgentSidecar` reference solution.**
4. Confirm that you selected the intended environment before importing.
5. **Do not separately upload an older themed `agentSidePane.html` after the solution import.**
   The supplied solution already contains Krysta's theme combined with the prompts-enabled runtime.
   Uploading an older theme-only HTML file can remove the prompt chips and navigation fixes.

The bundle includes `agentSidePane.html` only as a reference and recovery copy. It is
the same prompts-compatible compiled HTML included in the solution. Normally, do not upload it
separately.

## Update through the Maker portal

1. Open [Power Apps](https://make.powerapps.com).
2. Select the target environment in the environment picker.
3. Open **Solutions**.
4. Find `AgentSidecarCore` and record its installed version.
5. Confirm the version of the supplied package is higher than the installed version.
6. Optionally export the current `AgentSidecarCore` solution as an unmanaged backup.
7. Select **Import solution**.
8. Upload `AgentSidecarCore-unmanaged.zip`.
9. Confirm the import is recognized as an **update** to `AgentSidecarCore`.
10. Select **Overwrite unmanaged customizations** if prompted.
11. Start the import and wait for it to complete.
12. If Power Apps does not publish automatically, select **Publish all customizations**.

If the import reports that the package version is not higher than the installed solution version,
stop and request a new package with a higher version. Do not delete the current solution and do not
edit the ZIP.

## Optional PAC CLI import

Use this route only if you prefer PAC CLI:

```powershell
pac auth create --environment <TARGET_ENVIRONMENT_URL>
pac org who
pac solution import --path .\AgentSidecarCore-unmanaged.zip --publish-changes --force-overwrite
```

Before running the import, verify that `pac org who` shows the intended environment name and URL.

## Post-import verification

1. In **Solutions**, confirm `AgentSidecarCore` now shows the supplied version.
2. Confirm the authentication redirect web resource exists and is published:
   `maftagsc_/copilot/authRedirect.html`. Opening its direct URL without an active authentication
   request should show a controlled sign-in completion error, not HTTP 404.
3. Confirm the packaged **Agent Sidecar Administration** model-driven app is available.
   Confirm it contains both **Prompt Management** and **Setup & Deployment**. Do not add Prompt
   Management separately to each target app.
4. Confirm Sidecar administrators have **Read** and **Write** privileges on Sidecar Configuration
   and **Read** privilege on Target Binding. Regular Sidecar users need only the existing read
   privileges required by the runtime.
5. In **Agent Sidecar Administration**, choose the target app configuration. Confirm the expected
   bound tables appear. The page uses the signed-in user's existing Dataverse session and does not
   request a separate connector connection.
6. Open **Setup & Deployment** and confirm **Open Setup & Deployment** launches the environment's
   installed Code App in a new tab. The launcher resolves the imported app's `appopenuri`; it does
   not contain a source-environment app ID.
7. Save prompts for a configured table or form.
8. Confirm an already-open Sidecar pane refreshes its prompt chips without reloading the page.
9. Open a configured model-driven app record and confirm Krysta's themed side pane loads.
10. Select **Sign In** and confirm the authentication popup completes and closes. A blank popup that
   later returns HTTP 404 indicates the release omitted `authRedirect.html`.
11. Confirm suggested-prompt chips appear.
12. Select a prompt chip and confirm it sends the expected message.
13. Navigate to a different configured form and confirm its prompt chips update.

The existing Agent Sidecar Code App shows prompts read-only during the transition. Prompt edits
belong in the centralized **Agent Sidecar Administration** app.

Record the environment URL and ID, tenant ID, app row and immutable IDs, agent schema, Entra
application/client ID, redirect URI, selected tables/forms, Sidecar Configuration ID, Target
Binding solution name, package version, backup artifact, consent state, validation results, and any
remaining App Designer or acceptance-test work in a deployment record. IDs are configuration, not
secrets; never record tokens, client secrets, or credentials.

## What to send back if the update fails

Send the release owner:

- Target environment name and URL.
- Installed `AgentSidecarCore` version.
- Supplied package version.
- Import timestamp.
- Full import error text or the downloaded solution import log.
- Whether the failure occurred before, during, or after the import.

Do not troubleshoot npm unless you are separately setting up a development workstation for future
release builds.
