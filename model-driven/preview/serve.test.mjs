import test from "node:test";
import assert from "node:assert/strict";
import { buildPreviewHtml } from "./serve.mjs";

test("preview html embeds the mock bundle in the real template", async () => {
    const html = await buildPreviewHtml();
    assert.equal(
        (html.match(/<!doctype html>/gi) ?? []).length,
        1,
        "exactly one doctype"
    );
    assert.ok(
        !html.includes("<!-- HR_AGENT_SIDEPANE_BUNDLE -->"),
        "bundle marker replaced"
    );
    assert.ok(html.includes("preview-toolbar"), "state switcher present");
    assert.ok(
        html.includes("bubbleFromUserBackground"),
        "shared styleOptions bundled"
    );
});

test("preview bundle contains no production auth code", async () => {
    const html = await buildPreviewHtml();
    assert.ok(!html.includes("PublicClientApplication"), "no MSAL");
    assert.ok(!html.includes("CopilotStudioClient"), "no Agents SDK");
});
