import { useNavigate, useParams } from 'react-router-dom';
import { SidecarDetails } from '@/components/SidecarDetails/SidecarDetails';
import {
  useReconcileSidecar,
  useSetSidecarEnabled,
  useSidecarConfiguration,
  useUninstallSidecar,
  useValidateSidecar,
} from '@/hooks/useSidecarAdministration';

export function SidecarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const configuration = useSidecarConfiguration(id);
  const validate = useValidateSidecar();
  const reconcile = useReconcileSidecar();
  const setEnabled = useSetSidecarEnabled();
  const uninstall = useUninstallSidecar();
  const error = [configuration.error, validate.error, reconcile.error, setEnabled.error, uninstall.error]
    .find((item): item is Error => item instanceof Error);

  return (
    <SidecarDetails
      configuration={configuration.data}
      loading={configuration.isLoading}
      busy={validate.isPending || reconcile.isPending || setEnabled.isPending || uninstall.isPending}
      error={error?.message}
      onBack={() => navigate('/')}
      onValidate={async () => { if (id) await validate.mutateAsync(id); }}
      onReconcile={async () => { if (id) await reconcile.mutateAsync(id); }}
      onSetEnabled={async (enabled) => { if (id) await setEnabled.mutateAsync({ id, enabled }); }}
      onUninstall={async () => { if (id) { await uninstall.mutateAsync(id); navigate('/'); } }}
    />
  );
}
