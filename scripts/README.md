# Scripts

## Generate experience recap pages

Builds recap data and HTML for **Junction**, **Philidor**, and **Stakelab** from the vibecoding folders (sibling of this repo).

**Run from repo root:**

```bash
node scripts/generate-experience-data.js
```

**Requires:** The parent folder must be `vibecoding` and contain:

- `junction/` (JunctionCode, perps-api)
- `philidor-io/`
- `Website-StakeLab/`

**Output:**

- `data/junction.json`, `data/philidor.json`, `data/stakelab.json`
- `experience/junction.html`, `experience/philidor.html`, `experience/stakelab.html`

`generate-experience-data.js` now writes the JSON recap files only. It does not overwrite HTML.

## Project pages

All portfolio pages are rendered from `data/projects.json`:

```bash
node scripts/generate-projects.js
```

That writes `index.html`, `experience/<slug>.html` (Stakelab, Junction, Philidor), and `projects/<slug>.html` for every other entry.

To add a project:

1. Append an object to `data/projects.json` (copy a nearby entry: `slug`, `name`, `pitch`, `card`, `status`, `url`, `paragraphs`, `features`, `shots`).
2. Leave `role` null and omit `why` when those facts are not in the repo or on the product site. The page shows a TODO in that section.
3. Put screenshots in `assets/projects/<slug>/` and list them in `shots`. If there is no reachable URL, set `shots` to `[]` and `shotPlaceholder` to a short reason.
4. Re-run the script. Do not hand-edit the generated HTML; the next run replaces it.
