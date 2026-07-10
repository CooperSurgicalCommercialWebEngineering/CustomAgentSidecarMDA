const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, LevelFormat,
  PageBreak, PageNumber, Packer, Paragraph, ShadingType, Table, TableCell,
  TableRow, TextRun, WidthType,
} = require('docx');

const OUT = __dirname;
const BLUE = '17365D';
const TEAL = '0F6CBD';
const PALE_BLUE = 'EAF2F8';
const PALE_TEAL = 'E6F4F1';
const PALE_GOLD = 'FFF4CE';
const PALE_RED = 'FDE7E9';
const GRAY = '5B6573';
const LIGHT_GRAY = 'F3F4F6';
const WHITE = 'FFFFFF';
const CONTENT = 9360;
const border = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const borders = { top: border, bottom: border, left: border, right: border };
const generatedDate = 'July 9, 2026';
const fictionalNotice = 'All names, dates, amounts, and identifiers in examples are fictional and intended for training.';

const entities = [
  {
    slug: 'employee', name: 'Employee', plural: 'Employees', logicalName: 'systemuser', entitySetName: 'systemusers',
    domain: 'Organization', ownership: 'Dataverse platform User record; access is governed by platform security',
    purpose: 'Represents an internal worker and provides the authoritative identity and organizational assignment used by HR transactions.',
    useWhen: ['Onboarding an Employee after the authorized identity exists', 'Assigning or changing Manager, Position, or Department', 'Recording Hire Date and Employment Type', 'Referencing a person from Time Off, Expense, or Benefit records'],
    doNotUse: ['Do not create a custom duplicate Employee record', 'Do not type an Employee name into notes instead of selecting the Employee lookup', 'Do not delete a departed Employee to remove history; use the governed disable process'],
    roles: [['Identity administrator', 'Creates or synchronizes the identity and Dataverse User.'], ['HR administrator', 'Maintains approved HR and organizational fields.'], ['Manager', 'Confirms reporting relationships and raises corrections.']],
    fields: [
      ['Employee ID', 'Stable workforce identifier.', 'Use the approved HR identifier; search before creating or correcting a record.'],
      ['Full Name', 'Employee’s display name.', 'Directory-controlled; do not overwrite to represent another person.'],
      ['Primary Email', 'Business email address.', 'Directory-controlled and useful for identity matching.'],
      ['Mobile Phone', 'Business contact number.', 'Enter only when authorized and needed.'],
      ['Manager', 'Employee who supervises this Employee.', 'Use the standard Manager lookup; no direct or indirect circular relationships.'],
      ['Position', 'Organizational role held by the Employee.', 'Select an approved Position record.'],
      ['Department', 'Organizational unit to which the Employee belongs.', 'Select the approved Department/Business Unit.'],
      ['Hire Date', 'Date employment began.', 'Date only; enter from the authoritative HR event.'],
      ['Employment Type', 'Full Time, Part Time, Contractor, or Intern.', 'Select the approved business classification.'],
      ['Enabled', 'Whether the User can operate in the environment.', 'Disable through the governed identity/Dataverse process; do not delete.'],
    ],
    related: [['Manager', 'Another Employee selected through the standard reporting relationship.'], ['Position', 'Defines the Employee’s organizational role.'], ['Department', 'Defines the Employee’s organizational unit.'], ['Personal HR records', 'Time Off Balances, Time Off Requests, Expense Reports, and Benefit Enrollments reference the Employee.']],
    example: [['Employee', 'Avery Chen'], ['Employee ID', 'E-10482'], ['Primary Email', 'avery.chen@example.com'], ['Hire Date', 'July 20, 2026'], ['Employment Type', 'Full Time'], ['Department', 'Product'], ['Position', 'Senior Designer'], ['Manager', 'Morgan Lee'], ['Enabled', 'Yes']],
    questions: [['Why is the Manager important?', 'Approval routing for Time Off Requests and Expense Reports derives from the Employee’s Manager relationship.'], ['Can I create an Employee manually?', 'Only through the approved identity and Dataverse administration process. Search for an existing User first.'], ['What happens when an Employee leaves?', 'Complete handoffs, then disable the User. Historical HR transactions remain linked to that Employee.']],
    processDocs: ['HR-Agent-Sidecar-Employee-and-Organization-Process.pdf'],
  },
  {
    slug: 'position', name: 'Position', plural: 'Positions', logicalName: 'position', entitySetName: 'positions', domain: 'Organization', ownership: 'Dataverse platform organization reference data',
    purpose: 'Defines an organizational role that can be assigned to Employees and arranged in a Position hierarchy.',
    useWhen: ['Creating an approved organizational role', 'Assigning a role to one or more Employees', 'Representing parent and child organizational roles'],
    doNotUse: ['Do not use Position as an Employee record', 'Do not create a Position merely to hold a temporary title variation', 'Do not use Position as a security role'],
    roles: [['HR/organization administrator', 'Creates and maintains approved Positions.'], ['Manager', 'Requests or confirms approved role assignments.']],
    fields: [['Position Name', 'Business name of the organizational role.', 'Use the approved title, such as Senior Designer.'], ['Description', 'Brief explanation of the role.', 'Describe the role, not the current Employee.'], ['Parent Position', 'Position above this Position in the hierarchy.', 'Use when the approved organization design has a parent role.'], ['Status', 'Whether the Position can be used.', 'Deactivate obsolete Positions instead of deleting history.']],
    related: [['Employee', 'Employees can be assigned to a Position.'], ['Parent Position', 'Positions can form an organizational hierarchy.']],
    example: [['Position Name', 'Senior Designer'], ['Description', 'Leads customer-centered product design work.'], ['Parent Position', 'Director of Product Design'], ['Status', 'Active']],
    questions: [['Can more than one Employee hold the same Position?', 'Yes, when the organizational model treats the Position as a reusable role. Follow HR policy if positions must be unique.'], ['Is Position the same as Department?', 'No. Position is a role; Department is an organizational unit.'], ['Should I delete an old Position?', 'Normally no. Deactivate it so historical Employee assignments remain understandable.']],
    processDocs: ['HR-Agent-Sidecar-Employee-and-Organization-Process.pdf'],
  },
  {
    slug: 'department', name: 'Department', plural: 'Departments', logicalName: 'businessunit', entitySetName: 'businessunits', domain: 'Organization', ownership: 'Dataverse platform Business Unit; also participates in security boundaries',
    purpose: 'Represents an organizational unit used for Employee assignment, hierarchy, reporting, and Dataverse access boundaries.',
    useWhen: ['Creating an approved organizational unit', 'Assigning Employees to their organizational unit', 'Representing parent/child organizational structure', 'Maintaining division or cost-center reference information'],
    doNotUse: ['Do not create a custom Department table', 'Do not use a Department merely as a free-form reporting label', 'Do not reorganize Departments without assessing Dataverse security impact'],
    roles: [['HR/organization administrator', 'Defines approved organizational structure.'], ['Power Platform administrator', 'Assesses security and ownership consequences of Business Unit changes.']],
    fields: [['Department Name', 'Approved name of the organizational unit.', 'Use the canonical organization name.'], ['Division Name', 'Broader division label when used by the organization.', 'Keep consistent with reporting standards.'], ['Cost Center', 'Finance identifier for the unit.', 'Use the approved finance value.'], ['Parent Department', 'Department above this unit.', 'Use the standard parent Business Unit relationship.'], ['Disabled', 'Whether the Department is inactive.', 'Do not disable until users, teams, ownership, and security impacts are handled.']],
    related: [['Employee', 'Employees are assigned to a Department.'], ['Parent Department', 'Departments can form a hierarchy.'], ['Security roles and teams', 'Business Units influence Dataverse access and record ownership.']],
    example: [['Department Name', 'Product'], ['Division Name', 'Digital Experiences'], ['Cost Center', 'CC-4100'], ['Parent Department', 'Technology'], ['Disabled', 'No']],
    questions: [['Why can’t I freely move an Employee between Departments?', 'Department is implemented as Dataverse Business Unit, so reassignment can affect security and record access.'], ['Is a Department the same as a Position?', 'No. Department is the organizational unit; Position is the Employee’s role.'], ['Can I delete a Department?', 'Use the governed Business Unit process. Reassign users, teams, and ownership first; preserve historical meaning.']],
    processDocs: ['HR-Agent-Sidecar-Employee-and-Organization-Process.pdf'],
  },
  {
    slug: 'time-off-type', name: 'Time Off Type', plural: 'Time Off Types', logicalName: 'maftagsc_timeofftype', entitySetName: 'maftagsc_timeofftypes', domain: 'Time Off', ownership: 'Organization-owned reference data',
    purpose: 'Defines an organization-approved category of leave, its standard annual allowance, and whether Manager approval is required.',
    useWhen: ['Introducing a governed leave category', 'Providing a Time Off Type for balances and requests', 'Changing future default annual hours or approval behavior'],
    doNotUse: ['Do not create one Type per Employee', 'Do not use a Type to store an annual balance', 'Do not rename an existing Type to represent an unrelated policy'],
    roles: [['HR administrator', 'Creates and maintains approved Time Off Types.'], ['Process owner', 'Approves policy, allowance, and approval behavior.']],
    fields: [['Time Off Type Name', 'Business name of the leave category.', 'Use a clear name such as Vacation.'], ['Code', 'Stable short identifier.', 'Required; use an approved unique code such as VAC.'], ['Default Annual Hours', 'Standard annual allocation.', 'A reference default; individual balances may be prorated.'], ['Requires Approval', 'Whether requests normally require a Manager decision.', 'Required; defaults to Yes.'], ['Status', 'Whether the Type is available for use.', 'Deactivate retired Types; do not repurpose them.']],
    related: [['Time Off Balance', 'Balances are maintained by Employee, Type, and Calendar Year.'], ['Time Off Request', 'Each request selects one Type.']],
    example: [['Time Off Type Name', 'Vacation'], ['Code', 'VAC'], ['Default Annual Hours', '120.00'], ['Requires Approval', 'Yes'], ['Status', 'Active']],
    questions: [['Does changing Default Annual Hours update existing balances?', 'Not automatically. It is a reference default; apply governed annual setup or adjustment rules.'], ['When should Requires Approval be No?', 'Only for categories explicitly authorized for automatic handling.'], ['Can I reuse a retired code?', 'Avoid reuse because historical records must keep a stable business meaning.']],
    processDocs: ['HR-Agent-Sidecar-Time-Off-Process.pdf'],
  },
  {
    slug: 'time-off-balance', name: 'Time Off Balance', plural: 'Time Off Balances', logicalName: 'maftagsc_timeoffbalance', entitySetName: 'maftagsc_timeoffbalances', domain: 'Time Off', ownership: 'User-owned personal HR record',
    purpose: 'Tracks allocated, pending, and used hours for one Employee, one Time Off Type, and one calendar year.',
    useWhen: ['Establishing an annual leave allocation', 'Onboarding an Employee mid-year', 'Applying an authorized balance adjustment', 'Reconciling request impacts'],
    doNotUse: ['Do not use a Balance as a request', 'Do not combine multiple Employees, Types, or years', 'Do not manually change hours without authorized evidence or the approved automation'],
    roles: [['HR administrator', 'Creates, adjusts, and reconciles balances.'], ['Approved automation', 'Moves hours as requests are submitted, decided, or cancelled.'], ['Employee/Manager', 'Views authorized balance information.']],
    fields: [['Time Off Balance Name', 'Readable identifier.', 'Recommended: Employee — Type — Year.'], ['Employee', 'Person whose balance is tracked.', 'Required lookup.'], ['Time Off Type', 'Leave category.', 'Required lookup.'], ['Calendar Year', 'Year to which the balance applies.', 'Required whole year value.'], ['Allocated Hours', 'Total authorized allocation.', 'Required; includes approved prorating/adjustments.'], ['Pending Hours', 'Hours on Submitted requests awaiting final outcome.', 'Required; normally automation-maintained.'], ['Used Hours', 'Hours consumed by Approved requests.', 'Required; normally automation-maintained.']],
    related: [['Employee', 'Owner of the leave entitlement.'], ['Time Off Type', 'Category of leave represented by the balance.'], ['Time Off Requests', 'Submitted/approved requests change pending and used values.']],
    example: [['Time Off Balance Name', 'Avery Chen — Vacation — 2026'], ['Employee', 'Avery Chen'], ['Time Off Type', 'Vacation'], ['Calendar Year', '2026'], ['Allocated Hours', '120.00'], ['Pending Hours', '24.00'], ['Used Hours', '16.00'], ['Available Hours', '80.00 (120 − 24 − 16)']],
    questions: [['How is available time calculated?', 'Allocated Hours minus Pending Hours minus Used Hours.'], ['Why are hours pending?', 'A Submitted request reserves hours while awaiting a decision.'], ['Can two balances exist for the same Employee, Type, and year?', 'No in business terms. Search before create; duplicates are a data-quality incident.']],
    processDocs: ['HR-Agent-Sidecar-Time-Off-Process.pdf'],
  },
  {
    slug: 'time-off-request', name: 'Time Off Request', plural: 'Time Off Requests', logicalName: 'maftagsc_timeoffrequest', entitySetName: 'maftagsc_timeoffrequests', domain: 'Time Off', ownership: 'User-owned personal HR transaction',
    purpose: 'Records an Employee’s request to take specified hours for a Time Off Type and preserves submission and Manager decision history.',
    useWhen: ['Requesting planned or policy-authorized leave', 'Recording a Manager approval or rejection', 'Withdrawing a Draft or Submitted request through the governed process'],
    doNotUse: ['Do not use a Request to store the annual balance', 'Do not overwrite a decided Request for a new leave event', 'Do not add unnecessary medical or personal detail to Reason or Decision Comment'],
    roles: [['Employee/HR proxy', 'Creates and submits the request.'], ['Manager/Approver', 'Reviews and decides the request.'], ['HR administrator', 'Handles authorized exceptions and reconciliation.']],
    fields: [['Time Off Request Name', 'Readable request identifier.', 'Recommended: Employee — Type — date range.'], ['Employee', 'Person requesting leave.', 'Required.'], ['Time Off Type', 'Category of leave.', 'Required.'], ['Start Date', 'First date of requested leave.', 'Required; must not be after End Date.'], ['End Date', 'Last date of requested leave.', 'Required.'], ['Requested Hours', 'Total work hours requested.', 'Required and greater than zero.'], ['Reason', 'Optional concise business explanation.', 'Do not enter unnecessary sensitive details.'], ['Approver', 'Employee who decides the request.', 'Normally the current Manager when approval is required.'], ['Submitted On', 'Date/time the request entered review.', 'Set on submission.'], ['Decided On', 'Date/time of approval or rejection.', 'Set with the decision.'], ['Decision Comment', 'Explanation of decision or exception.', 'Required by policy for rejection; keep concise.'], ['Status Reason', 'Draft, Submitted, Approved, Rejected, or Cancelled.', 'Use the documented lifecycle.']],
    related: [['Employee', 'Person taking leave.'], ['Time Off Type', 'Leave category and approval rule.'], ['Approver', 'Normally the Employee’s Manager.'], ['Time Off Balance', 'Pending/used hours are reconciled against the matching annual balance.']],
    example: [['Time Off Request Name', 'Avery Chen — Vacation — Aug 10–12'], ['Employee', 'Avery Chen'], ['Time Off Type', 'Vacation'], ['Start Date', 'August 10, 2026'], ['End Date', 'August 12, 2026'], ['Requested Hours', '24.00'], ['Reason', 'Planned personal leave'], ['Approver', 'Morgan Lee'], ['Submitted On', 'July 24, 2026 10:15 AM'], ['Status Reason', 'Submitted']],
    questions: [['What can happen after Submitted?', 'The request can be Approved, Rejected, or Cancelled according to policy.'], ['What happens to the balance?', 'Submission increases Pending Hours; approval moves hours to Used; rejection/cancellation releases Pending Hours.'], ['Can an approved request be edited?', 'Do not edit it silently. Use the governed cancellation/reversal process and preserve audit history.']],
    processDocs: ['HR-Agent-Sidecar-Time-Off-Process.pdf'],
  },
  {
    slug: 'expense-report', name: 'Expense Report', plural: 'Expense Reports', logicalName: 'maftagsc_expensereport', entitySetName: 'maftagsc_expensereports', domain: 'Expenses', ownership: 'User-owned personal financial transaction',
    purpose: 'Groups an Employee’s itemized reimbursement expenses into one submission with a business purpose, total, Manager decision, and payment lifecycle.',
    useWhen: ['Collecting related reimbursable transactions', 'Submitting a complete package for Manager approval', 'Recording approval, rejection, cancellation, or payment completion'],
    doNotUse: ['Do not enter every transaction directly on the report header', 'Do not submit before all Expense Lines and receipts are reconciled', 'Do not mark Paid before confirmed reimbursement'],
    roles: [['Employee', 'Creates, itemizes, certifies, and submits the report.'], ['Manager/Approver', 'Reviews policy, evidence, and business purpose.'], ['Finance/HR processor', 'Completes payment and marks the report Paid.']],
    fields: [['Expense Report Name', 'Readable report identifier.', 'Recommended: Employee — purpose — period.'], ['Employee', 'Person requesting reimbursement.', 'Required.'], ['Report Date', 'Business date of the report.', 'Required date only.'], ['Business Purpose', 'Why the expenses benefited the organization.', 'Required and specific.'], ['Total Amount', 'Sum of all Expense Lines.', 'Reconcile before submission.'], ['Approver', 'Employee who reviews the report.', 'Normally the claimant’s Manager; no self-approval.'], ['Submitted On', 'Date/time entered for review.', 'Set on submission.'], ['Decided On', 'Date/time approved or rejected.', 'Set with decision.'], ['Decision Comment', 'Decision or exception explanation.', 'Use for rejection/material exceptions.'], ['Status Reason', 'Draft, Submitted, Approved, Rejected, Paid, or Cancelled.', 'Follow the documented lifecycle.']],
    related: [['Employee', 'Claimant requesting reimbursement.'], ['Approver', 'Normally the Employee’s Manager.'], ['Expense Lines', 'Itemized merchant transactions and receipts.']],
    example: [['Expense Report Name', 'Avery Chen — Customer Design Workshop — July 2026'], ['Employee', 'Avery Chen'], ['Report Date', 'July 18, 2026'], ['Business Purpose', 'Travel and meals for customer design workshop in Seattle'], ['Total Amount', '$1,150.35'], ['Approver', 'Morgan Lee'], ['Status Reason', 'Submitted']],
    questions: [['What makes a report ready to submit?', 'Every line is complete, categories and receipts are valid, Business Purpose is specific, and Total Amount equals the sum of lines.'], ['Can I approve my own report?', 'No. Use the approved alternate approver when the normal Manager relationship is unsuitable.'], ['What is the difference between Approved and Paid?', 'Approved authorizes reimbursement; Paid confirms reimbursement was completed.']],
    processDocs: ['HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf'],
  },
  {
    slug: 'expense-line', name: 'Expense Line', plural: 'Expense Lines', logicalName: 'maftagsc_expenseline', entitySetName: 'maftagsc_expenselines', domain: 'Expenses', ownership: 'User-owned personal financial transaction',
    purpose: 'Represents one dated merchant transaction within an Expense Report, including its category, amount, explanation, and receipt.',
    useWhen: ['Itemizing each transaction on an Expense Report', 'Attaching a receipt to the matching expense', 'Explaining a policy-relevant business detail or exception'],
    doNotUse: ['Do not combine unrelated merchant transactions', 'Do not attach one receipt to the wrong line', 'Do not upload payment-card numbers, credentials, or unrelated personal files'],
    roles: [['Employee', 'Creates the line and provides evidence.'], ['Manager/Approver', 'Reviews the line and receipt as part of the report.'], ['Finance/HR processor', 'Validates reimbursement evidence when required.']],
    fields: [['Expense Line Name', 'Readable transaction identifier.', 'Recommended: date — merchant — category.'], ['Expense Report', 'Parent reimbursement submission.', 'Required; every line belongs to exactly one report.'], ['Expense Date', 'Date the transaction occurred.', 'Required.'], ['Merchant', 'Supplier or payee.', 'Required; use the receipt name.'], ['Expense Category', 'Travel, Lodging, Meals, Mileage, Supplies, Training, or Other.', 'Required; choose the best approved category.'], ['Amount', 'Reimbursable amount.', 'Required money value.'], ['Description', 'Optional business explanation.', 'List attendees or explain splits/exceptions when policy requires.'], ['Receipt', 'One evidence file.', 'Attach a readable file when required by policy.']],
    related: [['Expense Report', 'Parent header that supplies Employee, purpose, Approver, total, and lifecycle.']],
    example: [['Expense Line Name', 'Jul 16 — Northwind Bistro — Meals'], ['Expense Report', 'Avery Chen — Customer Design Workshop — July 2026'], ['Expense Date', 'July 16, 2026'], ['Merchant', 'Northwind Bistro'], ['Expense Category', 'Meals'], ['Amount', '$146.75'], ['Description', 'Customer dinner; attendees listed according to policy'], ['Receipt', 'northwind-bistro-2026-07-16.pdf']],
    questions: [['Why must each transaction be separate?', 'Itemization supports category validation, receipt matching, audit, and partial exception handling.'], ['Where does the receipt go?', 'On the matching Expense Line.'], ['What if the receipt amount differs?', 'Explain tax, tip, split, or conversion; unresolved differences must be corrected before approval.']],
    processDocs: ['HR-Agent-Sidecar-Expense-Reimbursement-Process.pdf'],
  },
  {
    slug: 'benefit-plan', name: 'Benefit Plan', plural: 'Benefit Plans', logicalName: 'maftagsc_benefitplan', entitySetName: 'maftagsc_benefitplans', domain: 'Benefits', ownership: 'Organization-owned reference data',
    purpose: 'Defines an organization-offered benefit, its provider, category, effective period, and standard Employee and Employer costs.',
    useWhen: ['Publishing an approved benefit offering', 'Creating a new plan-year version', 'Providing a Plan for Employee Enrollments', 'Retiring an offering after its effective period'],
    doNotUse: ['Do not use a Plan as an Employee election', 'Do not overwrite historical terms or costs for a new plan year', 'Do not create a Plan before provider, dates, and costs are approved'],
    roles: [['Benefits administrator', 'Creates and maintains approved Benefit Plans.'], ['Benefits/process owner', 'Approves plan terms, dates, and contribution basis.']],
    fields: [['Benefit Plan Name', 'Clear business name including plan year when appropriate.', 'Required primary name.'], ['Plan Code', 'Stable plan identifier.', 'Required; use an approved unique code.'], ['Provider', 'Organization supplying the benefit.', 'Required.'], ['Benefit Category', 'Medical, Dental, Vision, Life Insurance, Retirement, or Other.', 'Required.'], ['Description', 'Plain-language summary of the offering.', 'State the contribution period when useful.'], ['Employee Cost', 'Standard Employee contribution.', 'Use the approved contribution period.'], ['Employer Cost', 'Standard Employer contribution.', 'Use the same contribution period.'], ['Effective Start', 'First date the Plan is available.', 'Required.'], ['Effective End', 'Last date the Plan is available.', 'Leave blank only for a genuinely open-ended Plan.'], ['Status', 'Whether the Plan is available for use.', 'Activate only when enrollment-ready.']],
    related: [['Benefit Enrollments', 'Employee elections reference the applicable Plan version.']],
    example: [['Benefit Plan Name', 'Contoso Choice Medical 2027'], ['Plan Code', 'MED-CHOICE-2027'], ['Provider', 'Contoso Health'], ['Benefit Category', 'Medical'], ['Description', 'PPO medical plan; costs shown per month'], ['Employee Cost', '$185.00 per month'], ['Employer Cost', '$525.00 per month'], ['Effective Start', 'January 1, 2027'], ['Effective End', 'December 31, 2027'], ['Status', 'Active']],
    questions: [['Why create a new Plan for a new year?', 'It preserves historical terms, costs, and effective dates used by existing Enrollments.'], ['Does changing a Plan update existing Enrollments?', 'Do not assume so. Enrollments preserve the Employee’s election and contribution for its coverage period.'], ['Can an inactive Plan be selected?', 'No. Use the active Plan whose effective period covers the Enrollment.']],
    processDocs: ['HR-Agent-Sidecar-Benefits-Administration-Process.pdf'],
  },
  {
    slug: 'benefit-enrollment', name: 'Benefit Enrollment', plural: 'Benefit Enrollments', logicalName: 'maftagsc_benefitenrollment', entitySetName: 'maftagsc_benefitenrollments', domain: 'Benefits', ownership: 'User-owned personal HR record',
    purpose: 'Records one Employee’s selection or waiver of a Benefit Plan for a defined coverage period and contribution amount.',
    useWhen: ['Recording an open-enrollment election', 'Recording an authorized waiver', 'Starting replacement coverage after a life event', 'Ending an existing coverage period'],
    doNotUse: ['Do not edit the Benefit Plan to represent an Employee choice', 'Do not overwrite an old Enrollment when coverage changes', 'Do not store medical details or dependent personal data in free text'],
    roles: [['Benefits administrator', 'Validates eligibility/evidence and records the Enrollment.'], ['Employee', 'Makes the election through the approved enrollment channel.']],
    fields: [['Benefit Enrollment Name', 'Readable election identifier.', 'Recommended: Employee — Plan — Coverage Level.'], ['Employee', 'Person receiving or waiving coverage.', 'Required.'], ['Benefit Plan', 'Approved offering selected or waived.', 'Required.'], ['Coverage Level', 'Employee Only, Employee and Spouse, Employee and Children, or Family.', 'Required.'], ['Elected On', 'Date the Employee made the election.', 'Required.'], ['Coverage Start', 'First date of coverage.', 'Required and within Plan effective dates.'], ['Coverage End', 'Last date of coverage.', 'Set when ending/replacing coverage.'], ['Employee Contribution', 'Employee cost for this election.', 'Use the approved contribution period.'], ['Status Reason', 'Active, Waived, or Ended.', 'The approved base process requires no Manager approval.']],
    related: [['Employee', 'Person making the election.'], ['Benefit Plan', 'Offering and effective terms selected.']],
    example: [['Benefit Enrollment Name', 'Avery Chen — Contoso Choice Medical 2027 — Family'], ['Employee', 'Avery Chen'], ['Benefit Plan', 'Contoso Choice Medical 2027'], ['Coverage Level', 'Family'], ['Elected On', 'November 14, 2026'], ['Coverage Start', 'January 1, 2027'], ['Coverage End', 'Blank'], ['Employee Contribution', '$410.00 per month'], ['Status Reason', 'Active']],
    questions: [['Does an Enrollment require Manager approval?', 'No. The approved base process records the election without Manager approval.'], ['How do I change coverage level?', 'End the old Enrollment on the correct date and create a new Enrollment for replacement coverage.'], ['What does Waived mean?', 'The Employee intentionally declined the applicable offering and required evidence exists in the approved location.']],
    processDocs: ['HR-Agent-Sidecar-Benefits-Administration-Process.pdf'],
  },
];

