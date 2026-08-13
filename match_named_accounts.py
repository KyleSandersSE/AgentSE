#!/usr/bin/env python3
"""
Cross-reference Schneider Electric named accounts against Citylitics agencies.

Naive normalization over-matches badly: stripping "city / county / district /
water / sanitation" collapses "City of Orange", "Orange County Water District"
and "County of Orange" onto one key, so a single named account would block
five unrelated agencies. This matcher keeps the entity type as part of the
identity and only auto-blocks when the place name AND the governance type
agree.

Outputs:
    data/named_accounts_excluded.csv    - confident blocks (feeds the map build)
    NamedAccounts_Review.csv            - near-misses needing a human call
    NamedAccounts_MatchReport.csv       - every named account and its outcome
"""

import os
import re
import unicodedata

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))

NAMED_CSV = os.environ.get(
    "NAMED_ACCOUNTS_CSV", os.path.join(HERE, "data", "eu_named_accounts.csv"))
AGENCY_CSV = os.path.join(HERE, "WaterDistricts_EAE_Targets.csv")

# Expand abbreviations before anything else - the named-account export is
# truncated to a fixed width, so "DIST", "AUTH", "MUN" are everywhere.
ABBR = {
    "dist": "district", "distr": "district", "dists": "district",
    "auth": "authority", "mun": "municipal", "muni": "municipal",
    "wtr": "water", "util": "utilities", "utils": "utilities",
    "dept": "department", "depts": "department", "comm": "commission",
    "svc": "service", "svcs": "service", "cnty": "county", "cty": "city",
    "reg": "regional", "natl": "national", "co": "county",
    "sd": "district", "wwtp": "wastewater", "ww": "wastewater",
    "mwd": "municipal water district", "cwd": "county water district",
    "pud": "public utility district", "csd": "community services district",
    "id": "irrigation district", "wd": "water district",
}

# Governance families. Crossing families is never an auto-block: a city and
# the county it sits in are different customers.
FAMILY = {
    "city": "muni", "town": "muni", "village": "muni", "borough": "muni",
    "county": "county",
    "district": "special", "authority": "special", "agency": "special",
    "commission": "special", "board": "special", "zone": "special",
}

# Service domain markers. Kept separate because a place can host a water
# district AND a sanitary district as unrelated customers - Goleta Water
# District and Goleta Sanitary District are two different agencies.
CLEAN_WORDS = {"water", "irrigation"}
SEWER_WORDS = {"wastewater", "sewer", "sanitation", "sanitary", "sewerage",
               "reclamation"}
WATER_WORDS = CLEAN_WORDS | SEWER_WORDS
POWER_WORDS = {"electric", "light", "power", "energy"}

# Dropped from the place name but remembered as type signal.
TYPE_WORDS = set(FAMILY) | WATER_WORDS | POWER_WORDS | {
    "of", "the", "and", "public", "utilities", "utility", "works",
    "municipal", "regional", "department", "services", "service",
    "system", "systems", "community", "metropolitan", "valley1",
    "inc", "llc", "corp", "corporation", "company", "co",
}


def tokens(name):
    s = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"[&/]", " ", s)
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    out = []
    for w in s.split():
        out.extend(ABBR.get(w, w).split())
    return out


FILLER = {"of", "the", "and", "inc", "llc", "corp", "corporation", "company",
          "co", "public", "services", "service"}

# Investor-owned marker. "San Jose Water" (a company) and "City of San Jose"
# are different customers, as are Southern California Water Company and the
# Metropolitan Water District.
PRIVATE_WORDS = {"company", "corporation", "corp", "inc", "llc", "incorporated"}


def parse(name):
    """Split a name into its place core and its type signature."""
    tk = tokens(name)
    fam = {FAMILY[w] for w in tk if w in FAMILY}
    core = [w for w in tk if w not in TYPE_WORDS]
    return {
        "core": " ".join(core),
        "families": fam,
        "clean": bool({w for w in tk if w in CLEAN_WORDS}),
        "sewer": bool({w for w in tk if w in SEWER_WORDS}),
        "water": bool({w for w in tk if w in WATER_WORDS}),
        "power": bool({w for w in tk if w in POWER_WORDS}),
        "private": bool({w for w in tk if w in PRIVATE_WORDS}),
        "tokens": {w for w in tk if w not in FILLER},
        "raw": str(name),
    }


