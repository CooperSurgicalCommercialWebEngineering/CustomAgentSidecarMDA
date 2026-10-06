// Validates that a packed/exported AgentSidecarCore solution ZIP is a complete,
// shippable deliverable — i.e. it is the AgentSidecarCore solution (NOT the
// HRAgentSidecar reference), it carries the administration Code App, the
// prompts column, the bundled prompts editor, and the runtime prompt chips.
//
// This exists because two different solutions live in this repo:
//   - AgentSidecarCore  -> the reusable customer deliverable (has the admin app)
//   - HRAgentSidecar    -> the HR reference (the unpacked `solution/` folder)
// Packing the wrong one, or exporting AgentSidecarCore before the Code App and
// `maftagsc_prompts` column are pushed, produces a package that silently drops
// the admin app or the prompts feature. This validator turns that packaging
// mistake into a detectable build failure.
//
// Dependency-free on purpose: CI installs with --frozen-lockfile, so this reads
// the ZIP with only Node built-ins (no jszip/adm-zip).

import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

export const EXPECTED_SOLUTION_NAME = 'AgentSidecarCore';
export const REFERENCE_SOLUTION_NAME = 'HRAgentSidecar';
export const CODE_APP_SCHEMA = 'maftagsc_agentsidecar_4b928';
export const PROMPTS_COLUMN = 'maftagsc_prompts';
export const CODE_APP_DIR = `CanvasApps/${CODE_APP_SCHEMA}_CodeAppPackages/`;
export const PROMPTS_EDITOR_MARKERS = ['Suggested prompts', 'Prompt text sent to the agent'];
export const PROMPT_CHIP_MARKER = 'prompt-chip';

