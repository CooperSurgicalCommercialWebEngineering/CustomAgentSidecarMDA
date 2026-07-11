# Productize the agent sidecar as a reusable core with target bindings

**Status:** accepted; administration-client and access-role sections superseded by ADR-0005

The Agent Sidecar will be productized as two solution layers: a reusable managed **Agent Sidecar Core** and a dedicated **Target Binding** solution for each Model-driven App. The core will provide the delegated Microsoft authentication, Microsoft 365 Agents SDK runtime, persistent side pane, minimal page-context envelope, configuration model, administrator security role, and a dedicated Agent Sidecar Administration Model-driven App. Each target binding will identify one Model-driven App, reference an existing Copilot Studio agent, define the supported entities and forms, and safely add only the sidecar-owned form library and OnLoad handler to selected existing forms. An environment may contain multiple independent sidecars keyed by Model-driven App ID.

The in-environment administrator experience will manage installation, updates, validation, disablement, and removal. It will create a dedicated unmanaged Target Binding solution that can be exported as managed for downstream environments. Structural mappings and form bindings will move through ALM, while each destination environment must complete post-import setup for its separate Entra public-client registration, Power Platform environment ID, and existing Copilot Studio agent. Knowledge authoring and publication remain outside the installer. The runtime sends only app identity, page type, entity logical name, record ID, and primary record name; it does not transmit arbitrary form fields.

## Considered options

- A local deployment wizard was rejected in favor of an administration experience installed in Dataverse.
- One global sidecar per environment was rejected because it prevents app-specific agents, configuration, and pane identities.
- Cloned target forms were rejected in favor of idempotently patching selected existing forms while preserving unrelated customization.
- Automatic Copilot Studio agent creation was rejected; onboarding validates an existing governed agent.
- Shared tenant-wide Entra registration was rejected in favor of a separate public-client registration for each sidecar configuration.
- Installer-managed knowledge generation or publication was rejected to keep knowledge governance independent.

## Consequences

The current HR implementation must be separated from its hard-coded environment, agent, entity, branding, app, and form bindings. Core upgrades can then be shipped without importing HR schema or overwriting target-specific configuration. Target bindings remain explicit Dataverse customizations and must be promoted through normal solution ALM. Safe uninstall requires deterministic ownership markers so the administrator experience removes only handlers, libraries, and configuration it created. Existing forms must be read, patched idempotently, published, and verified through Dataverse read-back.

The phased delivery plan is maintained in [the reusable sidecar implementation plan](../agent-sidecar-reusable-platform-plan.md).
