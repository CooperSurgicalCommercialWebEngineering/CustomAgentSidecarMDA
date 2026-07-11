# Prototype Feedback

This review began with the mock Agent Sidecar Administration Code App and now records the connected implementation outcome. Administration schema discovery, approval, provisioning, generated clients, and lifecycle integration are complete; Code App deployment remains separately gated.

## Reviewed Flows
- System Administrator access boundary and portfolio health summary.
- Five-step creation flow: target app, tables, existing agent, identity/pane, impact review and deployment.
- Automatic health validation on configuration open.
- Explicit Configuration Drift review and approved reconciliation.
- Disable and re-enable while retaining configuration.
- Blocking rollback-failure remediation state.
- Dependency-aware, explicitly confirmed scoped uninstall.
- Desktop and 390-pixel responsive layouts.

## What Worked Immediately
- Portfolio health made healthy, warning, and critical configurations distinguishable without opening each record.
- Defaulting all eligible tables to active main forms reduced wizard decisions while keeping the final impact explicit.
- Existing-agent resolution accepts the Microsoft 365 Agents SDK connection string and derives the case-sensitive agent schema name.
- Drift remained read-only until a clear administrator approval action.
- Provider contracts allowed the full lifecycle to run locally without schema or connector changes.
- Keyboard-visible controls, semantic headings, and narrow-layout reflow passed browser inspection without horizontal overflow.

## Points of Confusion or Friction
- Target-app cards needed an explicit selected state; the selected card now uses a brand outline/background, check icon, and `aria-pressed` state.
- The original automatic-inheritance explanation overflowed its compact information box; the revised copy states that newly discovered tables require approval before anything changes.
- A generic “web-channel link” was ambiguous and implied that one URL could provide every identifier. The wizard now requests the Microsoft 365 Agents SDK connection string from **Channels > Web app** and explicitly rejects public iframe embed HTML.
- The Agents SDK connection string identifies the case-sensitive agent schema name but does not reliably expose the full Power Platform Environment ID. The wizard now requests that GUID separately from **Settings > Advanced > Metadata**.
- The redirect URI is now the exact environment-specific URI and is covered by a regression test.
- Rollback remediation identifies the failed registration but needs a connected-mode deep link or operational runbook.
- The mock agent resolver assumes a parsed link is published; connected mode must verify publication, sharing, authentication, and environment.
- Fluent modal teardown conflicted with immediate HashRouter navigation during uninstall; the prototype uses an explicit non-modal confirmation surface to preserve page accessibility.

## Implemented Data Model Outcome
- `maftagsc_sidecarconfiguration` stores app, agent, pane, identity, Target Binding solution, health, validation, and current-operation state.
- `maftagsc_targetbinding` stores one selected form binding, deterministic handler ownership, enabled state, validation state, and original/applied fingerprints.
- A required one-to-many relationship cascades Target Bindings only after lifecycle cleanup succeeds.
- Existing `systemform`, platform audit columns, and `statecode`/`statuscode` remain authoritative; no copied form XML or dedicated history table was introduced.
- Portfolio counts remain calculated from current state.

## Decision Log
- [x] Update the planning payload after discovery and prototype approval
- [x] Complete Dataverse existing-schema discovery before provisioning
- [x] Provision the approved dedicated schema idempotently
- [x] Preserve a mock provider for local UX work and use generated services for connected mode

## Promotion Checklist
- [x] Primary workflow is implemented and automated tests pass
- [x] Empty, loading, error, drift, disabled, rollback-failure, and uninstall states are represented
- [x] Candidate record boundaries and canonical terms are documented
- [x] Portfolio reporting needs have been surfaced
- [x] Stakeholder has reviewed the running prototype
- [x] Dataverse existing-schema discovery is complete
- [x] Administration planning payload has been updated after review
- [x] Administration schema and alternate keys are provisioned
- [x] Connected provider and generated operations are implemented
- [ ] Connected read-only Power Apps host validation is complete
- [ ] Controlled non-HR mutation validation is complete
- [ ] Code App deployment is explicitly approved
