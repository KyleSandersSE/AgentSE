#!/usr/bin/env python3
"""
Build the Water Districts EAE targeting map dataset.

Reads the Citylitics Intelligence Feeds export, geocodes each agency to a ZIP
centroid, scores every opportunity for EcoStruxure Automation Expert (EAE) fit,
rolls opportunities up to the agency level, and emits:

    water-data.js                     - embedded dataset for water.html
    WaterDistricts_EAE_Targets.csv    - agency-level target list
    WaterDistricts_EAE_Opportunities.csv - opportunity-level detail
    WaterDistricts_EAE.kml            - Google My Maps import

Targetability comes from three optional account lists (see ACCOUNT_LISTS).
Any agency not on a list is flagged "Open / Unverified".

Usage:  python3 build_water_map.py
"""

import csv
import html
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))

SOURCE_CSV = os.environ.get(
    "CITYLITICS_CSV",
    os.path.join(HERE, "data", "citylitics_master.csv"),
)

# Optional account lists. Drop a CSV in place and it is picked up automatically.
# Each needs a column holding the agency name; the loader finds it heuristically.
ACCOUNT_LISTS = {
    "blocked": os.path.join(HERE, "data", "named_accounts_excluded.csv"),
    "existing": os.path.join(HERE, "data", "water_accounts_existing.csv"),
    "rural": os.path.join(HERE, "data", "rural_water_targets.csv"),
}

ZIP_SOURCES = [
    os.path.join(HERE, "data", "zips_primary.csv"),
    os.path.join(HERE, "data", "zips_secondary.csv"),
]

TERRITORY = ["CA", "WA", "OR", "NV", "AZ", "HI"]

NULLS = {"-", "", "n/a", "N/A", "None", "null", "nan"}


# --------------------------------------------------------------------------
# EAE fit model
# --------------------------------------------------------------------------
# Derived from the phased-overlay positioning in "Getting started with an EAE
# project": Phase 1 lands on pump/lift stations, SCADA and data orchestration,
# and electrical control - places where EAE rides on existing hardware without
# a rip-and-replace. Treatment plants score high because controls modernization
# is nearly always in scope on a plant upgrade.

HIGH_FIT_INDICATORS = {
    "Lift Station Initiatives",
    "Pump Station Initiatives",
    "Pump Initiatives",
    "System Monitoring and Control Software Initiatives",
    "Operational Technology (OT) Initiatives",
    "Cybersecurity Initiatives",
    "Power Supply, Control, and Protection Initiatives",
    "Electrical Systems-Wide Initiatives",
    "Water Treatment Plant or Facility Initiatives",
    "Wastewater Treatment Plant or Facility Initiatives",
    "Stormwater Treatment Plant or Facility Initiatives",
    "Disinfection Initiatives",
    "Secondary Treatment Initiatives",
    "Pretreatment Initiatives",
    "Primary Treatment Initiatives",
    "Tertiary Treatment Initiatives",
    "Aeration Initiatives",
    "Blower Initiatives",
    "Motor Initiatives",
    "Generator Initiatives",
    "SCADA Initiatives",
}

MEDIUM_FIT_INDICATORS = {
    "Distribution System-Wide Initiatives",
    "Collection System-Wide Initiatives",
    "Well Initiatives",
    "Reservoir Initiatives",
    "Water Tank or Tower Initiatives",
    "Operations-Wide Initiatives",
    "Biosolids and Sludge Management Initiatives",
    "Emerging Contaminants Initiatives",
    "Effluent Quality Initiatives",
    "Water Quality Initiatives",
    "Booster Station Initiatives",
    "Metering Initiatives",
    "Water Storage or Supply Initiatives",
    "Odor Control Initiatives",
    "Screening Initiatives",
}

# Initiative types that signal modernization of something already installed -
# the sweet spot for an EAE overlay.
MODERNIZATION_TYPES = ("Upgrade", "Replacement", "Rehabilitation", "Expansion")

WATER_INDUSTRIES = {"Wastewater", "Drinking Water", "Stormwater", "Software"}


