# CRM Entries — Paste-Ready

Generated from scored call logs in `sales-process/calls/`.
Stages match the Kanban board: `leads` → `qualified/contacted` → `followup` → `won`.

---
---

# 1. CITY OF LEMOORE — Wastewater Division

**Stage:** `followup`
**Priority:** 1 (highest — funded, in flight, dated next step)
**Next action date:** 2026-10-05 (target) · **invite must go out by 2026-08-21**

## Account summary

Municipal wastewater utility, Central Valley. **42 lift stations plus a treatment plant. Zero SCADA today** — operators drive to every site daily to read hours and levels. A city-wide energy upgrade (solar + VFDs) is in flight, delivered by incumbent integrator **Telstar**, adding PLCs and first-ever SCADA to **12 of the 42 stations**. Plant headworks also being upgraded, also with no SCADA.

**The opening: the other 30 stations.** No budget assigned, no vendor assigned, and the stated goal is "ideally we want it for everything."

**Primary pain — proprietary lock-out.** Telstar holds the license and login for the city's own PLCs. Lemoore staff physically cannot touch their own control system. High School station goes down, they call Telstar and wait — typically next-day, at roughly $2,500 per truck roll plus internal overtime. Staff raised this themselves and are visibly frustrated: *"we can't even touch our PLCs because we don't have a license."* Multiple people independently said they want the ability to reset it themselves.

**Corroborating story (use this):** their Flygt pumps went obsolete, Flygt was unresponsive, they bought Homa off the shelf — but Flygt's proprietary guide rails forced an adapter. They are now standardizing on Homa specifically so the base elbow accepts any pump. They have already lived and internalized the anti-lock-in lesson, in hardware.

## Contacts

| Name | Role | Notes |
|---|---|---|
| **Juan Diego** | Assistant Public Works Director | **Economic buyer.** Unreachable by phone for ~1 year. Met in person 8/19, agreed verbally to a further conversation. Described as very savvy electrically; knows the equipment detail |
| **Estefan** | Public Works Director | Above Diego. Equally involved on city-wide upgrades, less technical |
| **Jeremy** | Wastewater Supervisor | **Champion + budget holder for wastewater.** Stated interest: "being more efficient, saving money, upgrading our whole city." Volunteered to broker the Diego meeting |
| **Zeke** | Lift station coordinator | Met at Tri-State Conference. Original entry point |
| **Anthony** | Sr. wastewater operator | Collections lead |
| **Telstar** (Connor, Corey, Frank, Steve) | Incumbent integrator | **Specifies the hardware.** Schneider channel partner |
| **Medallion Supply** (Erin, Chad) | Distributor | Sells Schneider |

## Qualification

- **Budget:** FY July–July, next cycle already set. Wastewater budget tight this year (upgrades + CIPs). Department energy spend ~$15K/month, ~20% of budget. Real conversation window: **discussions for the following cycle begin early calendar year.**
- **Authority:** Diego + Estefan approve. **Telstar specifies brand** — "whatever Telstar suggests." Path runs through Telstar or it doesn't run.
- **Installed base:** Believed Allen-Bradley **MicroLogix** PLCs (VERIFY — likely end-of-life), likely **Schneider Altivar** VFDs. Vega and Precision Digital pump controllers. Smart Cover level sensors as a stopgap. No SCADA anywhere today.
- **Timeline:** Telstar install completing now; SCADA training in a few weeks. **October** named by the customer as when they'll know enough to talk seriously.

## Next steps

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | **Send the October calendar invite** — two dates, agenda already agreed: walk High School station, review installed upgrades, build a roadmap. Do NOT wait for Jeremy's email | Kyle | **8/21** |
| 2 | **Verify MicroLogix EOL status** against Rockwell's published lifecycle | Kyle | 8/22 |
| 3 | **Telstar call (Connor/Corey)** — frame on the 30 unmonitored stations as net-new work, not displacement | Kyle | 8/26 |
| 4 | Confirm the Altivar VFD model going in — enables drive-as-controller play at remaining 30 stations | Kyle | 8/26 |
| 5 | Price a Phase 1 overlay for 2–3 unmonitored lift stations | Kyle + Zach | 9/15 |
| 6 | **October site meeting** with Jeremy + Diego. Lead with the pump analogy. Bring the priced Phase 1 | Kyle | early Oct |
| 7 | Calendar the FY budget discussion window (early calendar year) | Kyle | — |

