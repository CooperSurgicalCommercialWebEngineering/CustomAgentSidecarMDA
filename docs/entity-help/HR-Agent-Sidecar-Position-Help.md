---
title: "Position Help"
documentType: "entity-help"
entityLogicalName: "position"
entitySetName: "positions"
businessEntity: "Position"
domain: "Organization"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Position"
  - "Positions"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Employee-and-Organization-Process.pdf"
retrievalKeywords:
  - "Position"
  - "Positions"
  - "position"
  - "positions"
  - "Organization"
---

# Position Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=position`. Combine it with HR-Agent-Sidecar-Employee-and-Organization-Process.pdf for process guidance.

## Business purpose

Defines an organizational role that can be assigned to Employees and arranged in a Position hierarchy.

## Use this screen when

- Creating an approved organizational role
- Assigning a role to one or more Employees
- Representing parent and child organizational roles

## Do not use this screen to

- Do not use Position as an Employee record
- Do not create a Position merely to hold a temporary title variation
- Do not use Position as a security role

## Who does what

| Business role | Responsibility |
|---|---|
| HR/organization administrator | Creates and maintains approved Positions. |
| Manager | Requests or confirms approved role assignments. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Position Name | Business name of the organizational role. | Use the approved title, such as Senior Designer. |
| Description | Brief explanation of the role. | Describe the role, not the current Employee. |
| Parent Position | Position above this Position in the hierarchy. | Use when the approved organization design has a parent role. |
| Status | Whether the Position can be used. | Deactivate obsolete Positions instead of deleting history. |

## Related business records

| Related record | Relationship |
|---|---|
| Employee | Employees can be assigned to a Position. |
| Parent Position | Positions can form an organizational hierarchy. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Position Name | Senior Designer |
| Description | Leads customer-centered product design work. |
| Parent Position | Director of Product Design |
| Status | Active |

## Questions users commonly ask

### Can more than one Employee hold the same Position?

Yes, when the organizational model treats the Position as a reusable role. Follow HR policy if positions must be unique.

### Is Position the same as Department?

No. Position is a role; Department is an organizational unit.

### Should I delete an old Position?

Normally no. Deactivate it so historical Employee assignments remain understandable.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Position. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
