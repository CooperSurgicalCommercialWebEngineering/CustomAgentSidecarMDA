# Use a Code App for Agent Sidecar administration

**Status:** accepted

Agent Sidecar administration will be delivered as a React and Fluent UI v9 Power Apps Code App rather than the Model-driven administration app proposed in ADR-0004. The Code App provides a guided portfolio, creation, drift-review, health-validation, disable/re-enable, and dependency-aware uninstall experience while Power Platform and Dataverse security remain authoritative. Access is limited to System Administrators; the client must not treat UI visibility as authorization.

## Considered options

- A dedicated administration Model-driven App was rejected because the lifecycle workflow requires richer guided review, impact comparison, and remediation interactions than generated forms provide.
- A local installer was rejected because administration must remain in the governed Power Platform environment.
- A custom web host was rejected because the administration client is a Power Apps Code App and must use the Power Platform host, connectors, and deployment lifecycle.

## Consequences

The administration Code App uses `HashRouter`, Fluent UI v9, and a provider boundary that swaps mock data for generated Dataverse services without changing presentation components. The managed Agent Sidecar Core and per-app Target Binding packaging from ADR-0004 remain accepted. ADR-0004 is superseded only where it names an administration Model-driven App and packaged Agent Sidecar Administrator role; the accepted access boundary is the existing System Administrator role unless a later security review records a replacement decision.