def norm_name(s):
    """Normalize an agency name for fuzzy matching across account lists."""
    if s is None:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = s.encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    # Strip common civic prefixes/suffixes and org-type words so that
    # "City of Buckeye", "Buckeye, City of" and "Buckeye" all collapse.
    stop = {
        "city", "of", "town", "county", "the", "district", "authority",
        "agency", "department", "dept", "utilities", "utility", "water",
        "wastewater", "sewer", "sanitation", "sanitary", "public", "works",
        "municipal", "regional", "service", "services", "co", "company",
        "association", "inc", "llc", "board", "commission", "csd", "pud",
        "and", "systems", "system",
    }
    words = [w for w in s.split() if w not in stop]
    return " ".join(words) if words else " ".join(s.split())


def clean(v):
    """Citylitics uses '-' as its null placeholder throughout."""
    if v is None:
        return None
    s = str(v).strip()
    if s in NULLS:
        return None
    return s


def to_num(v):
    s = clean(v)
    if s is None:
        return None
    s = re.sub(r"[^0-9.\-]", "", s)
    if s in ("", "-", "."):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def load_zip_index():
    """Merge every available ZIP centroid source into one lookup."""
    idx = {}
    for path in ZIP_SOURCES:
        if not os.path.exists(path):
            continue
        z = pd.read_csv(path, dtype=str)
        cols = {c.lower(): c for c in z.columns}
        zc = cols.get("code") or cols.get("zip5") or cols.get("zip_code")
        la = cols.get("lat") or cols.get("latitude")
        lo = cols.get("lon") or cols.get("longitude")
        ci = cols.get("city")
        st = cols.get("state")
        co = cols.get("county")
        if not (zc and la and lo):
            continue
        for _, r in z.iterrows():
            key = str(r[zc]).strip().zfill(5)
            if key in idx:
                continue
            try:
                lat, lon = float(r[la]), float(r[lo])
            except (TypeError, ValueError):
                continue
            idx[key] = {
                "lat": lat,
                "lon": lon,
                "city": (str(r[ci]).strip() if ci and pd.notna(r[ci]) else ""),
                "state": (str(r[st]).strip() if st and pd.notna(r[st]) else ""),
                "county": (str(r[co]).strip() if co and pd.notna(r[co]) else ""),
            }
    return idx


def build_county_index(zip_idx, zips_df):
    """County centroids, averaged from member ZIPs, as a geocoding fallback."""
    acc = defaultdict(lambda: [0.0, 0.0, 0])
    for path in ZIP_SOURCES:
        if not os.path.exists(path):
            continue
        z = pd.read_csv(path, dtype=str)
        cols = {c.lower(): c for c in z.columns}
        co, st = cols.get("county"), cols.get("state")
        la = cols.get("lat") or cols.get("latitude")
        lo = cols.get("lon") or cols.get("longitude")
        if not (co and st and la and lo):
            continue
        for _, r in z.iterrows():
            if pd.isna(r[co]) or pd.isna(r[st]):
                continue
            try:
                lat, lon = float(r[la]), float(r[lo])
            except (TypeError, ValueError):
                continue
            k = (str(r[st]).strip().upper(),
                 re.sub(r"\s+county$", "", str(r[co]).strip().lower()))
            a = acc[k]
            a[0] += lat
            a[1] += lon
            a[2] += 1
    return {k: (v[0] / v[2], v[1] / v[2]) for k, v in acc.items() if v[2]}


def load_exclusion_list(path):
    """Blocked accounts, keyed exactly on (owner, state).

    match_named_accounts.py already did the careful cross-reference and wrote
    exact Citylitics owner names here. Re-normalizing would undo that work -
    the loose key collapses all six Orange County agencies onto "orange".
    """
    if not path or not os.path.exists(path):
        return set()
    df = pd.read_csv(path, dtype=str)
    if "owner" not in df.columns or "state" not in df.columns:
        return set()
    return {(str(o).strip(), str(s).strip())
            for o, s in zip(df["owner"], df["state"]) if pd.notna(o)}


