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

function run(text, options = {}) {
  return new TextRun({ text, font: 'Arial', size: 22, color: options.color || '1F2937', ...options });
}
function p(text = '', options = {}) {
  return new Paragraph({
    alignment: options.alignment,
    spacing: { after: options.after ?? 120, before: options.before ?? 0, line: 300 },
    children: Array.isArray(text) ? text : [run(text, options.run || {})],
  });
}
function heading(text, level = 1) {
  return new Paragraph({ heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, children: [run(text, { bold: true })] });
}
function bullet(text, level = 0, ref = 'bullets') {
  return new Paragraph({ numbering: { reference: ref, level }, spacing: { after: 80, line: 280 }, children: [run(text)] });
}
function numbered(text, ref = 'steps') {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 100, line: 290 }, children: [run(text)] });
}
function cell(content, width, options = {}) {
  const children = (Array.isArray(content) ? content : [content]).map((item) => item instanceof Paragraph ? item : p(String(item), { after: 0, run: { bold: options.bold, color: options.color || '1F2937' } }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, borders,
    shading: options.fill ? { fill: options.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: 'center', children,
  });
}
function table(headers, rows, widths) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { fill: BLUE, bold: true, color: WHITE })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((v, i) => cell(v, widths[i], { fill: ri % 2 ? LIGHT_GRAY : WHITE })) })),
    ],
  });
}
function callout(title, body, fill = PALE_BLUE) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [CONTENT],
    rows: [new TableRow({ children: [cell([
      p(title, { after: 60, run: { bold: true, color: BLUE } }),
      p(body, { after: 0 }),
    ], CONTENT, { fill })] })],
  });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function cover(title, subtitle, audience) {
  return [
    p('HR AGENT SIDECAR', { alignment: AlignmentType.CENTER, before: 1600, after: 260, run: { bold: true, size: 24, color: TEAL, characterSpacing: 120 } }),
    p(title, { alignment: AlignmentType.CENTER, after: 260, run: { bold: true, size: 42, color: BLUE } }),
    p(subtitle, { alignment: AlignmentType.CENTER, after: 520, run: { size: 26, color: GRAY } }),
    p(`Audience: ${audience}`, { alignment: AlignmentType.CENTER, after: 120, run: { bold: true } }),
    p(`Version 1.0  |  ${generatedDate}`, { alignment: AlignmentType.CENTER, after: 900, run: { color: GRAY } }),
    callout('Document scope', 'This guide describes the approved HR Agent Sidecar data model and required business process. It distinguishes current Dataverse schema from planned application, automation, and Copilot features.'),
    p(fictionalNotice, { alignment: AlignmentType.CENTER, before: 500, run: { italic: true, color: GRAY, size: 18 } }),
    pageBreak(),
  ];
}
function commonIntro(purpose, audience) {
  return [
    heading('How to use this guide', 1),
    p(purpose),
    table(['Item', 'Guidance'], [
      ['Intended audience', audience],
      ['System of record', 'Microsoft Dataverse in the HR Agent Sidecar solution'],
      ['Naming convention', 'Business names are shown first; Dataverse logical names appear in parentheses.'],
      ['Required means', 'The value must be present before the record can be considered process-ready. Dataverse business-required fields are also enforced by the platform or application.'],
      ['Status discipline', 'Use the documented Status Reason transitions. Do not simulate process state with notes, record names, or ad hoc fields.'],
    ], [2200, 7160]),
    p(''),
    callout('Privacy and least privilege', 'HR records can contain personal and financial information. Only enter data needed for the approved process. Do not place medical details, payment-card data, credentials, or unrelated sensitive information in free-text fields.', PALE_GOLD),
  ];
}
function statusTable(rows) {
  return table(['Status Reason', 'Meaning', 'Permitted next status'], rows, [1900, 4300, 3160]);
}
function recordExample(title, rows) {
  return [heading(title, 3), table(['Field', 'Example value'], rows, [3400, 5960])];
}
function docConfig(title, children) {
  return new Document({
    title,
    subject: 'HR Agent Sidecar user documentation',
    creator: 'HR Agent Sidecar project team',
    description: title,
    styles: {
      default: { document: { run: { font: 'Arial', size: 22, color: '1F2937' }, paragraph: { spacing: { line: 300 } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 32, bold: true, color: BLUE }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 6 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 27, bold: true, color: TEAL }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 24, bold: true, color: BLUE }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] },
      { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 660, hanging: 360 } } } }] },
      { reference: 'process-a', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 660, hanging: 360 } } } }] },
      { reference: 'process-b', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 660, hanging: 360 } } } }] },
    ] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 4 } },
        tabStops: [{ type: 'right', position: 9000 }],
        children: [run('HR Agent Sidecar  |  Internal user guide', { size: 18, color: GRAY }), run('\tPage ', { size: 18, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: GRAY })],
      })] }) },
      children,
    }],
  });
}

