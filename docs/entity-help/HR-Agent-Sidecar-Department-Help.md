---
title: "Department Help"
documentType: "entity-help"
entityLogicalName: "businessunit"
entitySetName: "businessunits"
businessEntity: "Department"
domain: "Organization"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Department"
  - "Departments"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Employee-and-Organization-Process.pdf"
retrievalKeywords:
  - "Department"
  - "Departments"
  - "businessunit"
  - "businessunits"
  - "Organization"
---

# Department Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=businessunit`. Combine it with HR-Agent-Sidecar-Employee-and-Organization-Process.pdf for process guidance.

## Business purpose

Represents an organizational unit used for Employee assignment, hierarchy, reporting, and Dataverse access boundaries.

## Use this screen when

- Creating an approved organizational unit
- Assigning Employees to their organizational unit
- Representing parent/child organizational structure
- Maintaining division or cost-center reference information

## Do not use this screen to

- Do not create a custom Department table
- Do not use a Department merely as a free-form reporting label
- Do not reorganize Departments without assessing Dataverse security impact

## Who does what

| Business role | Responsibility |
|---|---|
| HR/organization administrator | Defines approved organizational structure. |
| Power Platform administrator | Assesses security and ownership consequences of Business Unit changes. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Department Name | Approved name of the organizational unit. | Use the canonical organization name. |
| Division Name | Broader division label when used by the organization. | Keep consistent with reporting standards. |
| Cost Center | Finance identifier for the unit. | Use the approved finance value. |
| Parent Department | Department above this unit. | Use the standard parent Business Unit relationship. |
| Disabled | Whether the Department is inactive. | Do not disable until users, teams, ownership, and security impacts are handled. |

## Related business records

| Related record | Relationship |
|---|---|
| Employee | Employees are assigned to a Department. |
| Parent Department | Departments can form a hierarchy. |
| Security roles and teams | Business Units influence Dataverse access and record ownership. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Department Name | Product |
| Division Name | Digital Experiences |
| Cost Center | CC-4100 |
| Parent Department | Technology |
| Disabled | No |

## Questions users commonly ask

### Why can’t I freely move an Employee between Departments?

Department is implemented as Dataverse Business Unit, so reassignment can affect security and record access.

### Is a Department the same as a Position?

No. Department is the organizational unit; Position is the Employee’s role.

### Can I delete a Department?

Use the governed Business Unit process. Reassign users, teams, and ownership first; preserve historical meaning.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Department. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
