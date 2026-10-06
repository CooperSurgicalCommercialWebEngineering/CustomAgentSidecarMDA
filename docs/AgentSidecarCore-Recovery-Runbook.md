# Agent Sidecar — Recovery &amp; Correct-Release Runbook

**Audience:** a CooperSurgical engineer/admin who can deploy to the target Power Platform
environment.
**Goal:** get the **Agent Sidecar administration app** back, with the **prompts** feature working,
and make sure it can never silently disappear again.

> ## ⚠️ Read this first (30-second version)
>
> - There are **two** solutions in this repo. They are **not** interchangeable:
>   - **`AgentSidecarCore`** — the real deliverable. **Contains the administration app** (the Code App
>     `maftagsc_agentsidecar_4b928`). This is what you import into an environment.
>   - **`HRAgentSidecar`** — an HR **reference** only. The repo's unpacked **`solution/`** folder is
>     this one. It has **no administration app**.
> - The admin app "disappeared" because the prompts release was packaged from the **wrong** solution
>   (the `solution/` folder = `HRAgentSidecar`), which does not include the admin app.
> - **A GitHub change by itself does NOT fix your environment.** The administration app only comes back
>   when a **corrected `AgentSidecarCore` solution is exported from Dataverse and imported**. Follow
>   **Part B**.

---

## Table of contents

