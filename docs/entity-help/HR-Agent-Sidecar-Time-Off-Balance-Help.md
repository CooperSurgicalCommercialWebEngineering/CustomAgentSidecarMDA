---
title: "Time Off Balance Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_timeoffbalance"
entitySetName: "maftagsc_timeoffbalances"
businessEntity: "Time Off Balance"
domain: "Time Off"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Time Off Balance"
  - "Time Off Balances"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Time-Off-Process.pdf"
retrievalKeywords:
  - "Time Off Balance"
  - "Time Off Balances"
  - "maftagsc_timeoffbalance"
  - "maftagsc_timeoffbalances"
  - "Time Off"
---

# Time Off Balance Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_timeoffbalance`. Combine it with HR-Agent-Sidecar-Time-Off-Process.pdf for process guidance.

## Business purpose

Tracks allocated, pending, and used hours for one Employee, one Time Off Type, and one calendar year.

## Use this screen when

- Establishing an annual leave allocation
- Onboarding an Employee mid-year
- Applying an authorized balance adjustment
- Reconciling request impacts

## Do not use this screen to

- Do not use a Balance as a request
- Do not combine multiple Employees, Types, or years
- Do not manually change hours without authorized evidence or the approved automation

## Who does what

| Business role | Responsibility |
|---|---|
| HR administrator | Creates, adjusts, and reconciles balances. |
| Approved automation | Moves hours as requests are submitted, decided, or cancelled. |
| Employee/Manager | Views authorized balance information. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Time Off Balance Name | Readable identifier. | Recommended: Employee — Type — Year. |
| Employee | Person whose balance is tracked. | Required lookup. |
| Time Off Type | Leave category. | Required lookup. |
| Calendar Year | Year to which the balance applies. | Required whole year value. |
| Allocated Hours | Total authorized allocation. | Required; includes approved prorating/adjustments. |
| Pending Hours | Hours on Submitted requests awaiting final outcome. | Required; normally automation-maintained. |
| Used Hours | Hours consumed by Approved requests. | Required; normally automation-maintained. |

## Related business records

| Related record | Relationship |
|---|---|
| Employee | Owner of the leave entitlement. |
| Time Off Type | Category of leave represented by the balance. |
| Time Off Requests | Submitted/approved requests change pending and used values. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Time Off Balance Name | Avery Chen — Vacation — 2026 |
| Employee | Avery Chen |
| Time Off Type | Vacation |
| Calendar Year | 2026 |
| Allocated Hours | 120.00 |
| Pending Hours | 24.00 |
| Used Hours | 16.00 |
| Available Hours | 80.00 (120 − 24 − 16) |

## Questions users commonly ask

### How is available time calculated?

Allocated Hours minus Pending Hours minus Used Hours.

### Why are hours pending?

A Submitted request reserves hours while awaiting a decision.

### Can two balances exist for the same Employee, Type, and year?

No in business terms. Search before create; duplicates are a data-quality incident.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Time Off Balance. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
