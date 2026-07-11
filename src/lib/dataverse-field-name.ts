export const DATAVERSE_PREFIX = 'maftagsc_';

export function toDataverseFieldName(key: string | undefined | null): string | undefined {
  if (!key) return undefined;
  if (key.startsWith(DATAVERSE_PREFIX)) return key.toLowerCase();
  return `${DATAVERSE_PREFIX}${key.toLowerCase()}`;
}
