import {
    InteractionRequiredAuthError,
    PublicClientApplication,
    type AccountInfo,
    type AuthenticationResult
} from "@azure/msal-browser";
import {
    ConnectionSettings,
    CopilotStudioClient,
    CopilotStudioWebChat,
    type CopilotStudioWebChatConnection
} from "@microsoft/agents-copilotstudio-client";
import type { Activity } from "@microsoft/agents-activity";

const CONFIG = Object.freeze({
    clientId: "9d03cd77-5246-4c9c-8e9d-262bff547a25",
    tenantId: "d92190b9-98e7-46da-8b11-580e06c7d15d",
    environmentId: "f9b87f8b-0abf-e629-affb-b13195d1ed14",
    agentSchemaName: "cr0b1_HRMgmtClassic",
    scope: "https://api.powerplatform.com/CopilotStudio.Copilots.Invoke",
    redirectPath: "/WebResources/maftagsc_/copilot/authRedirect.html"
});

const SUPPORTED_ENTITIES = new Set([
    "systemuser",
    "position",
    "businessunit",
    "maftagsc_timeofftype",
    "maftagsc_timeoffbalance",
    "maftagsc_timeoffrequest",
    "maftagsc_expensereport",
    "maftagsc_expenseline",
    "maftagsc_benefitplan",
    "maftagsc_benefitenrollment"
]);
const GUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const ORIGINAL_TEXT_KEY = "hrSidecarOriginalText";

const SCREEN_NAMES: Readonly<Record<string, string>> = Object.freeze({
    systemuser: "Employee record form",
    position: "Position record form",
    businessunit: "Department record form",
    maftagsc_timeofftype: "Time Off Type record form",
    maftagsc_timeoffbalance: "Time Off Balance record form",
    maftagsc_timeoffrequest: "Time Off Request record form",
    maftagsc_expensereport: "Expense Report record form",
    maftagsc_expenseline: "Expense Line record form",
    maftagsc_benefitplan: "Benefit Plan record form",
    maftagsc_benefitenrollment: "Benefit Enrollment record form"
});

interface LaunchContext {
    pageType: "entityrecord" | "entitylist";
    entityName: string;
    recordId: string | null;
    recordName: string;
    appId: string | null;
}

interface HostPageInput {
    pageType?: unknown;
    entityName?: unknown;
    entityId?: unknown;
}

interface HostFormEntity {
    getEntityName?: () => unknown;
    getId?: () => unknown;
    getPrimaryAttributeValue?: () => unknown;
}

interface HostXrm {
    Utility?: {
        getPageContext?: () => {
            input?: HostPageInput;
        };
    };
    Page?: {
        data?: {
            entity?: HostFormEntity;
        };
    };
}

interface WebChatApi {
    createStore(
        initialState: Record<string, unknown>,
        middleware: (api: WebChatStoreApi) => (next: WebChatNext) => (action: WebChatAction) => unknown
    ): unknown;
    renderWebChat(options: Record<string, unknown>, element: HTMLElement): void;
}

