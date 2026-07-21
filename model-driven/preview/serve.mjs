/**
 * Dev-only design-preview server for the Agent Sidecar pane.
 * Injects the mock preview bundle into the REAL side-pane template at the
 * same marker the production build uses, and serves it on port 5178.
 * The bundle is rebuilt on every request — edit, save, refresh.
 * Never used by the production build; nothing here ships in the solution.
 */
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const previewRoot = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.resolve(
    previewRoot,
    "..",
    "webresources",
    "maftagsc_",
    "copilot",
    "agentSidePane.template.html"
);
const entryPath = path.join(previewRoot, "preview.ts");
const marker = "<!-- HR_AGENT_SIDEPANE_BUNDLE -->";
const port = 5178;

export async function buildPreviewHtml() {
    const template = await readFile(templatePath, "utf8");
    if (!template.includes(marker)) {
        throw new Error("The side-pane template is missing its bundle marker.");
    }
    const result = await build({
        entryPoints: [entryPath],
        bundle: true,
        platform: "browser",
        format: "iife",
        target: ["es2020"],
        minify: false,
        legalComments: "none",
        write: false,
        conditions: ["browser", "import", "default"]
    });
    const output = result.outputFiles?.[0];
    if (!output) {
        throw new Error("The preview bundle wasn't generated.");
    }
    const safeBundle = output.text.replaceAll("</script", "<\\/script");
    return template.replace(marker, () => `<script>${safeBundle}</script>`);
}

const isMain =
    process.argv[1] !== undefined &&
    pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
    const server = createServer(async (request, response) => {
        try {
            const html = await buildPreviewHtml();
            response.writeHead(200, {
                "content-type": "text/html; charset=utf-8",
                "cache-control": "no-store"
            });
            response.end(html);
        } catch (error) {
            console.error(error);
            response.writeHead(500, {
                "content-type": "text/plain; charset=utf-8"
            });
            response.end(String(error));
        }
    });
    server.listen(port, () => {
        console.log(`Sidecar design preview: http://localhost:${port}`);
        console.log(
            "Edit agentSidePane.template.html or sidecarStyleOptions.ts, then refresh the browser."
        );
    });
}
