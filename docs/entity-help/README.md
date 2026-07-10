# HR Agent Sidecar Entity Help Library

This library provides one business-language help document for every entity surfaced by the HR Agent Sidecar experience. Each help topic is available as:

- **Markdown** — preferred for Copilot Studio knowledge ingestion and deterministic contextual retrieval.
- **PDF** — published user-facing help.
- **Word** — editable source document.

The routing index is [entity-help-manifest.json](entity-help-manifest.json). It maps the Model-driven App `entityName` context parameter to the correct entity document and its companion process document.

## Contextual grounding contract

The Model-driven App side pane passes:

- `entityName`: current Dataverse table logical name.
- `recordId`: current record identifier.

The agent should use `entityName` to select the matching entity-help document from the manifest. It should then retrieve from both:

1. The selected entity-help document for screen purpose, field meanings, relationships, examples, and screen-specific questions.
2. The linked process document for sequencing, roles, approvals, lifecycle transitions, exceptions, and cross-entity effects.

`recordId` identifies the current record but must not be treated as knowledge content. Any retrieval of live record values must respect Dataverse permissions and avoid exposing unnecessary personal or financial information.

## Entity routing index

| `entityName` | Business screen | Entity help PDF | Agent-ready Markdown | Companion process |
|---|---|---|---|---|
| `systemuser` | Employee | [PDF](HR-Agent-Sidecar-Employee-Help.pdf) | [Markdown](HR-Agent-Sidecar-Employee-Help.md) | [Employee and Organization](../user-guides/HR-Agent-Sidecar-Employee-and-Organization-Process.pdf) |
| `position` | Position | [PDF](HR-Agent-Sidecar-Position-Help.pdf) | [Markdown](HR-Agent-Sidecar-Position-Help.md) | [Employee and Organization](../user-guides/HR-Agent-Sidecar-Employee-and-Organization-Process.pdf) |
| `businessunit` | Department | [PDF](HR-Agent-Sidecar-Department-Help.pdf) | [Markdown](HR-Agent-Sidecar-Department-Help.md) | [Employee and Organization](../user-guides/HR-Agent-Sidecar-Employee-and-Organization-Process.pdf) |
| `maftagsc_timeofftype` | Time Off Type | [PDF](HR-Agent-Sidecar-Time-Off-Type-Help.pdf) | [Markdown](HR-Agent-Sidecar-Time-Off-Type-Help.md) | [Time Off](../user-guides/HR-Agent-Sidecar-Time-Off-Process.pdf) |
| `maftagsc_timeoffbalance` | Time Off Balance | [PDF](HR-Agent-Sidecar-Time-Off-Balance-Help.pdf) | [Markdown](HR-Agent-Sidecar-Time-Off-Balance-Help.md) | [Time Off](../user-guides/HR-Agent-Sidecar-Time-Off-Process.pdf) |
| `maftagsc_timeoffrequest` | Time Off Request | [PDF](HR-Agent-Sidecar-Time-Off-Request-Help.pdf) | [Markdown](HR-Agent-Sidecar-Time-Off-Request-Help.md) | [Time Off](../user-guides/HR-Agent-Sidecar-Time-Off-Process.pdf) |
| `maftagsc_expensereport` | Expense Report | [PDF](HR-Agent-Sidecar-Expense-Report-Help.pdf) | [Markdown](HR-Agent-Sidecar-Expense-Report-Help.md) | [Expense Reimbursement](../user-guides/HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf) |
| `maftagsc_expenseline` | Expense Line | [PDF](HR-Agent-Sidecar-Expense-Line-Help.pdf) | [Markdown](HR-Agent-Sidecar-Expense-Line-Help.md) | [Expense Reimbursement](../user-guides/HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf) |
| `maftagsc_benefitplan` | Benefit Plan | [PDF](HR-Agent-Sidecar-Benefit-Plan-Help.pdf) | [Markdown](HR-Agent-Sidecar-Benefit-Plan-Help.md) | [Benefits Administration](../user-guides/HR-Agent-Sidecar-Benefits-Administration-Process.pdf) |
| `maftagsc_benefitenrollment` | Benefit Enrollment | [PDF](HR-Agent-Sidecar-Benefit-Enrollment-Help.pdf) | [Markdown](HR-Agent-Sidecar-Benefit-Enrollment-Help.md) | [Benefits Administration](../user-guides/HR-Agent-Sidecar-Benefits-Administration-Process.pdf) |

## Recommended contextual prompt behavior

When a user opens a form, the orchestration layer should add the current logical table name to the agent context. The agent should:

1. Resolve the table through the manifest.
2. Prefer the corresponding entity-help topic for screen-specific questions.
3. Also search the linked process guide.
4. Answer using the business display name rather than the logical name unless technical identification is needed.
5. State when an answer depends on organization-specific policy or on planned automation that has not yet been deployed.
6. Never use the current screen context to bypass Dataverse security or disclose unrelated record data.

## Regeneration

The source generator is [generate-entity-help.cjs](generate-entity-help.cjs). It generates all ten Markdown and Word documents plus the manifest. Word files are converted to PDF with LibreOffice.