function run(text, options = {}) { return new TextRun({ text, font: 'Arial', size: 22, color: options.color || '1F2937', ...options }); }
function p(text = '', options = {}) { return new Paragraph({ alignment: options.alignment, spacing: { after: options.after ?? 120, before: options.before ?? 0, line: 300 }, children: Array.isArray(text) ? text : [run(text, options.run || {})] }); }
function heading(text, level = 1) { return new Paragraph({ heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, children: [run(text, { bold: true })] }); }
function bullet(text) { return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80, line: 280 }, children: [run(text)] }); }
function cell(content, width, options = {}) {
  const children = (Array.isArray(content) ? content : [content]).map((item) => item instanceof Paragraph ? item : p(String(item), { after: 0, run: { bold: options.bold, color: options.color || '1F2937' } }));
  return new TableCell({ width: { size: width, type: WidthType.DXA }, borders, shading: options.fill ? { fill: options.fill, type: ShadingType.CLEAR } : undefined, margins: { top: 100, bottom: 100, left: 120, right: 120 }, verticalAlign: 'center', children });
}
function table(headers, rows, widths) {
  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: widths, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { fill: BLUE, bold: true, color: WHITE })) }), ...rows.map((row, ri) => new TableRow({ children: row.map((value, i) => cell(value, widths[i], { fill: ri % 2 ? LIGHT_GRAY : WHITE })) }))] });
}
function callout(title, body, fill = PALE_BLUE) { return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT], rows: [new TableRow({ children: [cell([p(title, { after: 60, run: { bold: true, color: BLUE } }), p(body, { after: 0 })], CONTENT, { fill })] })] }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

