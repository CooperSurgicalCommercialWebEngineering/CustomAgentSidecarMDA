# Changelog

Notable user-visible changes to Agent Sidecar Platform are recorded here.

## 1.0.0.5 - 2026-10-13

### Added

- A centralized **Agent Sidecar Administration** model-driven app with packaged type-80 app and
  type-62 site map components.
- Central Prompt Management that lists active Sidecar configurations and edits suggested prompts
  through the signed-in user's `Xrm.WebApi` session.
- A portable **Setup & Deployment** launcher that resolves the imported Code App's environment-
  specific `appopenuri` instead of embedding source-environment IDs.
- The required self-contained `authRedirect.html` MSAL redirect web resource and release gate.
- Live prompt-chip refresh through `BroadcastChannel` and local-storage notification.
- A 15-check solution-package validator covering the Admin app, site map, Code App, prompts,
  runtime, authentication redirect, and Setup launcher.
- A CooperSurgical-inspired visual theme for the Model-driven App sidecar, with blue and purple accents, refined conversation chrome, and branded loading, sign-in, and error states.
- Rounded asymmetric agent and user message bubbles with subtle tails, plus updated composer, suggested-action, avatar, and status styling.
- Model-driven build, type-check, and regression-test coverage in pull-request CI.
- A shared `sidecarStyleOptions` module (`model-driven/webresources/maftagsc_/copilot/sidecarStyleOptions.ts`) as the single source of truth for Web Chat styling, consumed by both the deployable bundle and the local design-preview harness.

### Notes

- The existing Code App is now named **Agent Sidecar Setup & Deployment**. It remains the deployment
  and lifecycle workspace behind the model-driven administration front door.
- The Code App prompt editor is read-only; prompt authoring belongs in the centralized model-driven
  app.
- Option 1 removes separate Dataverse connector consent for prompt editing. It does not implement
  silent SSO for the Sidecar conversation.
- The exact unmanaged `1.0.0.3 → 1.0.0.5` update was accepted in a non-production environment with
  configuration, target binding, agent sign-in, message exchange, Prompt Management, and Setup &
  Deployment verified after import.
- The theme uses portable system fonts rather than CooperSurgical's proprietary typeface.
- Maintainers can customize the shell in `model-driven/webresources/maftagsc_/copilot/agentSidePane.template.html` and Web Chat styling in `model-driven/webresources/maftagsc_/copilot/sidecarStyleOptions.ts`.
