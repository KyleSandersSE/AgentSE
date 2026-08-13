#!/usr/bin/env python3
"""
Cross-reference the CRWA rural water contact list against Citylitics agencies.

Two outcomes per CRWA organization:

  1. It matches a Citylitics agency (place, governance, and service domain
     all agree) -> that agency is tagged Rural Target. It already has
     opportunity data; the CRWA contact and campaign fields ride along
     as supplemental fields.
  2. No confident match -> the org becomes a *new* pin of its own, geocoded
     from its own mailing address, carrying its CRWA contact and campaign
     fields but no opportunity data. Nothing gets silently dropped, and
     nothing gets silently mistagged - an uncertain case falls to outcome 2
     rather than guessing, since a wrong "no match" costs nothing (the org
     still gets its own accurate pin) while a wrong match would misattribute
     one org's contact info onto an unrelated agency.

Reuses the entity-aware name matching built for the named-account
cross-reference (match_named_accounts.py) rather than re-deriving it -
the same "Orange County has six agencies" problem applies here too.

Outputs:
    data/rural_water_targets.csv   - Citylitics agencies to tag Rural Target
    data/crwa_only_targets.csv     - CRWA orgs with no Citylitics match,
                                      geocoded from their own address
    RuralTargets_MatchReport.csv   - every CRWA org and its outcome
"""

import os
import re

import pandas as pd

from match_named_accounts import compatible, parse, similarity

HERE = os.path.dirname(os.path.abspath(__file__))

CRWA_CSV = os.environ.get(
    "CRWA_CSV", os.path.join(HERE, "data", "crwa_master_tracker.csv"))
AGENCY_CSV = os.path.join(HERE, "WaterDistricts_EAE_Targets.csv")
ZIP_SOURCES = [os.path.join(HERE, "data", "zips_primary.csv"),
               os.path.join(HERE, "data", "zips_secondary.csv")]

TERRITORY = {"CA", "WA", "OR", "NV", "AZ", "HI"}

ADDR_RE = re.compile(r"([A-Za-z .'-]+),\s*([A-Z]{2})\s*(\d{5})")


def parse_address(addr):
    """Best-effort city/state/zip out of a free-text mailing address."""
    m = ADDR_RE.search(str(addr))
    if not m:
        return None, None, None
    city, state, zip5 = m.groups()
    return city.strip(" ,"), state, zip5


def county_of(norm):
    """Comparable county key: lowercase, no ' county' suffix, blank if unknown."""
    if not norm or str(norm).strip().lower() in ("unspecified", "nan", ""):
        return None
    return re.sub(r"\s+county$", "", str(norm).strip().lower())


def load_zip_county():
    idx = {}
    for path in ZIP_SOURCES:
        if not os.path.exists(path):
            continue
        z = pd.read_csv(path, dtype=str)
        cols = {c.lower(): c for c in z.columns}
        zc = cols.get("code") or cols.get("zip5") or cols.get("zip_code")
        co = cols.get("county")
        if not (zc and co):
            continue
        for _, r in z.iterrows():
            key = str(r[zc]).strip().zfill(5)
            if key not in idx and pd.notna(r[co]):
                idx[key] = str(r[co]).strip()
    return idx


