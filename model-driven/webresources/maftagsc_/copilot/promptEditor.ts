const MAX_PROMPTS_PER_TABLE = 6;
const MAX_LABEL_LENGTH = 60;
const MAX_TEXT_LENGTH = 400;
const MAX_ROLE_LENGTH = 100;
const REFRESH_CHANNEL = "maftagsc.sidecar.prompts";
const CACHE_VERSION = "v1";

interface PromptDefinition {
    label: string;
    text: string;
    roles?: string[];
}

type PromptCatalog = Record<string, PromptDefinition[]>;

interface ConfigurationRecord {
    maftagsc_sidecarconfigurationid: string;
    maftagsc_name?: string;
    maftagsc_appid?: string;
    maftagsc_appdisplayname?: string;
    maftagsc_prompts?: string;
    modifiedon?: string;
}

interface BindingRecord {
    maftagsc_tablelogicalname?: string;
    maftagsc_tabledisplayname?: string;
}

interface WebApiResult<T> {
    entities: T[];
}

interface XrmWebApi {
    retrieveMultipleRecords<T>(
        entityLogicalName: string,
        options: string,
        maxPageSize?: number
    ): Promise<WebApiResult<T>>;
    retrieveRecord<T>(
        entityLogicalName: string,
        id: string,
        options: string
    ): Promise<T>;
    updateRecord(
        entityLogicalName: string,
        id: string,
        data: Record<string, unknown>
    ): Promise<unknown>;
}

interface XrmHost {
    WebApi: XrmWebApi;
    Utility: {
        getGlobalContext(): {
            getCurrentAppProperties(): Promise<{ appId?: string; displayName?: string }>;
        };
    };
}

interface EditorState {
    appId: string;
    hostAppId: string;
    configuration: ConfigurationRecord;
    bindings: BindingRecord[];
    catalog: PromptCatalog;
    initialRaw: string;
}

let state: EditorState | null = null;
let configurations: ConfigurationRecord[] = [];
let saving = false;

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
    throw new Error("Open Prompt Management from inside a model-driven app.");
}

function normalizeGuid(value: unknown): string {
    return String(value ?? "").replace(/[{}]/g, "").trim().toLowerCase();
}

function sanitizePrompt(value: unknown): PromptDefinition | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as { label?: unknown; text?: unknown; roles?: unknown };
    const label = typeof candidate.label === "string"
        ? candidate.label.trim().slice(0, MAX_LABEL_LENGTH)
        : "";
    const text = typeof candidate.text === "string"
        ? candidate.text.trim().slice(0, MAX_TEXT_LENGTH)
        : "";
    if (!label || !text) return null;
    const roles = Array.isArray(candidate.roles)
        ? [...new Set(candidate.roles
            .filter((role): role is string => typeof role === "string")
            .map((role) => role.trim().slice(0, MAX_ROLE_LENGTH))
            .filter(Boolean))]
        : [];
    return roles.length ? { label, text, roles } : { label, text };
}