## Talk track for October

> "You standardized on Homa so the base elbow fits whatever pump you can actually get. That's exactly what we do with controls. Right now your PLC is a Flygt guide rail — one vendor, one programmer, one phone number. We make it a Homa base elbow."

Then: you just funded 12 of 42. The other 30 are still open. You already can't touch your own system — if that goes city-wide, so does the problem. Non-proprietary platform, end-user training included (free virtual + one week on site), Telstar keeps the integration work.

## Risks

- Telstar controls the spec and has commercial incentive to protect the license position
- Diego historically unreachable — Jeremy is the only reliable path
- Budget locked for current FY; realistic funding is next cycle
- 12 sites just purchased — sunk-cost resistance to changing direction

---
---

# 2. CALIFORNIA DAIRIES — Visalia / Fresno / Tipton

**Stage:** `qualified/contacted`
**Priority:** 2
**Next action date:** 2026-08-20

## Account summary

Dairy processor, multiple Central Valley plants. Standardized on Allen-Bradley; **PLC-5 still running at several sites**; Fresno runs GE PLCs with **iFIX SCADA that is off-version and needs conversion**. Annual capex allocates one to two upgrades per plant.

**Primary pain — in the buyer's words:** *"By the time you install it and run it, it's already end of life."* Genuine, unprompted frustration with the Allen-Bradley refresh treadmill.

**Second pain — compressed air.** Audible leaks they cannot locate (no drawings; the people who ran the conduit left 20 years ago) pushing air compressors from ~50% to 60–80% load. Three of four compressors are on soft starters with no VFD. They may be heading toward buying a fifth compressor they don't need. **Nobody knows what energy costs them** — Edgar: "I have no clue."

**Best entry:** compressed-air / energy visibility overlay. Touches no PLC, needs no blessing from the controls team, threatens no standard. Politically free, and the number it produces is how the larger project gets funded.

## Contacts

| Name | Role | Notes |
|---|---|---|
| **Edgar Santos** | Sr. Projects Engineer | **Guide, not buyer.** Self-declared non-PLC. Covers Visalia, Fresno, Tipton. Proud of the Visalia butter room project (IO-Link / remote IO / Ethernet) he pushed for against internal resistance |
| **Mark** & **Lawrence** | Controls programmers — **for the entire company** | **Real technical buyers. Hold veto:** "they'd have to give their blessing." Both ex-integrators. Lawrence based in Visalia |
| **Zach Stewart** | Schneider EAE engineer | **Sold California Dairies Allen-Bradley for years.** Based in Fresno. Check whether he knows Mark or Lawrence personally |

## Qualification

- **Budget:** Corporate, annual, allocated roughly a month before the year starts. Scale: "$2M for this facility, $10M for this other." **Next allocation date unknown — ask.**
- **Authority:** Corporate funds it; Mark & Lawrence hold technical veto. Edgar influences and opens doors only.
- **Constraint:** 3 controls people for all plants. Strong argument for reusable, portable applications.
- **Target site: Fresno** — Edgar's own pick. Smallest, worst condition, most manual work. Specific live failure: old proximity sensors on an old PLC that don't appear on the HMI, so operators can't troubleshoot without pulling a programmer.
- **Why they took the meeting:** curiosity, no trigger. "We just stick to the usual."


## Opportunity sizing

**CRM value: $35,000 · 15% · close ~Q1 FY27** (Phase 1 energy/air visibility pilot, one site)

Everything below Tier 1 is account potential, not forecast. Track it separately so it does not inflate weighted pipeline.

| Tier | Scope | Range | Prob | Basis |
|---|---|---|---|---|
| 1. Phase 1 pilot | Air/energy visibility overlay, one site | $25–50K | 15% | iPC $1–3K + EAE licenses ~$3K + 6–10 metering points ~$8K + engineering/commissioning $15–30K. No control changes, no platform approval required |
| 2. Fresno modernization | GE PLC + PLC-5 migration, automate manual ops | $500K–1.5M | 5% | Multi-year phased. Edgar's own pick as the site needing the most help |
| 2b. iFIX → AVEVA | SCADA conversion at Fresno | $100–300K | 10–15% | Separate BU/sale. Customer-stated need: "has to be converted as well" |
| 3. Multi-plant standard | EAE as controls standard, 3–6 plants | $3–10M / 5 yr | <5% | Requires Mark & Lawrence to displace an entrenched Allen-Bradley standard |

