# Use a separate Model-driven HR solution with a contextual Copilot side pane

**Status:** accepted

The HR capability will be packaged in a separate `HRAgentSidecar` solution owned by the existing `agentsidecar` publisher (`maftagsc`). Although this repository began as a Code App scaffold, HR Agent Sidecar will use a Dataverse Model-driven App plus HTML and JavaScript web resources that open a Copilot Studio agent through `Xrm.App.sidePanes`; every form command will pass both the current table logical name and record ID. This boundary keeps the HR schema, app, web resources, environment variables, and command customizations deployable together without coupling them to the existing `AgentSidecar` solution.

## Consequences

The repository will contain unpacked Model-driven App solution artifacts in addition to the existing Code App source. Employee, position, department, ownership, lifecycle, and audit capabilities reuse Dataverse platform assets before custom schema is introduced.
