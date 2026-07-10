---
title: "Employee Help"
documentType: "entity-help"
entityLogicalName: "systemuser"
entitySetName: "systemusers"
businessEntity: "Employee"
domain: "Organization"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Employee"
  - "Employees"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Employee-and-Organization-Process.pdf"
retrievalKeywords:
  - "Employee"
  - "Employees"
  - "systemuser"
  - "systemusers"
  - "Organization"
---

# Employee Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=systemuser`. Combine it with HR-Agent-Sidecar-Employee-and-Organization-Process.pdf for process guidance.

## Business purpose

Represents an internal worker and provides the authoritative identity and organizational assignment used by HR transactions.

## Use this screen when

- Onboarding an Employee after the authorized identity exists
- Assigning or changing Manager, Position, or Department
- Recording Hire Date and Employment Type
- Referencing a person from Time Off, Expense, or Benefit records

## Do not use this screen to

- Do not create a custom duplicate Employee record
- Do not type an Employee name into notes instead of selecting the Employee lookup
- Do not delete a departed Employee to remove history; use the governed disable process

## Who does what

| Business role | Responsibility |
|---|---|
| Identity administrator | Creates or synchronizes the identity and Dataverse User. |
| HR administrator | Maintains approved HR and organizational fields. |
| Manager | Confirms reporting relationships and raises corrections. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Employee ID | Stable workforce identifier. | Use the approved HR identifier; search before creating or correcting a record. |
| Full Name | Employee’s display name. | Directory-controlled; do not overwrite to represent another person. |
| Primary Email | Business email address. | Directory-controlled and useful for identity matching. |
| Mobile Phone | Business contact number. | Enter only when authorized and needed. |
| Manager | Employee who supervises this Employee. | Use the standard Manager lookup; no direct or indirect circular relationships. |
| Position | Organizational role held by the Employee. | Select an approved Position record. |
| Department | Organizational unit to which the Employee belongs. | Select the approved Department/Business Unit. |
| Hire Date | Date employment began. | Date only; enter from the authoritative HR event. |
| Employment Type | Full Time, Part Time, Contractor, or Intern. | Select the approved business classification. |
| Enabled | Whether the User can operate in the environment. | Disable through the governed identity/Dataverse process; do not delete. |

## Related business records

| Related record | Relationship |
|---|---|
| Manager | Another Employee selected through the standard reporting relationship. |
| Position | Defines the Employee’s organizational role. |
| Department | Defines the Employee’s organizational unit. |
| Personal HR records | Time Off Balances, Time Off Requests, Expense Reports, and Benefit Enrollments reference the Employee. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Employee | Avery Chen |
| Employee ID | E-10482 |
| Primary Email | avery.chen@example.com |
| Hire Date | July 20, 2026 |
| Employment Type | Full Time |
| Department | Product |
| Position | Senior Designer |
| Manager | Morgan Lee |
| Enabled | Yes |

## Questions users commonly ask

### Why is the Manager important?

Approval routing for Time Off Requests and Expense Reports derives from the Employee’s Manager relationship.

### Can I create an Employee manually?

Only through the approved identity and Dataverse administration process. Search for an existing User first.

### What happens when an Employee leaves?

Complete handoffs, then disable the User. Historical HR transactions remain linked to that Employee.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Employee. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