const entityRows = [
  ['Employee (systemuser)', 'OOB, augmented', 'Worker identity and organizational assignment. Stores Employee ID, name, email, phone, Manager, Position, Department, Hire Date, Employment Type, and enabled state.', 'Referenced by personal HR records; synchronized identity remains governed by Entra ID/Dataverse user administration.'],
  ['Position (position)', 'OOB', 'Defines an organizational role and optional parent Position.', 'Assigned to Employees; supports position hierarchy reporting.'],
  ['Department (businessunit)', 'OOB', 'Defines organizational units, hierarchy, cost center, and division.', 'Assigned to Employees and used by Dataverse security/ownership.'],
  ['Time Off Type (maftagsc_timeofftype)', 'Custom, organization-owned', 'Defines a leave category, code, default annual hours, and whether approval is required.', 'Reference data used by balances and requests.'],
  ['Time Off Balance (maftagsc_timeoffbalance)', 'Custom, user-owned', 'Tracks allocated, pending, and used hours for one Employee, Time Off Type, and calendar year.', 'Maintained by HR and planned automation as requests move through approval.'],
  ['Time Off Request (maftagsc_timeoffrequest)', 'Custom, user-owned', 'Captures requested dates/hours, reason, Employee, Time Off Type, Approver, and decision audit details.', 'Submitted by an Employee and normally decided by the Employee’s Manager.'],
  ['Expense Report (maftagsc_expensereport)', 'Custom, user-owned', 'Groups reimbursement lines under a business purpose, report date, Employee, total, Approver, and approval status.', 'Submitted as one approval package; total should equal approved line amounts.'],
  ['Expense Line (maftagsc_expenseline)', 'Custom, user-owned', 'Captures one dated merchant transaction, category, amount, description, and one receipt file.', 'Must belong to one Expense Report.'],
  ['Benefit Plan (maftagsc_benefitplan)', 'Custom, organization-owned', 'Defines plan code, provider, category, coverage availability, and employee/employer cost.', 'Reference data selected by Benefit Enrollments.'],
  ['Benefit Enrollment (maftagsc_benefitenrollment)', 'Custom, user-owned', 'Records an Employee’s selected plan, coverage level/dates, election date, and employee contribution.', 'No approval is required in the approved base process.'],
];

