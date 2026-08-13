#!/usr/bin/env python3
"""
Build the shareable EAE targeting workbook.

Blocked named accounts are filled red on the agency-name cell in every sheet,
so anyone opening the file can see at a glance which agencies are off limits
while still working the opportunities.

Usage:  python3 build_workbook.py
"""

import os

import pandas as pd
from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "EAE_Water_Targeting.xlsx")

FONT = "Arial"

# Blocked = red fill, dark red text. Open = clean.
RED_FILL = PatternFill("solid", fgColor="FFC7CE")
RED_FONT = Font(name=FONT, size=10, color="9C0006", bold=True)
GREEN_FILL = PatternFill("solid", fgColor="C6EFCE")
GREEN_FONT = Font(name=FONT, size=10, color="1D6F42")
AMBER_FILL = PatternFill("solid", fgColor="FFEB9C")

HDR_FILL = PatternFill("solid", fgColor="1F3864")
HDR_FONT = Font(name=FONT, size=10, bold=True, color="FFFFFF")
TITLE_FONT = Font(name=FONT, size=14, bold=True, color="1F3864")
BODY = Font(name=FONT, size=10)
THIN = Side(style="thin", color="D0D7E5")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def write_table(ws, df, start_row=1, name_col=None, blocked_mask=None,
                money_cols=(), pct_cols=(), widths=None, borders=None):
    """Write a dataframe as a formatted table.

    name_col + blocked_mask drive the red highlight on the agency-name cell.

    Per-cell borders are skipped on large sheets - styling 80k cells bloats the
    file and makes it slow to open and recalculate. Banded fills carry the row
    structure instead.
    """
    if borders is None:
        borders = len(df) <= 1200
    band = PatternFill("solid", fgColor="F4F7FB")
    for j, col in enumerate(df.columns, start=1):
        c = ws.cell(row=start_row, column=j, value=str(col))
        c.fill = HDR_FILL
        c.font = HDR_FONT
        c.alignment = Alignment(horizontal="center", vertical="center",
                                wrap_text=True)
        c.border = BORDER

    for i, (_, row) in enumerate(df.iterrows(), start=start_row + 1):
        is_blocked = bool(blocked_mask.iloc[i - start_row - 1]) if \
            blocked_mask is not None else False
        for j, col in enumerate(df.columns, start=1):
            v = row[col]
            if pd.isna(v):
                v = None
            c = ws.cell(row=i, column=j, value=v)
            c.font = BODY
            if borders:
                c.border = BORDER
            elif i % 2 == 0:
                c.fill = band
            if col in money_cols:
                c.number_format = '$#,##0;($#,##0);-'
            elif col in pct_cols:
                c.number_format = "0.0%"
            if col == name_col and is_blocked:
                c.fill = RED_FILL
                c.font = RED_FONT

    ws.freeze_panes = ws.cell(row=start_row + 1, column=1)
    ws.auto_filter.ref = (f"A{start_row}:"
                          f"{get_column_letter(len(df.columns))}{start_row + len(df)}")

    for j, col in enumerate(df.columns, start=1):
        w = (widths or {}).get(col)
        if w is None:
            sample = df[col].astype(str).head(400)
            w = min(46, max(11, int(sample.str.len().quantile(0.9)) + 3,
                            len(str(col)) + 3))
        ws.column_dimensions[get_column_letter(j)].width = w


AGENCY_SOURCE_COLS = [
    "owner", "state", "county", "city", "target", "score", "size",
    "population", "n_opps", "n_high", "n_priority", "n_modern",
    "value_total", "value_high", "contact_name", "contact_title",
    "contact_email", "contact_phone", "address", "zip", "lat", "lon",
    "target_reason",
]
AGENCY_HEADERS = [
    "Agency", "State", "County", "City", "Status", "EAE Score",
    "Size Tier", "Population", "Opportunities", "High-Fit",
    "Priority", "Upgrade/Replace", "Total Value",
    "High-Fit Value", "Contact", "Title", "Email", "Phone",
    "Address", "ZIP", "Lat", "Lon", "Status Reason",
]


