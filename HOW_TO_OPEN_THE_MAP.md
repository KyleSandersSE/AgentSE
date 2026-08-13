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
5. Wait — 830 pins takes a few seconds.

You'll get four layers you can toggle independently:

- **Blocked** (115 pins) — named accounts, do not contact
- **Open — priority (score 70+)** — 120 pins, start here
- **Open — strong (score 50–69)** — 105 pins
- **Open — watch (score <50)** — 490 pins

Click any pin for the agency's opportunity count, total value, EAE score,
primary contact, and its top projects.

### Working the data inside My Maps

Every pin carries 18 data fields, so My Maps gives you a real table, not just
placemarks:

- **Open the table:** click the ⋮ menu next to a layer → **Open data table**.
  Sort by EAE Score, Total Value USD, or High-Fit Projects to rank a layer.
- **Color by a column:** click **Style** under a layer → *Group places by* →
  pick **EAE Score** or **Size Tier**. This re-colors pins on any field you
  choose.
- **Filter:** the data table's column headers filter, so you can narrow a layer
  to one county or size tier without touching the source file.

Fields on every pin: Status · EAE Score · Opportunities · High-Fit Projects ·
Priority Insights · Upgrade or Replace · Total Value USD · High-Fit Value USD ·
Population · Size Tier · County · State · Contact · Contact Title · Email ·
Phone · Project Types · Why Blocked.

> My Maps re-colors imported pins by layer and ignores the file's own colors.
> That is expected — the layer a pin sits in carries its status, and you can
> re-style by any data column above.

**To share:** click **Share** → set to "Anyone with the link" → copy. Recipients
need no account and can open it in the Google Maps mobile app.

### Limits worth knowing

- My Maps allows **10 layers, 2,000 pins per layer, and 5 MB per file**. This
  file is 1.5 MB across 4 layers, so there is room — but if you later split by
  state you will approach the layer cap.
- **38 agencies are not on the map.** They have neither a ZIP nor a county in
  the Citylitics export, so there is nowhere honest to put them. They are all
  in the CSV and workbook exports, and listed in the interactive map's
  "Not on map" panel.

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
