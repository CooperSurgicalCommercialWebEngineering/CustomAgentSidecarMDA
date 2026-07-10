---
title: "Time Off Request Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_timeoffrequest"
entitySetName: "maftagsc_timeoffrequests"
businessEntity: "Time Off Request"
domain: "Time Off"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Time Off Request"
  - "Time Off Requests"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Time-Off-Process.pdf"
retrievalKeywords:
  - "Time Off Request"
  - "Time Off Requests"
  - "maftagsc_timeoffrequest"
  - "maftagsc_timeoffrequests"
  - "Time Off"
---

# Time Off Request Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_timeoffrequest`. Combine it with HR-Agent-Sidecar-Time-Off-Process.pdf for process guidance.

## Business purpose

Records an Employee’s request to take specified hours for a Time Off Type and preserves submission and Manager decision history.

## Use this screen when

- Requesting planned or policy-authorized leave
- Recording a Manager approval or rejection
- Withdrawing a Draft or Submitted request through the governed process

## Do not use this screen to

- Do not use a Request to store the annual balance
- Do not overwrite a decided Request for a new leave event
- Do not add unnecessary medical or personal detail to Reason or Decision Comment

## Who does what

| Business role | Responsibility |
|---|---|
| Employee/HR proxy | Creates and submits the request. |
| Manager/Approver | Reviews and decides the request. |
| HR administrator | Handles authorized exceptions and reconciliation. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Time Off Request Name | Readable request identifier. | Recommended: Employee — Type — date range. |
| Employee | Person requesting leave. | Required. |
| Time Off Type | Category of leave. | Required. |
| Start Date | First date of requested leave. | Required; must not be after End Date. |
| End Date | Last date of requested leave. | Required. |
| Requested Hours | Total work hours requested. | Required and greater than zero. |
| Reason | Optional concise business explanation. | Do not enter unnecessary sensitive details. |
| Approver | Employee who decides the request. | Normally the current Manager when approval is required. |
| Submitted On | Date/time the request entered review. | Set on submission. |
| Decided On | Date/time of approval or rejection. | Set with the decision. |
| Decision Comment | Explanation of decision or exception. | Required by policy for rejection; keep concise. |
| Status Reason | Draft, Submitted, Approved, Rejected, or Cancelled. | Use the documented lifecycle. |

## Related business records

| Related record | Relationship |
|---|---|
| Employee | Person taking leave. |
| Time Off Type | Leave category and approval rule. |
| Approver | Normally the Employee’s Manager. |
| Time Off Balance | Pending/used hours are reconciled against the matching annual balance. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Time Off Request Name | Avery Chen — Vacation — Aug 10–12 |
| Employee | Avery Chen |
| Time Off Type | Vacation |
| Start Date | August 10, 2026 |
| End Date | August 12, 2026 |
| Requested Hours | 24.00 |
| Reason | Planned personal leave |
| Approver | Morgan Lee |
| Submitted On | July 24, 2026 10:15 AM |
| Status Reason | Submitted |

## Questions users commonly ask

### What can happen after Submitted?

The request can be Approved, Rejected, or Cancelled according to policy.

### What happens to the balance?

Submission increases Pending Hours; approval moves hours to Used; rejection/cancellation releases Pending Hours.

### Can an approved request be edited?

Do not edit it silently. Use the governed cancellation/reversal process and preserve audit history.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Time Off Request. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