const overview = [
  ...cover('Solution and Entity Guide', 'Purpose, ownership, relationships, and correct use of the HR data model', 'HR administrators, managers, app makers, support teams, and auditors'),
  ...commonIntro('Use this guide to understand what each business entity represents, when it should be used, and how records relate. Process-specific data-entry instructions are provided in the companion guides.', 'HR administrators, managers, app makers, support teams, and auditors'),
  heading('Solution purpose', 1),
  p('HR Agent Sidecar is a dedicated Dataverse solution for foundational employee organization data, time off, expense reimbursement, and benefits. It reuses standard Dataverse entities for Employee, Position, and Department, then adds seven HR-specific custom entities. The target experience is a Model-driven App with a contextual Copilot Studio side pane.'),
  callout('Implementation status', 'The Dataverse schema and unpacked solution source are implemented and validated. Model-driven App navigation/forms, security roles, Power Automate approval flows, and the Copilot side pane are planned solution components and must not be represented to users as active until deployed and tested.', PALE_GOLD),
  heading('Core design principles', 2),
  bullet('One business fact has one authoritative home. Example: reporting Manager belongs on Employee, not copied into every request.'),
  bullet('Reuse Dataverse platform entities and lifecycle columns instead of creating parallel employee, department, position, currency, owner, or status structures.'),
  bullet('Personal HR records are user-owned and require least-privilege access. Reference data is organization-owned.'),
  bullet('Approvals use Status Reason plus Approver, Submitted On, Decided On, and Decision Comment—not free-text conventions.'),
  bullet('Money values use Dataverse currency behavior. Receipt files belong on Expense Lines.'),
  pageBreak(),
  heading('Entity catalog', 1),
  table(['Entity', 'Type / ownership', 'Purpose', 'How it is used'], entityRows, [1900, 1700, 2920, 2840]),
  heading('Relationship map', 1),
  table(['Parent / reference', 'Child / transaction', 'Cardinality and rule'], [
    ['Employee', 'Time Off Balance', 'One Employee can have many balances; each balance requires exactly one Employee.'],
    ['Time Off Type', 'Time Off Balance', 'One Type can have many balances; each balance requires exactly one Type.'],
    ['Employee', 'Time Off Request', 'One Employee can have many requests; each request requires one Employee.'],
    ['Time Off Type', 'Time Off Request', 'One Type can have many requests; each request requires one Type.'],
    ['Employee (Approver)', 'Time Off Request', 'Optional while Draft; populated for submitted requests when approval is required.'],
    ['Employee', 'Expense Report', 'One Employee can have many reports; each report requires one Employee.'],
    ['Employee (Approver)', 'Expense Report', 'Optional while Draft; populated on submission.'],
    ['Expense Report', 'Expense Line', 'One report contains one or more lines; every line requires a report.'],
    ['Employee', 'Benefit Enrollment', 'One Employee can have many enrollments; each enrollment requires one Employee.'],
    ['Benefit Plan', 'Benefit Enrollment', 'One Plan can have many enrollments; each enrollment requires one Plan.'],
  ], [2700, 2700, 3960]),
  heading('Entity usage details', 1),
  heading('Employee, Position, and Department', 2),
  p('These are standard Dataverse entities. Employee is the person record used for HR transactions. Manager is the Employee referenced by the standard reporting relationship. Position is a reusable role; Department is a Business Unit and also participates in platform security.'),
  callout('Do not duplicate', 'Do not create a second Employee, Position, Department, Manager, owner, currency, or lifecycle entity. Correct the authoritative OOB record or relationship.', PALE_RED),
  heading('Time Off entities', 2),
  p('Time Off Type is reference data. Time Off Balance is an annual balance snapshot by Employee and Type. Time Off Request is the workflow transaction. Balance records should not be used as requests, and requests should not be used as balances.'),
  heading('Expense entities', 2),
  p('Expense Report is the approval header. Expense Line is the itemized transaction and receipt location. A report total is meaningful only when all lines are complete and valid.'),
  heading('Benefits entities', 2),
  p('Benefit Plan defines what the organization offers. Benefit Enrollment records what an Employee selected. Editing a Plan does not automatically rewrite historical Enrollments; effective dates preserve meaning over time.'),
  heading('Lifecycle reference', 1),
  statusTable([
    ['Time Off Request: Draft', 'Employee or HR is preparing the request.', 'Submitted or Cancelled'],
    ['Time Off Request: Submitted', 'Request is awaiting decision.', 'Approved, Rejected, or Cancelled'],
    ['Expense Report: Draft', 'Header and lines are being assembled.', 'Submitted or Cancelled'],
    ['Expense Report: Submitted', 'Report is locked for manager review.', 'Approved, Rejected, or Cancelled'],
    ['Expense Report: Approved', 'Manager approved reimbursement.', 'Paid'],
    ['Benefit Enrollment: Active', 'Coverage is current or scheduled.', 'Waived or Ended'],
  ]),
  heading('Data quality and audit expectations', 1),
  bullet('Use stable codes for Time Off Types and Benefit Plans.'),
  bullet('Use Employee lookups—not names typed into notes—to identify people.'),
  bullet('Record dates in the field intended for the business event; Created On is not a substitute for Submitted On or Elected On.'),
  bullet('Do not overwrite a decided request/report to recycle it. Create a new transaction or use the documented cancellation path.'),
  bullet('Decision comments should explain exceptions and rejections without including unnecessary personal details.'),
  bullet('Retain receipts according to organizational policy; never upload payment-card numbers or unrelated files.'),
  heading('Rich cross-process example', 1),
  p('Avery Chen is an active full-time Employee in the Product Department, assigned to the Senior Designer Position, and reports to Morgan Lee. Avery has an annual Vacation balance, submits a three-day Time Off Request, files an Expense Report after a customer workshop, and elects a Medical Benefit Plan. Each transaction references Avery’s single Employee record; manager routing derives from the Manager relationship; Department and Position are not copied into every transaction.'),
  table(['Business event', 'Correct record(s)', 'Key result'], [
    ['Annual vacation setup', 'One Time Off Balance for Avery + Vacation + 2026', 'Allocated, pending, and used hours remain traceable.'],
    ['Vacation request', 'One Time Off Request', 'Approval and decision history are independent of the balance snapshot.'],
    ['Workshop reimbursement', 'One Expense Report + three Expense Lines', 'One manager decision covers itemized transactions and receipts.'],
    ['Medical election', 'One Benefit Enrollment linked to the active Medical Plan', 'Coverage dates and contribution reflect Avery’s election.'],
  ], [2400, 3300, 3660]),
  heading('Support and escalation', 1),
  p('When data appears inconsistent, capture the record URL, entity name, record ID, current Status Reason, and a concise description. Do not copy sensitive field contents into email or chat. Escalate security concerns immediately to the Power Platform/HR data owner.'),
];

