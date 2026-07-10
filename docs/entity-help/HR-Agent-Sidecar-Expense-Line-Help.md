---
title: "Expense Line Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_expenseline"
entitySetName: "maftagsc_expenselines"
businessEntity: "Expense Line"
domain: "Expenses"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Expense Line"
  - "Expense Lines"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf"
retrievalKeywords:
  - "Expense Line"
  - "Expense Lines"
  - "maftagsc_expenseline"
  - "maftagsc_expenselines"
  - "Expenses"
---

# Expense Line Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_expenseline`. Combine it with HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf for process guidance.

## Business purpose

Represents one dated merchant transaction within an Expense Report, including its category, amount, explanation, and receipt.

## Use this screen when

- Itemizing each transaction on an Expense Report
- Attaching a receipt to the matching expense
- Explaining a policy-relevant business detail or exception

## Do not use this screen to

- Do not combine unrelated merchant transactions
- Do not attach one receipt to the wrong line
- Do not upload payment-card numbers, credentials, or unrelated personal files

## Who does what

| Business role | Responsibility |
|---|---|
| Employee | Creates the line and provides evidence. |
| Manager/Approver | Reviews the line and receipt as part of the report. |
| Finance/HR processor | Validates reimbursement evidence when required. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Expense Line Name | Readable transaction identifier. | Recommended: date — merchant — category. |
| Expense Report | Parent reimbursement submission. | Required; every line belongs to exactly one report. |
| Expense Date | Date the transaction occurred. | Required. |
| Merchant | Supplier or payee. | Required; use the receipt name. |
| Expense Category | Travel, Lodging, Meals, Mileage, Supplies, Training, or Other. | Required; choose the best approved category. |
| Amount | Reimbursable amount. | Required money value. |
| Description | Optional business explanation. | List attendees or explain splits/exceptions when policy requires. |
| Receipt | One evidence file. | Attach a readable file when required by policy. |

## Related business records

| Related record | Relationship |
|---|---|
| Expense Report | Parent header that supplies Employee, purpose, Approver, total, and lifecycle. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Expense Line Name | Jul 16 — Northwind Bistro — Meals |
| Expense Report | Avery Chen — Customer Design Workshop — July 2026 |
| Expense Date | July 16, 2026 |
| Merchant | Northwind Bistro |
| Expense Category | Meals |
| Amount | $146.75 |
| Description | Customer dinner; attendees listed according to policy |
| Receipt | northwind-bistro-2026-07-16.pdf |

## Questions users commonly ask

### Why must each transaction be separate?

Itemization supports category validation, receipt matching, audit, and partial exception handling.

### Where does the receipt go?

On the matching Expense Line.

### What if the receipt amount differs?

Explain tax, tip, split, or conversion; unresolved differences must be corrected before approval.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Expense Line. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