function findEndOfCentralDirectory(buffer) {
  const minimumRecord = 22;
  const maxCommentScan = Math.min(buffer.length, minimumRecord + 0xffff);
  for (let offset = buffer.length - minimumRecord; offset >= buffer.length - maxCommentScan; offset -= 1) {
    if (offset < 0) break;
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

// Minimal ZIP reader for classic (non-ZIP64) archives using stored (0) or
// deflate (8) compression — which is what pac-generated solution ZIPs use.
export function readZipEntries(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new Error('Expected a Buffer');
  const eocd = findEndOfCentralDirectory(buffer);
  if (eocd < 0) throw new Error('Not a ZIP archive (end-of-central-directory record not found)');

  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (entryCount === 0xffff || centralOffset === 0xffffffff) {
    throw new Error('ZIP64 archives are not supported by this validator');
  }

  const entries = new Map();
  let pointer = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(pointer) !== CENTRAL_SIGNATURE) {
      throw new Error(`Corrupt central directory record at entry ${index}`);
    }
    const method = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 32);
    const commentLength = buffer.readUInt16LE(pointer + 34);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.toString('utf8', pointer + 46, pointer + 46 + nameLength);

    if (buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) {
      throw new Error(`Corrupt local header for "${name}"`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    let content;
    if (method === 0) content = Buffer.from(raw);
    else if (method === 8) content = inflateRawSync(raw);
    else throw new Error(`Unsupported compression method ${method} for "${name}"`);

    entries.set(name, content);
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function extractUniqueName(solutionXml) {
  if (!solutionXml) return null;
  const match = /<UniqueName>([^<]+)<\/UniqueName>/.exec(solutionXml);
  return match ? match[1].trim() : null;
}

function rootComponents(solutionXml) {
  if (!solutionXml) return [];
  return solutionXml.match(/<RootComponent\b[^>]*\/?>/g) ?? [];
}

// Returns { ok, checks: [{ id, label, pass, detail }] }.
export function validateSolutionPackage(buffer) {
  const checks = [];
  const add = (id, label, pass, detail = '') => checks.push({ id, label, pass: Boolean(pass), detail });

  let entries;
  try {
    entries = readZipEntries(buffer);
  } catch (error) {
    add('zip-readable', 'Package is a readable solution ZIP', false, error.message);
    return { ok: false, checks };
  }
  add('zip-readable', 'Package is a readable solution ZIP', entries.size > 0, `${entries.size} entries`);

  const names = [...entries.keys()];
  const textOf = (name) => {
    const content = entries.get(name);
    return content ? content.toString('utf8') : null;
  };

  const solutionXml = textOf('solution.xml');
  add('solution-xml', 'solution.xml is present and non-empty', Boolean(solutionXml && solutionXml.length));

  const customizationsXml = textOf('customizations.xml');
  add('customizations-xml', 'customizations.xml is present and non-empty', Boolean(customizationsXml && customizationsXml.length));

  const uniqueName = extractUniqueName(solutionXml);
  add(
    'solution-name',
    `Solution unique name is ${EXPECTED_SOLUTION_NAME}`,
    uniqueName === EXPECTED_SOLUTION_NAME,
    `found: ${uniqueName ?? 'none'}`,
  );
  add(
    'not-hr-reference',
    `Package is not the ${REFERENCE_SOLUTION_NAME} reference solution`,
    uniqueName !== REFERENCE_SOLUTION_NAME,
    uniqueName === REFERENCE_SOLUTION_NAME ? 'this is the HR reference, which has no admin Code App' : '',
  );

  const adminRoot = rootComponents(solutionXml).some(
    (component) => /type="300"/.test(component) && component.includes(CODE_APP_SCHEMA),
  );
  add(
    'admin-app-root-component',
    `Admin Code App is a root component (type 300, ${CODE_APP_SCHEMA})`,
    adminRoot,
  );

  const codeAppFiles = names.filter((name) => name.startsWith(CODE_APP_DIR));
  const hasIndex = codeAppFiles.some((name) => name.endsWith('/index.html'));
  const jsAssets = codeAppFiles.filter((name) => name.endsWith('.js'));
  const allNonEmpty = codeAppFiles.length > 0 && codeAppFiles.every((name) => (entries.get(name)?.length ?? 0) > 0);
  add(
    'canvasapp-package-files',
    'Code App package files are present and non-empty',
    hasIndex && jsAssets.length > 0 && allNonEmpty,
    `${codeAppFiles.length} files under ${CODE_APP_DIR}`,
  );

  const hasColumn = Boolean(
    (customizationsXml && customizationsXml.includes(PROMPTS_COLUMN)) ||
      (solutionXml && solutionXml.includes(PROMPTS_COLUMN)),
  );
  add('prompts-column', `Prompts column (${PROMPTS_COLUMN}) is in the package`, hasColumn);

  const editorPresent = jsAssets.some((name) => {
    const content = entries.get(name)?.toString('utf8') ?? '';
    return PROMPTS_EDITOR_MARKERS.some((marker) => content.includes(marker));
  });
  add(
    'prompts-editor-bundled',
    'Prompts editor is in the bundled Code App',
    editorPresent,
    editorPresent ? '' : 'the bundled app looks like a pre-prompts build',
  );

  const sidePaneNames = names.filter((name) => /agentsidepane/i.test(name));
  const chipPresent = sidePaneNames.some((name) => (entries.get(name)?.toString('utf8') ?? '').includes(PROMPT_CHIP_MARKER));
  add(
    'prompt-chip-runtime',
    'Prompt-chip runtime is in the side-pane web resource',
    chipPresent,
  );

  return { ok: checks.every((check) => check.pass), checks };
}

function runCli() {
  const target = process.argv[2] ?? 'solution-core/AgentSidecarCore.zip';
  let buffer;
  try {
    buffer = readFileSync(target);
  } catch (error) {
    console.error(`\u2717 Cannot read solution package: ${target}\n  ${error.message}`);
    process.exit(2);
  }

  const { ok, checks } = validateSolutionPackage(buffer);
  console.log(`\nValidating solution package: ${target}\n`);
  for (const check of checks) {
    const mark = check.pass ? 'PASS' : 'FAIL';
    const detail = check.detail ? `  (${check.detail})` : '';
    console.log(`  ${mark}  ${check.label}${detail}`);
  }

  const failed = checks.filter((check) => !check.pass);
  console.log(`\n${ok ? 'OK' : 'FAILED'}: ${checks.length - failed.length}/${checks.length} checks passed.\n`);

  if (!ok) {
    console.error(
      'This package is NOT ready to ship.\n' +
        'Export AgentSidecarCore from Dataverse after `pac code push -s AgentSidecarCore` and adding\n' +
        'the maftagsc_prompts column. See HANDOFF.md and docs/prompts-feature-handoff.md.',
    );
    process.exit(1);
  }
}

const invokedDirectly =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) runCli();