1. [Who can run this](#who-can-run-this)
2. [Root cause in plain English](#root-cause-in-plain-english)
3. [Part A — Repository safeguards (one-time)](#part-a--repository-safeguards-one-time)
4. [Part B — Fix the environment (required)](#part-b--fix-the-environment-required)
5. [The Go / No-Go validation gate](#the-go--no-go-validation-gate)
6. [Functional smoke test](#functional-smoke-test)
7. [Rollback](#rollback)
8. [Foolproof final checklist](#foolproof-final-checklist)
9. [Frequently hit mistakes](#frequently-hit-mistakes)

---

## Who can run this

You need **all** of the following:

- **Dataverse System Administrator** on the target environment(s).
- **Power Platform CLI** (`pac`) installed: `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`
- A **user** `pac` auth profile (interactive sign-in). `pac code` commands **reject** service-principal
  (SPN) tokens — see [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).
- **Node.js 20+** and the repo cloned locally.

> If you only have Dataverse admin but not the dev toolchain, you can still do **Part B, Option 1**
> (restore the last good app) and add the column (run the provisioner script, or add it by hand in the
> maker portal — **M4**). The full re-release (Option 2) needs the dev toolchain.

---

## Root cause in plain English

1. The prompts feature added a Dataverse column, `maftagsc_prompts`, to the Sidecar Configuration
   table. In the repo, that edit landed in `solution/Entities/maftagsc_sidecarconfiguration/Entity.xml`.
2. But the `solution/` folder is the **`HRAgentSidecar`** reference solution
   (`solution/Other/Solution.xml` → `<UniqueName>HRAgentSidecar</UniqueName>`). It contains an HR app
   module but **not** the administration Code App.
3. So when the release was built by **packing `solution/`** and importing it, the package carried the
   new column **but not the administration app** — and the app effectively vanished from the
   environment.
4. Separately, the checked-in `solution-core/AgentSidecarCore.zip` is **also incomplete**: it still
   contains the (old) administration app and the runtime chips, **but it is missing** the
   `maftagsc_prompts` column **and** the rebuilt admin app that contains the **prompts editor**. So
   importing that ZIP gives you chips you cannot author.

**Bottom line:** the only complete deliverable is an `AgentSidecarCore` solution **exported from
Dataverse** *after* the Code App and the column are in it. Never build the deliverable by packing
`solution/`.

### Why the re-release captures the *whole* prompts feature (evidence)

The prompts feature has three surfaces. **`AgentSidecarCore` already owns all three** as root
components (verified in the exported `solution.xml`), so exporting Core after Part B picks up every
part:

| Prompts feature part | AgentSidecarCore root component it rides on | Filled by |
|----------------------|---------------------------------------------|-----------|
| Prompts **column** (`maftagsc_prompts`) | Table `maftagsc_sidecarconfiguration` — `type="1"` | Part B, Step 2 |
| Admin **prompts editor** (SidecarPromptsEditor, bundled) | Code App `maftagsc_agentsidecar_4b928` — `type="300"` | Part B, Step 3 (`pac code push -s AgentSidecarCore`) |
| Runtime **chips** + bundled catalog | Web resources `agentSidePane.html` / `.js` — `type="61"` | Part B, Step 4 (already present in today's Core ZIP) |

Because the table, the Code App, and the web resources are **all** members of `AgentSidecarCore`, the
single `pac solution export --name AgentSidecarCore` in Step 5 serializes the column, the rebuilt admin
bundle, and the chip runtime together. The validator then proves all three are present before you
ship.

> This is why the **original** `prompts-feature-handoff.md` Route A was wrong: it told you to pack
> `solution/` (= `HRAgentSidecar`), which owns the table but **not** the Code App — so the column
> shipped while the admin app was dropped.

---

## All the ways to bring the prompts feature into AgentSidecarCore

The prompts feature = **column** (`maftagsc_prompts`) + **admin editor** + **chip runtime**. Below is
every supported way to get each part into the `AgentSidecarCore` solution, and how to deploy the
finished package. **Only M1 produces a complete, shippable deliverable** — the others are for promotion,
emergencies, or a single missing piece.

### Per component — where each part comes from

| Part | How it gets into Core | Notes |
|------|-----------------------|-------|
| Column `maftagsc_prompts` | **Preferred:** run `python scripts/provision_sidecar_admin_schema.py` (creates the column via the Dataverse Web API, idempotent). **Or** add it by hand in the maker portal. Then export. | The table `maftagsc_sidecarconfiguration` is already a Core root component, so the column exports with Core |
| Admin **prompts editor** | `npm run build` → `pac code push -s AgentSidecarCore` | The editor is bundled into the Code App; a stale bundle = no editor (validator check #9) |
| **Chip** runtime + catalog | `npm run build:model-driven` → update the 2 web resources → export | Already present in today's Core; chips fall back to a bundled catalog even with no column |

### Overall — how to produce or deploy the package

| # | Method | When to use | Complete, shippable package? |
|---|--------|-------------|------------------------------|
| **M1** | **Build &amp; export from dev** (Part B · Option 2): add column (run the provisioner script) → `pac code push -s AgentSidecarCore` → rebuild web resources → `pac solution export --name AgentSidecarCore` → **validate 10/10** | The real fix; run once per release **in dev** | ✅ Yes — this is the single source of truth |
| **M2** | **Import the validated artifact** to **test/prod** (Part B · Steps 7–8): `pac solution import` the *same* file M1 produced | Promoting to downstream environments | ✅ Consumes M1's ZIP — never rebuild between environments |
| **M3** | **Interim restore** (Part B · Option 1): re-import the last known-good Core ZIP (`77cd24d`) | The app is down **now** and you need relief before M1 | ⚠️ Un-breaks the app; does **not** add prompts |
| **M4** | **Column only, no rebuild** (Route B): run `python scripts/provision_sidecar_admin_schema.py` (or add `maftagsc_prompts` by hand) | You can't rebuild, but need admins to save prompts, and the env already runs a prompts-enabled app bundle | ⚠️ Column only; the editor still needs M1's `pac code push` |

> ❌ **Not a method:** packing the repo's `solution/` folder. That is `HRAgentSidecar`, which has no
> admin app — it is the exact mistake that started this incident.

**Recommended flow:** M3 (only if the app is down) → **M1** (in dev, validated) → **M2** (to test,
smoke-test, then prod).

---

## Part A — Repository safeguards (one-time)

These are code/doc changes that make the mistake impossible to repeat. They are already prepared in
this repo (see `scripts/validate-solution-package.mjs`, its tests, the CI step, and the corrected
docs). They do **not** change any environment — they just **gate** bad packages.

Run the validator locally any time against a package:

```powershell
# From the repo root
node scripts/validate-solution-package.mjs .\solution-core\AgentSidecarCore.zip
# or: npm run validate:solution-package   (defaults to solution-core/AgentSidecarCore.zip)
```

It prints a PASS/FAIL line per requirement and exits non-zero if the package is not shippable. The
unit tests run in CI:

```powershell
npm run test:solution-package
```

> Against the **current** checked-in ZIP this validator **intentionally fails** on
> `Prompts column` and `Prompts editor` — that is the signal that Part B has not been done yet.

---

## Part B — Fix the environment (required)

You have two options. **Option 1** is a fast interim restore. **Option 2** is the real fix. Most teams
do **1 then 2**.

### Option 1 — Restore the administration app now (interim, ~10 min)

Use the last **known-good** `AgentSidecarCore` package (before the prompts packaging mistake) to bring
the app back immediately. This does **not** add prompts; it just un-breaks the environment.

```powershell
# Get the pre-prompts package (commit 77cd24d) WITHOUT changing your working tree:
git show 77cd24d:solution-core/AgentSidecarCore.zip > AgentSidecarCore-known-good.zip

pac auth create --environment <TARGET_ENVIRONMENT_URL>   # interactive user sign-in
pac solution import --path .\AgentSidecarCore-known-good.zip --publish-changes --force-overwrite
```

Then open **make.powerapps.com → (your environment) → Apps** and confirm **Agent Sidecar** is listed
and opens.

> 🔒 **Do NOT uninstall any solution.** Uninstalling can delete the Sidecar tables and their records.
> Importing an update (as above) is safe and preserves data.

### Option 2 — Re-release a complete, prompts-enabled AgentSidecarCore (the real fix)

Do this in a **development** environment first, then promote the exported file to test/prod.

#### Step 1 — Confirm where you are

```powershell
pac auth create --environment <DEV_ENVIRONMENT_URL>   # if not already authed
pac org who                                            # VERIFY this prints your DEV org
```

#### Step 1b — Protect the theme (back up + confirm no drift)

The CooperSurgical side-pane theme (the `--cooper-*` brand colors in `agentSidePane.html`) is **already
committed in this repo and already live** in your environment. These steps make sure a rebuild can never
revert it.

1. **Back up the current solution first** — this snapshot preserves the live theme no matter what:
   ```powershell
   pac solution export --name AgentSidecarCore --path .\solution-core\AgentSidecarCore-backup-pretheme.zip --managed false --overwrite
   ```
2. **Confirm the repo matches the live theme** (so a rebuild reproduces it, not reverts it). Quick check
   — both should show the same `--cooper-*` tokens:
   ```powershell
   # Repo source of truth:
   Select-String -Path model-driven\webresources\maftagsc_\copilot\agentSidePane.template.html -Pattern '--cooper-'
   # Live export you just made (open the backup zip's agentSidePane web resource and compare).
   ```
   - **If they match** → the theme is in the repo (the expected case). Safe to proceed.
   - **If the live side-pane has edits the repo lacks** → someone themed it *in the environment*. **Stop**
     and get those edits into the repo first (commit them), or you will revert Krysta's work in Step 4.

> 🎨 **Theme-risk summary:** only the side-pane **web-resource** step (Step 4) can affect the chat theme.
> `pac code push` (Step 3) rebuilds the **admin app**, a separate surface. The column (Step 2) and the
> export (Step 5) never touch the theme.
>
> 🔴 **Do NOT merge `feat/coopersurgical-sidecar-theme-ours` (or `…/feat/coopersurgical-sidecar-theme`)
> "to be safe."** The CooperSurgical theme is **already on `main`** (it arrived via PR #4) and its brand
> tokens are byte-identical to that branch. Those branches are **stale (Aug 2026)** and predate the
> chips/prompts work — merging one would **revert** the side-pane, not protect it. Build the theme from
> `main`, which is the current source of truth.

#### Step 2 — Add the `maftagsc_prompts` column to **AgentSidecarCore**

**Preferred — run the provisioner script** (idempotent; creates the column via the Dataverse Web API,
exactly matching the canonical schema — multiline text, `MaxLength` 100000, not required):

```powershell
# Authenticates with scripts/auth.py against the env in your .env (see .env.template).
python scripts/provision_sidecar_admin_schema.py
```

The script is safe to re-run — it skips components that already exist and only adds what's missing
(including `maftagsc_prompts`). This is the recommended, repeatable path.

**Fallback — add it by hand** in the maker portal. Make sure you are **inside the `AgentSidecarCore`
solution** (not HRAgentSidecar): **Solutions → AgentSidecarCore → Tables → Sidecar configuration
(`maftagsc_sidecarconfiguration`) → + New column**:

- **Display name:** `Prompts` (the script labels it "Suggested prompts (JSON)")
- **Name:** `maftagsc_prompts`
- **Data type:** **Multiline Text**
- **Required:** No

Save, then **Publish**.

#### Step 3 — Build &amp; push the administration Code App **into AgentSidecarCore**

```powershell
npm install
npm run build
pac code push -s AgentSidecarCore     # the -s target is REQUIRED so the app lands in the deliverable
```

#### Step 4 — Build &amp; deploy the side-pane web resources

```powershell
npm run build:model-driven
```

Update the two **web resources** in place with the regenerated content — upload
`agentSidePane.html` and `agentSidePane.js` in the maker portal (**Solutions → AgentSidecarCore → Web
resources**) or PATCH them via the Web API. **Do not import a solution to do this** (that is the exact
trap that dropped the admin app). Then **Publish all customizations**.

> Today's `AgentSidecarCore` already contains the chip-enabled side-pane, so this step is usually a
> no-op refresh — but run it so the exported content always matches source.

#### Step 5 — Export the completed solution **from Dataverse**

```powershell
pac solution export --name AgentSidecarCore --path .\solution-core\AgentSidecarCore.zip --managed false --overwrite
```

> ❌ **Never** build the deliverable with `pac solution pack --folder .\solution`. That folder is
> `HRAgentSidecar` and will drop the admin app.

#### Step 6 — Validate the export (hard gate — see next section)

```powershell
npm run validate:solution-package
```

If any check fails, **stop** and fix it. Do not import a package that fails validation.

#### Step 7 — Import to a TEST environment and smoke test

```powershell
pac auth create --environment <TEST_ENVIRONMENT_URL>
pac solution import --path .\solution-core\AgentSidecarCore.zip --publish-changes --force-overwrite
```

Run the [Functional smoke test](#functional-smoke-test).

#### Step 8 — Promote the SAME validated file to production

Import the **exact** `AgentSidecarCore.zip` you validated and tested — do not rebuild or re-export
between test and prod.

```powershell
pac auth create --environment <PROD_ENVIRONMENT_URL>
pac solution import --path .\solution-core\AgentSidecarCore.zip --publish-changes --force-overwrite
```

Commit the refreshed, validated `solution-core/AgentSidecarCore.zip` to the repo.

---

## The Go / No-Go validation gate

A package is shippable **only if every check below passes**. Run `npm run validate:solution-package`:

| # | Check | Why it matters |
|---|-------|----------------|
| 1 | Package is a readable solution ZIP | Basic integrity |
| 2 | `solution.xml` present and non-empty | Manifest exists |
| 3 | `customizations.xml` present and non-empty | Component definitions exist |
| 4 | Solution unique name is **AgentSidecarCore** | You exported the deliverable |
| 5 | Package is **not** the HRAgentSidecar reference | You did not pack `solution/` |
| 6 | Admin Code App is a root component (type 300, `maftagsc_agentsidecar_4b928`) | The app ships |
| 7 | Code App package files present and non-empty | The app bundle is real |
| 8 | Prompts column (`maftagsc_prompts`) is in the package | Admins can save prompts |
| 9 | Prompts editor is in the bundled Code App | You pushed the rebuilt app (not a stale build) |
| 10 | Prompt-chip runtime is in the side-pane web resource | Chips render at runtime |

**All 10 must say PASS.** The current checked-in ZIP fails #8 and #9 — that is expected until Option 2
is complete.

---

## Functional smoke test

After importing to a non-production environment, verify:

- [ ] **Agent Sidecar** appears in the Apps list and opens.
- [ ] Existing Sidecar configurations still load (no data loss).
- [ ] In the admin app you can **add, edit, remove, and Save** prompts for a table.
- [ ] Saved prompts **persist** after you reload the app.
- [ ] On a bound form, the **chip bar** shows that form's prompts; clicking a chip sends its text.
- [ ] Navigating to a different bound form **changes** the chips (no reload).
- [ ] Role-restricted prompts only show for the intended security role.
- [ ] Existing sign-in / agent connectivity still works.

---

## Rollback

- **If an import makes things worse:** re-import the previous known-good `AgentSidecarCore.zip`
  (e.g. `git show 77cd24d:solution-core/AgentSidecarCore.zip > rollback.zip`) with
  `pac solution import ... --force-overwrite`.
- **Do not uninstall** the solution to "start clean" — that risks deleting Sidecar tables and records.
- The `maftagsc_prompts` column is additive and harmless; you can leave it in place.

---

## Foolproof final checklist

Tick every box before telling anyone "it's fixed in production":

- [ ] The administration app opens in the target environment.
- [ ] `npm run validate:solution-package` printed **OK: 10/10 checks passed** for the file you shipped.
- [ ] You imported the **same** file you validated (no rebuild between test and prod).
- [ ] Prompts can be authored **and** persist, and chips render on forms.
- [ ] The validated `AgentSidecarCore.zip` is committed to the repo.
- [ ] You did **not** uninstall any solution, and you did **not** pack `solution/`.

---

## Frequently hit mistakes

| Symptom | Cause | Fix |
|--------|-------|-----|
| Admin app missing after import | You imported `HRAgentSidecar` (packed `solution/`) | Import a validated **AgentSidecarCore** export instead |
| Chips show but admins can't save prompts | `maftagsc_prompts` column missing | Part B, Step 2 — run the provisioner script (or add the column by hand) |
| App present but prompts editor missing | Stale Code App bundle; `pac code push` not run with `-s AgentSidecarCore` | Part B, Step 3, then re-export |
| `pac code push` asks for a browser / permission error | You used an SPN auth profile | Use a **user** auth profile (see TROUBLESHOOTING.md) |
| Data disappeared | A solution was **uninstalled** | Restore from backup; never uninstall to "reset" |