const organization = [
  ...cover('Employee and Organization Data Process', 'Maintaining Employee, Manager, Position, and Department information', 'HR administrators and authorized identity/Dataverse administrators'),
  ...commonIntro('Use this guide when onboarding an Employee, changing organizational assignment, correcting reporting hierarchy, or disabling a departing Employee.', 'HR administrators and authorized identity/Dataverse administrators'),
  heading('Business outcome', 1),
  p('Every active Employee has one authoritative Dataverse User record with valid organizational relationships. Downstream approval routing and HR transactions depend on this accuracy.'),
  heading('Roles and responsibilities', 2),
  table(['Role', 'Responsibility'], [
    ['Identity administrator', 'Creates or synchronizes the Microsoft Entra ID identity and ensures the Dataverse User exists.'],
    ['HR administrator', 'Maintains Employee ID, Hire Date, Employment Type, Manager, Position, and Department according to approved HR events.'],
    ['Manager', 'Confirms reporting assignment and raises corrections.'],
    ['Power Platform administrator', 'Maintains access/security configuration; does not invent HR data to make routing work.'],
  ], [2600, 6760]),
  heading('Prerequisites', 1),
  bullet('The person’s authorized identity exists and is synchronized to Dataverse.'),
  bullet('The correct Department and Position already exist, or approved reference-data creation has been completed.'),
  bullet('The Manager is an active Employee when manager approval routing is expected.'),
  heading('Process: onboard or activate an Employee', 1),
  numbered('Search Dataverse Users by primary email and Employee ID. Do not create a duplicate because a display name differs.'),
  numbered('Confirm identity-controlled fields such as name and email against the authoritative directory.'),
  numbered('Enter or verify Employee ID, Hire Date, and Employment Type.'),
  numbered('Select the Department (Business Unit) and Position using lookups.'),
  numbered('Select the Manager using the standard Manager relationship.'),
  numbered('Validate that the Manager relationship is not circular and that the Manager is enabled.'),
  numbered('Save, reopen, and verify the organizational fields and reporting chain.'),
  numbered('If the Employee will transact immediately, confirm the appropriate security role/access has been assigned through the governed access process.'),
  ...recordExample('Example: new Employee', [
    ['Employee', 'Avery Chen'], ['Employee ID', 'E-10482'], ['Primary email', 'avery.chen@example.com'], ['Hire Date', 'July 20, 2026'], ['Employment Type', 'Full Time'], ['Department', 'Product'], ['Position', 'Senior Designer'], ['Manager', 'Morgan Lee'], ['Enabled', 'Yes'],
  ]),
  heading('Process: organizational change', 1),
  numbered('Confirm the effective change and approvals in the source HR process.' , 'process-a'),
  numbered('Update Department, Position, or Manager only as authorized by the event.', 'process-a'),
  numbered('Verify the new Manager is enabled and the relationship does not create a loop.', 'process-a'),
  numbered('Assess in-flight Submitted requests and reports. Do not silently change an existing Approver unless the reassignment policy authorizes it.', 'process-a'),
  numbered('Record the operational change in the approved audit/change channel; avoid duplicating narrative in unrelated HR fields.', 'process-a'),
  callout('Example: manager transfer', 'Avery moves from Morgan Lee to Priya Nair on August 1. Update Avery’s Manager after the transfer is effective. A Time Off Request submitted to Morgan on July 29 remains assigned to Morgan unless the reassignment policy explicitly transfers it to Priya.', PALE_TEAL),
  heading('Process: departure or deactivation', 1),
  numbered('Confirm the authorized termination/deactivation event.', 'process-b'),
  numbered('Review outstanding requests, expense reports, and required handoffs before disabling access.', 'process-b'),
  numbered('Reassign outstanding approval responsibility through the governed process.', 'process-b'),
  numbered('Disable the User through the approved identity/Dataverse administration process; do not delete the Employee record.', 'process-b'),
  numbered('Retain historical relationships and HR transactions according to policy.', 'process-b'),
  heading('Validation and exception rules', 1),
  table(['Condition', 'Required action'], [
    ['Duplicate email or Employee ID', 'Stop. Determine the authoritative User record; merge/correct through administration rather than creating another Employee.'],
    ['Manager is disabled', 'Select the valid acting/permanent Manager according to policy before approval-dependent transactions are submitted.'],
    ['Circular hierarchy', 'Stop and correct the Manager chain. An Employee cannot manage themself directly or indirectly.'],
    ['Position or Department missing', 'Use the governed reference-data process. Do not type the value into notes or create an unapproved duplicate.'],
    ['Contractor without Manager', 'Document and approve the routing exception before allowing manager-approved transactions.'],
  ], [2800, 6560]),
  heading('Completion checklist', 1),
  bullet('One User record; no duplicate.'), bullet('Employee ID, Hire Date, and Employment Type verified.'), bullet('Department and Position use approved lookups.'), bullet('Manager chain is valid.'), bullet('Access is appropriate for the Employee’s duties.'),
];

