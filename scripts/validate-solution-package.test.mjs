import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

import {
  CODE_APP_DIR,
  PROMPTS_COLUMN,
  readZipEntries,
  validateSolutionPackage,
} from './validate-solution-package.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (~crc) >>> 0;
}

// Minimal stored-method (no compression) ZIP writer, so the test suite needs no
// third-party dependency. The validator's reader supports stored + deflate.
function makeZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8');
    const data = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, 'utf8');
    const checksum = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    const localRecord = Buffer.concat([local, nameBuffer, data]);
    locals.push(localRecord);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, nameBuffer]));

    offset += localRecord.length;
  }

  const centralBuffer = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, centralBuffer, eocd]);
}

const VALID_SOLUTION_XML = `<?xml version="1.0"?>
<ImportExportXml>
  <SolutionManifest>
    <UniqueName>AgentSidecarCore</UniqueName>
    <RootComponents>
      <RootComponent type="300" schemaName="maftagsc_agentsidecar_4b928" behavior="0" />
    </RootComponents>
  </SolutionManifest>
</ImportExportXml>`;

const VALID_CUSTOMIZATIONS_XML = `<?xml version="1.0"?>
<ImportExportXml>
  <Entities>
    <Entity>
      <Name>maftagsc_sidecarconfiguration</Name>
      <attributes>
        <attribute PhysicalName="${PROMPTS_COLUMN}"><Type>ntext</Type></attribute>
      </attributes>
    </Entity>
  </Entities>
</ImportExportXml>`;

function validFiles() {
  return [
    { name: 'solution.xml', content: VALID_SOLUTION_XML },
    { name: 'customizations.xml', content: VALID_CUSTOMIZATIONS_XML },
    { name: `${CODE_APP_DIR}index.html`, content: '<!doctype html><title>Agent Sidecar</title>' },
    {
      name: `${CODE_APP_DIR}assets/index-abc123.js`,
      content: 'console.log("admin app");const t="Suggested prompts";const u="Prompt text sent to the agent";',
    },
    {
      name: 'WebResources/maftagsc_copilotagentSidePanehtml71CEA068',
      content: '<div class="prompt-chip">Summarize</div>',
    },
  ];
}

function passIds(result) {
  return new Set(result.checks.filter((check) => check.pass).map((check) => check.id));
}

function failIds(result) {
  return new Set(result.checks.filter((check) => !check.pass).map((check) => check.id));
}

test('a complete AgentSidecarCore package passes every check', () => {
  const result = validateSolutionPackage(makeZip(validFiles()));
  assert.equal(result.ok, true, JSON.stringify(result.checks, null, 2));
});

test('the HRAgentSidecar reference name is rejected', () => {
  const files = validFiles();
  files[0].content = VALID_SOLUTION_XML.replace('AgentSidecarCore', 'HRAgentSidecar');
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  const failed = failIds(result);
  assert.ok(failed.has('solution-name'));
  assert.ok(failed.has('not-hr-reference'));
});

test('a missing admin Code App root component is caught', () => {
  const files = validFiles();
  files[0].content = VALID_SOLUTION_XML.replace(/<RootComponents>[\s\S]*<\/RootComponents>/, '<RootComponents />');
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('admin-app-root-component'));
});

test('missing Code App package files are caught', () => {
  const files = validFiles().filter((file) => !file.name.startsWith(CODE_APP_DIR));
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('canvasapp-package-files'));
});

test('a missing prompts column is caught', () => {
  const files = validFiles();
  files[1].content = VALID_CUSTOMIZATIONS_XML.replace(new RegExp(PROMPTS_COLUMN, 'g'), 'maftagsc_other');
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('prompts-column'));
});

test('a bundled app without the prompts editor is caught', () => {
  const files = validFiles();
  const appAsset = files.find((file) => file.name.endsWith('.js') && file.name.startsWith(CODE_APP_DIR));
  appAsset.content = 'console.log("stale pre-prompts build");';
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('prompts-editor-bundled'));
});

test('a side-pane without prompt-chip runtime is caught', () => {
  const files = validFiles();
  const sidePane = files.find((file) => /agentSidePane/i.test(file.name));
  sidePane.content = '<div>no chips here</div>';
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('prompt-chip-runtime'));
});

test('a non-ZIP buffer fails the readability check', () => {
  const result = validateSolutionPackage(Buffer.from('this is not a zip file'));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('zip-readable'));
});

test('the reader round-trips stored entries', () => {
  const entries = readZipEntries(makeZip(validFiles()));
  assert.ok(entries.has('solution.xml'));
  assert.match(entries.get('solution.xml').toString('utf8'), /AgentSidecarCore/);
});

// Regression guard: the currently checked-in package must be recognised as
// incomplete (missing prompts column + editor) so it cannot ship by accident.
// Skips cleanly if the artifact is not present in a given checkout.
test('the checked-in AgentSidecarCore.zip is detected as incomplete', () => {
  const zipPath = resolve(here, '..', 'solution-core', 'AgentSidecarCore.zip');
  if (!existsSync(zipPath)) {
    return;
  }
  const result = validateSolutionPackage(readFileSync(zipPath));
  const failed = failIds(result);
  const passed = passIds(result);
  // It IS AgentSidecarCore and DOES contain the admin app...
  assert.ok(passed.has('solution-name'));
  assert.ok(passed.has('admin-app-root-component'));
  assert.ok(passed.has('canvasapp-package-files'));
  // ...but the prompts feature was never fully packaged into it.
  assert.equal(result.ok, false);
  assert.ok(failed.has('prompts-column'));
  assert.ok(failed.has('prompts-editor-bundled'));
});