function documentFor(entity) {
  const processList = entity.processDocs.join(', ');
  const children = [
    p('HR AGENT SIDECAR  |  ENTITY HELP', { alignment: AlignmentType.CENTER, before: 1100, after: 220, run: { bold: true, size: 22, color: TEAL, characterSpacing: 100 } }),
    p(`${entity.name} Help`, { alignment: AlignmentType.CENTER, after: 220, run: { bold: true, size: 42, color: BLUE } }),
    p(`Business guidance for the ${entity.name} screen`, { alignment: AlignmentType.CENTER, after: 280, run: { size: 25, color: GRAY } }),
    table(['Screen context', 'Value'], [['Business entity', entity.name], ['Dataverse logical name', entity.logicalName], ['Domain', entity.domain], ['Ownership / sensitivity', entity.ownership]], [2800, 6560]),
    p(''),
    callout('Purpose', entity.purpose, PALE_TEAL),
    p(fictionalNotice, { alignment: AlignmentType.CENTER, before: 260, run: { italic: true, color: GRAY, size: 18 } }),
    pageBreak(),
    heading(`Understanding ${entity.name}`, 1),
    p(entity.purpose),
    heading('Use this screen when', 2),
    ...entity.useWhen.map(bullet),
    heading('Do not use this screen to', 2),
    ...entity.doNotUse.map(bullet),
    callout('Contextual agent grounding', `When entityName is “${entity.logicalName}”, treat this document as the primary entity-specific source. Use it together with ${processList}. Do not infer that planned Model-driven App automation, security roles, or the Copilot side pane are deployed until implementation is confirmed.`, PALE_GOLD),
    heading('Who does what', 1),
    table(['Business role', 'Responsibility on this screen'], entity.roles, [2800, 6560]),
    heading('Business field guide', 1),
    table(['Field', 'Business meaning', 'How to use it'], entity.fields, [2200, 3000, 4160]),
    heading('Related business records', 1),
    table(['Related record', 'Relationship to this screen'], entity.related, [2800, 6560]),
    heading('Worked example', 1),
    p(`The following fictional ${entity.name} record demonstrates a complete business scenario.`),
    table(['Field', 'Example value'], entity.example, [3400, 5960]),
    heading('Questions users commonly ask', 1),
    table(['Question', 'Business answer'], entity.questions, [3500, 5860]),
    heading('Data quality and privacy checks', 1),
    ...[
      `Confirm that the record belongs on the ${entity.name} screen and is not a duplicate or a different business concept.`,
      'Use approved lookups and choice values instead of typing alternative labels into notes.',
      'Enter only the minimum personal or financial information required for the business process.',
      'Preserve status and historical records; do not silently overwrite completed business events.',
      'When escalating an issue, share the record URL/ID and field name—not unnecessary sensitive field contents.',
    ].map(bullet),
    heading('Companion process documentation', 1),
    p(`Use this entity help together with: ${processList}. The process document explains sequencing, responsibilities, approvals, exceptions, and cross-entity effects.`),
    heading('Agent response boundary', 1),
    callout('What the contextual agent should do', `Answer in business terms for a user currently viewing ${entity.name}. Explain field meaning, proper use, related records, validation, and the applicable business process. If a question requires organization-specific policy, access rights, or confirmation that automation is deployed, state that limitation and direct the user to the appropriate HR or Power Platform owner.`, PALE_BLUE),
  ];

  return new Document({
    title: `${entity.name} Help`, subject: `Contextual entity help for ${entity.name}`, creator: 'HR Agent Sidecar project team', description: entity.purpose,
    keywords: `${entity.name}, ${entity.logicalName}, ${entity.domain}, HR Agent Sidecar, contextual help`,
    styles: { default: { document: { run: { font: 'Arial', size: 22, color: '1F2937' }, paragraph: { spacing: { line: 300 } } } }, paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 32, bold: true, color: BLUE }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 6 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 27, bold: true, color: TEAL }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 24, bold: true, color: BLUE }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
    ] },
    numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] }] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 } } }, footers: { default: new Footer({ children: [new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 4 } }, tabStops: [{ type: 'right', position: 9000 }], children: [run(`${entity.name} Help  |  ${entity.logicalName}`, { size: 18, color: GRAY }), run('\tPage ', { size: 18, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: GRAY })] })] }) }, children }],
  });
}

