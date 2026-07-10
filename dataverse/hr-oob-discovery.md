# HR Agent Sidecar — OOB-first discovery

Target environment: `https://carremacodeapps.crm.dynamics.com`

Discovery completed on 2026-07-09 through the Dataverse MCP `describe` and `search` tools. The live GA tool surface exposes `describe("tables/")` rather than the older `list_tables` tool name.

## Reuse decisions

| Business concept | Dataverse asset | Decision |
|---|---|---|
| Employee | `systemuser` | Reuse. Includes `employeeid`, names, email, phone, `parentsystemuserid`, `positionid`, and `businessunitid`. |
| Manager hierarchy | `systemuser.parentsystemuserid` | Reuse. |
| Position | `position` | Reuse. Includes `parentpositionid`. |
| Department | `businessunit` | Reuse. Includes `parentbusinessunitid`, `divisionname`, and `costcenter`. |
| Currency | `transactioncurrency` | Reuse through Dataverse Money columns. |
| Ownership and audit | `ownerid`, `createdby`, `createdon`, `modifiedby`, `modifiedon` | Reuse on custom user-owned tables. |
| Lifecycle | `statecode` and `statuscode` | Reuse and extend per custom table rather than creating parallel status columns. |

## Existing custom assets considered

- No existing `maftagsc_*` tables were returned by schema search.
- `msftcjm_expense` belongs to an unrelated judge-assignment solution and is not suitable for employee reimbursement.
- Other search matches for enrollment, travel expenses, and approvals belong to unrelated managed/custom solutions and are not reused.

## Approved custom boundary

Create domain-specific tables for Time Off Type, Time Off Balance, Time Off Request, Expense Report, Expense Line, Benefit Plan, and Benefit Enrollment. Add only a small HR augmentation to `systemuser` for Hire Date and Employment Type.
