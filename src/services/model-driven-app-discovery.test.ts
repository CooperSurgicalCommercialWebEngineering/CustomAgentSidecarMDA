import { describe, expect, it, vi } from 'vitest';
import { discoverAppForms, type ModelDrivenAppDiscoveryDataSource } from '@/services/model-driven-app-discovery';

// The generated services statically import '@microsoft/power-apps/data', which is
// not resolvable in the test runtime. These tests inject their own data source, so
// the real generated clients are never invoked — stub the modules to keep the pure
// discovery logic importable in isolation.
vi.mock('@/generated/services/AppmodulecomponentsService', () => ({ AppmodulecomponentsService: {} }));
vi.mock('@/generated/services/EntitiesService', () => ({ EntitiesService: {} }));
vi.mock('@/generated/services/SystemformsService', () => ({ SystemformsService: {} }));

describe('discoverAppForms', () => {
  it('discovers active main forms from app entity components when no form components exist', async () => {
    const entityIds = Array.from({ length: 7 }, (_, index) => `00000000-0000-0000-0000-00000000000${index}`);
    const logicalNames = entityIds.map((_, index) => `contoso_table${index}`);
    const source: ModelDrivenAppDiscoveryDataSource = {
      listEntityComponents: vi.fn().mockResolvedValue({
        data: entityIds.map((objectid) => ({ objectid })),
      }),
      listEntities: vi.fn().mockImplementation(async (metadataIds: string[]) => ({
        data: metadataIds.map((metadataId) => {
          const index = entityIds.indexOf(metadataId);
          return {
            entityid: metadataId,
            logicalname: logicalNames[index],
            originallocalizedname: `Table ${index}`,
            componentstate: 0,
            overwritetime: '',
            solutionid: '',
          };
        }),
      })),
      listActiveMainForms: vi.fn().mockResolvedValue({
        data: logicalNames.map((logicalName, index) => ({
          formid: `10000000-0000-0000-0000-00000000000${index}`,
          name: `${logicalName} main form`,
          objecttypecode: logicalName,
          formxml: '<form />',
        })),
      }),
    };

    const result = await discoverAppForms('20000000-0000-0000-0000-000000000000', source);

    expect(result.formsByTable.size).toBe(7);
    expect(result.tableDisplayNames.get(logicalNames[0])).toBe('Table 0');
    expect(source.listEntityComponents).toHaveBeenCalledOnce();
    expect(source.listEntities).toHaveBeenCalledOnce();
    expect(source.listEntities).toHaveBeenCalledWith(entityIds);
    expect(source.listActiveMainForms).toHaveBeenCalledWith(logicalNames);
  });

  it('ignores forms for tables that are not app entity components', async () => {
    const source: ModelDrivenAppDiscoveryDataSource = {
      listEntityComponents: async () => ({ data: [{ objectid: 'entity-metadata-id' }] }),
      listEntities: async () => ({
        data: [{
          entityid: 'entity-metadata-id', logicalname: 'contoso_inapp', originallocalizedname: 'In App',
          componentstate: 0, overwritetime: '', solutionid: '',
        }],
      }),
      listActiveMainForms: async () => ({
        data: [
          { formid: 'form-1', name: 'In App', objecttypecode: 'contoso_inapp', formxml: '' },
          { formid: 'form-2', name: 'Outside', objecttypecode: 'contoso_outside', formxml: '' },
        ],
      }),
    };

    const result = await discoverAppForms('app-id', source);

    expect([...result.formsByTable.keys()]).toEqual(['contoso_inapp']);
  });
});