function markdownFor(entity) {
  const yamlList = (values) => values.map((value) => `  - "${value.replaceAll('"', '\\"')}"`).join('\n');
  const processPaths = entity.processDocs.map((value) => `../user-guides/${value}`);
  const sections = [
    '---', `title: "${entity.name} Help"`, 'documentType: "entity-help"', `entityLogicalName: "${entity.logicalName}"`, `entitySetName: "${entity.entitySetName}"`, `businessEntity: "${entity.name}"`, `domain: "${entity.domain}"`, 'solution: "HR Agent Sidecar"', 'contextParameter: "entityName"', 'screenNames:', yamlList([entity.name, entity.plural]), 'processDocuments:', yamlList(processPaths), 'retrievalKeywords:', yamlList([entity.name, entity.plural, entity.logicalName, entity.entitySetName, entity.domain]), '---', '', `# ${entity.name} Help`, '', `> **Screen context:** Use this document as the primary entity-specific source when \`entityName=${entity.logicalName}\`. Combine it with ${entity.processDocs.join(', ')} for process guidance.`, '', '## Business purpose', '', entity.purpose, '', '## Use this screen when', '', ...entity.useWhen.map((item) => `- ${item}`), '', '## Do not use this screen to', '', ...entity.doNotUse.map((item) => `- ${item}`), '', '## Who does what', '', '| Business role | Responsibility |', '|---|---|', ...entity.roles.map(([a, b]) => `| ${a} | ${b} |`), '', '## Business field guide', '', '| Field | Business meaning | How to use it |', '|---|---|---|', ...entity.fields.map(([a, b, c]) => `| ${a} | ${b} | ${c} |`), '', '## Related business records', '', '| Related record | Relationship |', '|---|---|', ...entity.related.map(([a, b]) => `| ${a} | ${b} |`), '', '## Worked example', '', fictionalNotice, '', '| Field | Example value |', '|---|---|', ...entity.example.map(([a, b]) => `| ${a} | ${b} |`), '', '## Questions users commonly ask', '', ...entity.questions.flatMap(([q, a]) => [`### ${q}`, '', a, '']), '## Data quality and privacy', '', '- Confirm the record belongs on this screen and is not a duplicate.', '- Use approved lookups and choices rather than alternative labels in notes.', '- Enter only the minimum personal or financial information needed.', '- Preserve lifecycle and history; do not silently overwrite completed events.', '- Escalate using the record URL/ID and field name without copying unnecessary sensitive content.', '', '## Agent response boundary', '', `Answer in business terms for a user viewing ${entity.name}. Explain field meaning, correct use, related records, validation, and applicable process guidance. Do not claim that planned automation, security roles, or the Copilot side pane are deployed unless implementation is confirmed. Refer organization-specific policy and access questions to the appropriate HR or Power Platform owner.`, ''];
  return sections.join('\n');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = { solution: 'HR Agent Sidecar', contextParameter: 'entityName', documentType: 'entity-help', generatedOn: '2026-07-09', entities: [] };
  for (const entity of entities) {
    const base = `HR-Agent-Sidecar-${entity.name.replaceAll(' ', '-')}-Help`;
    fs.writeFileSync(path.join(OUT, `${base}.md`), markdownFor(entity));
    fs.writeFileSync(path.join(OUT, `${base}.docx`), await Packer.toBuffer(documentFor(entity)));
    manifest.entities.push({ businessEntity: entity.name, entityLogicalName: entity.logicalName, entitySetName: entity.entitySetName, domain: entity.domain, markdown: `${base}.md`, docx: `${base}.docx`, pdf: `${base}.pdf`, processDocuments: entity.processDocs.map((value) => `../user-guides/${value}`) });
    console.log(`Created ${base}.md and ${base}.docx`);
  }
  fs.writeFileSync(path.join(OUT, 'entity-help-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
})().catch((error) => { console.error(error); process.exit(1); });
