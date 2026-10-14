export {};

const CODE_APP_SCHEMA_NAME = "maftagsc_agentsidecar_4b928";
const POWER_APPS_HOST = "apps.powerapps.com";

interface CanvasAppRecord {
    canvasappid?: string;
    displayname?: string;
    appopenuri?: string;
}

interface WebApiResult<T> {
    entities: T[];
}

interface XrmHost {
    WebApi: {
        retrieveMultipleRecords<T>(
            entityLogicalName: string,
            options: string,
            maxPageSize?: number
        ): Promise<WebApiResult<T>>;
    };
}

function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required element '${id}' is unavailable.`);
    return element as T;
}

function getXrm(): XrmHost {
    const currentWindow = window as Window & { Xrm?: XrmHost };
    const parentWindow = window.parent as Window & { Xrm?: XrmHost };
    const topWindow = window.top as (Window & { Xrm?: XrmHost }) | null;
    try {
        if (parentWindow !== currentWindow && parentWindow.Xrm) return parentWindow.Xrm;
        if (topWindow !== currentWindow && topWindow?.Xrm) return topWindow.Xrm;
    } catch {
        throw new Error("The model-driven app context is not available.");
    }
    if (currentWindow.Xrm) return currentWindow.Xrm;
    throw new Error("Open Setup & Deployment from inside Agent Sidecar Administration.");
}

function validateLaunchUri(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error("The Agent Sidecar Setup & Deployment launch URL is unavailable.");
    }
    const uri = new URL(value);
    if (uri.protocol !== "https:" || uri.hostname.toLowerCase() !== POWER_APPS_HOST) {
        throw new Error("The Agent Sidecar Setup & Deployment launch URL is invalid.");
    }
    return uri.toString();
}

async function initialize(): Promise<void> {
    const status = getRequiredElement<HTMLElement>("status");
    const launch = getRequiredElement<HTMLAnchorElement>("launch");
    const xrm = getXrm();
    const query =
        "?$select=canvasappid,displayname,appopenuri" +
        `&$filter=name eq '${CODE_APP_SCHEMA_NAME}'&$top=2`;
    const result = await xrm.WebApi.retrieveMultipleRecords<CanvasAppRecord>(
        "canvasapp",
        query,
        2
    );

    if (result.entities.length === 0) {
        throw new Error(
            "Agent Sidecar Setup & Deployment is not installed in this environment."
        );
    }
    if (result.entities.length > 1) {
        throw new Error(
            "Multiple Agent Sidecar Setup & Deployment apps were found. Resolve the duplicate before continuing."
        );
    }

    const app = result.entities[0];
    launch.href = validateLaunchUri(app.appopenuri);
    launch.removeAttribute("aria-disabled");
    status.textContent =
        `${app.displayname || "Agent Sidecar Setup & Deployment"} is ready to open.`;
    status.dataset.kind = "success";
}

void initialize().catch((error: unknown) => {
    const status = getRequiredElement<HTMLElement>("status");
    status.textContent = error instanceof Error ? error.message : String(error);
    status.dataset.kind = "error";
});