function parseCatalog(raw: unknown): PromptCatalog {
    if (typeof raw !== "string" || !raw.trim()) return {};
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("The saved prompt catalog is not valid JSON. Correct it before editing prompts.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("The saved prompt catalog has an invalid structure.");
    }
    const catalog: PromptCatalog = {};
    for (const [logicalName, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (!Array.isArray(value)) continue;
        const prompts = value
            .map(sanitizePrompt)
            .filter((prompt): prompt is PromptDefinition => Boolean(prompt))
            .slice(0, MAX_PROMPTS_PER_TABLE);
        if (prompts.length) catalog[logicalName.trim().toLowerCase()] = prompts;
    }
    return catalog;
}

function serializeCatalog(catalog: PromptCatalog): string {
    const clean: PromptCatalog = {};
    for (const [logicalName, values] of Object.entries(catalog)) {
        const prompts = values
            .map(sanitizePrompt)
            .filter((prompt): prompt is PromptDefinition => Boolean(prompt))
            .slice(0, MAX_PROMPTS_PER_TABLE);
        if (prompts.length) clean[logicalName.trim().toLowerCase()] = prompts;
    }
    return JSON.stringify(clean);
}

function showStatus(message: string, kind: "info" | "success" | "error" = "info"): void {
    const status = getRequiredElement<HTMLElement>("status");
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = false;
}

function setBusy(value: boolean): void {
    saving = value;
    getRequiredElement<HTMLButtonElement>("save").disabled = value;
    getRequiredElement<HTMLButtonElement>("reload").disabled = value;
    getRequiredElement<HTMLSelectElement>("configuration-select").disabled = value;
}

function createInput(
    labelText: string,
    value: string,
    maxLength: number,
    multiline = false
): HTMLLabelElement {
    const label = document.createElement("label");
    label.append(labelText);
    const input = multiline ? document.createElement("textarea") : document.createElement("input");
    input.value = value;
    input.maxLength = maxLength;
    input.dataset.field = labelText.toLowerCase().replace(/ /g, "-");
    label.append(input);
    return label;
}

function render(): void {
    if (!state) return;
    const picker = getRequiredElement<HTMLElement>("configuration-picker");
    const select = getRequiredElement<HTMLSelectElement>("configuration-select");
    const centralMode = state.hostAppId !== state.appId;
    picker.hidden = !centralMode;
    if (centralMode) {
        select.replaceChildren();
        for (const configuration of configurations) {
            const option = document.createElement("option");
            option.value = normalizeGuid(configuration.maftagsc_sidecarconfigurationid);
            option.textContent = configuration.maftagsc_appdisplayname ||
                configuration.maftagsc_name ||
                option.value;
            option.selected = option.value ===
                normalizeGuid(state.configuration.maftagsc_sidecarconfigurationid);
            select.append(option);
        }
    }
    getRequiredElement<HTMLElement>("configuration-name").textContent =
        state.configuration.maftagsc_name || "Agent Sidecar";
    getRequiredElement<HTMLElement>("app-name").textContent =
        state.configuration.maftagsc_appdisplayname || "";
    const tables = getRequiredElement<HTMLElement>("tables");
    tables.replaceChildren();

    for (const binding of state.bindings) {
        const logicalName = String(binding.maftagsc_tablelogicalname ?? "").trim().toLowerCase();
        if (!logicalName) continue;
        const card = document.createElement("section");
        card.className = "table-card";
        card.dataset.logicalName = logicalName;
        const heading = document.createElement("h2");
        heading.textContent = String(binding.maftagsc_tabledisplayname || logicalName);
        const logical = document.createElement("span");
        logical.className = "logical-name";
        logical.textContent = logicalName;
        heading.append(logical);
        card.append(heading);

        const list = document.createElement("div");
        list.className = "prompt-list";
        const prompts = state.catalog[logicalName] ?? [];
        if (!prompts.length) {
            const empty = document.createElement("div");
            empty.className = "empty";
            empty.textContent = "No custom prompts. Packaged defaults remain active until you save an override.";
            list.append(empty);
        }
        for (const prompt of prompts) list.append(createPromptRow(prompt));
        card.append(list);

        const actions = document.createElement("div");
        actions.className = "table-actions";
        const add = document.createElement("button");
        add.type = "button";
        add.textContent = "Add prompt";
        add.disabled = prompts.length >= MAX_PROMPTS_PER_TABLE;
        add.addEventListener("click", () => {
            if (list.querySelectorAll(".prompt").length >= MAX_PROMPTS_PER_TABLE) return;
            list.querySelector(".empty")?.remove();
            list.append(createPromptRow({ label: "", text: "" }));
            add.disabled = list.querySelectorAll(".prompt").length >= MAX_PROMPTS_PER_TABLE;
        });
        actions.append(add);
        card.append(actions);
        tables.append(card);
    }

    getRequiredElement<HTMLElement>("editor").hidden = false;
    getRequiredElement<HTMLElement>("actions").hidden = false;
    getRequiredElement<HTMLElement>("status").hidden = true;
}

function createPromptRow(prompt: PromptDefinition): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "prompt";
    row.append(
        createInput("Label", prompt.label, MAX_LABEL_LENGTH),
        createInput("Message", prompt.text, MAX_TEXT_LENGTH, true),
        createInput("Security roles", (prompt.roles ?? []).join(", "), 600)
    );
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => row.remove());
    row.append(remove);
    return row;
}

function readCatalogFromForm(): PromptCatalog {
    const catalog: PromptCatalog = {};
    for (const card of document.querySelectorAll<HTMLElement>(".table-card")) {
        const logicalName = card.dataset.logicalName;
        if (!logicalName) continue;
        const prompts: PromptDefinition[] = [];
        for (const row of card.querySelectorAll<HTMLElement>(".prompt")) {
            const label = row.querySelector<HTMLInputElement>('[data-field="label"]')?.value ?? "";
            const text = row.querySelector<HTMLTextAreaElement>('[data-field="message"]')?.value ?? "";
            const rolesText = row.querySelector<HTMLInputElement>('[data-field="security-roles"]')?.value ?? "";
            const prompt = sanitizePrompt({
                label,
                text,
                roles: rolesText.split(",")
            });
            if (!prompt && (label.trim() || text.trim())) {
                throw new Error(`Each prompt for ${logicalName} requires both a label and message.`);
            }
            if (prompt) prompts.push(prompt);
        }
        if (prompts.length) catalog[logicalName] = prompts;
    }
    return catalog;
}

function uniqueBindings(records: BindingRecord[]): BindingRecord[] {
    const bindings = new Map<string, BindingRecord>();
    for (const record of records) {
        const logicalName = String(record.maftagsc_tablelogicalname ?? "").trim().toLowerCase();
        if (logicalName && !bindings.has(logicalName)) bindings.set(logicalName, record);
    }
    return [...bindings.values()];
}

