# Handoff runbook — add Dynamic Per-Form Prompt Chips to a themed sidecar

**Audience:** a developer (or GitHub Copilot in VS Code) working in a **themed clone** of the
Agent Sidecar whose brand colors already live in the pane. This runbook applies **only** the
dynamic prompts/chips feature and **never modifies your theme**.

This is a **mechanical apply/deploy script**, not a "build it from a description" prompt. It merges a
pre-built, pre-tested branch and walks you through the one small merge you have to confirm. Follow the
steps in order. Each **VERIFY** gate must pass before you continue.

> ⚠️ **Two solutions live in this repo — do not confuse them.**
> - **`AgentSidecarCore`** is the reusable **deliverable**: it contains the Agent Sidecar
>   administration Code App (`maftagsc_agentsidecar_4b928`). This is what customers import.
> - **`HRAgentSidecar`** is only the **HR reference**. The unpacked **`solution/`** folder in this
>   repo is that reference (`solution/Other/Solution.xml` → `<UniqueName>HRAgentSidecar</UniqueName>`),
>   and it does **not** contain the administration Code App.
>
> **Never build the customer deliverable by packing `solution/`.** Doing so ships a package with no
> admin app — the app "disappears" on import. Always produce `AgentSidecarCore.zip` by exporting the
> **AgentSidecarCore** solution from Dataverse, and validate it with `npm run validate:solution-package`
> before handing it on.

---

## 0. What you are applying (and what you are NOT)

**You ARE adding:**
- Role-aware **suggested-prompt chips** that change per form (a chip bar above the chat).
- **In-app prompt authoring** in the Administration app — edit each table's prompts with no code.
  Tables appear as **collapsible sections** (start collapsed, click to expand, plus Expand all /
  Collapse all).
- A per-session **config cache** and a **self-healing navigation** fix (chips follow form changes).
- An additive Dataverse column, `maftagsc_prompts` (multiline text) on the existing
  `maftagsc_sidecarconfiguration` table. **No new table.**

**You are NOT adding (intentionally excluded):**
- Silent token refresh, SSO login-hint, or the reconnect UI. This branch is **auth-free** so it
  cannot disturb your sign-in flow.

**Theme safety guarantee:** the chips are additive DOM. They do **not** touch Web Chat `styleOptions`
or your brand CSS. The chips carry their own `--sidecar-chip-*` tokens (see Step 5). The merge below
touches your theme file in exactly **two** places, and in both the resolution is *"keep your line and
keep ours"* — your colors are preserved verbatim.

---

## 1. Prerequisites

```powershell
node --version      # >= 18
npm --version       # (or pnpm; this repo supports both)
git --version
pac --version       # Power Platform CLI, for deployment
```

- A clean working tree on **your themed branch** (the branch that holds your brand colors). Commit or
  stash anything outstanding first.
- Ability to fetch the delivery branch (URL provided with this handoff).

```powershell
# Run all commands from the repository root.
cd <path-to-your-repo>
git status                      # must be clean
git rev-parse --abbrev-ref HEAD # note your themed branch name; call it <YOUR_THEME_BRANCH>
```

---

## 2. Fetch the delivery branch

The feature ships on branch **`feature/dynamic-prompts-only`** in this public repository. Add it as a
remote and fetch it (copy these commands as-is):

```powershell
git remote add prompts https://github.com/walkthenose75/CustomAgentMDA-1.git
git fetch prompts feature/dynamic-prompts-only
```

**VERIFY** the branch is present:

```powershell
git log --oneline -1 prompts/feature/dynamic-prompts-only
# -> feat(prompts): add dynamic per-form suggested-prompt chips (auth-excluded)
```

> Offline alternative: if you were given a `dynamic-prompts-only.bundle` file instead of a URL, run
> `git fetch <path-to>.bundle feature/dynamic-prompts-only:refs/remotes/prompts/feature/dynamic-prompts-only`.

---

## 3. Merge into your themed branch

```powershell
git checkout <YOUR_THEME_BRANCH>
git merge --no-ff prompts/feature/dynamic-prompts-only
```

Git auto-merges everything except a small set of files. **Expected result:**

- **Auto-merged cleanly** (no action): the pane script `agentSidePane.ts`, the launcher, the entire
  Administration app under `src/`, the runtime modules, `build.test.mjs`, and `Entity.xml`.
- **Conflicts you resolve by hand — one file:** `agentSidePane.template.html` (two tiny hunks; Step 4).
- **Conflicts you resolve by rebuild — generated files:** the two built `agentSidePane.html` copies
  (and possibly `agentSidePane.js`). **Do not hand-edit these** — Step 4 regenerates them.

**VERIFY** the conflict set matches expectations:

```powershell
git diff --name-only --diff-filter=U
```

You should see only:
```
model-driven/webresources/maftagsc_/copilot/agentSidePane.template.html
model-driven/webresources/maftagsc_/copilot/agentSidePane.html
solution/WebResources/maftagsc_/copilot/agentSidePane.html
```
If `agentSidePane.ts` or any `src/**` file appears here, stop and re-read — that is not expected.