**Sanity check:** customer stated "$2M for this facility, $10M for this other," one to two upgrades per plant per year. Every tier fits inside their spend envelope. The constraint is approval and attention, not budget.

**Why probability stays low despite a 3.5 gate:** no trigger event (curiosity meeting); the two people with veto power have not been met; both are ex-integrators, historically the hardest audience for a platform change; deep AB standardization; 3 controls staff company-wide caps absorption capacity; the champion cannot advance a purchase.

**Headline for pipeline review: $135K** — Phase 1 pilot ($35K) + iFIX→AVEVA ($100K). The AVEVA thread is the highest-probability near-term revenue: customer-stated need, Schneider already owns the product, and it requires no blessing on a new control platform.

**What re-rates this, in order:**
1. Next budget allocation date — one unasked question; every close date is a guess without it
2. Mark & Lawrence on a call — hold at ≤15% until then
3. Trial installed or pilot funded — the step change from curiosity account to real opportunity

## Next steps

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | **Recap email to Edgar** — dairy references, NOT water/wastewater. He asked explicitly | Kyle | **8/20** |
| 2 | **Ask: when does the next budget allocation get decided?** One line, highest-value missing fact | Kyle | **8/20** |
| 3 | **Find the Leprino case study** (he named it himself) or any CA dairy/F&B modernization reference | Kyle | 8/21 |
| 4 | **Brief Zach** — does he know Mark or Lawrence from his Allen-Bradley years? If yes, that's the warmer intro path | Kyle | 8/21 |
| 5 | **Trade for the intro:** "If I get you these dairy references this week, will you forward them to Mark and Lawrence and ask for 30 minutes?" | Kyle | 8/24 |
| 6 | Target Mark & Lawrence session at **Fresno with Zach**. Agenda = the prox/HMI visibility failure, not an architecture tour | Kyle + Zach | ~9/1 |
| 7 | Price a Phase 1 compressed-air / energy visibility overlay. **State the ~$4–6K number in writing** | Kyle | 9/5 |
| 8 | **iFIX → AVEVA** conversion — separate thread, loop in AVEVA team | Kyle | 9/5 |
| 9 | Score named integrators against the Integrator Gate: E-Tech (ex-Automation Group), TNT Process, "Avery/Barry Controls" | Kyle | 9/15 |

## Talk track

> "You said by the time you install Allen-Bradley it's already end of life. The cheapest place to start isn't controls at all — it's metering and a data layer on your compressed air. Four to six thousand, no PLC changes, nobody has to bless a new platform. In a month you'd know what those leaks actually cost you, and that number is usually how the bigger project gets funded."

## Risks

- No trigger event — curiosity meeting
- Mark & Lawrence unmet; ex-integrators are often the hardest audience for a platform change
- Deep Allen-Bradley standardization
- Edgar cannot advance this alone

---
---

# 3. ASTECH ENGINEERED PRODUCTS — Santa Ana

**Stage:** `qualified/contacted`
**Priority:** 3 — **note: this is a CHANNEL/INTEGRATOR record, not an end-user opportunity**
**Next action date:** 2026-08-22

## Account summary

Aerospace machine shop rebuilding legacy welders from the 1950s–60s, roughly one per year for the next 3–4 years. **As an end user this account does not qualify** — 5–6 machines, no connectivity ambitions, no data ambitions, rare PLC failures, and a hard functional-safety requirement EAE cannot meet until ~late 2027.

**The actual opportunity is Greg personally.** He runs an independent systems integration business on the side and is openly weighing whether he stays at AStech. Schneider needs more integrators capable of machine-level manufacturing work. EAE gives him a way to scale his book.

**Objective: get EAE installed on his machine and get him through free virtual training.** Everything else is noise until that happens.

## Contacts