const timeoff = [
  ...cover('Time Off Business Process', 'Configuring leave, establishing balances, submitting requests, and recording decisions', 'Employees, managers, HR administrators, and process owners'),
  ...commonIntro('Use this guide for the complete Time Off lifecycle across Time Off Type, Time Off Balance, and Time Off Request.', 'Employees, managers, HR administrators, and process owners'),
  heading('Business outcome', 1),
  p('Employees request leave against an understandable annual balance; Managers make traceable decisions; HR can reconcile allocated, pending, and used hours.'),
  heading('Record responsibilities', 2),
  table(['Entity', 'Created/maintained by', 'When'], [
    ['Time Off Type', 'HR administrator', 'When a governed leave category is introduced or changed.'],
    ['Time Off Balance', 'HR administrator or approved automation', 'At annual setup, onboarding, or adjustment.'],
    ['Time Off Request', 'Employee or authorized HR proxy', 'Whenever leave is requested.'],
  ], [2500, 3000, 3860]),
  heading('Process A: configure a Time Off Type', 1),
  numbered('Search by Code and Name to prevent duplicates.'),
  numbered('Enter the approved Name and stable Code.'),
  numbered('Enter Default Annual Hours when the category has a standard allowance.'),
  numbered('Set Requires Approval. Use Yes for manager-reviewed leave; use No only for categories authorized for automatic handling.'),
  numbered('Activate the Type only when it is ready for balances and requests.'),
  ...recordExample('Example: Vacation type', [['Name', 'Vacation'], ['Code', 'VAC'], ['Default Annual Hours', '120.00'], ['Requires Approval', 'Yes'], ['Status', 'Active']]),
  heading('Process B: establish an annual balance', 1),
  numbered('Search for an existing balance for the same Employee, Time Off Type, and Calendar Year.', 'process-a'),
  numbered('If none exists, create one and select the Employee and Time Off Type.', 'process-a'),
  numbered('Enter Calendar Year and Allocated Hours according to policy and prorating rules.', 'process-a'),
  numbered('Initialize Pending Hours and Used Hours to zero unless an approved migration or adjustment applies.', 'process-a'),
  numbered('Name the record consistently, for example “Avery Chen — Vacation — 2026”.', 'process-a'),
  numbered('Validate available hours: Allocated − Pending − Used.', 'process-a'),
  ...recordExample('Example: annual balance', [['Name', 'Avery Chen — Vacation — 2026'], ['Employee', 'Avery Chen'], ['Time Off Type', 'Vacation'], ['Calendar Year', '2026'], ['Allocated Hours', '120.00'], ['Pending Hours', '0.00'], ['Used Hours', '0.00'], ['Available Hours', '120.00 (derived operationally)']]),
  callout('Uniqueness control', 'The approved model expects one balance per Employee + Time Off Type + Calendar Year. Until a Dataverse alternate key is implemented, search before create and treat duplicates as a data-quality incident.', PALE_GOLD),
  heading('Process C: create and submit a request', 1),
  numbered('Confirm the Employee, Time Off Type, dates, and requested hours.' , 'process-b'),
  numbered('Verify the appropriate annual balance and available hours.', 'process-b'),
  numbered('Create the request in Draft. Enter Start Date, End Date, Requested Hours, and an optional concise Reason.', 'process-b'),
  numbered('If approval is required, set Approver to the Employee’s current Manager.', 'process-b'),
  numbered('Before submission, validate Start Date ≤ End Date, hours are positive, and dates/hours follow work-calendar policy.', 'process-b'),
  numbered('Set Submitted On and change Status Reason to Submitted.', 'process-b'),
  numbered('Increase Pending Hours through the approved automation/manual control. Do not increase Used Hours yet.', 'process-b'),
  ...recordExample('Example: request submission', [['Name', 'Avery Chen — Vacation — Aug 10–12'], ['Employee', 'Avery Chen'], ['Time Off Type', 'Vacation'], ['Start Date', 'August 10, 2026'], ['End Date', 'August 12, 2026'], ['Requested Hours', '24.00'], ['Reason', 'Planned personal leave'], ['Approver', 'Morgan Lee'], ['Submitted On', 'July 24, 2026 10:15 AM'], ['Status Reason', 'Submitted']]),
  heading('Process D: manager decision', 1),
  numbered('Open the Submitted request and confirm Employee, Type, dates, hours, overlap, and balance.', 'process-a'),
  numbered('Do not modify the Employee’s request to make it approvable. Reject with a clear reason when correction is needed.', 'process-a'),
  numbered('For approval, set Decided On, optionally add a Decision Comment, and change Status Reason to Approved.', 'process-a'),
  numbered('Move the request hours from Pending to Used in the balance.', 'process-a'),
  numbered('For rejection, set Decided On and Decision Comment, then change Status Reason to Rejected. Remove the hours from Pending.', 'process-a'),
  numbered('Notify the Employee through the approved workflow/channel.', 'process-a'),
  statusTable([
    ['Draft', 'Request is editable and not routed.', 'Submitted or Cancelled'],
    ['Submitted', 'Awaiting Manager decision; pending balance applies.', 'Approved, Rejected, or Cancelled'],
    ['Approved', 'Leave is authorized; used balance applies.', 'Terminal; cancellation requires governed handling'],
    ['Rejected', 'Leave is not authorized; pending hours released.', 'Terminal; create a corrected new request'],
    ['Cancelled', 'Request was withdrawn or voided.', 'Terminal'],
  ]),
  heading('Balance reconciliation example', 1),
  table(['Event', 'Allocated', 'Pending', 'Used', 'Available'], [
    ['Before submission', '120', '0', '16', '104'],
    ['After 24-hour request submitted', '120', '24', '16', '80'],
    ['After request approved', '120', '0', '40', '80'],
    ['If instead rejected', '120', '0', '16', '104'],
  ], [2900, 1615, 1615, 1615, 1615]),
  heading('Exceptions', 1),
  table(['Scenario', 'Correct handling'], [
    ['Insufficient balance', 'Do not approve unless policy permits a documented exception. Record the decision; do not falsify balance values.'],
    ['Cross-year request', 'Apply the organization’s split rule; typically create separate requests/balance impacts by calendar year.'],
    ['Manager unavailable', 'Use the approved delegation/reassignment procedure and retain the effective Approver.'],
    ['No-approval Time Off Type', 'Document the approved automatic process; still record submission and balance movement consistently.'],
    ['Approved request cancelled', 'Use a governed reversal that restores Used Hours and records who authorized the cancellation.'],
  ], [2700, 6660]),
];