---

## 4. Resolve the two template hunks, then rebuild

Open `model-driven/webresources/maftagsc_/copilot/agentSidePane.template.html`. There are **exactly two**
conflict markers. In both, the rule is **keep your theme line AND keep the incoming line** (a union).

### Hunk 1 — inside `:root` (your text vars + the chip tokens)

Replace this conflict block:

```
HEAD side:
            color: var(--your-ink-var);          /* <- your existing theme lines */
            background: var(--your-surface-var);
incoming side:
            color: #242424;
            background: #ffffff;

            /* Suggested-prompt chips — self-contained theme tokens ... */
            --sidecar-chip-accent: #0f6cbd;
            --sidecar-chip-bg: #ffffff;
            --sidecar-chip-hover-bg: #eff6fc;
            --sidecar-chip-border: #d1d1d1;
            --sidecar-chip-bar-bg: #fafafa;
            --sidecar-chip-bar-border: #e0e0e0;
end incoming side
```

…with **your two lines, followed by the chip token block** (drop the incoming `color:`/`background:`
stock lines — keep YOURS):

```
            color: var(--your-ink-var);
            background: var(--your-surface-var);

            /* Suggested-prompt chips — self-contained theme tokens. Defaults match
               stock Fluent. To brand the chips, edit --sidecar-chip-accent (and
               optionally the two backgrounds); these never touch the host pane theme. */
            --sidecar-chip-accent: #0f6cbd;
            --sidecar-chip-bg: #ffffff;
            --sidecar-chip-hover-bg: #eff6fc;
            --sidecar-chip-border: #d1d1d1;
            --sidecar-chip-bar-bg: #fafafa;
            --sidecar-chip-bar-border: #e0e0e0;
```

### Hunk 2 — inside `#chat` (the grid gains one row)

Replace this conflict block:

```
HEAD side:
            grid-template-rows: auto minmax(0, 1fr);
            background: var(--your-surface-var);   /* <- keep if present in your theme */
incoming side:
            grid-template-rows: auto auto minmax(0, 1fr);
end incoming side
```

…with the **incoming 3-row grid** (the chip bar needs its row) **plus any theme line you had**:

```
            grid-template-rows: auto auto minmax(0, 1fr);
            background: var(--your-surface-var);
```

> Why: `auto minmax(0,1fr)` = toolbar + chat. `auto auto minmax(0,1fr)` = toolbar + **chip bar** + chat.

### Rebuild the generated files (this resolves the `agentSidePane.html` conflicts)

```powershell
npm install                     # first time only
npm run build:model-driven      # regenerates BOTH built agentSidePane.html copies + agentSidePane.js
git add -A
```

**VERIFY** no markers remain and no conflicts are left:

```powershell
Select-String -Path model-driven/webresources/maftagsc_/copilot/agentSidePane.template.html -Pattern '^<<<<<<<|^=======$|^>>>>>>>'   # empty
git diff --name-only --diff-filter=U                                                                                                  # empty
```

**VERIFY** your theme and the chips now coexist in the built pane:

```powershell
Select-String -Path model-driven/webresources/maftagsc_/copilot/agentSidePane.html -Pattern 'prompt-chip'   # present (chips)
# and your own brand token (e.g. a --your-*-var name) is still present   # present (theme intact)
```

Then finish the merge:

```powershell
git commit --no-edit
```

---

## 5. (Optional) Brand the chips

The chips ship neutral (they look native on any theme). To match your brand, edit the tokens you just
merged into `:root` in `agentSidePane.template.html` — in practice you only need the first one:

```css
--sidecar-chip-accent: <your-brand-color>;   /* chip text, hover border, focus ring */
--sidecar-chip-hover-bg: <your-brand-tint>;  /* optional: chip hover background */
--sidecar-chip-bg: #ffffff;                  /* optional: chip background */
```

Then rebuild: `npm run build:model-driven`. These tokens are **separate** from your theme vars and are
the *only* place chip color is defined.

---

## 6. Add the `maftagsc_prompts` column

In-app authoring writes to a multiline-text column, `maftagsc_prompts`, on the existing
`maftagsc_sidecarconfiguration` table. Add it once per environment. **Runtime chips work without it**
(they fall back to the bundled catalog), but **saving prompts in the admin app requires it.**

- **Route A — ship it inside the AgentSidecarCore solution** (recommended): the column must live in
  the **AgentSidecarCore** solution — the reusable deliverable that also contains the administration
  Code App. Add `maftagsc_prompts` to `maftagsc_sidecarconfiguration` **in AgentSidecarCore** (maker
  portal or `pac`), then export that solution from Dataverse and import the refreshed package. Then
  **Publish all customizations** and run `npm run validate:solution-package` to confirm the export is
  complete.

  > ⚠️ **Do NOT pack the repo's `solution/` folder as the deliverable.** That unpacked source is the
  > **HRAgentSidecar** reference (`solution/Other/Solution.xml` → `<UniqueName>HRAgentSidecar`), which
  > has **no** administration Code App. Packing and importing it adds the prompts column but makes the
  > admin app disappear. The `maftagsc_prompts` definition in
  > `solution/Entities/maftagsc_sidecarconfiguration/Entity.xml` belongs to that HR reference — it does
  > **not** put the column into the AgentSidecarCore deliverable.