def main():
    agencies = pd.read_csv(os.path.join(HERE, "WaterDistricts_EAE_Targets.csv"))
    opps = pd.read_csv(os.path.join(HERE, "WaterDistricts_EAE_Opportunities.csv"))
    blocked = pd.read_csv(os.path.join(HERE, "data",
                                       "named_accounts_excluded.csv"))
    review = pd.read_csv(os.path.join(HERE, "NamedAccounts_Review.csv"))

    wb = Workbook()

    # ---------------- Read Me ----------------
    ws = wb.active
    ws.title = "Read Me"
    ws.sheet_view.showGridLines = False
    ws["A1"] = "EAE Water Targeting — CA / WA / OR / NV / AZ / HI"
    ws["A1"].font = TITLE_FONT
    ws["A2"] = ("EcoStruxure Automation Expert · built from the Citylitics "
                "Intelligence Feeds export, cross-referenced against the "
                "Schneider Electric named-account list.")
    ws["A2"].font = Font(name=FONT, size=10, italic=True, color="555555")

    rows = [
        ("", ""),
        ("HOW TO READ THIS FILE", ""),
        ("Agency names filled RED are named accounts — do not contact.", ""),
        ("Everything else is open territory. Their opportunities are still "
         "listed so you can hand them to whoever owns the account.", ""),
        ("", ""),
        ("TABS", ""),
        ("Agencies", "One row per agency, ranked by EAE score. Start here."),
        ("Opportunities", "All 3,959 projects. Agency name is red if blocked."),
        ("Blocked Accounts", "Every blocked agency and the named account it "
                             "matched, with match confidence."),
        ("Assumed Blocked", "Blocked on name similarity rather than a certain "
                            "match. Release any of these if you know better."),
        ("", ""),
        ("LIVE COUNTS", ""),
    ]
    r = 4
    for a, b in rows:
        ws.cell(row=r, column=1, value=a).font = (
            Font(name=FONT, size=11, bold=True) if b == "" and a and a.isupper()
            else Font(name=FONT, size=10, bold=bool(b)))
        ws.cell(row=r, column=2, value=b).font = BODY
        ws.cell(row=r, column=2).alignment = Alignment(wrap_text=True,
                                                       vertical="top")
        r += 1

    # Formulas so the counts follow any edits made to the Agencies tab.
    # Column letters are derived from the Agencies sheet layout below - the
    # sheet renames and reorders the CSV columns, so hardcoding letters here
    # silently points the formulas at the wrong data.
    n = len(agencies)
    last = n + 1

    def rng(header):
        i = AGENCY_HEADERS.index(header) + 1
        return f"Agencies!{get_column_letter(i)}2:{get_column_letter(i)}{last}"

    live = [
        ("Agencies total", f'=COUNTA({rng("Agency")})'),
        ("Blocked — cannot target", f'=COUNTIF({rng("Status")},"Blocked")'),
        ("  of which assumed on name similarity", len(review)),
        ("Open — targetable", f'=COUNTIF({rng("Status")},"Open")'),
        ("Open pipeline value",
         f'=SUMIF({rng("Status")},"Open",{rng("Total Value")})'),
        ("Open high-fit projects",
         f'=SUMIF({rng("Status")},"Open",{rng("High-Fit")})'),
        ("Open agencies scoring 70+",
         f'=COUNTIFS({rng("Status")},"Open",{rng("EAE Score")},">=70")'),
    ]
    for label, formula in live:
        ws.cell(row=r, column=1, value=label).font = BODY
        c = ws.cell(row=r, column=2, value=formula)
        c.font = Font(name=FONT, size=10, bold=True)
        if "value" in label.lower():
            c.number_format = '$#,##0;($#,##0);-'
        r += 1

    r += 1
    ws.cell(row=r, column=1, value="CAVEATS").font = Font(name=FONT, size=11,
                                                          bold=True)
    r += 1
    for note in [
        "Agencies whose name is merely similar to a named account are blocked "
        "too, on the assumption that most large accounts are already taken. "
        "Those are listed on Assumed Blocked and can be released individually.",
        "The named-account list has no state column, so same-named agencies "
        "in different states were resolved by size.",
        "Map pins are ZIP-centroid accurate (about 1–3 miles), not rooftop.",
        "Population is each agency's self-reported figure and is sometimes "
        "understated.",
        "Opportunity value is present on 74% of projects; blanks are unknown, "
        "not zero.",
    ]:
        c = ws.cell(row=r, column=1, value="•  " + note)
        c.font = Font(name=FONT, size=9, color="555555")
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
        ws.row_dimensions[r].height = 26
        r += 1

    ws.column_dimensions["A"].width = 44
    ws.column_dimensions["B"].width = 62

    # ---------------- Agencies ----------------
    adf = agencies.sort_values(
        ["target", "score"], ascending=[True, False])[AGENCY_SOURCE_COLS].copy()
    adf.columns = AGENCY_HEADERS
    ws2 = wb.create_sheet("Agencies")
    write_table(ws2, adf, name_col="Agency",
                blocked_mask=(adf["Status"] == "Blocked"),
                money_cols={"Total Value", "High-Fit Value"},
                widths={"Agency": 42, "Status Reason": 40, "Email": 30})

    # ---------------- Opportunities ----------------
    o_cols = ["owner", "state", "county", "targetability", "agency_score",
              "fit", "rank", "value", "indicators", "categories",
              "initiative_types", "date", "facility", "facility_mgd",
              "consultants", "c1_name", "c1_title", "c1_email", "c1_phone",
              "url", "opp_id"]
    odf = opps.sort_values(["targetability", "agency_score", "value"],
                           ascending=[True, False, False])[o_cols].copy()
    odf.columns = ["Agency", "State", "County", "Status", "EAE Score",
                   "Fit", "Rank", "Value", "Indicators", "Category",
                   "Initiative Type", "Date", "Facility", "MGD",
                   "Consultants/Competitors", "Contact", "Title", "Email",
                   "Phone", "Citylitics Link", "Opp ID"]
    ws3 = wb.create_sheet("Opportunities")
    write_table(ws3, odf, name_col="Agency",
                blocked_mask=(odf["Status"] == "Blocked"),
                money_cols={"Value"},
                widths={"Agency": 40, "Indicators": 38, "Category": 34,
                        "Email": 30, "Citylitics Link": 30})

    # ---------------- Blocked Accounts ----------------
    bdf = blocked[["owner", "state", "county", "named_account",
                   "match_confidence", "match_reason", "name_overlap",
                   "n_opps", "value_total", "score"]].copy()
    bdf.columns = ["Agency (blocked)", "State", "County",
                   "Matched Named Account", "Confidence", "Why It Matched",
                   "Name Overlap", "Opportunities", "Total Value", "EAE Score"]
    ws4 = wb.create_sheet("Blocked Accounts")
    write_table(ws4, bdf, name_col="Agency (blocked)",
                blocked_mask=pd.Series([True] * len(bdf)),
                money_cols={"Total Value"}, pct_cols={"Name Overlap"},
                widths={"Agency (blocked)": 42, "Matched Named Account": 38,
                        "Why It Matched": 40, "Confidence": 26})

    # ---------------- Needs Review ----------------
    rdf = review[["owner", "state", "county", "possible_named_account",
                  "why_not_auto_blocked", "n_opps", "value_total", "score",
                  "decision (block/allow)"]].copy()
    rdf.columns = ["Agency", "State", "County", "Matched Named Account",
                   "Why It Was Uncertain", "Opportunities", "Total Value",
                   "EAE Score", "RELEASE? (leave blank to keep blocked)"]
    ws5 = wb.create_sheet("Assumed Blocked")
    write_table(ws5, rdf, name_col="Agency",
                blocked_mask=pd.Series([True] * len(rdf)),
                money_cols={"Total Value"},
                widths={"Agency": 42, "Matched Named Account": 46,
                        "Why It Was Uncertain": 44,
                        "RELEASE? (leave blank to keep blocked)": 30})
    # Mark the decision column as the one to fill in.
    dcol = len(rdf.columns)
    for i in range(2, len(rdf) + 2):
        ws5.cell(row=i, column=dcol).fill = AMBER_FILL
    ws5.cell(row=1, column=dcol).comment = Comment(
        "These are blocked on name similarity, not a certain match. Type "
        "release next to any you know is actually open, then send the file "
        "back to regenerate the map and exclusion list.", "EAE targeting")

    wb.save(OUT)
    print(f"wrote {os.path.basename(OUT)}")
    print(f"  Agencies      {len(adf):,} rows ({int((adf['Status']=='Blocked').sum())} red)")
    print(f"  Opportunities {len(odf):,} rows ({int((odf['Status']=='Blocked').sum())} red)")
    print(f"  Blocked       {len(bdf):,} rows")
    print(f"  Needs Review  {len(rdf):,} rows")


if __name__ == "__main__":
    main()
