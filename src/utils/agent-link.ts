import type { AgentResolution } from '@/types/sidecar-admin-models';

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const schemaPattern = /^[A-Za-z][A-Za-z0-9_]{2,199}$/;

function valueAfterSegment(segments: string[], segment: string): string | undefined {
  const index = segments.findIndex((item) => item.toLowerCase() === segment.toLowerCase());
  return index >= 0 ? segments[index + 1] : undefined;
}

export function parseCopilotStudioConnectionString(connectionString: string, environmentId: string): AgentResolution {
  const value = connectionString.trim();
  if (/<iframe\b|<script\b|<html\b/i.test(value)) {
    throw new Error('Paste the Microsoft 365 Agents SDK connection string from Channels > Web app, not the public iframe embed code.');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Paste a valid Microsoft 365 Agents SDK connection string from Channels > Web app.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('The Agents SDK connection string must use HTTPS.');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const normalizedEnvironmentId = environmentId.trim();
  const schemaName =
    url.searchParams.get('agentName') ??
    url.searchParams.get('agentname') ??
    valueAfterSegment(segments, 'bots');

  if (!guidPattern.test(normalizedEnvironmentId)) {
    throw new Error('Enter a valid Environment ID from Copilot Studio Settings > Advanced > Metadata.');
  }
  if (!segments.some((segment) => segment.toLowerCase() === 'conversations')) {
    throw new Error('Paste the Microsoft 365 Agents SDK connection string ending in /conversations, not a public web chat URL.');
  }
  if (!schemaName || !schemaPattern.test(schemaName)) {
    throw new Error('The Agents SDK connection string does not contain a valid /bots/{agentName}/ segment.');
  }

  const displayName = schemaName
    .replace(/^[a-z0-9]+_/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  return {
    displayName: displayName || schemaName,
    schemaName,
    environmentId: normalizedEnvironmentId,
    published: true,
  };
}

export function isGuid(value: string): boolean {
  return guidPattern.test(value.trim());
}
