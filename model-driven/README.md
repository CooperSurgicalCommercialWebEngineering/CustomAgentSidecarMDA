# HR Management App Guide side pane

This folder contains the source for the Model-driven App side-pane vertical slice.
The deployable Dataverse copies are created as web resources in the
`HRAgentSidecar` solution and then pulled back into `solution/` by solution export.

## Component contract

- HTML web resource: `maftagsc_/copilot/agentSidePane.html`
- JavaScript web resource: `maftagsc_/copilot/agentSidePane.js`
- Stable pane ID: `maftagsc_hr_management_app_guide`
- Authentication: Microsoft Entra delegated authorization code flow with PKCE
- Delegated scope: `https://api.powerplatform.com/CopilotStudio.Copilots.Invoke`
- Agent client: Microsoft 365 Agents SDK `CopilotStudioClient`
- Form OnLoad entry point: `AgentSidecar.initializeGuide` (with a `HRAgentSidecar.initializeGuide` alias for the existing HR reference forms) with execution context
- Supported main forms: Benefit Plan, Benefit Enrollment, Expense Line, Expense
   Report, Time Off Balance, Time Off Request, and Time Off Type
- Initial presentation: persistent and collapsed (`canClose: false`,
   `isSelected: false`, `alwaysRender: true`)

The side pane uses four non-secret identifiers: Application (client) ID,
Directory (tenant) ID, Power Platform environment ID, and Copilot Studio agent
schema name. The generic runtime resolves an enabled configuration by the
current Model-driven App ID and fails closed when no unique match exists. The
current HR values remain in `hrSidecarBootstrap.ts` as a compatibility bridge
until the runtime configuration repository is implemented. No client secret is
created or shipped, and MSAL tokens use memory storage only.

## Build

The maintained conversation source is `agentSidePane.ts`, the form launcher
source is `agentSidePaneLauncher.ts`, and `agentSidePane.template.html`
provides the accessible shell. Both TypeScript entries use the same app-keyed
configuration repository. Build and type-check them from the repository root:

```text
pnpm run typecheck:model-driven
pnpm run build:model-driven
```

The build bundles MSAL Browser and the Agents SDK directly into
`agentSidePane.html`, compiles the launcher into `agentSidePane.js`, then
synchronizes both deployable solution projections. Do not edit either generated
web resource directly.

The app-keyed compatibility runtime was deployed in place to the existing
`HRAgentSidecar` development solution on 2026-07-10 after explicit project-owner
approval. Any later import or publish still requires target-environment
confirmation and the repository's deployment safeguards.

## Redesigning the sidecar UI

The pane's entire visual design lives in two files:

| File | Controls |
|---|---|
| `webresources/maftagsc_/copilot/agentSidePane.template.html` | The shell: status card, spinner, Sign in / Try again buttons, toolbar, New conversation button, fonts, colors (the `<style>` block) |
| `webresources/maftagsc_/copilot/sidecarStyleOptions.ts` | The chat conversation: Bot Framework Web Chat style tokens (accent, bubbles, send box, avatars, and [any other Web Chat styleOption](https://github.com/microsoft/BotFramework-WebChat/blob/main/docs/API.md#style-options)) |

Both are the single source of truth for production **and** the local preview, so
what you see in the preview is exactly what ships.

### 1. Preview while you edit (no Dataverse needed)

```text
pnpm run dev:sidecar-preview
```

Open http://localhost:5178. The pane renders with a mock conversation; the
toolbar in the top-left switches between the Loading / Sign in / Error / Chat
states, and typing a message shows both bubble styles. The server rebuilds on
every request — edit either styling file, save, refresh the browser. Stop with
`Ctrl+C`. (Port 5178; 3000 is reserved for the Code App.)

The preview harness lives in `model-driven/preview/` and never ships in the
solution.

### 2. Verify

```text
pnpm run test:model-driven
```

Runs the build validations, preview harness tests, and solution repack test.

### 3. Package the importable solution

```text
pnpm run package:solution-core
```

This rebuilds the web resources and rewrites
`solution-core/AgentSidecarCore.zip` in place: the four sidecar web resources
are replaced with the fresh build and the solution version is bumped (e.g.
`1.0.0.1` → `1.0.0.2`). Send the zip to whoever administers the target
environment — they import it at make.powerapps.com → **Solutions → Import**,
choosing **Upgrade**. Existing sidecar configuration lives in Dataverse data,
not the solution, so it survives the upgrade.

**Scope limit:** the repack updates web resources only. Changes to schema, the
administration Code App, or plugins must go through the canonical pipeline in
`HANDOFF.md` (deploy to dev, `pac solution export`). Test-import the repacked
zip in a dev environment before distributing it broadly.

## Side-pane smoke test

1. Open a saved Benefit Plan in the **HR Management** Model-driven App.
2. Confirm the library icon is present in the collapsed side-pane switcher and
   that no **HR Management App Guide** command appears on the command bar.
3. Select the library icon and confirm the guide pane opens.
4. If prompted, select **Sign in** and complete Microsoft sign-in/consent.
5. Confirm the conversation starts as the signed-in user and that no access token
   is written to the console, URL, or storage.
6. Ask “What is this screen for?” and verify Benefit Plan help is used.
7. Ask “What process should I follow before making this plan active?” and verify
   Benefits Administration process guidance is included.
8. Navigate through each supported main form and confirm the same pane remains
   available, the conversation is preserved, and the current page context updates.