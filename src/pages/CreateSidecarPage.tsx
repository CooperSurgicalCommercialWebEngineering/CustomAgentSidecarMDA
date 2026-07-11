import { useNavigate } from 'react-router-dom';
import { SidecarWizard } from '@/components/SidecarWizard/SidecarWizard';
import {
  useDeploySidecar,
  useDeploymentPreview,
  useResolveAgentLink,
  useResolveManualTargetApp,
  useTargetApps,
} from '@/hooks/useSidecarAdministration';

export function CreateSidecarPage() {
  const navigate = useNavigate();
  const targetApps = useTargetApps();
  const resolveManual = useResolveManualTargetApp();
  const resolveAgent = useResolveAgentLink();
  const preview = useDeploymentPreview();
  const deploy = useDeploySidecar();
  const error = [targetApps.error, resolveManual.error, resolveAgent.error, preview.error, deploy.error]
    .find((item): item is Error => item instanceof Error);

  return (
    <SidecarWizard
      apps={targetApps.data}
      appsLoading={targetApps.isLoading}
      busy={resolveManual.isPending || resolveAgent.isPending || preview.isPending || deploy.isPending}
      error={error?.message}
      onCancel={() => navigate('/')}
      onResolveManualApp={(appId) => resolveManual.mutateAsync(appId)}
      onResolveAgent={(connectionString, environmentId) => resolveAgent.mutateAsync({ connectionString, environmentId })}
      onPreview={(draft) => preview.mutateAsync(draft)}
      onDeploy={async (draft) => {
        const configuration = await deploy.mutateAsync(draft);
        navigate(`/sidecars/${configuration.id}`);
      }}
    />
  );
}
