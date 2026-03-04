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

Each experience page shows: what was implemented, languages & frameworks, third-party services & APIs, and which vibecoding folders were used. You can edit the script (`buildJunction`, `buildPhilidor`, `buildStakelab`) to refine the recap or add more projects.
