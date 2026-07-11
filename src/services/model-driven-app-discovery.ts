import { AppmodulecomponentsService } from '@/generated/services/AppmodulecomponentsService';
import { EntitiesService } from '@/generated/services/EntitiesService';
import { SystemformsService } from '@/generated/services/SystemformsService';
import type { Entities } from '@/generated/models/EntitiesModel';
import type { Systemforms } from '@/generated/models/SystemformsModel';

type Result<T> = { data?: T; error?: unknown };
export type DiscoveredForm = Pick<Systemforms, 'formid' | 'name' | 'objecttypecode' | 'formxml'>;

interface AppEntityComponent {
  objectid?: string;
}

// The OOB `entity` table does not support Retrieve-by-id; only RetrieveMultiple
// (a filtered list) is supported. Resolve entity metadata in batches with an
// `entityid eq ... or ...` filter and keep each batch small to bound URL length.
const ENTITY_CHUNK_SIZE = 20;

export interface ModelDrivenAppDiscoveryDataSource {
  listEntityComponents(appIdUnique: string): Promise<Result<AppEntityComponent[]>>;
  listEntities(metadataIds: string[]): Promise<Result<Entities[]>>;
  listActiveMainForms(logicalNames: string[]): Promise<Result<DiscoveredForm[]>>;
}

export interface DiscoveredAppForms {
  formsByTable: Map<string, DiscoveredForm[]>;
  tableDisplayNames: Map<string, string>;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? 'Unknown Dataverse error');
}

function data<T>(result: Result<T>, operation: string): T {
  if (result.error) throw new Error(`${operation} failed: ${message(result.error)}`);
  if (result.data === undefined) throw new Error(`${operation} returned no data.`);
  return result.data;
}

function odataString(value: string): string {
  return value.replace(/'/g, "''");
}

const dataverseSource: ModelDrivenAppDiscoveryDataSource = {
  listEntityComponents: (appIdUnique) => AppmodulecomponentsService.getAll({
    select: ['objectid'],
    filter: `_appmoduleidunique_value eq ${appIdUnique} and componenttype eq 1`,
    top: 5000,
  }),
  listEntities: (metadataIds) => EntitiesService.getAll({
    select: ['entityid', 'logicalname', 'originallocalizedname'],
    filter: metadataIds.map((id) => `entityid eq ${id}`).join(' or '),
    top: 5000,
  }),
  listActiveMainForms: (logicalNames) => SystemformsService.getAll({
    select: ['formid', 'name', 'objecttypecode', 'formxml', 'type', 'formactivationstate'],
    filter: `type eq 2 and formactivationstate eq 1 and componentstate eq 0 and (${logicalNames
      .map((logicalName) => `objecttypecode eq '${odataString(logicalName)}'`)
      .join(' or ')})`,
    top: 5000,
  }),
};

export async function discoverAppForms(
  appIdUnique: string,
  source: ModelDrivenAppDiscoveryDataSource = dataverseSource,
): Promise<DiscoveredAppForms> {
  const components = data(await source.listEntityComponents(appIdUnique), 'Discover app tables');
  const metadataIds = [...new Set(components.map((item) => item.objectid).filter((id): id is string => Boolean(id)))];
  const entities: Entities[] = [];
  for (let index = 0; index < metadataIds.length; index += ENTITY_CHUNK_SIZE) {
    const chunk = metadataIds.slice(index, index + ENTITY_CHUNK_SIZE);
    entities.push(...data(await source.listEntities(chunk), 'Resolve app table metadata'));
  }
  const discoveredEntities = entities.filter((entity): entity is Entities & { logicalname: string } => Boolean(entity.logicalname));
  const logicalNames = [...new Set(discoveredEntities.map((entity) => entity.logicalname))];
  const tableDisplayNames = new Map(discoveredEntities.map((entity) => [
    entity.logicalname,
    entity.originallocalizedname ?? entity.logicalname,
  ]));
  const formsByTable = new Map<string, DiscoveredForm[]>();

  if (!logicalNames.length) return { formsByTable, tableDisplayNames };

  const forms = data(await source.listActiveMainForms(logicalNames), 'Discover active main forms');
  for (const form of forms) {
    if (!form.objecttypecode || !logicalNames.includes(form.objecttypecode)) continue;
    formsByTable.set(form.objecttypecode, [...(formsByTable.get(form.objecttypecode) ?? []), form]);
  }
  return { formsByTable, tableDisplayNames };
}