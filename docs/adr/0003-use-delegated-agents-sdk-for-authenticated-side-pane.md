# Use delegated authentication and Microsoft 365 Agents SDK for the side pane

**Status:** accepted; supersedes ADR-0002

The HR Management App Guide side pane will keep the existing Model-driven App command, HTML web resource, and `Xrm.App.sidePanes` experience, but it will connect through Microsoft Entra delegated authentication and `CopilotStudioClient` instead of secured Direct Line. The agent is configured with **Authenticate with Microsoft** and uses user-scoped SharePoint knowledge, so a Direct Line conversation token cannot establish the Microsoft user identity the agent requires. The browser public client uses authorization code with PKCE, requests only `https://api.powerplatform.com/CopilotStudio.Copilots.Invoke`, and creates the Copilot Studio connection with the environment ID and agent schema name; no client secret is created or shipped.

## Consequences

The Application ID, tenant ID, environment ID, and agent schema name are non-secret deployable configuration. Access tokens remain memory-only and are never logged. The existing Direct Line Custom API, plug-in, and Secure Configuration remain temporarily packaged for rollback but are no longer called by the side pane; they can be removed after authenticated runtime acceptance testing succeeds.