const expense = [
  ...cover('Expense Reimbursement Business Process', 'Creating itemized reports, attaching receipts, manager approval, and payment completion', 'Employees, managers, finance/HR processors, and auditors'),
  ...commonIntro('Use this guide for Expense Reports and Expense Lines from Draft through Paid or final rejection/cancellation.', 'Employees, managers, finance/HR processors, and auditors'),
  heading('Business outcome', 1),
  p('A reimbursement submission is complete, itemized, supported by appropriate receipts, approved by the correct Manager, and traceable through payment.'),
  heading('Process roles', 2),
  table(['Role', 'Responsibility'], [
    ['Employee', 'Creates the report and lines, attaches receipts, certifies business purpose, and submits.'],
    ['Manager / Approver', 'Reviews business purpose, policy compliance, amounts, categories, and evidence; approves or rejects.'],
    ['Finance/HR processor', 'Performs downstream reimbursement checks and marks an approved report Paid only after payment confirmation.'],
    ['Auditor', 'Reviews immutable evidence and lifecycle history; does not edit transactions.'],
  ], [2500, 6860]),
  heading('Process A: create the Draft report', 1),
  numbered('Search for an existing Draft report for the same business event to avoid duplicates.'),
  numbered('Create the Expense Report and select the Employee.'),
  numbered('Enter Report Date and a specific Business Purpose.'),
  numbered('Leave Total Amount blank or system-calculated until lines are complete.'),
  numbered('Keep Status Reason as Draft.'),
  ...recordExample('Example: report header', [['Name', 'Avery Chen — Customer Design Workshop — July 2026'], ['Employee', 'Avery Chen'], ['Report Date', 'July 18, 2026'], ['Business Purpose', 'Travel and meals for customer design workshop in Seattle'], ['Approver', 'Blank while Draft'], ['Total Amount', '$0.00 until lines are entered'], ['Status Reason', 'Draft']]),
  heading('Process B: add and validate Expense Lines', 1),
  numbered('Create one line per merchant transaction; never combine unrelated transactions.', 'process-a'),
  numbered('Select the parent Expense Report.', 'process-a'),
  numbered('Enter Expense Date, Merchant, Expense Category, and Amount.', 'process-a'),
  numbered('Add a concise Description when the business relevance is not obvious.', 'process-a'),
  numbered('Attach one readable receipt file when required. Confirm it belongs to that line.', 'process-a'),
  numbered('Repeat until all transactions are itemized, then reconcile the report total to the sum of lines.', 'process-a'),
  heading('Rich line-item example', 2),
  table(['Line', 'Date', 'Merchant / category', 'Amount', 'Receipt / explanation'], [
    ['1 — Airfare', 'Jul 15', 'Contoso Air / Travel', '$428.40', 'PDF receipt attached'],
    ['2 — Hotel', 'Jul 15–17', 'City Center Hotel / Lodging', '$512.00', 'Itemized hotel folio attached'],
    ['3 — Customer dinner', 'Jul 16', 'Northwind Bistro / Meals', '$146.75', 'Receipt attached; attendees listed in Description'],
    ['4 — Airport transit', 'Jul 17', 'Metro Taxi / Travel', '$63.20', 'Electronic receipt attached'],
  ], [1350, 1000, 2600, 1250, 3160]),
  callout('Calculated example total', '$428.40 + $512.00 + $146.75 + $63.20 = $1,150.35. The Expense Report Total Amount must be $1,150.35 before submission.', PALE_TEAL),
  heading('Receipt rules', 2),
  bullet('Attach the receipt to the matching Expense Line, not to the report name or an unrelated line.'),
  bullet('Use a readable PDF or image according to organizational file policy.'),
  bullet('Do not upload files containing full payment-card numbers, passwords, medical data, or unrelated personal information.'),
  bullet('If a receipt is missing, follow the approved missing-receipt exception process and explain the exception in the line Description.'),
  heading('Process C: submit the report', 1),
  numbered('Confirm every required line field is complete and categories are correct.', 'process-b'),
  numbered('Recalculate/reconcile Total Amount to all lines.', 'process-b'),
  numbered('Confirm Business Purpose is specific and receipts/exceptions are present.', 'process-b'),
  numbered('Set Approver to the Employee’s current Manager.', 'process-b'),
  numbered('Set Submitted On and change Status Reason to Submitted.', 'process-b'),
  numbered('Treat the report and lines as locked for review. Corrections require rejection/return according to policy.', 'process-b'),
  heading('Process D: approve, reject, and pay', 1),
  numbered('Approver reviews the header, each line, receipt, total, and policy compliance.', 'process-a'),
  numbered('If valid, set Decided On and change Status Reason to Approved; add Decision Comment for material exceptions.', 'process-a'),
  numbered('If invalid, enter a clear Decision Comment and change Status Reason to Rejected. The Employee creates a corrected report or follows the return process.', 'process-a'),
  numbered('Finance/HR pays only an Approved report.', 'process-a'),
  numbered('After payment confirmation, change Status Reason from Approved to Paid.', 'process-a'),
  statusTable([
    ['Draft', 'Employee is assembling header, lines, and receipts.', 'Submitted or Cancelled'],
    ['Submitted', 'Awaiting Manager decision.', 'Approved, Rejected, or Cancelled'],
    ['Approved', 'Authorized for reimbursement.', 'Paid'],
    ['Rejected', 'Not authorized; correction or explanation required.', 'Terminal; use governed resubmission'],
    ['Paid', 'Reimbursement completed.', 'Terminal'],
    ['Cancelled', 'Withdrawn or voided.', 'Terminal'],
  ]),
  heading('Exceptions and controls', 1),
  table(['Scenario', 'Correct handling'], [
    ['Duplicate transaction', 'Stop submission; remove/void the duplicate and confirm it is not on another report.'],
    ['Personal portion on receipt', 'Claim only the business portion and explain the calculation.'],
    ['Foreign currency', 'Use Dataverse currency/approved conversion process; retain exchange evidence as policy requires.'],
    ['Amount differs from receipt', 'Explain tax, tip, split, or conversion; unresolved differences must be corrected before approval.'],
    ['Approver is the claimant', 'Route through the approved alternate approver; self-approval is prohibited.'],
    ['Report changed after approval', 'Do not edit silently. Cancel/reverse through the governed process and preserve audit history.'],
  ], [2600, 6760]),
];

