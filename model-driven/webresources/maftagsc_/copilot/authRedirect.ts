import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

void broadcastResponseToMainFrame().catch(() => {
    document.body.textContent = "Sign-in could not be completed. Close this window and try again.";
});