def load_account_list(path):
    """Return a set of normalized agency names from an optional CSV list."""
    if not path or not os.path.exists(path):
        return set(), None
    try:
        df = pd.read_csv(path, dtype=str)
    except Exception as exc:  # noqa: BLE001 - surface bad files, don't crash
        print(f"  ! could not read {os.path.basename(path)}: {exc}")
        return set(), None
    if df.empty:
        return set(), None
    # Pick the column most likely to hold agency names.
    best, best_score = None, -1
    for c in df.columns:
        lc = c.lower()
        score = 0
        if any(k in lc for k in ("account", "agency", "owner", "name",
                                 "customer", "district", "entity", "utility")):
            score += 10
        vals = df[c].dropna().astype(str)
        if len(vals):
            score += min(5, vals.str.len().mean() / 10)
        if score > best_score:
            best, best_score = c, score
    names = {norm_name(v) for v in df[best].dropna().astype(str)}
    names.discard("")
    return names, best


def indicator_fit(indicators):
    """Highest fit tier across an opportunity's indicator slots."""
    if any(i in HIGH_FIT_INDICATORS for i in indicators):
        return "High"
    if any(i in MEDIUM_FIT_INDICATORS for i in indicators):
        return "Medium"
    return "Low"


def main():
    if not os.path.exists(SOURCE_CSV):
        sys.exit(f"Source CSV not found: {SOURCE_CSV}\n"
                 f"Set CITYLITICS_CSV or place the export at that path.")

    print("Reading Citylitics export ...")
    df = pd.read_csv(SOURCE_CSV, encoding="utf-8-sig", low_memory=False)
    print(f"  {len(df):,} opportunity rows, "
          f"{df['Opportunity Owner'].nunique():,} agencies")

    print("Loading geocoding sources ...")
    zip_idx = load_zip_index()
    county_idx = build_county_index(zip_idx, None)
    zip3_acc = defaultdict(lambda: [0.0, 0.0, 0])
    for z, v in zip_idx.items():
        a = zip3_acc[z[:3]]
        a[0] += v["lat"]
        a[1] += v["lon"]
        a[2] += 1
    zip3_idx = {k: (v[0] / v[2], v[1] / v[2]) for k, v in zip3_acc.items()}
    print(f"  {len(zip_idx):,} ZIP centroids, {len(zip3_idx):,} ZIP3 regions, "
          f"{len(county_idx):,} county centroids")

    # Manual ZIP corrections. Some Citylitics cells pack two addresses - the
    # county-seat admin office and the agency's own - with two ZIPs, and
    # neither position is reliably the right one.
    geo_overrides = {}
    ov_path = os.path.join(HERE, "data", "geo_overrides.csv")
    if os.path.exists(ov_path):
        ov = pd.read_csv(ov_path, dtype=str)
        for _, r in ov.iterrows():
            geo_overrides[(str(r["owner"]).strip(), str(r["state"]).strip())] = \
                str(r["zip"]).strip().zfill(5)
        print(f"  {len(geo_overrides)} manual ZIP overrides")

    print("Loading account lists ...")
    lists = {}
    blocked_keys = load_exclusion_list(ACCOUNT_LISTS["blocked"])
    print(f"  blocked: {len(blocked_keys):,} agencies (exact owner+state match)"
          if blocked_keys else
          f"  blocked: not supplied - place at "
          f"data/{os.path.basename(ACCOUNT_LISTS['blocked'])}")
    for key, path in ACCOUNT_LISTS.items():
        if key == "blocked":
            lists[key] = blocked_keys
            continue
        names, col = load_account_list(path)
        lists[key] = names
        if names:
            print(f"  {key}: {len(names):,} names (column '{col}')")
        else:
            print(f"  {key}: not supplied - "
                  f"place at data/{os.path.basename(path)}")

    # ---------------- opportunity level ----------------
    opps = []
    for _, r in df.iterrows():
        inds = [clean(r.get("Indicator [1]")), clean(r.get("Indicator [2]"))]
        inds = [i for i in inds if i]
        industries = [clean(r.get("Indicator Industry [1]")),
                      clean(r.get("Indicator Industry [2]"))]
        industries = [i for i in industries if i]
        itypes = " ".join(filter(None, [
            clean(r.get("Initiative Type(s) [1]")) or "",
            clean(r.get("Initiative Type(s) [2]")) or "",
        ]))

        fit = indicator_fit(inds)
        is_modernization = any(t in itypes for t in MODERNIZATION_TYPES)
        value = to_num(r.get("Opportunity Value"))

        opps.append({
            "opp_id": clean(r.get("Opportunity ID")),
            "owner": clean(r.get("Opportunity Owner")) or "Unknown",
            "state": clean(r.get("Owner State Code")),
            "county": clean(r.get("Owner County")),
            # Some cells pack several ZIPs ("92325,91708"); keep them all and
            # disambiguate at the agency level once county is known.
            "zips": re.findall(r"\d{5}", str(r.get("Owner ZIP Code") or "")),
            "address": clean(r.get("Owner Address")),
            "population": to_num(r.get("Owner Population")),
            "date": clean(r.get("Date")),
            "rank": clean(r.get("Insight Rank")),
            "summary": clean(r.get("Trigger Summary")),
            "value": value,
            "indicators": inds,
            "industries": industries,
            "categories": [c for c in [clean(r.get("Indicator Category [1]")),
                                       clean(r.get("Indicator Category [2]"))] if c],
            "initiative_types": itypes.strip() or None,
            "fit": fit,
            "modernization": is_modernization,
            "url": clean(r.get("Citylitics URL")),
            "source_title": clean(r.get("Source Title")),
            "source_url": clean(r.get("Source URL")),
            "facility": clean(r.get("Facility Name")),
            "facility_mgd": to_num(r.get("Facility Size (MGD)")),
            "dw_system": clean(r.get("Drinking Water System Name")),
            "dw_pop": to_num(r.get("Drinking Water System Population Served")),
            "consultants": clean(r.get("Consultant & Competitors")),
            "c1_name": " ".join(filter(None, [clean(r.get("Contact First Name [1]")),
                                              clean(r.get("Contact Last Name [1]"))])) or None,
            "c1_title": clean(r.get("Contact Position [1]")),
            "c1_email": clean(r.get("Contact Email [1]")),
            "c1_phone": clean(r.get("Phone Number [1]")),
            "c1_li": clean(r.get("Contact LinkedIn [1]")),
            "c2_name": " ".join(filter(None, [clean(r.get("Contact First Name [2]")),
                                              clean(r.get("Contact Last Name [2]"))])) or None,
            "c2_title": clean(r.get("Position [2]")),
            "c2_email": clean(r.get("Email [2]")),
            "c2_phone": clean(r.get("Phone Number [2]")),
        })

    odf = pd.DataFrame(opps)
    odf = odf[odf["state"].isin(TERRITORY)]
    print(f"  {len(odf):,} rows in territory {'/'.join(TERRITORY)}")

    # ---------------- agency level ----------------
    agencies = []
    unmatched_geo = []
    # Group on (owner, state): seven names collide across states in this export
    # - "City of Phoenix" is both AZ and OR, "County of Clark" both NV and WA -
    # and merging them would fuse unrelated agencies onto one pin.
    for (owner, state), g in odf.groupby(["owner", "state"]):
        first = g.iloc[0]

        # population: agencies report one value; take the max seen (some rows blank)
        pop = pd.to_numeric(g["population"], errors="coerce").max()
        pop = None if pd.isna(pop) else float(pop)

        # geocode: ZIP centroid, then ZIP3 region, then county centroid
        lat = lon = None
        geo_precision = None
        zips = []
        for lst in g["zips"]:
            for z in lst:
                if z not in zips:
                    zips.append(z)

        county_norm = re.sub(r"\s+county$", "",
                             (clean(first["county"]) or "").strip().lower())
        addr_l = (clean(first["address"]) or "").lower()

        # With several candidate ZIPs, prefer the one whose reference city is
        # named in the street address, then one in the right county, then the
        # right state - taking the first blindly put IEUA in Crestline rather
        # than Chino.
        def zip_rank(z):
            hit = zip_idx.get(str(z).zfill(5))
            if not hit:
                return 9
            city = (hit.get("city") or "").lower()
            if city and city in addr_l:
                return 0
            if county_norm and county_norm in (hit.get("county") or "").lower():
                return 1
            if (hit.get("state") or "").upper() == state.upper():
                return 2
            return 3

        ambiguous_zip = len(zips) > 1
        override = geo_overrides.get((owner, state))
        if override:
            zips = [override] + [z for z in zips if z != override]
            ambiguous_zip = False
        for z in (zips if override else sorted(zips, key=zip_rank)):
            hit = zip_idx.get(str(z).zfill(5))
            if hit:
                lat, lon = hit["lat"], hit["lon"]
                geo_precision = "zip-ambiguous" if ambiguous_zip else "zip"
                zips = [z] + [x for x in zips if x != z]
                break
        if lat is None and zips:
            # The reference ZIP sets have gaps. Fall back to the ZIP3 sectional
            # centre - ZIPs sharing three digits sit in the same postal region,
            # so this lands within a few miles.
            for z in zips:
                hit = zip3_idx.get(str(z).zfill(5)[:3])
                if hit:
                    lat, lon = hit
                    geo_precision = "zip3"
                    break
        if lat is None:
            county = clean(first["county"])
            if county:
                k = (state.upper(),
                     re.sub(r"\s+county$", "", county.strip().lower()))
                hit = county_idx.get(k)
                if hit:
                    lat, lon = hit
                    geo_precision = "county"
        if lat is None:
            unmatched_geo.append(owner)

        high = g[g["fit"] == "High"]
        med = g[g["fit"] == "Medium"]
        val_total = pd.to_numeric(g["value"], errors="coerce").sum()
        val_high = pd.to_numeric(high["value"], errors="coerce").sum()
        n_priority = int((g["rank"] == "Priority").sum())
        n_modern = int(g["modernization"].sum())

        # ----- EAE score (0-100) -----
        # Weighted toward controls-relevant project density and modernization
        # signal rather than raw dollars, so a small district with four lift
        # station upgrades outranks a big agency with one pipe replacement.
        s_high = min(30, len(high) * 6)              # high-fit project count
        s_med = min(10, len(med) * 2)                # medium-fit count
        s_val = min(20, (val_high / 5_000_000) * 10) if val_high > 0 else 0
        s_pri = min(15, n_priority * 3)              # Citylitics priority rank
        s_mod = min(15, n_modern * 3)                # upgrade/replace signal
        s_rural = 10 if (pop is not None and pop < 50_000) else 0
        score = round(s_high + s_med + s_val + s_pri + s_mod + s_rural, 1)

        # ----- targetability -----
        nn = norm_name(owner)
        if (owner, state) in lists.get("blocked", set()):
            target = "Blocked"
            target_reason = "On named-account exclusion list"
        elif nn in lists.get("rural", set()):
            target = "Rural Target"
            target_reason = "On rural water target list"
        elif nn in lists.get("existing", set()):
            target = "Existing Account"
            target_reason = "Has existing account/projects"
        else:
            target = "Open"
            target_reason = "Not on any supplied list - verify before outreach"

        if pop is None:
            size = "Unknown"
        elif pop < 10_000:
            size = "Rural (<10k)"
        elif pop < 50_000:
            size = "Small (10-50k)"
        elif pop < 250_000:
            size = "Mid (50-250k)"
        else:
            size = "Large (250k+)"

        # best contact across the agency's rows
        contact = None
        for _, r in g.iterrows():
            if r["c1_email"]:
                contact = {"name": r["c1_name"], "title": r["c1_title"],
                           "email": r["c1_email"], "phone": r["c1_phone"],
                           "li": r["c1_li"]}
                break

        opp_list = []
        for _, r in g.sort_values("value", ascending=False, na_position="last").iterrows():
            opp_list.append({
                "id": r["opp_id"], "date": r["date"], "rank": r["rank"],
                "fit": r["fit"], "value": r["value"],
                "ind": r["indicators"], "cat": r["categories"],
                "types": r["initiative_types"], "summary": r["summary"],
                "url": r["url"], "facility": r["facility"],
                "mgd": r["facility_mgd"], "consultants": r["consultants"],
                "c1": r["c1_name"], "c1t": r["c1_title"],
                "c1e": r["c1_email"], "c1p": r["c1_phone"],
                "c2": r["c2_name"], "c2t": r["c2_title"], "c2e": r["c2_email"],
            })

        agencies.append({
            # owner alone is not unique across states - key is what the map
            # and detail panel look up by.
            "key": f"{owner}|{state}",
            "owner": owner, "state": state, "county": clean(first["county"]),
            "city": (zip_idx.get(str(zips[0]).zfill(5), {}).get("city") if zips else None),
            "address": clean(first["address"]), "zip": zips[0] if zips else None,
            "lat": lat, "lon": lon, "geo": geo_precision,
            "population": pop, "size": size,
            "n_opps": len(g), "n_high": len(high), "n_med": len(med),
            "n_priority": n_priority, "n_modern": n_modern,
            "value_total": float(val_total) if val_total else 0.0,
            "value_high": float(val_high) if val_high else 0.0,
            "score": score, "target": target, "target_reason": target_reason,
            "contact": contact, "opps": opp_list,
        })

    adf = pd.DataFrame(agencies).sort_values("score", ascending=False)
    print(f"  {len(adf):,} agencies | geocoded "
          f"{adf['lat'].notna().sum():,} ({100*adf['lat'].notna().mean():.1f}%)")
    if unmatched_geo:
        print(f"  ! no coordinates for {len(unmatched_geo)}: "
              f"{', '.join(unmatched_geo[:8])}"
              f"{' ...' if len(unmatched_geo) > 8 else ''}")

    os.makedirs(os.path.join(HERE, "data"), exist_ok=True)

    # ---------------- outputs ----------------
    mapped = adf[adf["lat"].notna()].copy()

    payload = {
        "generated": pd.Timestamp.now("UTC").strftime("%Y-%m-%d %H:%M UTC"),
        "source_rows": int(len(odf)),
        "lists_supplied": {k: len(v) for k, v in lists.items()},
        "agencies": json.loads(mapped.to_json(orient="records")),
        "unmapped": json.loads(
            adf[adf["lat"].isna()].drop(columns=["opps"]).to_json(orient="records")),
    }
    out_js = os.path.join(HERE, "water-data.js")
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("// Generated by build_water_map.py - do not edit by hand.\n")
        f.write("const WATER_DATA = ")
        json.dump(payload, f, ensure_ascii=False)
        f.write(";\n")
    print(f"  wrote {os.path.basename(out_js)} "
          f"({os.path.getsize(out_js)/1e6:.1f} MB)")

    # agency-level CSV
    agency_csv = os.path.join(HERE, "WaterDistricts_EAE_Targets.csv")
    adf.drop(columns=["opps", "contact"]).assign(
        contact_name=adf["contact"].apply(lambda c: c["name"] if c else None),
        contact_title=adf["contact"].apply(lambda c: c["title"] if c else None),
        contact_email=adf["contact"].apply(lambda c: c["email"] if c else None),
        contact_phone=adf["contact"].apply(lambda c: c["phone"] if c else None),
    ).to_csv(agency_csv, index=False)
    print(f"  wrote {os.path.basename(agency_csv)}")

    # opportunity-level CSV
    opp_csv = os.path.join(HERE, "WaterDistricts_EAE_Opportunities.csv")
    flat = odf.copy()
    flat["indicators"] = flat["indicators"].apply(lambda x: "; ".join(x))
    flat["industries"] = flat["industries"].apply(lambda x: "; ".join(x))
    flat["categories"] = flat["categories"].apply(lambda x: "; ".join(x))
    # Join on owner+state, matching how agencies were grouped.
    flat["agency_key"] = flat["owner"] + "|" + flat["state"]
    score_map = dict(zip(adf["key"], adf["score"]))
    target_map = dict(zip(adf["key"], adf["target"]))
    flat["agency_score"] = flat["agency_key"].map(score_map)
    flat["targetability"] = flat["agency_key"].map(target_map)
    flat["zips"] = flat["zips"].apply(lambda x: ";".join(x) if x else "")
    flat.drop(columns=["summary"]).to_csv(opp_csv, index=False)
    print(f"  wrote {os.path.basename(opp_csv)}")

    write_kml(mapped, os.path.join(HERE, "WaterDistricts_EAE.kml"))
    print("Done.")


