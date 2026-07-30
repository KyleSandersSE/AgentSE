# Tri-State Seminar 2026 — Speaker Guide

**Talk:** The Shift to Software-Defined Automation in Water & Wastewater
**Slot:** Wed Aug 5, 2026 · 07:30–08:20 · Sonoma B · Electrical/I&C Track
**Deck:** `SDA-Water-Wastewater-TriState-2026.pptx` (33 slides, 16:9, PowerPoint-2013 compatible)
**Regenerate:** `node build.js`

---

## The story spine

Your instinct to build a villain was right, but the strongest version of it isn't
"vendors locked you in." It's:

> **Every generation of automation solved the last generation's problem, and each solution
> quietly became the next constraint. The PLC was invented in 1968 as an act of *decoupling* —
> logic separated from copper. We just never finished the job. Logic is still welded to the box.**

That framing does three things a vendor-blame framing can't:

1. **It's fair**, so the room trusts you. Nobody in that room chose badly — they chose the
   right thing for 1985.
2. **It makes SDA the ending, not the pitch.** Software-defined automation isn't a new idea
   being sold to them; it's the completion of an idea their industry already believes in.
3. **It gives you the credibility move**: you work for one of the companies that built the
   problem. That admission on slide 2 is what buys you the next forty minutes.

**Three acts:** how we got here (1968 → 1975 → 1989) · the seam we never cut and the four
bills now coming due · what changes, and why "open" is the word that matters.

---

## Timing (50 min: ~42 speaking + 8 Q&A)

| Slides | Section | Off by |
|---|---|---|
| 1–4 | Open, disclosure, the hook | 0:05 |
| 5–10 | **Act I** — relay panel → PLC → DCS → SCADA → the pattern | 0:14 |
| 11–19 | **Act II** — the villain, why it happened, four bills, audience beat | 0:29 |
| 20–29 | **Act III** — the idea, two analogies, open vs. software-defined, proof | 0:44 |
| 30–33 | Where SE sits, phased path, Monday actions, Q&A | 0:50 |

Every slide's speaker notes end with a timing checkpoint. **If you're running long, cut
slide 28** (the İzmir/Anglian/Novara proof slide) — it's breadth, and Conroe already
carries the argument. Do **not** cut slide 19 (the audience question); it's the hinge.

---

## What changed from your outline, and why

| Your outline | What's in the deck | Why |
|---|---|---|
| Speaker background early | Kept, but paired with the "I work for one of the companies that built this" disclosure | Turns a resume slide into the credibility moment of the talk |
| 6-item agenda | Three acts | An agenda that promises a story reads differently than one that promises a list |
| CarPlay analogy | Kept — plus **phone number portability (1996)** right after | CarPlay explains what it *feels* like; portability explains what's *at stake*. The second one is about ownership, which is your actual argument |
| SDA benefits listed as features | Reframed as consequences of one decision (slide 24) | Stops it sounding like a datasheet |
| Cyber: "patch-and-pray," IEC 62443-3-3 | Aliquippa 2023 + EPA's 70% finding; standard number dropped | You said you're not pitching technically. The standard number adds nothing from a stage; the story of a default password on an internet-facing PLC lands |
| Conroe: "50+ hrs/week manual data collection" | **"five hours a day → minutes"** | See "verify before you go" below — the published figure is five hours daily |
| SE section mid-deck weight | Compressed to 2 slides at the very end, framed as disclosure | Tri-State's rules explicitly bar sales pitches, and the room will punish one after 40 min of earned trust |
| — | **New: slide 25, "software-defined" ≠ "open"** | This is the most valuable 90 seconds in the talk for a utility audience, and it's the slide that proves your slide-2 disclosure was sincere |

**Deliberately left out:** Oldsmar 2021. It was later attributed to operator error, and
citing it costs credibility with anyone who followed the story. IEC 62443 and IEC 61131-3
appear only in passing. No container/runtime/virtualization vocabulary anywhere on a slide.

---

## Two things to verify before you present

1. **"530+ active projects" (slide 30).** That's the most recent figure I could source
   publicly (Aug 2025). Your outline said 600+ and your notes elsewhere say 700+. Get the
   currently approved number from SE marketing and update slide 30 — an inflated count is
   exactly the kind of thing someone in a 300-seat room will check.
2. **Your title on slides 1, 2 and 33.** Currently "Business Development Manager,
   Schneider Electric." Change if you'd rather present under a different title.

---

## Conference logistics (from the acceptance letter)

- 50 minutes **including** Q&A. Presentations must be PowerPoint-2013 compatible for Windows — this deck is.
- **On a flash drive.** No personal laptops connect to the projector.
- **Arrive 15 minutes early** to load onto the conference laptop.
- Sonoma B seats 300. Body text here is 16–24pt with 34–52pt titles, above the recommended floor.
- **No product/sales brochures may be handed out.** If you want a leave-behind, add a QR code
  to slide 33 pointing at a resource page — the organizers explicitly ask for this instead of paper.

---

## Sources behind the claims

| Claim | Source |
|---|---|
| GM Hydramatic 1968 spec; Modicon 084, Bedford Associates' 84th project | control.com, automationmag.com, AutomationDirect PLC history |
| First DCS 1975 — Honeywell TDC 2000, Yokogawa CENTUM | Honeywell "50 years of DCS"; Yokogawa CENTUM history |
| Wonderware InTouch 1989, first Windows HMI | Industrial Software Solutions; AVEVA product history |
| Aliquippa PA, Nov 2023 — Unitronics PLC, default password | WaterWorld; CISA / WaterISAC advisories |
| EPA: 70%+ of inspected systems non-compliant with SDWA §1433 | EPA Enforcement Alert, May 2024 |
| 21% retirement-eligible in 5 yrs; 9% vacancy rate | AWWA 2025 Utility Benchmarking Survey |
| ~10,000 operator openings/year through 2034 | U.S. Bureau of Labor Statistics |
| 25–35 year control system service life; İzmir / Anglian / Novara results | Frost & Sullivan, *Modernising Water and Wastewater Operations*, 2025 |
| Conroe: 19 facilities, $50M program, 70% engineering efficiency, 80% faster recovery, 5 hrs/day → minutes | City of Conroe / Schneider Electric, WEFTEC 2025 |
| UAO founded Nov 2021, 9 founders, 90+ members, board incl. ExxonMobil/Yokogawa/Intel | UniversalAutomation.org; automation.com |
