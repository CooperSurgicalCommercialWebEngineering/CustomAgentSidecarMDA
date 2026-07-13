import { Button, ProgressBar, Text, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowDownloadRegular } from '@fluentui/react-icons';
import type { SidecarProgress } from '@/types/sidecar-admin-models';

const phaseLabels: Record<string, string> = {
  forms: 'Updating forms',
  publish: 'Publishing form changes',
  readback: 'Verifying deployed forms',
  finalize: 'Finalizing configuration',
  cleanup: 'Cleaning up',
  rollback: 'Rolling back',
  result: 'Completed',
};

const useStyles = makeStyles({
  banner: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalL, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorBrandStroke1}` },
  headline: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
  muted: { color: tokens.colorNeutralForeground2 },
  warn: { color: tokens.colorPaletteMarigoldForeground2 },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
});

interface OperationProgressProps {
  active: boolean;
  progress?: SidecarProgress;
  errorCount: number;
  downloadable: boolean;
  onDownload: () => void;
  activeNote?: string;
  idleNote?: string;
}

export function OperationProgress({ active, progress, errorCount, downloadable, onDownload, activeNote, idleNote }: OperationProgressProps) {
  const styles = useStyles();
  if (!active && !downloadable) return null;

  const total = progress?.total ?? 0;
  const value = active && progress && total > 0 ? Math.min(progress.current / total, 1) : undefined;
  const phase = progress ? (phaseLabels[progress.phase] ?? progress.phase) : undefined;

  return (
    <div className={styles.banner} role="status" aria-live="assertive">
      <div className={styles.headline}>
        <Text weight="semibold">{active ? (phase ?? 'Working…') : 'Operation finished'}</Text>
        {downloadable && (
          <Button size="small" appearance="secondary" icon={<ArrowDownloadRegular />} onClick={onDownload}>
            Download report{errorCount > 0 ? ` (${errorCount} issue${errorCount === 1 ? '' : 's'})` : ''}
          </Button>
        )}
      </div>
      {active && (
        <>
          <ProgressBar value={value} thickness="large" />
          {progress && total > 0 && (
            <Text size={200} className={styles.muted}>
              {progress.phase === 'forms' ? `Form ${Math.min(progress.current + (progress.current < total ? 1 : 0), total)} of ${total}` : `${progress.current} of ${total}`} — {progress.label}
            </Text>
          )}
          {activeNote && <Text size={200} className={styles.muted}>{activeNote}</Text>}
        </>
      )}
      {!active && idleNote && <Text size={200} className={styles.muted}>{idleNote}</Text>}
      {errorCount > 0 && <Text size={200} className={styles.warn}>{errorCount} issue{errorCount === 1 ? '' : 's'} recorded — download the report for details.</Text>}
    </div>
  );
}
