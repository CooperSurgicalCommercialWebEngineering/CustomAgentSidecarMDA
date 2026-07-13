import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const modelDrivenRoot = path.dirname(fileURLToPath(import.meta.url));
const copilotRoot = path.join(
    modelDrivenRoot,
    "webresources",
    "maftagsc_",
    "copilot"
);
const entryPath = path.join(copilotRoot, "agentSidePane.ts");
const launcherPath = path.join(copilotRoot, "agentSidePane.js");
const launcherEntryPath = path.join(copilotRoot, "agentSidePaneLauncher.ts");
const iconPath = path.join(copilotRoot, "agentGuideLibrary.svg");
const templatePath = path.join(copilotRoot, "agentSidePane.template.html");
const outputPath = path.join(copilotRoot, "agentSidePane.html");
const authRedirectPath = path.join(copilotRoot, "authRedirect.html");
const authRedirectEntryPath = path.join(copilotRoot, "authRedirect.ts");
const solutionOutputPath = path.resolve(
    modelDrivenRoot,
    "..",
    "solution",
    "WebResources",
    "maftagsc_",
    "copilot",
    "agentSidePane.html"
);
const solutionAuthRedirectPath = path.resolve(
    modelDrivenRoot,
    "..",
    "solution",
    "WebResources",
    "maftagsc_",
    "copilot",
    "authRedirect.html"
);
const solutionLauncherPath = path.resolve(
    modelDrivenRoot,
    "..",
    "solution",
    "WebResources",
    "maftagsc_",
    "copilot",
    "agentSidePane.js"
);
const solutionIconPath = path.resolve(
    modelDrivenRoot,
    "..",
    "solution",
    "WebResources",
    "maftagsc_",
    "copilot",
    "agentGuideLibrary.svg"
);
const marker = "<!-- HR_AGENT_SIDEPANE_BUNDLE -->";
const authRedirectMarker = "<!-- HR_AGENT_AUTH_REDIRECT_BUNDLE -->";

async function bundle(entryPoint) {
    const result = await build({
        entryPoints: [entryPoint],
        bundle: true,
        platform: "browser",
        format: "iife",
        target: ["es2020"],
        minify: true,
        legalComments: "none",
        write: false,
        conditions: ["browser", "import", "default"]
    });

    const output = result.outputFiles?.[0];
    if (!output) {
        throw new Error(`The browser bundle wasn't generated for ${entryPoint}.`);
    }
    return output.text.replaceAll("</script", "<\\/script");
}

const template = await readFile(templatePath, "utf8");
if (!template.includes(marker)) {
    throw new Error("The side-pane template is missing its bundle marker.");
}

const safeBundle = await bundle(entryPath);
const html = template.replace(marker, () => `<script>${safeBundle}</script>`);
const launcherBundle = await bundle(launcherEntryPath);

if ((html.match(/<!doctype html>/gi) ?? []).length !== 1 || html.includes(marker)) {
    throw new Error("The generated side-pane HTML failed its structural validation.");
}
if (!html.includes("https://api.powerplatform.com/CopilotStudio.Copilots.Invoke")) {
    throw new Error("The side-pane bundle does not request the registered delegated scope.");
}
if (!html.includes("/WebResources/maftagsc_/copilot/authRedirect.html")) {
    throw new Error("The side-pane bundle does not use the dedicated MSAL redirect page.");
}

const authRedirectTemplate = await readFile(authRedirectPath, "utf8");
if (!authRedirectTemplate.includes(authRedirectMarker)) {
    throw new Error("The authentication redirect page is missing its bundle marker.");
}
const authRedirectBundle = await bundle(authRedirectEntryPath);
const authRedirectHtml = authRedirectTemplate.replace(
    authRedirectMarker,
    () => `<script>${authRedirectBundle}</script>`
);
if (
    (authRedirectHtml.match(/<!doctype html>/gi) ?? []).length !== 1 ||
    authRedirectHtml.includes(authRedirectMarker) ||
    !authRedirectHtml.includes("handleRedirectPromise")
) {
    throw new Error("The generated authentication redirect page failed structural validation.");
}

await writeFile(outputPath, html, "utf8");
await writeFile(launcherPath, launcherBundle, "utf8");
await writeFile(solutionOutputPath, html, "utf8");
await writeFile(solutionAuthRedirectPath, authRedirectHtml, "utf8");
await writeFile(solutionLauncherPath, launcherBundle, "utf8");
await writeFile(solutionIconPath, await readFile(iconPath, "utf8"), "utf8");

console.log(`Built ${path.relative(process.cwd(), outputPath)}`);
console.log(`Synced ${path.relative(process.cwd(), solutionOutputPath)}`);
console.log(`Synced ${path.relative(process.cwd(), solutionAuthRedirectPath)}`);
console.log(`Synced ${path.relative(process.cwd(), solutionLauncherPath)}`);
console.log(`Synced ${path.relative(process.cwd(), solutionIconPath)}`);
