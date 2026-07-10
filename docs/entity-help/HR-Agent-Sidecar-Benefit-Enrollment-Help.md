---
title: "Benefit Enrollment Help"
documentType: "entity-help"
entityLogicalName: "maftagsc_benefitenrollment"
entitySetName: "maftagsc_benefitenrollments"
businessEntity: "Benefit Enrollment"
domain: "Benefits"
solution: "HR Agent Sidecar"
contextParameter: "entityName"
screenNames:
  - "Benefit Enrollment"
  - "Benefit Enrollments"
processDocuments:
  - "../user-guides/HR-Agent-Sidecar-Benefits-Administration-Process.pdf"
retrievalKeywords:
  - "Benefit Enrollment"
  - "Benefit Enrollments"
  - "maftagsc_benefitenrollment"
  - "maftagsc_benefitenrollments"
  - "Benefits"
---

# Benefit Enrollment Help

> **Screen context:** Use this document as the primary entity-specific source when `entityName=maftagsc_benefitenrollment`. Combine it with HR-Agent-Sidecar-Benefits-Administration-Process.pdf for process guidance.

## Business purpose

Records one Employee’s selection or waiver of a Benefit Plan for a defined coverage period and contribution amount.

## Use this screen when

- Recording an open-enrollment election
- Recording an authorized waiver
- Starting replacement coverage after a life event
- Ending an existing coverage period

## Do not use this screen to

- Do not edit the Benefit Plan to represent an Employee choice
- Do not overwrite an old Enrollment when coverage changes
- Do not store medical details or dependent personal data in free text

## Who does what

| Business role | Responsibility |
|---|---|
| Benefits administrator | Validates eligibility/evidence and records the Enrollment. |
| Employee | Makes the election through the approved enrollment channel. |

## Business field guide

| Field | Business meaning | How to use it |
|---|---|---|
| Benefit Enrollment Name | Readable election identifier. | Recommended: Employee — Plan — Coverage Level. |
| Employee | Person receiving or waiving coverage. | Required. |
| Benefit Plan | Approved offering selected or waived. | Required. |
| Coverage Level | Employee Only, Employee and Spouse, Employee and Children, or Family. | Required. |
| Elected On | Date the Employee made the election. | Required. |
| Coverage Start | First date of coverage. | Required and within Plan effective dates. |
| Coverage End | Last date of coverage. | Set when ending/replacing coverage. |
| Employee Contribution | Employee cost for this election. | Use the approved contribution period. |
| Status Reason | Active, Waived, or Ended. | The approved base process requires no Manager approval. |

## Related business records

| Related record | Relationship |
|---|---|
| Employee | Person making the election. |
| Benefit Plan | Offering and effective terms selected. |

## Worked example

All names, dates, amounts, and identifiers in examples are fictional and intended for training.

| Field | Example value |
|---|---|
| Benefit Enrollment Name | Avery Chen — Contoso Choice Medical 2027 — Family |
| Employee | Avery Chen |
| Benefit Plan | Contoso Choice Medical 2027 |
| Coverage Level | Family |
| Elected On | November 14, 2026 |
| Coverage Start | January 1, 2027 |
| Coverage End | Blank |
| Employee Contribution | $410.00 per month |
| Status Reason | Active |

## Questions users commonly ask

### Does an Enrollment require Manager approval?

No. The approved base process records the election without Manager approval.

### How do I change coverage level?

End the old Enrollment on the correct date and create a new Enrollment for replacement coverage.

### What does Waived mean?

The Employee intentionally declined the applicable offering and required evidence exists in the approved location.

## Data quality and privacy

- Confirm the record belongs on this screen and is not a duplicate.
- Use approved lookups and choices rather than alternative labels in notes.
- Enter only the minimum personal or financial information needed.
- Preserve lifecycle and history; do not silently overwrite completed events.
- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.

## Agent response boundary

Answer in business terms for a user viewing Benefit Enrollment. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.
