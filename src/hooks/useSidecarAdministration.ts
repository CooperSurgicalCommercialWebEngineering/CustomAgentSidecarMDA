import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSidecarAdministrationProvider } from '@/services/sidecar-provider-factory';
import type { SidecarConfiguration, SidecarDraft } from '@/types/sidecar-admin-models';

const provider = createSidecarAdministrationProvider();

export const sidecarQueryKeys = {
  access: ['sidecar-admin', 'access'] as const,
  configurations: ['sidecar-admin', 'configurations'] as const,
  configuration: (id: string) => ['sidecar-admin', 'configurations', id] as const,
  targetApps: ['sidecar-admin', 'target-apps'] as const,
};

function useConfigurationMutation<TInput>(
  mutationFn: (input: TInput) => Promise<SidecarConfiguration>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (configuration) => {
      queryClient.setQueryData(sidecarQueryKeys.configuration(configuration.id), configuration);
      queryClient.setQueryData<SidecarConfiguration[]>(sidecarQueryKeys.configurations, (current) => {
        if (!current) return [configuration];
        const exists = current.some((item) => item.id === configuration.id);
        return exists
          ? current.map((item) => (item.id === configuration.id ? configuration : item))
          : [configuration, ...current];
      });
    },
  });
}

export function useAdminAccess() {
  return useQuery({ queryKey: sidecarQueryKeys.access, queryFn: () => provider.getAccessContext() });
}

export function useSidecarConfigurations() {
  return useQuery({
    queryKey: sidecarQueryKeys.configurations,
    queryFn: () => provider.listConfigurations(),
  });
}

export function useSidecarConfiguration(id: string | undefined) {
  return useQuery({
    queryKey: sidecarQueryKeys.configuration(id ?? 'missing'),
    queryFn: () => (id ? provider.getConfiguration(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useTargetApps() {
  return useQuery({ queryKey: sidecarQueryKeys.targetApps, queryFn: () => provider.discoverTargetApps() });
}

export function useResolveManualTargetApp() {
  return useMutation({ mutationFn: (appId: string) => provider.resolveManualTargetApp(appId) });
}

export function useResolveAgentLink() {
  return useMutation({
    mutationFn: ({ connectionString, environmentId }: { connectionString: string; environmentId: string }) =>
      provider.resolveAgentLink(connectionString, environmentId),
  });
}

export function useDeploymentPreview() {
  return useMutation({ mutationFn: (draft: SidecarDraft) => provider.previewDeployment(draft) });
}

export function useDeploySidecar() {
  return useConfigurationMutation((draft: SidecarDraft) => provider.deploy(draft));
}

export function useValidateSidecar() {
  return useConfigurationMutation((id: string) => provider.validate(id));
}

export function useReconcileSidecar() {
  return useConfigurationMutation((id: string) => provider.reconcile(id));
}

export function useSetSidecarEnabled() {
  return useConfigurationMutation(({ id, enabled }: { id: string; enabled: boolean }) =>
    provider.setEnabled(id, enabled),
  );
}

export function useUninstallSidecar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => provider.uninstall(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: sidecarQueryKeys.configuration(id) });
      const current = queryClient.getQueryData<SidecarConfiguration[]>(sidecarQueryKeys.configurations);
      if (current) {
        queryClient.setQueryData(sidecarQueryKeys.configurations, current.filter((item) => item.id !== id));
      } else {
        void queryClient.invalidateQueries({ queryKey: sidecarQueryKeys.configurations });
      }
    },
  });
}
