# Use dedicated tables for sidecar configuration and target bindings

**Status:** accepted

Agent Sidecar Core will own organization-wide **Sidecar Configuration** and **Target Binding** tables rather than extending the existing `cat_copilotconfiguration` table. The existing table belongs to an unrelated solution and models telemetry and Direct Line concerns; reusing it would create a cross-solution dependency without covering app-keyed lifecycle, form ownership, drift, or rollback safety. Lifecycle uses Dataverse `statecode` and `statuscode`, detailed health and drift are recalculated on demand, and Target Bindings retain deterministic handler IDs plus form fingerprints—not copied form XML—so `systemform` remains authoritative.

## Consequences

One alternate key prevents duplicate configurations for the same Model-driven App. Target Bindings cascade-delete with their parent after lifecycle cleanup succeeds. Agent Sidecar Core owns and can evolve this schema independently, while existing agent knowledge and Copilot Studio configuration remain outside installer scope.