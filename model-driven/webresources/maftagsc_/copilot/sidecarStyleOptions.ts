/**
 * Bot Framework Web Chat styleOptions for the Agent Sidecar pane.
 * Single source of truth consumed by both the production bundle
 * (agentSidePane.ts) and the local design-preview harness
 * (model-driven/preview/preview.ts).
 */
export const sidecarStyleOptions: Record<string, unknown> = {
    accent: "#005596",
    primaryFont: "\"Segoe UI\", \"Segoe UI Web (West European)\", -apple-system, system-ui, Roboto, \"Helvetica Neue\", sans-serif",
    backgroundColor: "#f7fafc",
    bubbleBackground: "#ffffff",
    bubbleBorderColor: "#dbe5eb",
    bubbleBorderRadius: 18,
    bubbleBorderStyle: "solid",
    bubbleBorderWidth: 1,
    bubbleNubOffset: 16,
    bubbleNubSize: 8,
    bubbleTextColor: "#3f4143",
    bubbleFromUserBackground: "#005596",
    bubbleFromUserBorderColor: "#005596",
    bubbleFromUserBorderRadius: 18,
    bubbleFromUserBorderStyle: "solid",
    bubbleFromUserBorderWidth: 1,
    bubbleFromUserNubOffset: 16,
    bubbleFromUserNubSize: 8,
    bubbleFromUserTextColor: "#ffffff",
    bubbleMessageMaxWidth: 340,
    bubbleMinHeight: 38,
    hideUploadButton: true,
    messageActivityWordBreak: "break-word",
    paddingRegular: 12,
    paddingWide: 16,
    sendBoxBackground: "#ffffff",
    sendBoxBorderTop: "solid 1px #dbe5eb",
    sendBoxButtonColor: "#005596",
    sendBoxButtonColorOnHover: "#6c2196",
    sendBoxButtonShadeBorderRadius: 999,
    sendBoxHeight: 58,
    sendBoxPlaceholderColor: "#73777a",
    sendBoxTextColor: "#3f4143",
    subtleColor: "#636466",
    suggestedActionBackgroundColor: "#ffffff",
    suggestedActionBackgroundColorOnHover: "#e8f3f8",
    suggestedActionBorderColor: "#005596",
    suggestedActionBorderRadius: 999,
    suggestedActionBorderWidth: 1,
    suggestedActionTextColor: "#005596"
};
