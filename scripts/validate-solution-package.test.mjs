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
      <RootComponent type="80" schemaName="cr27f_AgentSidecarAdministration" behavior="0" />
      <RootComponent type="62" schemaName="cr27f_AgentSidecarAdministration" behavior="0" />
      <RootComponent type="61" schemaName="maftagsc_/copilot/adminLauncher.html" behavior="0" />
      <RootComponent type="61" schemaName="maftagsc_/copilot/promptEditor.html" behavior="0" />
      <RootComponent type="61" schemaName="maftagsc_/copilot/authRedirect.html" behavior="0" />
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
  <AppModuleSiteMaps>
    <AppModuleSiteMap>
      <SiteMapUniqueName>cr27f_AgentSidecarAdministration</SiteMapUniqueName>
      <SiteMap>
        <SubArea Url="$webresource:maftagsc_/copilot/promptEditor.html" />
        <SubArea Url="$webresource:maftagsc_/copilot/adminLauncher.html" />
      </SiteMap>
    </AppModuleSiteMap>
  </AppModuleSiteMaps>
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
    {
      name: 'WebResources/maftagsc_copilotpromptEditorhtml0B217A23',
      content: '<script>getCurrentAppProperties();const field="maftagsc_prompts";</script>',
    },
    {
      name: 'WebResources/maftagsc_copilotauthRedirecthtml1B88ACD6',
      content: '<script>handleRedirectPromise();localStorage.getItem("maftagsc.sidecar.authRequest");const start="sidecarAuth";</script>',
    },
    {
      name: 'WebResources/maftagsc_copilotadminLauncherhtmlCC61283A',
      content: '<script>const schema="maftagsc_agentsidecar_4b928";const field="appopenuri";const host="apps.powerapps.com";</script>',
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
  files[0].content = VALID_SOLUTION_XML.replace(
    '<RootComponent type="300" schemaName="maftagsc_agentsidecar_4b928" behavior="0" />',
    '',
  );
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('admin-app-root-component'));
});

test('a missing central Admin model-driven app root component is caught', () => {
  const files = validFiles();
  files[0].content = VALID_SOLUTION_XML.replace(
    '<RootComponent type="80" schemaName="cr27f_AgentSidecarAdministration" behavior="0" />',
    '',
  );
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('admin-model-driven-app-root-component'));
});

test('a missing central Admin app sitemap is caught', () => {
  const files = validFiles();
  files[0].content = VALID_SOLUTION_XML.replace(
    '<RootComponent type="62" schemaName="cr27f_AgentSidecarAdministration" behavior="0" />',
    '',
  );
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('admin-model-driven-app-sitemap'));
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

test('a missing Xrm.WebApi prompt editor is caught', () => {
  const files = validFiles().filter((file) => !/promptEditor/i.test(file.name));
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('prompt-editor-web-resource'));
});

test('a missing MSAL authentication redirect is caught', () => {
  const files = validFiles().filter((file) => !/authRedirect/i.test(file.name));
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('auth-redirect-web-resource'));
});

test('a missing portable Setup launcher is caught', () => {
  const files = validFiles().filter((file) => !/adminLauncher/i.test(file.name));
  files[0].content = files[0].content.replace(
    '<RootComponent type="61" schemaName="maftagsc_/copilot/adminLauncher.html" behavior="0" />',
    '',
  );
  const result = validateSolutionPackage(makeZip(files));
  assert.equal(result.ok, false);
  assert.ok(failIds(result).has('admin-launcher-web-resource'));
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

// Regression guard: the currently checked-in package predates centralized
// administration and must not be mistaken for the 1.0.0.5 release artifact.
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
  // ...but it does not contain the centralized administration surfaces.
  assert.equal(result.ok, false);
  assert.ok(failed.has('admin-model-driven-app-root-component'));
  assert.ok(failed.has('admin-model-driven-app-sitemap'));
  assert.ok(failed.has('prompt-editor-web-resource'));
  assert.ok(failed.has('auth-redirect-web-resource'));
  assert.ok(failed.has('admin-launcher-web-resource'));
});
