# HR Agent Sidecar User Guides

Generated user and business-process documentation for the HR Agent Sidecar Dataverse solution.

## Published PDFs

- [Solution and Entity Guide](HR-Agent-Sidecar-Solution-and-Entity-Guide.pdf)
- [Employee and Organization Data Process](HR-Agent-Sidecar-Employee-and-Organization-Process.pdf)
- [Time Off Business Process](HR-Agent-Sidecar-Time-Off-Process.pdf)
- [Expense Reimbursement Business Process](HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf)
- [Benefits Administration Business Process](HR-Agent-Sidecar-Benefits-Administration-Process.pdf)
- [Microsoft Entra App Registration Guide](HR-Management-App-Guide-Entra-App-Registration.pdf)

Editable Word source documents are stored beside each PDF. The documents are generated from [generate-guides.cjs](generate-guides.cjs).

## Screen-specific entity help

The companion [Entity Help Library](../entity-help/README.md) provides one contextual help document for every business entity surfaced by the solution. Its manifest maps the Model-driven App `entityName` parameter to the appropriate entity guide and process guide for agent grounding.

## Coverage

The guides describe:

- The purpose, ownership, relationships, and correct use of all OOB and custom entities.
- Employee onboarding, organizational changes, reporting hierarchy, and departures.
- Time Off Type setup, annual balance setup, request submission, manager decisions, cancellation, and reconciliation.
- Expense Report and Expense Line entry, receipts, submission, approval, rejection, payment, and exception handling.
- Benefit Plan administration, Employee Enrollments, waivers, coverage changes, and terminations.
- Rich fictional examples, validation rules, privacy guidance, lifecycle transitions, and completion controls.

## Implementation note

The Dataverse schema is implemented. The documents identify Model-driven App forms/navigation, Power Automate flows, security roles, and the Copilot side pane as planned until those components are deployed and tested.
