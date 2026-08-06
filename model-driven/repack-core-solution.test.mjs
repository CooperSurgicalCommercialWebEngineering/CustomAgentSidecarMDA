import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repackCoreSolution } from "./repack-core-solution.mjs";

const modelDrivenRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(modelDrivenRoot, "..");
const builtPaneHtmlPath = path.join(
    repoRoot,
    "solution",
    "WebResources",
    "maftagsc_",
    "copilot",
    "agentSidePane.html"
);

function zipEntryNames(zipPath) {
    return execFileSync("zipinfo", ["-1", zipPath], { encoding: "utf8" })
        .trim()
        .split("\n");
}

function readZipEntry(zipPath, entryName) {
    return execFileSync("unzip", ["-p", zipPath, entryName], {
        maxBuffer: 16 * 1024 * 1024
    });
}

test("repacked solution carries the freshly built web resources and a bumped version", async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), "sidecar-repack-test-"));
    const outPath = path.join(outDir, "AgentSidecarCore.zip");

    const result = await repackCoreSolution({ outPath });

    assert.match(result.previousVersion, /^\d+\.\d+\.\d+\.\d+$/);
    assert.match(result.newVersion, /^\d+\.\d+\.\d+\.\d+$/);
    const previousBuild = Number(result.previousVersion.split(".")[3]);
    const newBuild = Number(result.newVersion.split(".")[3]);
    assert.equal(newBuild, previousBuild + 1, "last version segment bumped by one");

    const entries = zipEntryNames(outPath);
    const paneEntry = entries.find((entry) =>
        entry.startsWith("WebResources/maftagsc_copilotagentSidePanehtml")
    );
    assert.ok(paneEntry, "pane html entry present");

    const packedPane = readZipEntry(outPath, paneEntry);
    const builtPane = await readFile(builtPaneHtmlPath);
    assert.ok(packedPane.equals(builtPane), "packed pane html matches the local build output");

    const solutionXml = readZipEntry(outPath, "solution.xml").toString("utf8");
    assert.ok(
        solutionXml.includes(`<Version>${result.newVersion}</Version>`),
        "solution.xml carries the bumped version"
    );

    const entryCount = zipEntryNames(
        path.join(repoRoot, "solution-core", "AgentSidecarCore.zip")
    ).length;
    assert.equal(entries.length, entryCount, "no zip entries lost or added");
});
