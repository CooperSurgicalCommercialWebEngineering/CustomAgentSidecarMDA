# HR Agent Sidecar

HR Agent Sidecar provides a base human-resources data model and a contextual Copilot Studio experience embedded in a Dataverse Model-driven App side pane.

## Organization

**Employee**:
An internal worker represented by the Dataverse `systemuser` table and synchronized from Microsoft Entra ID.
_Avoid_: Worker record, custom employee, HR user

**Manager**:
An Employee who supervises another Employee through the Dataverse `systemuser.parentsystemuserid` relationship.
_Avoid_: Supervisor record, custom reporting line

**Position**:
An organizational role represented by the Dataverse `position` table; Positions may form a hierarchy.
_Avoid_: Job record, custom role

**Department**:
An organizational unit represented by the Dataverse `businessunit` table; Departments may form a hierarchy.
_Avoid_: Division record, custom department

## Time Off

**Time Off Type**:
An organization-defined category of leave with a default annual allowance.
_Avoid_: Leave category, absence type

**Time Off Balance**:
An Employee's allocated, pending, and used hours for one Time Off Type and calendar year.
_Avoid_: Leave bank, PTO bucket

**Time Off Request**:
An Employee's request to take a specified number of hours for a Time Off Type, approved by the Employee's Manager.
_Avoid_: Leave application, absence request

## Expenses

**Expense Report**:
An Employee's reimbursement submission containing one or more Expense Lines and approved by the Employee's Manager.
_Avoid_: Claim, reimbursement request

**Expense Line**:
A single dated expense within an Expense Report, with an amount, category, merchant, and one receipt file.
_Avoid_: Cost item, receipt record

## Benefits

**Benefit Plan**:
An organization-offered benefit with provider, category, coverage dates, and contribution amounts.
_Avoid_: Benefit package, program

**Benefit Enrollment**:
An Employee's selection of a Benefit Plan for a coverage period; it does not require approval.
_Avoid_: Benefit election, plan membership

## Agent Experience

**HR Copilot Side Pane**:
A Model-driven App side pane that hosts a Copilot Studio agent through an HTML web resource and receives both the current table logical name and record ID.
_Avoid_: Embedded bot, chatbot panel
