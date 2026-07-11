import { createMockSidecarAdministrationProvider } from '@/services/mock-sidecar-admin-provider';
import type { SidecarAdministrationProvider } from '@/services/sidecar-admin-contracts';

export function createSidecarAdministrationProvider(): SidecarAdministrationProvider {
  if (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'test') {
    return createMockSidecarAdministrationProvider();
  }

  const provider = import('@/services/real-sidecar-admin-provider')
    .then(({ createRealSidecarAdministrationProvider }) => createRealSidecarAdministrationProvider());

  return {
    getAccessContext: () => provider.then((value) => value.getAccessContext()),
    listConfigurations: () => provider.then((value) => value.listConfigurations()),
    getConfiguration: (id) => provider.then((value) => value.getConfiguration(id)),
    discoverTargetApps: () => provider.then((value) => value.discoverTargetApps()),
    resolveManualTargetApp: (appId) => provider.then((value) => value.resolveManualTargetApp(appId)),
    resolveAgentLink: (connectionString, environmentId) => provider.then((value) => value.resolveAgentLink(connectionString, environmentId)),
    previewDeployment: (draft) => provider.then((value) => value.previewDeployment(draft)),
    deploy: (draft) => provider.then((value) => value.deploy(draft)),
    validate: (id) => provider.then((value) => value.validate(id)),
    reconcile: (id) => provider.then((value) => value.reconcile(id)),
    setEnabled: (id, enabled) => provider.then((value) => value.setEnabled(id, enabled)),
    uninstall: (id) => provider.then((value) => value.uninstall(id)),
  };
}
