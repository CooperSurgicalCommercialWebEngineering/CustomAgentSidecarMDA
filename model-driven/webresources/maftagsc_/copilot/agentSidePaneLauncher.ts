import { sidecarConfigurationRepository } from "./hrSidecarBootstrap";
import {
    getEntityBinding,
    normalizeGuid,
    type SidecarConfiguration
} from "./sidecarConfiguration";

// The launcher runs on every form OnLoad and writes the current record context
// here; the already-open side pane watches this key so navigation updates the
// live conversation without recreating the pane (which would reset the chat).
const SIDECAR_CONTEXT_KEY_PREFIX = "maftagsc.sidecar.context.";

interface FormEntity {
    getEntityName(): unknown;
    getId(): unknown;
    getPrimaryAttributeValue?(): unknown;
}

interface FormContext {
    data?: {
        entity?: FormEntity;
    };
}

interface ExecutionContext {
    getFormContext?(): FormContext;
}

interface AppProperties {
    appId?: unknown;
}

interface SidePane {
    navigate(input: Record<string, unknown>): Promise<void>;
}

interface XrmApi {
    Utility: {
        getGlobalContext(): {
            getCurrentAppProperties(): Promise<AppProperties>;
        };
    };
    App: {
        sidePanes: {
            getPane(paneId: string): SidePane | undefined;
            createPane(options: Record<string, unknown>): Promise<SidePane>;
        };
    };
}

declare const Xrm: XrmApi;

declare global {
    interface Window {
        AgentSidecar?: {
            initializeGuide?: (executionContext: ExecutionContext) => Promise<void>;
        };
        HRAgentSidecar?: {
            initializeGuide?: (executionContext: ExecutionContext) => Promise<void>;
        };
    }
}

interface LaunchContext {
    pageType: "entityrecord";
    entityName: string;
    recordId: string | null;
    recordName: string;
    appId: string;
}

async function getConfiguration(): Promise<SidecarConfiguration> {
    const appProperties = await Xrm.Utility.getGlobalContext().getCurrentAppProperties();
    return sidecarConfigurationRepository.getByAppId(appProperties.appId);
}

function getLaunchContext(
    formContext: FormContext,
    configuration: SidecarConfiguration
): LaunchContext {
    const entity = formContext.data?.entity;
    if (!entity) {
        throw new Error("The current form context is unavailable.");
    }

    const entityName = String(entity.getEntityName() ?? "").trim().toLowerCase();
    if (!getEntityBinding(configuration, entityName)) {
        throw new Error("The configured guide is not available for this table.");
    }

    const rawRecordId = entity.getId();
    const recordId = rawRecordId ? normalizeGuid(rawRecordId) : null;
    if (rawRecordId && !recordId) {
        throw new Error("The current record identifier is invalid.");
    }

    const recordName = typeof entity.getPrimaryAttributeValue === "function"
        ? String(entity.getPrimaryAttributeValue() ?? "").slice(0, 200)
        : "";

    return {
        pageType: "entityrecord",
        entityName,
        recordId,
        recordName,
        appId: configuration.appId
    };
}

function createPageInput(
    configuration: SidecarConfiguration,
    context: LaunchContext
): Record<string, unknown> {
    return {
        pageType: "webresource",
        webresourceName: configuration.webResourceName,
        data: JSON.stringify(context)
    };
}

function writeSharedContext(paneId: string, context: LaunchContext): void {
    try {
        window.localStorage.setItem(`${SIDECAR_CONTEXT_KEY_PREFIX}${paneId}`, JSON.stringify(context));
    } catch {
        // localStorage may be unavailable; the pane falls back to its live host read.
    }
}

async function ensurePane(formContext: FormContext): Promise<SidePane> {
    const configuration = await getConfiguration();
    const context = getLaunchContext(formContext, configuration);
    writeSharedContext(configuration.paneId, context);
    let pane = Xrm.App.sidePanes.getPane(configuration.paneId);

    if (!pane) {
        pane = await Xrm.App.sidePanes.createPane({
            paneId: configuration.paneId,
            title: configuration.paneTitle,
            imageSrc: configuration.iconWebResource,
            canClose: false,
            isSelected: false,
            alwaysRender: true,
            width: configuration.paneWidth
        });

        await pane.navigate(createPageInput(configuration, context));
    }

    return pane;
}

async function initialize(executionContext: ExecutionContext): Promise<void> {
    try {
        const formContext = executionContext?.getFormContext?.();
        if (!formContext) {
            throw new Error("The current form context is unavailable.");
        }
        await ensurePane(formContext);
    } catch (error) {
        // Avoid logging target record data, tokens, or connector payloads.
        const code = error && typeof error === "object" && "errorCode" in error
            ? String(error.errorCode)
            : "sidecar_initialization_failed";
        console.warn(`Agent Sidecar couldn't be initialized (${code}).`);
    }
}

window.AgentSidecar = window.AgentSidecar ?? {};
window.AgentSidecar.initializeGuide = initialize;

// Compatibility alias for existing form registrations during HR binding migration.
window.HRAgentSidecar = window.HRAgentSidecar ?? {};
window.HRAgentSidecar.initializeGuide = initialize;
