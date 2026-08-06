/**
 * Repacks solution-core/AgentSidecarCore.zip with the freshly built side-pane
 * web resources from solution/WebResources/maftagsc_/copilot/ and bumps the
 * solution version, producing an importable upgrade zip without needing a
 * Dataverse environment.
 *
 * Offline complement to the canonical HANDOFF.md pipeline (deploy to dev,
 * `pac solution export`). Suitable for web-resource-only changes; anything
 * that touches schema, the Code App, or plugins must go through dev export.
 *
 * Run `node model-driven/build.mjs` first (the package:solution-core npm
 * script chains both).
 */
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const modelDrivenRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(modelDrivenRoot, "..");
const defaultZipPath = path.join(repoRoot, "solution-core", "AgentSidecarCore.zip");
const builtWebResourcesRoot = path.join(
    repoRoot,
    "solution",
    "WebResources",
    "maftagsc_",
    "copilot"
);

/**
 * Zip entry names are the web resource logical name with "/" and "." stripped
 * plus a GUID suffix, so each built file maps to a unique entry prefix.
 */
const replacements = [
    { source: "agentSidePane.html", entryPrefix: "maftagsc_copilotagentSidePanehtml" },
    { source: "agentSidePane.js", entryPrefix: "maftagsc_copilotagentSidePanejs" },
    { source: "authRedirect.html", entryPrefix: "maftagsc_copilotauthRedirecthtml" },
    { source: "agentGuideLibrary.svg", entryPrefix: "maftagsc_copilotagentGuideLibrarysvg" }
];

function bumpVersion(version) {
    const segments = version.split(".");
    if (segments.length !== 4 || segments.some((segment) => !/^\d+$/.test(segment))) {
        throw new Error(`Unexpected solution version format: ${version}`);
    }
    segments[3] = String(Number(segments[3]) + 1);
    return segments.join(".");
}

export async function repackCoreSolution({ zipPath = defaultZipPath, outPath = defaultZipPath } = {}) {
    const workDir = await mkdtemp(path.join(tmpdir(), "sidecar-repack-"));
    try {
        execFileSync("unzip", ["-q", zipPath, "-d", workDir]);

        const webResourcesDir = path.join(workDir, "WebResources");
        const entries = await readdir(webResourcesDir);
        const replaced = [];
        for (const { source, entryPrefix } of replacements) {
            const entryName = entries.find((entry) => entry.startsWith(entryPrefix));
            if (!entryName) {
                throw new Error(`No zip entry found for web resource prefix ${entryPrefix}.`);
            }
            await cp(
                path.join(builtWebResourcesRoot, source),
                path.join(webResourcesDir, entryName)
            );
            replaced.push(`${source} -> WebResources/${entryName}`);
        }

        const solutionXmlPath = path.join(workDir, "solution.xml");
        const solutionXml = await readFile(solutionXmlPath, "utf8");
        const versionMatch = solutionXml.match(/<Version>([\d.]+)<\/Version>/);
        if (!versionMatch) {
            throw new Error("solution.xml has no <Version> element.");
        }
        const previousVersion = versionMatch[1];
        const newVersion = bumpVersion(previousVersion);
        await writeFile(
            solutionXmlPath,
            solutionXml.replace(versionMatch[0], `<Version>${newVersion}</Version>`),
            "utf8"
        );

        const stagedZip = path.join(workDir, "repacked.zip");
        execFileSync("zip", ["-q", "-r", "-X", "-D", stagedZip, ".", "-x", "repacked.zip"], {
            cwd: workDir
        });
        await rm(outPath, { force: true });
        await rename(stagedZip, outPath).catch(async (error) => {
            // rename fails across filesystems (tmp -> repo volume); fall back to copy.
            if (error.code !== "EXDEV") {
                throw error;
            }
            await cp(stagedZip, outPath);
        });

        return { previousVersion, newVersion, replaced, outPath };
    } finally {
        await rm(workDir, { recursive: true, force: true });
    }
}

const isMain =
    process.argv[1] !== undefined &&
    pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
    const result = await repackCoreSolution();
    for (const line of result.replaced) {
        console.log(`Replaced ${line}`);
    }
    console.log(`Version ${result.previousVersion} -> ${result.newVersion}`);
    console.log(`Wrote ${path.relative(process.cwd(), result.outPath)}`);
}
