# Water Districts — EAE Targeting Map

Territory targeting for **EcoStruxure Automation Expert (EAE)** across
CA / WA / OR / NV / AZ / HI, built from the Citylitics Intelligence Feeds export.

Open **`water.html`** in any browser. No server, no internet connection —
Leaflet is vendored in `vendor/` and the dataset is embedded in `water-data.js`.

---

## What's here

| File | What it is |
| --- | --- |
| `water.html` / `water-app.js` / `water-styles.css` | The interactive map |
| `water-data.js` | Generated dataset (agencies + opportunities) |
| `build_water_map.py` | Rebuilds everything from the Citylitics CSV |
| `WaterDistricts_EAE_Targets.csv` | Agency-level target list, ranked by EAE score |
| `WaterDistricts_EAE_Opportunities.csv` | Every opportunity, with agency score and status |
| `WaterDistricts_EAE.kml` | Import into Google My Maps for a shareable link |
| `data/` | Source CSV, ZIP reference data, account lists, geo overrides |

## Current numbers

868 agencies · 3,959 opportunities · $34.2B total opportunity value ·
3,434 high-fit projects. 830 agencies are placed on the map; 38 lack both ZIP
and county in the source and are listed in the sidebar's "Not on map" panel.

---

## Adding your account lists

Targetability is driven by three optional CSVs. Until they are supplied,
**every agency shows as "Open / Unverified."**

Drop these into `data/` and re-run `python3 build_water_map.py`:

| File | Meaning | Map colour |
| --- | --- | --- |
| `named_accounts_excluded.csv` | Named accounts you **cannot** target | red |
| `water_accounts_existing.csv` | Accounts that already have projects | blue |
| `rural_water_targets.csv` | Your rural water target list | green |

Each file needs a column holding the agency name — the loader picks it up
automatically from headers like `account`, `agency`, `owner`, `name`,
`customer`, `district`, `entity`, or `utility`. Extra columns are ignored.

Names are matched on a normalized form that strips civic filler
("City of", "District", "Authority", "Water", …), so `City of Buckeye`,
`Buckeye, City of`, and `Buckeye` all collapse to the same key. Matching is
exact on that normalized form — it will not guess at near-misses, so check
the build output and spot-check the result.

## EAE fit scoring

Each opportunity is graded **High / Medium / Low** on its Citylitics
indicator, following the phased-overlay positioning in *Getting started with
an EAE project* — Phase 1 lands on pump/lift stations, SCADA and data
orchestration, and electrical control, where EAE rides on existing hardware
without a rip-and-replace.

- **High** — lift stations, pump stations, monitoring & control software, OT,
  cybersecurity, power supply/control/protection, electrical systems, and
  water/wastewater treatment plants
- **Medium** — distribution and collection system-wide work, wells,
  reservoirs, tanks, metering, biosolids, water quality
- **Low** — pipe, valve, financial, master planning, everything else

The agency **EAE score (0–100)** weights project density and modernization
signal over raw dollars, so a small district with four lift-station upgrades
outranks a large agency with one pipe replacement:

| Component | Max | Basis |
| --- | --- | --- |
| High-fit project count | 30 | 6 per project |
| Medium-fit count | 10 | 2 per project |
| High-fit value | 20 | scaled to $5M |
| Priority-ranked insights | 15 | 3 per insight |
| Upgrade / replace / rehab | 15 | 3 per project |
| Rural bonus (pop < 50k) | 10 | flat |

To retune, edit `HIGH_FIT_INDICATORS`, `MEDIUM_FIT_INDICATORS`, or the
score components in `build_water_map.py` and rebuild.

---

## Data quality notes

Worth knowing before you trust a number:

- **`-` is the null placeholder** throughout the Citylitics export. A naive
  read shows 100% fill on every column. True fill: opportunity value 73.6%,
  contact email 93.4%, population 93.5%, facility name 10.1%.
- **Seven agency names span two states** — "City of Phoenix" is both AZ and
  OR, "County of Clark" both NV and WA. Agencies are keyed on name **and**
  state so these stay separate.
- **185 rows pack two ZIPs into one cell** (e.g. `92325,91708`), pairing a
  county-seat administrative address with the agency's own. Neither position
  is reliably correct, so the six affected agencies are pinned explicitly in
  `data/geo_overrides.csv`. Add a row there for any future case.
- **Pins are ZIP-centroid accurate (±1–3 miles)**, not rooftop. Street
  addresses in the export frequently omit the city, so rooftop geocoding
  isn't possible from this file alone. Eight agencies fall back to a ZIP3
  regional centroid — see the `geo` column in the CSV.
- **Population is the agency's own reported figure** and is sometimes clearly
  understated (Inland Empire Utilities Agency reports 10,000 against a real
  service population in the hundreds of thousands). Treat the size tier as a
  filter aid, not ground truth.

## Google My Maps

Import `WaterDistricts_EAE.kml` at [mymaps.google.com](https://mymaps.google.com)
→ Create a new map → Import. Each folder becomes its own layer:

- Open — priority (score 70+) — 165
- Open — strong (score 50–69) — 123
- Open — watch (score <50) — 542

Once account lists are loaded, Blocked / Rural Target / Existing Account
become their own layers too. My Maps caps at 10 layers and 2,000 features
per layer; the current split stays well inside both.

## Rebuilding

```bash
python3 build_water_map.py
```

Reads `data/citylitics_master.csv` (override with the `CITYLITICS_CSV`
environment variable) and regenerates the dataset, both CSVs, and the KML.
Requires `pandas`.
