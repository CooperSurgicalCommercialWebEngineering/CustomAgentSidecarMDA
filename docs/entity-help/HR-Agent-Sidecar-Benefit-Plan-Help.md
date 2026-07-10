---
title: "Benefit Plan Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_benefitplan"
entitySetName: "maftagsc_benefitplans"
businessEntity: "Benefit Plan"
domain: "Benefits"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Benefit Plan"
  - "Benefit Plans"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Benefits-Administration-Process.pdf"
retrievalKeywords:
  - "Benefit Plan"
  - "Benefit Plans"
  - "maftagsc_benefitplan"
  - "maftagsc_benefitplans"
  - "Benefits"
---

# Benefit Plan Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_benefitplan`. Combine it with HR-Agent-Sidecar-Benefits-Administration-Process.pdf for process guidance.

## Business purpose

Defines an organization-offered benefit, its provider, category, effective period, and standard Employee and Employer costs.

## Use this screen when

- Publishing an approved benefit offering
- Creating a new plan-year version
- Providing a Plan for Employee Enrollments
- Retiring an offering after its effective period

## Do not use this screen to

- Do not use a Plan as an Employee election
- Do not overwrite historical terms or costs for a new plan year
- Do not create a Plan before provider, dates, and costs are approved

## Who does what

| Business role | Responsibility |
|---|---|
| Benefits administrator | Creates and maintains approved Benefit Plans. |
| Benefits/process owner | Approves plan terms, dates, and contribution basis. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Benefit Plan Name | Clear business name including plan year when appropriate. | Required primary name. |
| Plan Code | Stable plan identifier. | Required; use an approved unique code. |
| Provider | Organization supplying the benefit. | Required. |
| Benefit Category | Medical, Dental, Vision, Life Insurance, Retirement, or Other. | Required. |
| Description | Plain-language summary of the offering. | State the contribution period when useful. |
| Employee Cost | Standard Employee contribution. | Use the approved contribution period. |
| Employer Cost | Standard Employer contribution. | Use the same contribution period. |
| Effective Start | First date the Plan is available. | Required. |
| Effective End | Last date the Plan is available. | Leave blank only for a genuinely open-ended Plan. |
| Status | Whether the Plan is available for use. | Activate only when enrollment-ready. |

## Related business records

| Related record | Relationship |
|---|---|
| Benefit Enrollments | Employee elections reference the applicable Plan version. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Benefit Plan Name | Contoso Choice Medical 2027 |
| Plan Code | MED-CHOICE-2027 |
| Provider | Contoso Health |
| Benefit Category | Medical |
| Description | PPO medical plan; costs shown per month |
| Employee Cost | $185.00 per month |
| Employer Cost | $525.00 per month |
| Effective Start | January 1, 2027 |
| Effective End | December 31, 2027 |
| Status | Active |

## Questions users commonly ask

### Why create a new Plan for a new year?

It preserves historical terms, costs, and effective dates used by existing Enrollments.

### Does changing a Plan update existing Enrollments?

Do not assume so. Enrollments preserve the Employee’s election and contribution for its coverage period.

### Can an inactive Plan be selected?

No. Use the active Plan whose effective period covers the Enrollment.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Benefit Plan. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