def similarity(a, b):
    """Jaccard over meaningful tokens - how much of the full name agrees."""
    ta, tb = a["tokens"], b["tokens"]
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def compatible(a, b, contested=False):
    """Return (verdict, reason) for two parsed names sharing a place core.

    `contested` means several agencies in the dataset share this place name,
    so the bar for an automatic block is raised - a named account for one
    Orange County agency must not take out all six.
    """
    fa, fb = a["families"], b["families"]
    sim = similarity(a, b)

    # Both name a governance family and they don't overlap -> different bodies.
    if fa and fb and not (fa & fb):
        return "review", (f"governance mismatch ({'/'.join(sorted(fa))} vs "
                          f"{'/'.join(sorted(fb))})")

    # Electric utility vs water/sewer utility sharing a place name.
    if (a["power"] and not a["water"] and b["water"]) or \
       (b["power"] and not b["water"] and a["water"]):
        return "review", "electric utility vs water utility"
    if (a["power"] and not a["water"]) != (b["power"] and not b["water"]):
        if a["power"] or b["power"]:
            return "review", "electric utility vs municipal/water entity"

    # Investor-owned utility vs public body sharing a place name.
    if a["private"] != b["private"] and (fa or fb):
        return "review", "investor-owned utility vs public agency"

    # Drinking water vs sanitation are routinely separate agencies in one town.
    if (a["clean"] and not a["sewer"] and b["sewer"] and not b["clean"]) or \
       (b["clean"] and not b["sewer"] and a["sewer"] and not a["clean"]):
        return "review", "water district vs sanitation district"

    if contested and sim < 0.7:
        return "review", (f"several agencies share this place name; "
                          f"name overlap only {sim:.0%}")

    if not fa or not fb:
        if (a["water"] or b["water"]) and sim >= 0.6:
            return "block", f"place + water domain match ({sim:.0%} overlap)"
        return "review", "one side has no governance signal"

    if sim < 0.34:
        return "review", f"weak name overlap ({sim:.0%})"

    return "block", f"place + governance match ({sim:.0%} overlap)"