async function loadConfiguration(
    xrm: XrmHost,
    hostAppId: string,
    configuration: ConfigurationRecord
): Promise<void> {
    const configurationId = normalizeGuid(configuration.maftagsc_sidecarconfigurationid);
    if (!configurationId) throw new Error("The selected Sidecar configuration ID is invalid.");
    const appId = normalizeGuid(configuration.maftagsc_appid);
    if (!appId) throw new Error("The selected Sidecar configuration does not identify a target app.");
    const bindingResult = await xrm.WebApi.retrieveMultipleRecords<BindingRecord>(
        "maftagsc_targetbinding",
        `?$select=maftagsc_tablelogicalname,maftagsc_tabledisplayname&$filter=_maftagsc_sidecarconfiguration_value eq ${configurationId} and statecode eq 0 and maftagsc_enabled eq true&$orderby=maftagsc_tabledisplayname asc`,
        500
    );
    const initialRaw = String(configuration.maftagsc_prompts ?? "");
    state = {
        appId,
        hostAppId,
        configuration,
        bindings: uniqueBindings(bindingResult.entities),
        catalog: parseCatalog(initialRaw),
        initialRaw
    };
    render();
}

async function load(preferredConfigurationId?: string): Promise<void> {
    showStatus("Loading Sidecar configuration…");
    const xrm = getXrm();
    const app = await xrm.Utility.getGlobalContext().getCurrentAppProperties();
    const hostAppId = normalizeGuid(app.appId);
    if (!hostAppId) throw new Error("The current model-driven app ID is unavailable.");
    const configurationResult = await xrm.WebApi.retrieveMultipleRecords<ConfigurationRecord>(
        "maftagsc_sidecarconfiguration",
        "?$select=maftagsc_sidecarconfigurationid,maftagsc_name,maftagsc_appid,maftagsc_appdisplayname,maftagsc_prompts,modifiedon&$filter=statecode eq 0&$orderby=maftagsc_appdisplayname asc",
        500
    );
    configurations = configurationResult.entities;
    if (!configurations.length) {
        throw new Error("No enabled Sidecar configurations are available.");
    }
    const hostMatches = configurations.filter(
        (configuration) => normalizeGuid(configuration.maftagsc_appid) === hostAppId
    );
    if (hostMatches.length > 1) {
        throw new Error("More than one enabled Sidecar configuration exists for this app.");
    }
    const preferredId = normalizeGuid(preferredConfigurationId);
    const configuration = hostMatches[0] ??
        configurations.find((candidate) =>
            normalizeGuid(candidate.maftagsc_sidecarconfigurationid) === preferredId
        ) ??
        configurations[0];
    await loadConfiguration(xrm, hostAppId, configuration);
}

function notifySidecar(appId: string): void {
    try {
        sessionStorage.removeItem(`maftagsc.sidecar.config.${CACHE_VERSION}.${appId}`);
        localStorage.setItem(
            `${REFRESH_CHANNEL}.${appId}`,
            JSON.stringify({ appId, updatedAt: Date.now() })
        );
        if ("BroadcastChannel" in window) {
            const channel = new BroadcastChannel(REFRESH_CHANNEL);
            channel.postMessage({ type: "prompts-updated", appId });
            channel.close();
        }
    } catch (error) {
        console.warn("Prompts were saved, but the Sidecar refresh signal could not be sent.", error);
    }
}

async function save(): Promise<void> {
    if (!state || saving) return;
    setBusy(true);
    try {
        const xrm = getXrm();
        const configurationId = normalizeGuid(state.configuration.maftagsc_sidecarconfigurationid);
        const current = await xrm.WebApi.retrieveRecord<ConfigurationRecord>(
            "maftagsc_sidecarconfiguration",
            configurationId,
            "?$select=maftagsc_prompts,modifiedon"
        );
        const currentRaw = String(current.maftagsc_prompts ?? "");
        if (
            current.modifiedon !== state.configuration.modifiedon &&
            currentRaw !== state.initialRaw
        ) {
            throw new Error("Prompts changed after this page loaded. Reload before saving so another administrator's changes are not overwritten.");
        }
        const serialized = serializeCatalog(readCatalogFromForm());
        await xrm.WebApi.updateRecord(
            "maftagsc_sidecarconfiguration",
            configurationId,
            { maftagsc_prompts: serialized }
        );
        notifySidecar(state.appId);
        showStatus("Prompts saved. Open Sidecar panes will refresh automatically.", "success");
        await load(configurationId);
    } catch (error) {
        showStatus(
            error instanceof Error ? error.message : "Prompts could not be saved.",
            "error"
        );
    } finally {
        setBusy(false);
    }
}

function initialize(): void {
    getRequiredElement<HTMLButtonElement>("save").addEventListener("click", () => void save());
    getRequiredElement<HTMLButtonElement>("reload").addEventListener("click", () =>
        void load(state?.configuration.maftagsc_sidecarconfigurationid)
    );
    getRequiredElement<HTMLSelectElement>("configuration-select").addEventListener("change", (event) => {
        const configurationId = (event.currentTarget as HTMLSelectElement).value;
        void load(configurationId).catch((error) => {
            showStatus(
                error instanceof Error ? error.message : "The selected configuration could not be loaded.",
                "error"
            );
        });
    });
    void load().catch((error) => {
        showStatus(
            error instanceof Error ? error.message : "Prompt Management could not start.",
            "error"
        );
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
    initialize();
}