def kml_color(target, score):
    """KML uses aabbggrr byte order, not rrggbb."""
    if target == "Blocked":
        return "ff3b30c8"      # red
    if target == "Rural Target":
        return "ff22a05a"      # green
    if target == "Existing Account":
        return "ffd18b1e"      # blue-ish
    return "ff8b5cf6" if score >= 50 else "ff909090"


def write_kml(mapped, path):
    """Google My Maps import. One folder per targetability bucket, and My Maps
    caps a layer at 2,000 features - buckets keep us well under that."""
    def esc(v):
        return html.escape(str(v)) if v is not None else ""

    # One folder per bucket becomes one layer in Google My Maps. The Open
    # bucket is split by score so the layer list stays actionable - My Maps
    # caps at 10 layers and 2,000 features per layer.
    def bucket_of(a):
        if a["target"] != "Open":
            return a["target"]
        if a["score"] >= 70:
            return "Open - priority (score 70+)"
        if a["score"] >= 50:
            return "Open - strong (score 50-69)"
        return "Open - watch (score <50)"

    buckets = defaultdict(list)
    for _, a in mapped.iterrows():
        buckets[bucket_of(a)].append(a)

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
             '<name>Water Districts - EAE Targeting (CA/WA/OR/NV/AZ/HI)</name>']

    styles = {}
    for _, a in mapped.iterrows():
        c = kml_color(a["target"], a["score"])
        if c not in styles:
            styles[c] = f"s{len(styles)}"
            parts.append(
                f'<Style id="{styles[c]}"><IconStyle><color>{c}</color>'
                f'<scale>1.1</scale><Icon><href>'
                f'http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png'
                f'</href></Icon></IconStyle></Style>')

    for bucket, rows in sorted(buckets.items()):
        parts.append(f"<Folder><name>{esc(bucket)} ({len(rows)})</name>")
        for a in rows:
            items = []
            for o in a["opps"][:6]:
                label = "; ".join(o["ind"]) or "Unspecified"
                amount = f" - ${o['value']:,.0f}" if o.get("value") else ""
                items.append(f"<li><b>{esc(o['fit'])} fit</b> - "
                             f"{esc(label)}{amount}</li>")
            lines = "".join(items)
            c = a["contact"] or {}
            desc = (
                f"<b>{esc(a['owner'])}</b> ({esc(a['state'])})<br/>"
                f"EAE score: <b>{a['score']}</b> &nbsp;|&nbsp; Status: <b>{esc(a['target'])}</b><br/>"
                + (f"Population: {int(a['population']):,}<br/>"
                   if pd.notna(a["population"]) else "")
                + f"County: {esc(a['county'])}<br/>"
                + f"Opportunities: {a['n_opps']} "
                  f"({a['n_high']} high-fit, {a['n_priority']} priority)<br/>"
                + f"Total value: ${a['value_total']:,.0f}<br/>"
                + (f"<br/><b>Contact:</b> {esc(c.get('name'))}, {esc(c.get('title'))}"
                   f"<br/>{esc(c.get('email'))} {esc(c.get('phone'))}<br/>" if c else "")
                + f"<br/><b>Top opportunities:</b><ul>{lines}</ul>"
            )
            parts.append(
                f"<Placemark><name>{esc(a['owner'])}</name>"
                f"<styleUrl>#{styles[kml_color(a['target'], a['score'])]}</styleUrl>"
                f"<description><![CDATA[{desc}]]></description>"
                f"<Point><coordinates>{a['lon']},{a['lat']},0</coordinates></Point>"
                f"</Placemark>")
        parts.append("</Folder>")

    parts.append("</Document></kml>")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"  wrote {os.path.basename(path)} ({len(mapped):,} placemarks)")


if __name__ == "__main__":
    main()