const benefits = [
  ...cover('Benefits Administration Business Process', 'Maintaining Benefit Plans and recording Employee Enrollments', 'Benefits/HR administrators and authorized support teams'),
  ...commonIntro('Use this guide when publishing a Benefit Plan, recording an Employee election, waiver, coverage change, or end of coverage.', 'Benefits/HR administrators and authorized support teams'),
  heading('Business outcome', 1),
  p('Benefit offerings have clear effective dates and costs, while each Employee election is represented by a separate Enrollment with traceable coverage dates and status.'),
  heading('Separation of concerns', 2),
  table(['Entity', 'Represents', 'Must not be used for'], [
    ['Benefit Plan', 'The organization’s reusable offering from a provider.', 'A specific Employee’s election or waiver.'],
    ['Benefit Enrollment', 'One Employee’s selected Plan and coverage period.', 'Changing the terms of the Plan for everyone.'],
  ], [2400, 3480, 3480]),
  heading('Process A: create or update a Benefit Plan', 1),
  numbered('Search by Plan Code, Name, provider, and effective period to avoid duplicates.'),
  numbered('Enter a stable Plan Code and clear Plan Name.'),
  numbered('Enter Provider and Benefit Category.'),
  numbered('Enter Employee Cost and Employer Cost using the approved contribution period (for example, monthly). Document the period in process policy; do not mix periods.'),
  numbered('Enter Effective Start and optional Effective End.'),
  numbered('Activate the Plan only when terms are approved and enrollment-ready.'),
  ...recordExample('Example: Benefit Plan', [['Name', 'Contoso Choice Medical 2027'], ['Plan Code', 'MED-CHOICE-2027'], ['Provider', 'Contoso Health'], ['Benefit Category', 'Medical'], ['Description', 'PPO medical plan; costs shown per month'], ['Employee Cost', '$185.00'], ['Employer Cost', '$525.00'], ['Effective Start', 'January 1, 2027'], ['Effective End', 'December 31, 2027'], ['Status', 'Active']]),
  callout('Plan versioning rule', 'When costs or terms change for a new plan year, create a new effective Plan rather than overwriting a historical Plan used by existing Enrollments.', PALE_GOLD),
  heading('Process B: record an Employee election', 1),
  numbered('Confirm the Employee is eligible and the election was received through the approved enrollment channel.', 'process-a'),
  numbered('Select the Employee and active Benefit Plan.', 'process-a'),
  numbered('Select Coverage Level.', 'process-a'),
  numbered('Enter Elected On, Coverage Start, and optional Coverage End.', 'process-a'),
  numbered('Enter Employee Contribution for the Enrollment when it differs or must be snapshotted from the Plan.', 'process-a'),
  numbered('Name the record consistently, for example “Avery Chen — Contoso Choice Medical 2027 — Family”.', 'process-a'),
  numbered('Set Status Reason to Active. The approved base process does not require manager approval.', 'process-a'),
  ...recordExample('Example: active Enrollment', [['Name', 'Avery Chen — Contoso Choice Medical 2027 — Family'], ['Employee', 'Avery Chen'], ['Benefit Plan', 'Contoso Choice Medical 2027'], ['Coverage Level', 'Family'], ['Elected On', 'November 14, 2026'], ['Coverage Start', 'January 1, 2027'], ['Coverage End', 'Blank'], ['Employee Contribution', '$410.00 per month'], ['Status Reason', 'Active']]),
  heading('Process C: waiver', 1),
  p('A waiver means the Employee intentionally declined the offered coverage. Record it only when the organization requires a waiver record and the evidence exists.'),
  numbered('Confirm the Employee, plan/benefit context, and waiver evidence.', 'process-b'),
  numbered('Create or update the applicable Enrollment with the election context.', 'process-b'),
  numbered('Set Status Reason to Waived and ensure contribution is zero unless policy states otherwise.', 'process-b'),
  numbered('Retain waiver evidence in the approved system/location; do not place sensitive evidence in free text.', 'process-b'),
  heading('Process D: end or change coverage', 1),
  numbered('Confirm the qualifying event or plan-year transition and effective date.', 'process-a'),
  numbered('Set Coverage End on the existing Enrollment and change Status Reason to Ended when coverage terminates.', 'process-a'),
  numbered('For replacement coverage, create a new Enrollment linked to the new Plan/coverage level. Do not overwrite the old Enrollment.', 'process-a'),
  numbered('Validate that coverage periods do not overlap unless policy explicitly permits overlap.', 'process-a'),
  statusTable([
    ['Active', 'Coverage is current or scheduled under the Enrollment.', 'Waived or Ended'],
    ['Waived', 'Employee declined the applicable offering.', 'Terminal; create a new Enrollment for a later election'],
    ['Ended', 'Coverage period concluded.', 'Terminal; create a new Enrollment for replacement coverage'],
  ]),
  heading('Rich life-event example', 1),
  p('Avery has Employee Only medical coverage beginning January 1. After a marriage on May 10, Avery elects Family coverage effective June 1. End the original Enrollment on May 31 and set it to Ended. Create a second Enrollment with Family coverage starting June 1. This preserves both periods and their contributions.'),
  table(['Enrollment', 'Coverage level', 'Start', 'End', 'Status', 'Contribution'], [
    ['Avery — Medical — Employee Only', 'Employee Only', 'Jan 1, 2027', 'May 31, 2027', 'Ended', '$185/month'],
    ['Avery — Medical — Family', 'Family', 'Jun 1, 2027', 'Blank', 'Active', '$410/month'],
  ], [2500, 1600, 1400, 1400, 1100, 1360]),
  heading('Validation and exceptions', 1),
  table(['Condition', 'Required action'], [
    ['Plan inactive or outside effective dates', 'Do not enroll. Select the correct effective Plan or correct approved Plan setup.'],
    ['Duplicate active Enrollment', 'Stop and reconcile coverage periods before saving another active record.'],
    ['Coverage Start before Plan Effective Start', 'Correct the dates or choose the proper Plan version.'],
    ['Contribution differs from Plan', 'Confirm approved coverage-level pricing or exception; document through the governed process.'],
    ['Retroactive change', 'Require authorized evidence and preserve old values through end/new Enrollment records rather than silent overwrite.'],
  ], [2900, 6460]),
];

const docs = [
  ['HR-Agent-Sidecar-Solution-and-Entity-Guide.docx', 'HR Agent Sidecar Solution and Entity Guide', overview],
  ['HR-Agent-Sidecar-Employee-and-Organization-Process.docx', 'HR Agent Sidecar Employee and Organization Data Process', organization],
  ['HR-Agent-Sidecar-Time-Off-Process.docx', 'HR Agent Sidecar Time Off Business Process', timeoff],
  ['HR-Agent-Sidecar-Expense-Reimbursement-Process.docx', 'HR Agent Sidecar Expense Reimbursement Business Process', expense],
  ['HR-Agent-Sidecar-Benefits-Administration-Process.docx', 'HR Agent Sidecar Benefits Administration Business Process', benefits],
];

(async () => {
  for (const [filename, title, children] of docs) {
    const buffer = await Packer.toBuffer(docConfig(title, children));
    fs.writeFileSync(path.join(OUT, filename), buffer);
    console.log(`Created ${filename}`);
  }
})().catch((error) => { console.error(error); process.exit(1); });