| Name | Role | Notes |
|---|---|---|
| **Greg Rasmussen** | Automation Engineer, AStech + independent integrator | **Channel recruit target.** Technically sharp, direct, appreciates candor. Asked to see the IDE and defined his own test: build an application, then swap the controller underneath |
| **Myron** | Stevens Engineering (channel partner) | First EAE exposure. Voiced doubt about the safety gap in front of the prospect — **needs briefing before any joint call** |
| **Zach Stewart** | Schneider EAE engineer | Ex-Rockwell. Right person for the technical session |

## Qualification (Integrator Gate: 3.5 / 4.0)

- **Scaling motive:** Yes — wants to grow his integration book; weighing his future at AStech
- **Segment fit:** Yes — machine-level manufacturing work
- **Capability gap:** Partial — **not yet pinned down. Ask directly.**
- **Willingness to learn:** Yes — asked to see the environment, accepted the engineer session

## Known blockers (disclosed honestly, credibility earned)

- **Functional safety** — not supported; roadmap ~late 2027
- **Synchronized/coordinated motion** — not supported

Neither blocks the channel track. They constrain which of *his customers'* applications fit, not whether he can build a practice.

## Next steps

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | **Recap email** — answers on scan-time/latency, protocol & I/O mapping, safety roadmap timing. Confirm session, name Zach and his Rockwell background, restate the agenda in Greg's words | Kyle | **8/22** |
| 2 | **Send trial license + virtual training enrollment.** The license is the ask, not the reward — do not wait for the session | Kyle | **8/22** |
| 3 | **Brief Myron** — partner checklist. Known gaps, agreed language, no roadmap speculation. Thank him for the phone/app analogy; it worked | Kyle | before session |
| 4 | **Zach session, 45 min, dated.** Build-and-swap exercise only, Greg's hands on the keyboard. Not a feature demo | Kyle + Zach | ~8/29 |
| 5 | In session: **pin down what actually limits the scale of his integration business today** | Kyle | ~8/29 |
| 6 | **T+30 qualifier: "Did you get a chance to spin it up?"** Installed = invest. Not installed = quarterly | Kyle | ~9/29 |
| 7 | If installed: introduce to partner/channel program — certification, deal registration, co-sell | Kyle | Oct |
| 8 | Secondary/low priority: AStech machine #3 controls scope date | Kyle | — |

## Do not

Push AStech's own plant as an opportunity. It muddies the relationship and reads as selling past the point.

---
---

# Pipeline summary

| Account | Stage | Priority | Real buyer | Next milestone | Date |
|---|---|---|---|---|---|
| **City of Lemoore** | followup | 1 | Juan Diego (via Jeremy + Telstar) | Site meeting + roadmap | **Oct** |
| **California Dairies** | qualified/contacted | 2 | Mark & Lawrence | Intro session at Fresno | **~9/1** |

**Forecast:** Lemoore unsized pending October scoping · California Dairies **$35K @ 15%** (account potential $135K–1.8M) · AStech non-revenue channel record
| **AStech / Greg Rasmussen** | qualified/contacted | 3 | Greg (channel recruit) | Zach build-and-swap session | **~8/29** |

## This week (by 8/22)

- [ ] **8/20** — Edgar recap email + budget allocation date question
- [ ] **8/21** — Lemoore October calendar invite (two dates, agenda attached)
- [ ] **8/21** — Leprino / dairy case study hunt
- [ ] **8/21** — Brief Zach on both California Dairies and AStech
- [ ] **8/22** — Verify MicroLogix EOL status
- [ ] **8/22** — Greg recap email + trial license + training enrollment
- [ ] **8/22** — Brief Myron

## Cross-account themes

1. **Proprietary lock-in is the message that lands.** All three said it unprompted, in their own words. Lemoore: can't touch their own PLCs. California Dairies: "already end of life" by install. Greg: wants portability to scale. Lead with their story, not the architecture.
2. **Free end-user training is the most compelling differentiator** — it was the emotional center at Lemoore and it's the entire ask at AStech.
3. **Phase 1 overlay (~$4–6K, no control changes) is underused.** Not stated in any of the three meetings. State the number.
4. **Zach is the highest-leverage asset in the portfolio** — Fresno-based, ex-Rockwell, and he sold California Dairies Allen-Bradley for years.
5. **Integrators are gatekeepers, not obstacles.** Telstar specifies Lemoore's hardware. California Dairies uses four named integrators. Greg is one. Recruit them or route through them — do not compete with them.