interface WebChatAction {
    type: string;
    payload?: {
        activity?: Partial<Activity>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface WebChatStoreApi {
    dispatch(action: WebChatAction): void;
}

type WebChatNext = (action: WebChatAction) => unknown;

declare global {
    interface Window {
        WebChat?: WebChatApi;
        Xrm?: HostXrm;
    }
}

const msalClient = new PublicClientApplication({
    auth: {
        clientId: CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
        redirectUri: `${window.location.origin}${CONFIG.redirectPath}`
    },
    cache: {
        cacheLocation: "localStorage"
    }
});

let msalInitialized = false;
let startInProgress = false;
let activeConnection: CopilotStudioWebChatConnection | null = null;
let activeToken: string | null = null;
let activeContext: LaunchContext | null = null;
let resetInProgress = false;

function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Required element '${id}' is unavailable.`);
    }
    return element as T;
}

function parseContext(): LaunchContext {
    const encoded = new URLSearchParams(window.location.search).get("data");
    if (!encoded || encoded.length > 2000) {
        throw new Error("Screen context wasn't provided.");
    }

    let value: Record<string, unknown>;
    try {
        value = JSON.parse(encoded) as Record<string, unknown>;
    } catch {
        throw new Error("Screen context is invalid.");
    }

    const entityName = String(value.entityName || "").toLowerCase();
    if (!SUPPORTED_ENTITIES.has(entityName)) {
        throw new Error("Screen-specific help isn't available for this table.");
    }

    const recordId = value.recordId == null
        ? null
        : String(value.recordId).toLowerCase();
    if (recordId && !GUID_PATTERN.test(recordId)) {
        throw new Error("The current record identifier is invalid.");
    }

    const appId = value.appId == null ? null : String(value.appId).toLowerCase();
    if (appId && !GUID_PATTERN.test(appId)) {
        throw new Error("The current app identifier is invalid.");
    }

    return {
        pageType: value.pageType === "entitylist" ? "entitylist" : "entityrecord",
        entityName,
        recordId,
        recordName: String(value.recordName || "").slice(0, 200),
        appId
    };
}

function normalizeGuid(value: unknown): string | null {
    const normalized = String(value ?? "")
        .trim()
        .replace(/^\{([^{}]+)\}$/, "$1")
        .toLowerCase();
    return GUID_PATTERN.test(normalized) ? normalized : null;
}

function getHostXrm(): HostXrm | null {
    try {
        if (window.parent !== window && window.parent.Xrm) {
            return window.parent.Xrm;
        }
        if (window.top !== window && window.top?.Xrm) {
            return window.top.Xrm;
        }
    } catch {
        // The launch context remains the safe fallback if host access is unavailable.
    }
    return null;
}

function getCurrentRecordName(
    hostXrm: HostXrm,
    entityName: string,
    recordId: string | null
): string | null {
    const formEntity = hostXrm.Page?.data?.entity;
    if (!formEntity) {
        return null;
    }

    const formEntityName = String(formEntity.getEntityName?.() ?? "").trim().toLowerCase();
    const formRecordId = normalizeGuid(formEntity.getId?.());
    if (formEntityName !== entityName || formRecordId !== recordId) {
        return null;
    }

    return String(formEntity.getPrimaryAttributeValue?.() ?? "").slice(0, 200);
}

function getCurrentContext(fallback: LaunchContext): LaunchContext {
    try {
        const hostXrm = getHostXrm();
        const input = hostXrm?.Utility?.getPageContext?.().input;
        const pageType = input?.pageType === "entityrecord" || input?.pageType === "entitylist"
            ? input.pageType
            : null;
        const entityName = String(input?.entityName ?? "").trim().toLowerCase();
        if (!pageType || !SUPPORTED_ENTITIES.has(entityName)) {
            return fallback;
        }

        const recordId = pageType === "entityrecord" ? normalizeGuid(input?.entityId) : null;
        const isSameRecord = pageType === "entityrecord" &&
            fallback.pageType === "entityrecord" &&
            fallback.entityName === entityName &&
            fallback.recordId === recordId;
        const currentRecordName = pageType === "entityrecord" && hostXrm
            ? getCurrentRecordName(hostXrm, entityName, recordId)
            : null;

        return {
            pageType,
            entityName,
            recordId,
            recordName: currentRecordName ?? (isSameRecord ? fallback.recordName : ""),
            appId: fallback.appId
        };
    } catch {
        return fallback;
    }
}

function setStatus(message: string, isError = false): void {
    getRequiredElement<HTMLElement>("status-message").textContent = message;
    const status = getRequiredElement<HTMLElement>("status");
    status.setAttribute("role", isError ? "alert" : "status");
    getRequiredElement<HTMLElement>("spinner").hidden = isError;
}

function showSignIn(): void {
    setStatus("Sign in with your Microsoft work account to continue.");
    getRequiredElement<HTMLButtonElement>("sign-in").hidden = false;
}

function getSafeErrorCode(error: unknown): string {
    if (!error || typeof error !== "object") {
        return "unknown_error";
    }

    const candidate = "errorCode" in error
        ? String(error.errorCode)
        : "name" in error
            ? String(error.name)
            : "unknown_error";
    return /^[a-z0-9_.-]{1,80}$/i.test(candidate) ? candidate : "unknown_error";
}

function showError(error: unknown): void {
    const code = getSafeErrorCode(error);
    setStatus(`The guide couldn't start (${code}). Try again or contact an administrator.`, true);
    const retry = getRequiredElement<HTMLButtonElement>("sign-in");
    retry.textContent = "Try again";
    retry.hidden = false;
}

async function initializeMsal(): Promise<void> {
    if (!msalInitialized) {
        await msalClient.initialize();
        let redirectResult: AuthenticationResult | null = null;
        try {
            redirectResult = await msalClient.handleRedirectPromise();
        } catch (error) {
            if (getSafeErrorCode(error) !== "no_token_request_cache_error") {
                throw error;
            }
        }
        if (redirectResult?.account) {
            msalClient.setActiveAccount(redirectResult.account);
        }
        msalInitialized = true;
    }
}

function getCachedAccount(): AccountInfo | undefined {
    return msalClient.getActiveAccount() ?? msalClient.getAllAccounts()[0];
}

async function acquireToken(interactive: boolean): Promise<string | null> {
    await initializeMsal();
    const account = getCachedAccount();

    if (account) {
        msalClient.setActiveAccount(account);
        try {
            const result = await msalClient.acquireTokenSilent({
                scopes: [CONFIG.scope],
                account
            });
            return result.accessToken;
        } catch (error) {
            if (!interactive && error instanceof InteractionRequiredAuthError) {
                return null;
            }
            if (!interactive) {
                throw error;
            }
        }
    } else if (!interactive) {
        return null;
    }

    const result: AuthenticationResult = await msalClient.acquireTokenPopup({
        scopes: [CONFIG.scope],
        account,
        prompt: account ? undefined : "select_account"
    });
    msalClient.setActiveAccount(result.account);
    return result.accessToken;
}

function getScreenName(context: LaunchContext): string {
    const recordScreen = SCREEN_NAMES[context.entityName] ?? "HR Management record form";
    return context.pageType === "entitylist"
        ? recordScreen.replace(/ record form$/, " list")
        : recordScreen;
}

function createContextEnvelope(context: LaunchContext, userText: string): string {
    const recordDescription = context.recordName
        ? ` The open record is named "${context.recordName}".`
        : "";

    return [
        "[Trusted HR Management app context]",
        `The user is currently on the ${getScreenName(context)}.${recordDescription}`,
        "Use this exact screen as the primary context for navigation and how-to questions. Do not infer or substitute a different screen.",
        "[End trusted app context]",
        "",
        userText
    ].join("\n");
}

function createContextStore(webChat: WebChatApi, getContext: () => LaunchContext): unknown {
    return webChat.createStore({}, ({ dispatch }) => next => action => {
        if (
            action.type === "DIRECT_LINE/CONNECT_FULFILLED" ||
            action.type === "WEB_CHAT/SEND_MESSAGE"
        ) {
            const context = getContext();
            dispatch({
                type: "WEB_CHAT/SEND_EVENT",
                payload: {
                    name: "pvaSetContext",
                    value: {
                        CurrentScreen: getScreenName(context),
                        CurrentTable: context.entityName,
                        CurrentRecordName: context.recordName
                    }
                }
            });
        }

        const activity = action.payload?.activity;
        const originalText = activity?.channelData?.[ORIGINAL_TEXT_KEY];
        if (
            action.type === "DIRECT_LINE/INCOMING_ACTIVITY" &&
            activity?.type === "message" &&
            typeof originalText === "string"
        ) {
            return next({
                ...action,
                payload: {
                    ...action.payload,
                    activity: {
                        ...activity,
                        text: originalText
                    }
                }
            });
        }

        return next(action);
    });
}

function resetWebChatHost(): HTMLElement {
    const current = getRequiredElement<HTMLElement>("webchat");
    const replacement = document.createElement("div");
    replacement.id = "webchat";
    current.replaceWith(replacement);
    return replacement;
}

function renderConversation(token: string, context: LaunchContext): void {
    if (
        !window.WebChat ||
        typeof window.WebChat.createStore !== "function" ||
        typeof window.WebChat.renderWebChat !== "function"
    ) {
        throw new Error("The chat client couldn't be loaded.");
    }

    const settings = new ConnectionSettings({
        environmentId: CONFIG.environmentId,
        schemaName: CONFIG.agentSchemaName
    });
    const client = new CopilotStudioClient(settings, token);
    const connection = CopilotStudioWebChat.createConnection(client, {
        showTyping: true
    });
    const originalPostActivity = connection.postActivity.bind(connection);
    connection.postActivity = (activity: Activity) => {
        const originalText = activity.type === "message"
            ? activity.text?.trim()
            : undefined;
        if (!originalText) {
            return originalPostActivity(activity);
        }

        const currentContext = getCurrentContext(activeContext ?? context);
        activeContext = currentContext;

        return originalPostActivity({
            ...activity,
            text: createContextEnvelope(currentContext, originalText),
            channelData: {
                ...activity.channelData,
                [ORIGINAL_TEXT_KEY]: originalText
            }
        } as Activity);
    };
    const store = createContextStore(window.WebChat, () => {
        const currentContext = getCurrentContext(activeContext ?? context);
        activeContext = currentContext;
        return currentContext;
    });

    const chat = getRequiredElement<HTMLElement>("chat");
    const webChat = getRequiredElement<HTMLElement>("webchat");
    getRequiredElement<HTMLElement>("status").hidden = true;
    chat.hidden = false;

    window.WebChat.renderWebChat({
        directLine: connection,
        store,
        styleOptions: {
            accent: "#0f6cbd",
            primaryFont: "\"Segoe UI\", \"Segoe UI Web (West European)\", -apple-system, system-ui, Roboto, \"Helvetica Neue\", sans-serif",
            bubbleBackground: "#f5f5f5",
            bubbleFromUserBackground: "#deecf9",
            hideUploadButton: true
        }
    }, webChat);

    activeConnection = connection;
    activeToken = token;
    activeContext = context;
    chat.focus();
}

async function startNewConversation(): Promise<void> {
    if (resetInProgress || !activeToken || !activeContext) {
        return;
    }
    if (!window.confirm("Start a new conversation? The current chat history will be cleared.")) {
        return;
    }

    resetInProgress = true;
    const button = getRequiredElement<HTMLButtonElement>("new-conversation");
    button.disabled = true;
    button.textContent = "Starting…";

    try {
        activeConnection?.end();
        activeConnection = null;
        resetWebChatHost();
        renderConversation(activeToken, getCurrentContext(activeContext));
    } catch (error) {
        getRequiredElement<HTMLElement>("chat").hidden = true;
        getRequiredElement<HTMLElement>("status").hidden = false;
        showError(error);
    } finally {
        button.disabled = false;
        button.textContent = "New conversation";
        resetInProgress = false;
    }
}

async function start(interactive: boolean): Promise<void> {
    if (startInProgress) {
        return;
    }

    startInProgress = true;
    const signIn = getRequiredElement<HTMLButtonElement>("sign-in");
    signIn.hidden = true;
    setStatus(interactive ? "Signing you in…" : "Starting a secure conversation…");

    try {
        const context = parseContext();
        const token = await acquireToken(interactive);
        if (!token) {
            showSignIn();
            return;
        }
        renderConversation(token, context);
    } catch (error) {
        // Never expose token, account, response, or HR context details in the UI or browser logs.
        showError(error);
    } finally {
        startInProgress = false;
    }
}

function initialize(): void {
    getRequiredElement<HTMLButtonElement>("sign-in").addEventListener("click", () => {
        void start(true);
    });
    getRequiredElement<HTMLButtonElement>("new-conversation").addEventListener("click", () => {
        void startNewConversation();
    });
    void start(false);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
    initialize();
}