def main():
    if not os.path.exists(NAMED_CSV):
        raise SystemExit(f"Named accounts CSV not found: {NAMED_CSV}")

    named = pd.read_csv(NAMED_CSV, encoding="utf-8-sig")
    agencies = pd.read_csv(AGENCY_CSV)

    col = "Assignment" if "Assignment" in named.columns else named.columns[-1]
    account_names = sorted({str(x).strip() for x in named[col].dropna()
                            if str(x).strip()})
    print(f"{len(named):,} rows -> {len(account_names):,} unique named accounts")
    print(f"{len(agencies):,} Citylitics agencies")

    parsed_named = [parse(x) for x in account_names]
    by_core = {}
    for p in parsed_named:
        if p["core"]:
            by_core.setdefault(p["core"], []).append(p)

    # A place name is "contested" when the water dataset holds more than one
    # agency for it - Orange County alone has six.
    agencies = agencies.copy()
    agencies["_parsed"] = agencies["owner"].map(parse)
    agencies["_core"] = agencies["_parsed"].map(lambda p: p["core"])
    core_counts = agencies.groupby("_core")["owner"].nunique().to_dict()

    # The named-account export carries no state, so one entry can land on
    # same-named agencies in different states ("City of Phoenix" is AZ and OR).
    core_states = agencies.groupby("_core")["state"].nunique().to_dict()

    blocks, reviews, report = [], [], []

    for _, ag in agencies.iterrows():
        pa = ag["_parsed"]
        cands = by_core.get(pa["core"], [])
        if not pa["core"] or not cands:
            continue

        contested = (core_counts.get(pa["core"], 0) > 1
                     or core_states.get(pa["core"], 0) > 1)

        # Rank candidates by name overlap so the best evidence decides.
        verdicts = sorted(
            ((compatible(pa, pn, contested), pn, similarity(pa, pn))
             for pn in cands),
            key=lambda v: (v[0][0] != "block", -v[2]))

        (verdict, reason), pn, sim = verdicts[0]

        if verdict == "block":
            blocks.append({
                "owner": ag["owner"], "state": ag["state"],
                "county": ag["county"], "named_account": pn["raw"],
                "match_reason": reason, "name_overlap": round(sim, 2),
                "score": ag["score"], "n_opps": ag["n_opps"],
                "value_total": ag["value_total"],
            })
        else:
            reviews.append({
                "owner": ag["owner"], "state": ag["state"],
                "county": ag["county"],
                "possible_named_account": "; ".join(
                    p["raw"] for _, p, _ in verdicts[:4]),
                "why_not_auto_blocked": reason,
                "best_name_overlap": round(sim, 2),
                "score": ag["score"], "n_opps": ag["n_opps"],
                "value_total": ag["value_total"],
                "decision (block/allow)": "",
            })

    bdf = pd.DataFrame(blocks)
    rdf = pd.DataFrame(reviews)

    # A named account is one company - it cannot be the same-named agency in
    # two states. With no state column to go on, keep the larger agency
    # ("City of Phoenix" is Phoenix AZ, not Phoenix OR) and send the rest to
    # review rather than blocking both.
    if len(bdf):
        demoted = []
        keep = []
        for na, grp in bdf.groupby("named_account"):
            if grp["state"].nunique() > 1:
                grp = grp.sort_values(["n_opps", "score"], ascending=False)
                keep.append(grp.iloc[0])
                for _, loser in grp.iloc[1:].iterrows():
                    demoted.append({
                        "owner": loser["owner"], "state": loser["state"],
                        "county": loser["county"],
                        "possible_named_account": na,
                        "why_not_auto_blocked": (
                            f"same name matched in {grp['state'].nunique()} states; "
                            f"kept {grp.iloc[0]['state']} as the larger agency"),
                        "best_name_overlap": loser["name_overlap"],
                        "score": loser["score"], "n_opps": loser["n_opps"],
                        "value_total": loser["value_total"],
                        "decision (block/allow)": "",
                    })
            else:
                # One named account should not take out several distinct
                # agencies in the same state - MWD of Orange County and Orange
                # County Water District are not the same customer. Keep the
                # best match plus any true duplicate spellings of it.
                if len(grp) > 1:
                    grp = grp.sort_values("name_overlap", ascending=False)
                    top_tokens = parse(grp.iloc[0]["owner"])["tokens"]
                    for i, (_, row) in enumerate(grp.iterrows()):
                        if i == 0 or parse(row["owner"])["tokens"] == top_tokens:
                            keep.append(row)
                        else:
                            demoted.append({
                                "owner": row["owner"], "state": row["state"],
                                "county": row["county"],
                                "possible_named_account": na,
                                "why_not_auto_blocked": (
                                    f"'{na}' matched better to "
                                    f"'{grp.iloc[0]['owner']}'; these are "
                                    f"different agencies"),
                                "best_name_overlap": row["name_overlap"],
                                "score": row["score"], "n_opps": row["n_opps"],
                                "value_total": row["value_total"],
                                "decision (block/allow)": "",
                            })
                else:
                    keep.extend(row for _, row in grp.iterrows())
        bdf = pd.DataFrame(keep)
        if demoted:
            rdf = pd.concat([rdf, pd.DataFrame(demoted)], ignore_index=True)

    bdf = bdf.sort_values("score", ascending=False)
    rdf = rdf.sort_values("score", ascending=False)

    # Which named accounts never touched the water dataset at all?
    matched_named = set(bdf["named_account"]) if len(bdf) else set()
    for p in parsed_named:
        report.append({
            "named_account": p["raw"],
            "outcome": "matched" if p["raw"] in matched_named else "no water match",
            "looks_like_water": p["water"],
            "looks_like_municipal": bool(p["families"]),
        })
    rep = pd.DataFrame(report)

    os.makedirs(os.path.join(HERE, "data"), exist_ok=True)
    bdf.to_csv(os.path.join(HERE, "data", "named_accounts_excluded.csv"), index=False)
    rdf.to_csv(os.path.join(HERE, "NamedAccounts_Review.csv"), index=False)
    rep.to_csv(os.path.join(HERE, "NamedAccounts_MatchReport.csv"), index=False)

    print(f"\n  auto-blocked : {len(bdf):,} agencies")
    print(f"  needs review : {len(rdf):,} agencies")
    muni = rep["looks_like_municipal"] | rep["looks_like_water"]
    print(f"  named accounts that look municipal/water : {int(muni.sum()):,}")
    print(f"  named accounts with no water-dataset match : "
          f"{int((rep['outcome'] == 'no water match').sum()):,}")
    print("\n  wrote data/named_accounts_excluded.csv, "
          "NamedAccounts_Review.csv, NamedAccounts_MatchReport.csv")


if __name__ == "__main__":
    main()