def main():
    if not os.path.exists(CRWA_CSV):
        raise SystemExit(f"CRWA tracker CSV not found: {CRWA_CSV}")

    crwa = pd.read_csv(CRWA_CSV)
    agencies = pd.read_csv(AGENCY_CSV)
    zip_county = load_zip_county()
    print(f"{len(crwa):,} CRWA contacts")
    print(f"{len(agencies):,} Citylitics agencies")

    agencies = agencies.copy()
    agencies["_parsed"] = agencies["owner"].map(parse)
    agencies["_core"] = agencies["_parsed"].map(lambda p: p["core"])
    by_state_core = {}
    for _, ag in agencies.iterrows():
        by_state_core.setdefault((ag["state"], ag["_core"]), []).append(ag)
    core_counts = agencies.groupby("_core")["owner"].nunique().to_dict()

    matched_rows, unmatched_rows, report = [], [], []
    out_of_territory = 0
    no_address = 0

    for _, r in crwa.iterrows():
        org = str(r["OrgName"]).strip()
        city, state, zip5 = parse_address(r["Mailing Address"])

        crwa_fields = {
            "crwa_org": org,
            "crwa_contact": r.get("Contact"),
            "crwa_email": r.get("Email"),
            "crwa_phone": r.get("Phone"),
            "crwa_address": r.get("Mailing Address"),
            "crwa_group": r.get("Grp"),
            "crwa_status": r.get("Campaign Status"),
            "crwa_responded": r.get("Responded?"),
            "crwa_meeting_booked": r.get("Mtg Booked?"),
            "crwa_notes": r.get("Notes"),
        }

        if not state:
            no_address += 1
            report.append({"crwa_org": org, "outcome": "no address parsed",
                           "detail": r.get("Mailing Address")})
            continue
        if state not in TERRITORY:
            out_of_territory += 1
            report.append({"crwa_org": org,
                           "outcome": f"outside territory ({state})",
                           "detail": r.get("Mailing Address")})
            # Still pinnable if the user ever expands territory - keep it,
            # just flagged, in the unmatched set rather than dropped.

        pa = parse(org)
        cands = by_state_core.get((state, pa["core"]), []) if pa["core"] else []
        contested = core_counts.get(pa["core"], 0) > 1

        crwa_county = county_of(zip_county.get(zip5)) if zip5 else None
        rejected_reason = None

        match = None
        if cands:
            verdicts = sorted(
                ((compatible(pa, ag["_parsed"], contested), ag,
                  similarity(pa, ag["_parsed"])) for ag in cands),
                key=lambda v: (v[0][0] != "block", -v[2]))
            (verdict, reason), ag, sim = verdicts[0]
            if verdict == "block":
                # Cross-check against the CRWA org's own mailing address - real
                # geography the named-account matcher never had. When both
                # sides carry a real county and they disagree, the name match
                # is coincidental (two agencies both named "Union ... District"
                # 130 miles apart is a real case in this data) - fall back to
                # standalone rather than merge two different entities.
                ag_county = county_of(ag["county"])
                if crwa_county and ag_county and crwa_county != ag_county:
                    rejected_reason = (
                        f"name matched '{ag['owner']}' but county disagrees "
                        f"(agency: {ag['county']}, CRWA address county: "
                        f"{zip_county.get(zip5)}) - kept as standalone pin")
                else:
                    match = (ag, reason, sim)

        if match:
            ag, reason, sim = match
            matched_rows.append({
                "owner": ag["owner"], "state": ag["state"],
                "match_reason": reason, "name_overlap": round(sim, 2),
                **crwa_fields,
            })
            report.append({"crwa_org": org,
                           "outcome": f"matched -> {ag['owner']} ({ag['state']})",
                           "detail": f"{reason}, {sim:.0%} overlap"})
        else:
            unmatched_rows.append({
                "city": city, "state": state, "zip": zip5,
                **crwa_fields,
            })
            report.append({
                "crwa_org": org,
                "outcome": ("county mismatch - own pin" if rejected_reason
                           else "no confident match - own pin"),
                "detail": rejected_reason or f"parsed at {city}, {state} {zip5}",
            })

    mdf = pd.DataFrame(matched_rows)
    udf = pd.DataFrame(unmatched_rows)
    rep = pd.DataFrame(report)

    os.makedirs(os.path.join(HERE, "data"), exist_ok=True)
    mdf.to_csv(os.path.join(HERE, "data", "rural_water_targets.csv"), index=False)
    udf.to_csv(os.path.join(HERE, "data", "crwa_only_targets.csv"), index=False)
    rep.to_csv(os.path.join(HERE, "RuralTargets_MatchReport.csv"), index=False)

    county_rejected = int((rep["outcome"] == "county mismatch - own pin").sum())
    print(f"\n  matched to existing agencies : {len(mdf):,} "
          f"(double-tagged - has Citylitics data)")
    print(f"  standalone CRWA pins         : {len(udf):,} "
          f"(no Citylitics opportunities)")
    print(f"    of which outside territory : {out_of_territory:,}")
    print(f"    of which name-matched but "
          f"rejected on county              : {county_rejected:,}")
    print(f"  no address parsed            : {no_address:,}")
    print("\n  wrote data/rural_water_targets.csv, data/crwa_only_targets.csv, "
          "RuralTargets_MatchReport.csv")


if __name__ == "__main__":
    main()
