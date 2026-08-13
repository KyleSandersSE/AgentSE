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
                money_cols=(), pct_cols=(), widths=None):
    """Write a dataframe as a formatted table.

    name_col + blocked_mask drive the red highlight on the agency-name cell.
    """
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
            c.border = BORDER
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
        ("Blocked Accounts", "The 88 blocked agencies and the named account "
                             "each matched."),
        ("Needs Review", "Close matches I would not auto-block. Put block or "
                         "allow in the decision column."),
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
    n = len(agencies)
    live = [
        ("Agencies total", f'=COUNTA(Agencies!B2:B{n + 1})'),
        ("Blocked — cannot target", '=COUNTIF(Agencies!U2:U%d,"Blocked")' % (n + 1)),
        ("Open — targetable", '=COUNTIF(Agencies!U2:U%d,"Open")' % (n + 1)),
        ("Open pipeline value",
         '=SUMIF(Agencies!U2:U%d,"Open",Agencies!R2:R%d)' % (n + 1, n + 1)),
        ("Open high-fit projects",
         '=SUMIF(Agencies!U2:U%d,"Open",Agencies!N2:N%d)' % (n + 1, n + 1)),
        ("Open agencies scoring 70+",
         '=COUNTIFS(Agencies!U2:U%d,"Open",Agencies!T2:T%d,">=70")' % (n + 1, n + 1)),
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
        "The named-account list has no state column, so same-named agencies "
        "in different states were resolved by size — see Needs Review.",
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
    a_cols = ["owner", "state", "county", "city", "target", "score", "size",
              "population", "n_opps", "n_high", "n_priority", "n_modern",
              "value_total", "value_high", "contact_name", "contact_title",
              "contact_email", "contact_phone", "address", "zip", "lat", "lon",
              "target_reason"]
    adf = agencies.sort_values(["target", "score"],
                               ascending=[True, False])[a_cols].copy()
    adf.columns = ["Agency", "State", "County", "City", "Status", "EAE Score",
                   "Size Tier", "Population", "Opportunities", "High-Fit",
                   "Priority", "Upgrade/Replace", "Total Value",
                   "High-Fit Value", "Contact", "Title", "Email", "Phone",
                   "Address", "ZIP", "Lat", "Lon", "Status Reason"]
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
    bdf = blocked[["owner", "state", "county", "named_account", "match_reason",
                   "name_overlap", "n_opps", "value_total", "score"]].copy()
    bdf.columns = ["Agency (blocked)", "State", "County",
                   "Matched Named Account", "Why It Matched", "Name Overlap",
                   "Opportunities", "Total Value", "EAE Score"]
    ws4 = wb.create_sheet("Blocked Accounts")
    write_table(ws4, bdf, name_col="Agency (blocked)",
                blocked_mask=pd.Series([True] * len(bdf)),
                money_cols={"Total Value"}, pct_cols={"Name Overlap"},
                widths={"Agency (blocked)": 42, "Matched Named Account": 38,
                        "Why It Matched": 40})

    # ---------------- Needs Review ----------------
    rdf = review[["owner", "state", "county", "possible_named_account",
                  "why_not_auto_blocked", "n_opps", "value_total", "score",
                  "decision (block/allow)"]].copy()
    rdf.columns = ["Agency", "State", "County", "Possible Named Account",
                   "Why Not Auto-Blocked", "Opportunities", "Total Value",
                   "EAE Score", "YOUR DECISION (block/allow)"]
    ws5 = wb.create_sheet("Needs Review")
    write_table(ws5, rdf, money_cols={"Total Value"},
                widths={"Agency": 42, "Possible Named Account": 46,
                        "Why Not Auto-Blocked": 44,
                        "YOUR DECISION (block/allow)": 26})
    # Mark the decision column as the one to fill in.
    dcol = len(rdf.columns)
    for i in range(2, len(rdf) + 2):
        ws5.cell(row=i, column=dcol).fill = AMBER_FILL
    ws5.cell(row=1, column=dcol).comment = Comment(
        "Type block or allow here, then send the file back so the map and "
        "exclusion list can be regenerated.", "EAE targeting")

    wb.save(OUT)
    print(f"wrote {os.path.basename(OUT)}")
    print(f"  Agencies      {len(adf):,} rows ({int((adf['Status']=='Blocked').sum())} red)")
    print(f"  Opportunities {len(odf):,} rows ({int((odf['Status']=='Blocked').sum())} red)")
    print(f"  Blocked       {len(bdf):,} rows")
    print(f"  Needs Review  {len(rdf):,} rows")


if __name__ == "__main__":
    main()
