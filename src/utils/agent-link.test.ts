import { describe, expect, it } from 'vitest';
import { isGuid, parseCopilotStudioConnectionString } from '@/utils/agent-link';

const environmentId = 'f9b87f8b-0abf-e629-affb-b13195d1ed14';
const connectionString = 'https://1234567890.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/contoso_FieldGuide/conversations?api-version=2022-03-01-preview';

describe('parseCopilotStudioConnectionString', () => {
  it('resolves the agent schema from an Agents SDK connection string and uses the supplied environment ID', () => {
    expect(parseCopilotStudioConnectionString(connectionString, environmentId)).toEqual({
      displayName: 'Field Guide',
      schemaName: 'contoso_FieldGuide',
      environmentId,
      published: true,
    });
  });

  it('rejects non-HTTPS links', () => {
    expect(() => parseCopilotStudioConnectionString(connectionString.replace('https:', 'http:'), environmentId)).toThrow('must use HTTPS');
  });

  it('rejects an invalid separately supplied environment ID', () => {
    expect(() => parseCopilotStudioConnectionString(connectionString, 'not-a-guid')).toThrow('valid Environment ID');
  });

  it('rejects a public web chat URL without the conversations endpoint', () => {
    expect(() => parseCopilotStudioConnectionString('https://copilotstudio.microsoft.com/bots/contoso_FieldGuide/webchat', environmentId)).toThrow('ending in /conversations');
  });

  it('rejects public iframe embed HTML with actionable guidance', () => {
    expect(() => parseCopilotStudioConnectionString('<iframe src="https://example.com"></iframe>', environmentId)).toThrow('not the public iframe embed code');
  });
});

describe('isGuid', () => {
  it('accepts trimmed GUIDs and rejects arbitrary text', () => {
    expect(isGuid(` ${environmentId} `)).toBe(true);
    expect(isGuid('not-a-guid')).toBe(false);
  });
});
