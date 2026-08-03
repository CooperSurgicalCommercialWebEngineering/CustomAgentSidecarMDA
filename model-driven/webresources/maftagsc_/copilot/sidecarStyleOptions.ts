/**
 * Bot Framework Web Chat styleOptions for the Agent Sidecar pane.
 * Single source of truth consumed by both the production bundle
 * (agentSidePane.ts) and the local design-preview harness
 * (model-driven/preview/preview.ts).
 */
export const sidecarStyleOptions: Record<string, unknown> = {
  accent: '#3FB27F',
  primaryFont:
    '"Segoe UI", "Segoe UI Web (West European)", -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif',
  bubbleBackground: '#f5f5f5',
  bubbleFromUserBackground: '#3FB27F',
  hideUploadButton: true,
};
