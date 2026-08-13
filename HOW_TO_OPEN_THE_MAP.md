# How to open the map

Two versions of the same data. Use whichever fits the moment.

| | Interactive map (`water.html`) | Google My Maps |
| --- | --- | --- |
| Best for | Your own targeting work | Sharing with a team |
| Sharing | Send the folder, or host it | Send a link |
| Filtering | Full — score, size, state, value, status | Layer on/off only |
| Works on phone | Not really | Yes, in the Google Maps app |
| Setup | Download once | ~5 minutes, one time |

---

## Option A — Google My Maps (the shareable one)

You need `WaterDistricts_EAE.kml`. It came through in chat; it's also in the
repo.

1. Go to **[mymaps.google.com](https://www.google.com/mymaps)** and sign in.
2. Click **+ Create a new map**.
3. Click **Import** (under the "Untitled layer" heading in the left panel).
4. Drag in `WaterDistricts_EAE.kml`, or browse to it.
5. Wait — 1,666 pins takes a few seconds.

You'll get three layers:

- **Water - Blocked** (115 pins) — named accounts, do not contact
- **Water - Rural Targets** (933 pins) — your CRWA rural water list, both
  agencies with active Citylitics opportunities and ones with none
- **Water - Open Targets** (618 pins) — everything else you can pursue

Rural gets its own layer specifically for area-by-area cold calling — one
click hides everything else. Click any pin for the agency's opportunity
count, total value, EAE score, primary industry, primary contact, and its
top projects **with a working Citylitics link on each one**.

### The CRWA rural water list

Your `Final_CRWA_Contact_List.xlsm` Master Tracker (952 contacts) is folded
in two ways:

- **112 matched an existing Citylitics agency** — double-tagged. That pin now
  shows both its Citylitics opportunities *and* a "Also a CRWA rural water
  contact" note with your campaign group and status.
- **836 had no confident match** — these get their own pin, geocoded from
  their own mailing address, with no opportunity data (there isn't any) but
  full CRWA contact and campaign info: group letter, campaign status,
  responded/meeting-booked flags, and notes.

Matching reused the same entity-aware logic built for the named-account
cross-reference (place + governance type + service domain all have to
agree), plus one thing that check never had: your CRWA list carries real
mailing addresses, so every candidate match is cross-checked against county.
That caught real collisions the name alone would have missed — **Union
Sanitary District** (Alameda County) is not **Union Public Utility
District** (Calaveras County, 130 miles away) despite both being called
"Union ... District." Four such cases were kept as their own standalone
pins instead of merged into an unrelated agency. Full detail in
`RuralTargets_MatchReport.csv`.

**4 CRWA contacts aren't on the map** — three California mobile-home-park
water systems and one Montana entity were recorded under corporate billing
addresses (a business-license processor in New York, a management
company's PO Box) rather than the water system's actual site. Geocoding
those would put pins in the wrong state, so they're kept in
`data/crwa_only_targets.csv` and the match report but not placed. Worth a
manual look if you want them on the map — the file has the org names.

### Turning on color — do this first

My Maps imports every pin the same flat black by default; it does not
reliably apply a KML file's own icon colors. Color comes from a feature
inside My Maps itself, and it's one click per layer:

1. Click the **Water - Open Targets** layer.
2. Click **Individual styles** (directly under the layer name) to open the
   style panel.
3. Under **Group places by**, choose a field — good starting points:
   - **EAE Score** — numeric, so My Maps offers a color ramp with adjustable
     buckets (try 4–5 buckets). This recreates the old priority/strong/watch
     bands, but as togglable groups *inside* the layer instead of separate
     layers, so you can hide the bottom band with one click.
   - **Primary Industry** — Wastewater / Drinking Water / Software /
     Stormwater / Mixed. Useful if you want to see where the SCADA-heavy
     "Software" opportunities cluster.
   - **Size Tier** — Rural / Small / Mid / Large, matching your rural-water
     focus.
4. Repeat for **Water - Blocked** — try **Block Confidence**, which splits
   *confident* matches from *similar name (assumed blocked)* ones, so you can
   see at a glance which blocks are certain and which are your judgment call
   to revisit later.

Each grouping gets its own legend with checkboxes right there in the layer
panel — that's the same toggle convenience the old 4-layer split gave you,
without spending 4 of your 10 available layers on one vertical.

### Getting to the Citylitics opportunity

Two ways, both now built in:

- **Click a pin.** The popup lists up to 8 opportunities, each ending in
  **"Open in Citylitics ↗"** — a real link that opens the source record in a
  new tab.
- **Open the data table** (⋮ next to a layer → **Open data table**). The
  **Top Citylitics Link** column holds the link to that agency's
  highest-value opportunity, and My Maps auto-linkifies it — click straight
  through from the table without opening the pin first.

If an agency has more than 8 opportunities, the popup says how many more and
points you to the CSV or workbook for the rest — packing all 3,959 into pin
popups isn't practical, but every one is a link.

### The full data table

Every pin carries these fields, sortable and filterable from the data table:
Status · EAE Score · Primary Industry · Opportunities · High-Fit Projects ·
Priority Insights · Upgrade or Replace · Total Value USD · High-Fit Value USD ·
Population · Size Tier · County · State · Contact · Contact Title · Email ·
Phone · Project Types · Top Citylitics Link · Why Blocked · Block Confidence.

**To share:** click **Share** → set to "Anyone with the link" → copy. Recipients
need no account and can open it in the Google Maps mobile app.

### Room for other verticals (bringing in your industrial/F&B data)

The map uses 3 of My Maps' **10-layer cap**, and layers don't nest — a KML
`<Folder>` becomes a flat entry in the same list, not a sub-group. So the way
to organize by vertical is naming, not hierarchy:

- This file's layers are named **"Water - Blocked"**, **"Water - Rural
  Targets"**, and **"Water - Open Targets"**.
- Give any other vertical's KML the same pattern — e.g.
  **"F&B - Blocked"** / **"F&B - Open Targets"** — and import it into this
  same My Map (**Add layer** → **Import**, same steps as above). The list
  will read as grouped by vertical even though My Maps itself keeps it flat.
- If your Food & Beverage / industrial dataset is a CSV with addresses or
  lat/lon, My Maps can import that directly — no KML conversion needed,
  same **Add layer → Import** flow. If it needs the same scoring and
  ExtendedData treatment this file got, send it over and I'll build a
  matching KML with the same field set so both verticals filter and style
  the same way.

### Limits worth knowing

- My Maps allows **10 layers, 2,000 pins per layer, and 5 MB per file**. This
  file is 3.3 MB across 3 layers — 7 layers of headroom for other verticals,
  though less byte headroom than before now that CRWA contact data is baked
  in.
- **42 agencies are not on the map** — 38 Citylitics agencies with neither a
  ZIP nor a county in the export, plus the 4 CRWA contacts recorded under an
  out-of-state corporate address (see above). All 42 are still in the CSV
  and workbook exports; the Citylitics 38 are also listed in the interactive
  map's "Not on map" panel.

---

## Option B — The interactive map

This is the one with real filtering. It needs no server and no internet —
Leaflet is bundled and the data is baked in, so it opens straight from disk.

### Getting the files

The map is four files that must sit in the same folder: `water.html`,
`water-app.js`, `water-styles.css`, `water-data.js`, plus the `vendor/` folder.

**If you have GitHub Desktop or git:**

```
git clone https://github.com/KyleSandersSE/AgentSE
cd AgentSE
git checkout claude/water-districts-targeting-map-yo8ojb
```

**If you don't:**

1. Go to <https://github.com/KyleSandersSE/AgentSE>
2. Switch the branch dropdown to `claude/water-districts-targeting-map-yo8ojb`
3. **Code** → **Download ZIP**
4. Unzip it somewhere permanent, like `Documents\EAE-Map`

### Opening it

**Double-click `water.html`.** That's the whole step — it opens in your default
browser.

If double-clicking opens a text editor instead of a browser, right-click →
**Open with** → Chrome or Edge.

> Don't open `index.html` — that's the Food & Beverage map from before.
> The water map is **`water.html`**.

### Using it

- **Left sidebar** filters everything at once. "Targeting status" chips toggle
  Blocked and Open; turn Blocked off to see only what you can work.
- **Agency size** → *Rural + Small (<50k)* is your core focus, in one click.
- **Ranked targets** lists the top 80 by EAE score. Click any row to jump to it.
- **Export CSV** dumps whatever is currently filtered — this is the fastest way
  to build a call list.
- Clicking a pin or a ranked row opens the full detail panel on the right:
  every opportunity, its value, the facility, consultants already circling,
  and contact emails and phone numbers.

### Sharing it

Zip the folder and send it — it works offline on any machine. For a real link,
put the folder in SharePoint/OneDrive, or ask IT to drop it on an internal web
server.

---

## Which pins are which

| Color | Meaning |
| --- | --- |
| 🔴 Red | **Blocked** — Schneider named account, do not contact |
| 🟣 Purple | Open, strong EAE fit (score ≥ 50) |
| ⚪ Grey | Open, lower fit |
| 🟢 Green | On your rural water target list *(once you send that list)* |
| 🔵 Blue | Existing account with projects *(once you send that list)* |

Pin size scales with how many opportunities the agency has.
