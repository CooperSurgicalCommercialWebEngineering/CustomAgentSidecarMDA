import { Badge } from '@fluentui/react-components';
import type { SidecarHealthState, SidecarLifecycleState } from '@/types/sidecar-admin-models';

const healthAppearance: Record<SidecarHealthState, { label: string; color: 'success' | 'warning' | 'danger' | 'informative' }> = {
  healthy: { label: 'Healthy', color: 'success' },
  warning: { label: 'Needs review', color: 'warning' },
  critical: { label: 'Action required', color: 'danger' },
  notValidated: { label: 'Not validated', color: 'informative' },
};

const lifecycleAppearance: Record<SidecarLifecycleState, { label: string; color: 'brand' | 'warning' | 'subtle' }> = {
  draft: { label: 'Draft', color: 'subtle' },
  deployed: { label: 'Deployed', color: 'brand' },
  disabled: { label: 'Disabled', color: 'subtle' },
  drift: { label: 'Drift detected', color: 'warning' },
};

export function HealthBadge({ state }: { state: SidecarHealthState }) {
  const appearance = healthAppearance[state];
  return <Badge appearance="filled" color={appearance.color}>{appearance.label}</Badge>;
}

export function LifecycleBadge({ state }: { state: SidecarLifecycleState }) {
  const appearance = lifecycleAppearance[state];
  return <Badge appearance="tint" color={appearance.color}>{appearance.label}</Badge>;
}
