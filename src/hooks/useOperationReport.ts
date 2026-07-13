import { useCallback, useRef, useState } from 'react';
import type { SidecarProgress, SidecarProgressCallback } from '@/types/sidecar-admin-models';

export interface OperationLogEntry {
  time: string;
  phase: string;
  current: number;
  total: number;
  label: string;
  status: 'progress' | 'success' | 'error';
  message?: string;
}

export interface OperationReport {
  progress?: SidecarProgress;
  log: OperationLogEntry[];
  errorCount: number;
  hasEntries: boolean;
  onProgress: SidecarProgressCallback;
  begin: (operation: string, context?: Record<string, unknown>) => void;
  recordSuccess: (message: string) => void;
  recordError: (message: string) => void;
  reset: () => void;
  download: () => void;
}

/**
 * Accumulates progress events and errors for a long-running sidecar operation so
 * the UI can show live progress and offer a downloadable JSON report for analysis.
 */
export function useOperationReport(): OperationReport {
  const [progress, setProgress] = useState<SidecarProgress>();
  const [log, setLog] = useState<OperationLogEntry[]>([]);
  const metaRef = useRef<{ operation: string; context?: Record<string, unknown>; startedAt: string }>();

  const onProgress = useCallback<SidecarProgressCallback>((next) => {
    setProgress(next);
    setLog((current) => [
      ...current,
      { time: new Date().toISOString(), phase: next.phase, current: next.current, total: next.total, label: next.label, status: 'progress' },
    ]);
  }, []);

  const begin = useCallback((operation: string, context?: Record<string, unknown>) => {
    metaRef.current = { operation, context, startedAt: new Date().toISOString() };
    setProgress(undefined);
    setLog([]);
  }, []);

  const record = useCallback((status: 'success' | 'error', message: string) => {
    setLog((current) => [
      ...current,
      { time: new Date().toISOString(), phase: 'result', current: 0, total: 0, label: message, status, message },
    ]);
  }, []);

  const recordSuccess = useCallback((message: string) => record('success', message), [record]);
  const recordError = useCallback((message: string) => record('error', message), [record]);

  const reset = useCallback(() => {
    setProgress(undefined);
    setLog([]);
    metaRef.current = undefined;
  }, []);

  const download = useCallback(() => {
    const operation = metaRef.current?.operation ?? 'operation';
    const report = {
      operation,
      startedAt: metaRef.current?.startedAt,
      generatedAt: new Date().toISOString(),
      context: metaRef.current?.context,
      errorCount: log.filter((entry) => entry.status === 'error').length,
      errors: log.filter((entry) => entry.status === 'error'),
      entries: log,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `agent-sidecar-${operation.replace(/\W+/g, '-').toLowerCase()}-${Date.now()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [log]);

  return {
    progress,
    log,
    errorCount: log.filter((entry) => entry.status === 'error').length,
    hasEntries: log.length > 0,
    onProgress,
    begin,
    recordSuccess,
    recordError,
    reset,
    download,
  };
}
