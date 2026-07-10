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
import { sidecarConfigurationRepository } from "./hrSidecarBootstrap";
import {
    getEntityBinding,
    normalizeGuid,
    type SidecarConfiguration
} from "./sidecarConfiguration";

const ORIGINAL_TEXT_KEY = "hrSidecarOriginalText";

interface LaunchContext {
    pageType: "entityrecord" | "entitylist";
    entityName: string;
    recordId: string | null;
    recordName: string;
    appId: string | null;
}

interface LaunchRequest {
    configuration: SidecarConfiguration;
    context: LaunchContext;
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

let msalClient: PublicClientApplication | null = null;
let msalInitialized = false;
let startInProgress = false;
let activeConnection: CopilotStudioWebChatConnection | null = null;
let activeToken: string | null = null;
let activeContext: LaunchContext | null = null;
let activeConfiguration: SidecarConfiguration | null = null;
let resetInProgress = false;

function getRequiredElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Required element '${id}' is unavailable.`);
    }
    return element as T;
}

async function parseLaunchRequest(): Promise<LaunchRequest> {
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

    const appId = normalizeGuid(value.appId);
    const configuration = await sidecarConfigurationRepository.getByAppId(appId);
    const entityName = String(value.entityName || "").trim().toLowerCase();
    if (!getEntityBinding(configuration, entityName)) {
        throw new Error("Screen-specific help isn't available for this table.");
    }

    const recordId = value.recordId == null ? null : normalizeGuid(value.recordId);
    if (value.recordId != null && !recordId) {
        throw new Error("The current record identifier is invalid.");
    }

    return {
        configuration,
        context: {
            pageType: value.pageType === "entitylist" ? "entitylist" : "entityrecord",
            entityName,
            recordId,
            recordName: String(value.recordName || "").slice(0, 200),
            appId
        }
    };
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

function getCurrentContext(
    fallback: LaunchContext,
    configuration: SidecarConfiguration
): LaunchContext {
    try {
        const hostXrm = getHostXrm();
        const input = hostXrm?.Utility?.getPageContext?.().input;
        const pageType = input?.pageType === "entityrecord" || input?.pageType === "entitylist"
            ? input.pageType
            : null;
        const entityName = String(input?.entityName ?? "").trim().toLowerCase();
        if (!pageType || !getEntityBinding(configuration, entityName)) {
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

function getMsalClient(configuration: SidecarConfiguration): PublicClientApplication {
    if (!msalClient) {
        msalClient = new PublicClientApplication({
            auth: {
                clientId: configuration.clientId,
                authority: `https://login.microsoftonline.com/${configuration.tenantId}`,
                redirectUri: `${window.location.origin}${configuration.redirectPath}`
            },
            cache: {
                cacheLocation: "memoryStorage"
            }
        });
    }
    return msalClient;
}

async function initializeMsal(configuration: SidecarConfiguration): Promise<PublicClientApplication> {
    const client = getMsalClient(configuration);
    if (!msalInitialized) {
        await client.initialize();
        let redirectResult: AuthenticationResult | null = null;
        try {
            redirectResult = await client.handleRedirectPromise();
        } catch (error) {
            if (getSafeErrorCode(error) !== "no_token_request_cache_error") {
                throw error;
            }
        }
        if (redirectResult?.account) {
            client.setActiveAccount(redirectResult.account);
        }
        msalInitialized = true;
    }
    return client;
}

function getCachedAccount(client: PublicClientApplication): AccountInfo | undefined {
    return client.getActiveAccount() ?? client.getAllAccounts()[0];
}

async function acquireToken(
    interactive: boolean,
    configuration: SidecarConfiguration
): Promise<string | null> {
    const client = await initializeMsal(configuration);
    const account = getCachedAccount(client);

    if (account) {
        client.setActiveAccount(account);
        try {
            const result = await client.acquireTokenSilent({
                scopes: [configuration.scope],
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

    const result: AuthenticationResult = await client.acquireTokenPopup({
        scopes: [configuration.scope],
        account,
        prompt: account ? undefined : "select_account"
    });
    client.setActiveAccount(result.account);
    return result.accessToken;
}

function getScreenName(
    context: LaunchContext,
    configuration: SidecarConfiguration
): string {
    const recordScreen = getEntityBinding(configuration, context.entityName)?.screenName ??
        configuration.defaultScreenName;
    return context.pageType === "entitylist"
        ? recordScreen.replace(/ record form$/, " list")
        : recordScreen;
}

function createContextEnvelope(
    context: LaunchContext,
    userText: string,
    configuration: SidecarConfiguration
): string {
    const recordDescription = context.recordName
        ? ` The open record is named "${context.recordName}".`
        : "";

    return [
        `[Trusted ${configuration.contextLabel} context]`,
        `The user is currently on the ${getScreenName(context, configuration)}.${recordDescription}`,
        `App ID: ${context.appId ?? "unavailable"}`,
        `Page type: ${context.pageType}`,
        `Table: ${context.entityName}`,
        `Record ID: ${context.recordId ?? "unavailable"}`,
        "Use this exact screen as the primary context for navigation and how-to questions. Do not infer or substitute a different screen.",
        "[End trusted app context]",
        "",
        userText
    ].join("\n");
}

function createContextStore(
    webChat: WebChatApi,
    getContext: () => LaunchContext,
    configuration: SidecarConfiguration
): unknown {
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
                        CurrentAppId: context.appId,
                        CurrentPageType: context.pageType,
                        CurrentScreen: getScreenName(context, configuration),
                        CurrentTable: context.entityName,
                        CurrentRecordId: context.recordId,
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

function renderConversation(
    token: string,
    context: LaunchContext,
    configuration: SidecarConfiguration
): void {
    if (
        !window.WebChat ||
        typeof window.WebChat.createStore !== "function" ||
        typeof window.WebChat.renderWebChat !== "function"
    ) {
        throw new Error("The chat client couldn't be loaded.");
    }

    const settings = new ConnectionSettings({
        environmentId: configuration.environmentId,
        schemaName: configuration.agentSchemaName
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

        const currentContext = getCurrentContext(activeContext ?? context, configuration);
        activeContext = currentContext;

        return originalPostActivity({
            ...activity,
            text: createContextEnvelope(currentContext, originalText, configuration),
            channelData: {
                ...activity.channelData,
                [ORIGINAL_TEXT_KEY]: originalText
            }
        } as Activity);
    };
    const store = createContextStore(window.WebChat, () => {
        const currentContext = getCurrentContext(activeContext ?? context, configuration);
        activeContext = currentContext;
        return currentContext;
    }, configuration);

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
    activeConfiguration = configuration;
    chat.focus();
}

async function startNewConversation(): Promise<void> {
    if (resetInProgress || !activeToken || !activeContext || !activeConfiguration) {
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
        renderConversation(
            activeToken,
            getCurrentContext(activeContext, activeConfiguration),
            activeConfiguration
        );
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
        const { configuration, context } = await parseLaunchRequest();
        const token = await acquireToken(interactive, configuration);
        if (!token) {
            showSignIn();
            return;
        }
        renderConversation(token, context, configuration);
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
