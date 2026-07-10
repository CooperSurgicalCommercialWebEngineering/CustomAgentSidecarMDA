---
title: "Expense Report Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_expensereport"
entitySetName: "maftagsc_expensereports"
businessEntity: "Expense Report"
domain: "Expenses"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Expense Report"
  - "Expense Reports"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf"
retrievalKeywords:
  - "Expense Report"
  - "Expense Reports"
  - "maftagsc_expensereport"
  - "maftagsc_expensereports"
  - "Expenses"
---

# Expense Report Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_expensereport`. Combine it with HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf for process guidance.

## Business purpose

Groups an Employee’s itemized reimbursement expenses into one submission with a business purpose, total, Manager decision, and payment lifecycle.

## Use this screen when

- Collecting related reimbursable transactions
- Submitting a complete package for Manager approval
- Recording approval, rejection, cancellation, or payment completion

## Do not use this screen to

- Do not enter every transaction directly on the report header
- Do not submit before all Expense Lines and receipts are reconciled
- Do not mark Paid before confirmed reimbursement

## Who does what

| Business role | Responsibility |
|---|---|
| Employee | Creates, itemizes, certifies, and submits the report. |
| Manager/Approver | Reviews policy, evidence, and business purpose. |
| Finance/HR processor | Completes payment and marks the report Paid. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Expense Report Name | Readable report identifier. | Recommended: Employee — purpose — period. |
| Employee | Person requesting reimbursement. | Required. |
| Report Date | Business date of the report. | Required date only. |
| Business Purpose | Why the expenses benefited the organization. | Required and specific. |
| Total Amount | Sum of all Expense Lines. | Reconcile before submission. |
| Approver | Employee who reviews the report. | Normally the claimant’s Manager; no self-approval. |
| Submitted On | Date/time entered for review. | Set on submission. |
| Decided On | Date/time approved or rejected. | Set with decision. |
| Decision Comment | Decision or exception explanation. | Use for rejection/material exceptions. |
| Status Reason | Draft, Submitted, Approved, Rejected, Paid, or Cancelled. | Follow the documented lifecycle. |

## Related business records

| Related record | Relationship |
|---|---|
| Employee | Claimant requesting reimbursement. |
| Approver | Normally the Employee’s Manager. |
| Expense Lines | Itemized merchant transactions and receipts. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Expense Report Name | Avery Chen — Customer Design Workshop — July 2026 |
| Employee | Avery Chen |
| Report Date | July 18, 2026 |
| Business Purpose | Travel and meals for customer design workshop in Seattle |
| Total Amount | $1,150.35 |
| Approver | Morgan Lee |
| Status Reason | Submitted |

## Questions users commonly ask

### What makes a report ready to submit?

Every line is complete, categories and receipts are valid, Business Purpose is specific, and Total Amount equals the sum of lines.

### Can I approve my own report?

No. Use the approved alternate approver when the normal Manager relationship is unsuitable.

### What is the difference between Approved and Paid?

Approved authorizes reimbursement; Paid confirms reimbursement was completed.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Expense Report. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