- **Route B — add it manually** in the maker portal: open the **Sidecar configuration**
  (`maftagsc_sidecarconfiguration`) table → **New column** → Display name `Prompts`, name
  `maftagsc_prompts`, data type **Multiline Text**, **not required** → Save → **Publish**.

---

## 7. Full green baseline

```powershell
npm run typecheck
npm run lint
npm run test:model-driven
npm run typecheck:model-driven
npx vitest run --testTimeout=120000
npm run build
npm run build:model-driven
```

**VERIFY** all pass. (`build:model-driven` regenerates the web resources one last time so the built
files match source before you deploy.)

---

## 8. Deploy

Use **your existing deployment path**. The change set is: two web resources + the Code App + the column.

1. **Pane web resources** — publish the regenerated files
   `solution/WebResources/maftagsc_/copilot/agentSidePane.html` and `.../agentSidePane.js` (import the
   solution, or update the two web resources directly), then **Publish all customizations**.
2. **Administration (Code App)** — from the repo root, push into **AgentSidecarCore** so the admin app
   and the prompts editor land in the deliverable:
   ```powershell
   pac auth create --environment <YOUR_ENV_URL>   # if not already authed
   npm run build
   pac code push -s AgentSidecarCore
   ```
   Then export and validate the refreshed deliverable before you hand it on:
   ```powershell
   pac solution export --name AgentSidecarCore --path ./solution-core/AgentSidecarCore.zip --managed false --overwrite
   npm run validate:solution-package
   ```
3. **Column** — done in Step 6.

---

## 9. Verify in the running app

1. Hard-refresh the model-driven app (**Ctrl+F5**).
2. Open a record on a **bound** form → the chip bar shows that form's prompts. Click a chip → its text
   is sent as a message.
3. Navigate to a **different bound** form → chips **change** to the new form (no reload).
4. Confirm chips are **role-filtered** (a role-restricted prompt only shows for that role).
5. In the **Administration** app, open a sidecar → edit a table's prompts → **Save** → reload the
   pane → your authored prompts override the bundled defaults.
6. Confirm your **theme is unchanged** (bubble colors, header, fonts identical to before).

---

## 10. Rollback

Everything is one merge commit plus the column.

```powershell
git revert -m 1 <merge-commit-sha>      # removes the feature, keeps your theme
npm run build:model-driven && git add -A && git commit --no-edit
# redeploy the reverted web resources + pac code push
```

The `maftagsc_prompts` column is additive and harmless; leave it, or delete it in the maker portal.
Reverting the code makes the runtime ignore it.

---

## 11. Open the pull request (into your own repo)

```powershell
git push origin <YOUR_THEME_BRANCH>
gh pr create --base <your-default-branch> --head <YOUR_THEME_BRANCH> \
  --title "Add dynamic per-form prompt chips" \
  --body "Applies the auth-free dynamic prompts/chips feature. Theme untouched; adds the maftagsc_prompts column and in-app prompt authoring. Green baseline verified."
```

---

## Appendix — why this is safe (evidence)

- The delivery branch was cut from the same upstream `main` your theme branch descends from, so git does
  a clean 3-way merge. A real test-merge into a themed branch produced **exactly** the conflicts listed
  in Step 3 — the two template hunks (Step 4) and the generated `agentSidePane.html` (rebuild). The pane
  **script** and every `src/**` admin file auto-merged with **no** conflict.
- The pane script does **not** modify Web Chat `styleOptions`; your brand hex there is left as-is.
- Prompt chips read from a bundled catalog merged over your live config, so they render even before the
  `maftagsc_prompts` column exists — the column only enables *authoring*.

### File inventory (what the merge brings in)

| Area | Files |
| --- | --- |
| New runtime modules | `promptCatalog.ts`, `contextResolution.ts`, `configCache.ts` |
| Pane (additive) | `agentSidePane.ts`, `agentSidePane.template.html`, `agentSidePaneLauncher.ts` |
| Runtime config | `sidecarConfiguration.ts`, `sidecarConfigurationRepository.ts`, `hrSidecarBootstrap.ts` |
| Admin authoring | `src/components/SidecarPromptsEditor/**`, `src/lib/sidecar-prompts.ts`, provider/hook/type wiring |
| Schema | `solution/Entities/maftagsc_sidecarconfiguration/Entity.xml` (adds `maftagsc_prompts`) |
| Tests | `build.test.mjs` (+8 prompts tests), `tests/model-driven/sidecar-configuration.test.ts`, `src/lib/sidecar-prompts.test.ts` |
