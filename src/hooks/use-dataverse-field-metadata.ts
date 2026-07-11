import { useQuery } from '@tanstack/react-query';
import { getFieldMetadata } from '@/services/field-metadata-cache';

export function useDataverseFieldMetadata(tableLogicalName: string, fieldLogicalName: string) {
  return useQuery({
    queryKey: ['fieldMetadata', tableLogicalName, fieldLogicalName],
    enabled: Boolean(tableLogicalName && fieldLogicalName),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: () => getFieldMetadata(tableLogicalName, fieldLogicalName),
  });
}
