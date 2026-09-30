/**
 * Design-preview harness for the Agent Sidecar pane. Dev-only: bundled by
 * model-driven/preview/serve.mjs into the real template in place of the
 * production bundle. Fakes the conversation and exposes a state switcher;
 * never ships in the solution. No auth, no Xrm, no agent connection.
 */
import { sidecarStyleOptions } from "../webresources/maftagsc_/copilot/sidecarStyleOptions";

interface PreviewActivity {
    type: string;
    id?: string;
    text?: string;
    textFormat?: string;
    from?: { id: string; name?: string; role?: string };
    timestamp?: string;
    [key: string]: unknown;
}

interface Observer<T> {
    next?: (value: T) => void;
    error?: (error: unknown) => void;
    complete?: () => void;
}

interface Subscription {
    unsubscribe(): void;
}

/** Minimal replaying observable — just enough surface for Web Chat. */
class ReplaySubject<T> {
    private observers: Observer<T>[] = [];
    private readonly buffer: T[] = [];

    subscribe(observer: Observer<T>): Subscription {
        this.observers.push(observer);
        for (const value of this.buffer) {
            observer.next?.(value);
        }
        return {
            unsubscribe: () => {
                this.observers = this.observers.filter((candidate) => candidate !== observer);
            }
        };
    }

    next(value: T): void {
        this.buffer.push(value);
        for (const observer of [...this.observers]) {
            observer.next?.(value);
        }
    }
}

const GREETING = [
    "Hi! I'm the **Agent Sidecar** guide. In this preview I'm a mock —",
    "no sign-in, no live agent — but everything you see is the real pane's",
    "markup, CSS, and Web Chat styling."
].join(" ");

const SCREEN_ANSWER = [
    "This screen shows a **Benefit Plan** record.",
    "",
    "- Review the plan's coverage details before activating it",
    "- Check **Benefit Enrollments** to see who is on the plan",
    "- Follow the Benefits Administration process before status changes",
    "",
    "_(Canned preview answer — styling is what matters here.)_"
].join("\n");

const ECHO_REPLY = [
    "Thanks! In the real pane your Copilot Studio agent answers here.",
    "This mock reply exists so the designer can see both bubble styles,",
    "markdown, and the send box in action."
].join(" ");

let messageCounter = 0;

function nextId(prefix: string): string {
    messageCounter += 1;
    return `${prefix}-${messageCounter}`;
}

class FakeDirectLine {
    readonly activity$ = new ReplaySubject<PreviewActivity>();
    readonly connectionStatus$ = new ReplaySubject<number>();

    constructor() {
        // 0 = Uninitialized, 1 = Connecting, 2 = Online
        this.connectionStatus$.next(0);
        this.connectionStatus$.next(1);
        this.connectionStatus$.next(2);
        this.pushBotMessage(GREETING);
        this.pushUserMessage("What is this screen for?");
        this.pushBotMessage(SCREEN_ANSWER);
    }

    postActivity(activity: PreviewActivity): { subscribe(observer: Observer<string>): Subscription } {
        return {
            subscribe: (observer: Observer<string>): Subscription => {
                const id = nextId("preview-user");
                this.activity$.next({
                    ...activity,
                    id,
                    timestamp: new Date().toISOString()
                });
                observer.next?.(id);
                observer.complete?.();
                if (activity.type === "message") {
                    window.setTimeout(() => this.pushBotMessage(ECHO_REPLY), 600);
                }
                return { unsubscribe: () => undefined };
            }
        };
    }

    end(): void {
        // Nothing to tear down in the mock.
    }

    private pushBotMessage(text: string): void {
        this.activity$.next({
            type: "message",
            id: nextId("preview-bot"),
            timestamp: new Date().toISOString(),
            from: { id: "preview-agent", name: "Agent", role: "bot" },
            text,
            textFormat: "markdown"
        });
    }

    private pushUserMessage(text: string): void {
        this.activity$.next({
            type: "message",
            id: nextId("preview-user"),
            timestamp: new Date().toISOString(),
            from: { id: "preview-user", role: "user" },
            text
        });
    }
}

type PreviewState = "loading" | "signin" | "error" | "chat";

function byId<T extends HTMLElement>(id: string): T | null {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`[sidecar-preview] Missing template element #${id}`);
        return null;
    }
    return element as T;
}

let chatRendered = false;

function renderFakeChat(): void {
    const host = byId<HTMLElement>("webchat");
    const webChat = window.WebChat;
    if (!host || !webChat) {
        console.error("[sidecar-preview] Web Chat CDN script not loaded or #webchat missing.");
        return;
    }
    webChat.renderWebChat(
        {
            directLine: new FakeDirectLine(),
            styleOptions: sidecarStyleOptions
        },
        host
    );
    chatRendered = true;
}

/** Mirrors the copy and spinner behavior of setStatus/showSignIn/showError in agentSidePane.ts. */
function setState(state: PreviewState): void {
    const status = byId<HTMLElement>("status");
    const chat = byId<HTMLElement>("chat");
    const spinner = byId<HTMLElement>("spinner");
    const signIn = byId<HTMLButtonElement>("sign-in");
    const message = byId<HTMLElement>("status-message");
    if (!status || !chat || !spinner || !signIn || !message) {
        return;
    }

    status.hidden = state === "chat";
    chat.hidden = state !== "chat";

    if (state === "loading") {
        status.setAttribute("role", "status");
        message.textContent = "Starting a secure conversation…";
        spinner.hidden = false;
        signIn.hidden = true;
        signIn.textContent = "Sign in";
    } else if (state === "signin") {
        status.setAttribute("role", "status");
        message.textContent = "Sign in with your Microsoft work account to continue.";
        spinner.hidden = false;
        signIn.hidden = false;
        signIn.textContent = "Sign in";
    } else if (state === "error") {
        status.setAttribute("role", "alert");
        message.textContent = "The guide couldn't start (preview_error). Try again or contact an administrator.";
        spinner.hidden = true;
        signIn.hidden = false;
        signIn.textContent = "Try again";
    } else {
        if (!chatRendered) {
            renderFakeChat();
        }
        chat.focus();
    }
}

function injectToolbar(): void {
    const bar = document.createElement("div");
    bar.id = "preview-toolbar";
    bar.setAttribute("aria-label", "Preview state switcher");
    bar.style.cssText =
        "position:fixed;top:12px;left:12px;z-index:1000;display:flex;gap:6px;" +
        "padding:6px;background:#242424;border-radius:6px;opacity:0.92;";
    const states: Array<[PreviewState, string]> = [
        ["loading", "Loading"],
        ["signin", "Sign in"],
        ["error", "Error"],
        ["chat", "Chat"]
    ];
    for (const [state, label] of states) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.style.cssText =
            "font:12px 'Segoe UI',sans-serif;padding:4px 10px;border:0;" +
            "border-radius:4px;cursor:pointer;background:#ffffff;color:#242424;";
        button.addEventListener("click", () => setState(state));
        bar.appendChild(button);
    }
    document.body.appendChild(bar);
}

function start(): void {
    injectToolbar();
    byId<HTMLButtonElement>("new-conversation")?.addEventListener("click", () => {
        const host = byId<HTMLElement>("webchat");
        if (!host) {
            return;
        }
        host.replaceChildren();
        chatRendered = false;
        renderFakeChat();
    });
    setState("chat");
}

start();
