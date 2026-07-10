---
title: "Time Off Type Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_timeofftype"
entitySetName: "maftagsc_timeofftypes"
businessEntity: "Time Off Type"
domain: "Time Off"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Time Off Type"
  - "Time Off Types"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Time-Off-Process.pdf"
retrievalKeywords:
  - "Time Off Type"
  - "Time Off Types"
  - "maftagsc_timeofftype"
  - "maftagsc_timeofftypes"
  - "Time Off"
---

# Time Off Type Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_timeofftype`. Combine it with HR-Agent-Sidecar-Time-Off-Process.pdf for process guidance.

## Business purpose

Defines an organization-approved category of leave, its standard annual allowance, and whether Manager approval is required.

## Use this screen when

- Introducing a governed leave category
- Providing a Time Off Type for balances and requests
- Changing future default annual hours or approval behavior

## Do not use this screen to

- Do not create one Type per Employee
- Do not use a Type to store an annual balance
- Do not rename an existing Type to represent an unrelated policy

## Who does what

| Business role | Responsibility |
|---|---|
| HR administrator | Creates and maintains approved Time Off Types. |
| Process owner | Approves policy, allowance, and approval behavior. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Time Off Type Name | Business name of the leave category. | Use a clear name such as Vacation. |
| Code | Stable short identifier. | Required; use an approved unique code such as VAC. |
| Default Annual Hours | Standard annual allocation. | A reference default; individual balances may be prorated. |
| Requires Approval | Whether requests normally require a Manager decision. | Required; defaults to Yes. |
| Status | Whether the Type is available for use. | Deactivate retired Types; do not repurpose them. |

## Related business records

| Related record | Relationship |
|---|---|
| Time Off Balance | Balances are maintained by Employee, Type, and Calendar Year. |
| Time Off Request | Each request selects one Type. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Time Off Type Name | Vacation |
| Code | VAC |
| Default Annual Hours | 120.00 |
| Requires Approval | Yes |
| Status | Active |

## Questions users commonly ask

### Does changing Default Annual Hours update existing balances?

Not automatically. It is a reference default; apply governed annual setup or adjustment rules.

### When should Requires Approval be No?

Only for categories explicitly authorized for automatic handling.

### Can I reuse a retired code?

Avoid reuse because historical records must keep a stable business meaning.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Time Off Type. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
