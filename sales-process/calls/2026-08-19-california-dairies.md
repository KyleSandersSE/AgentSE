# California Dairies (Visalia) — 2026-08-19

**Contact:** Edgar Santos — Senior Projects Engineer. Covers Visalia, Fresno, Tipton. (Turlock has its own engineers.)
**Others present:** none — solo
**Track:** End User
**Format:** Plant-floor walk (~40 min) + sit-down (~15-20 min)
**Transcript:** recorded, ASR quality poor but substance recoverable

---

## Part A — Pre-Call Gate

Scored twice to show what discovery produced.

| # | Criterion | Pre-call | Post-call | Evidence |
|---|---|---|---|---|
| A1 Trigger event | N | **Y** | Annual capex cycle; "every year they put some money aside... tackle one or two per plant." PLC-5 at multiple sites, GE PLCs + iFIX at Fresno, all need upgrading |
| A2 Named pain (their words) | N | **Y** | "By the time you install it and run it, it's already end of life." Plus audible air leaks driving compressors to 60-80% load |
| A3 Repeatability | P | **Y** | 4+ plants, corporate-standardized, one-to-two upgrades per plant per year |
| A4 Budget proximity | N | **P** | Budget is corporate; Mark & Lawrence (controls) hold technical veto. Edgar is one intro away and offered it |

**Gate: 1.0 pre-call → 3.5 post-call**

> Walked into a meeting that did not clear the gate and **discovered his way to a 3.5**. That is exactly what good discovery is for. Note for future: this account was worth the visit, but it was luck rather than targeting — the pre-call intel did not exist.

---

## Part B — Execution

| Dim | Score | Note |
|---|---|---|
| B1 Opening | 6 | No agenda up front, but time-box negotiated cleanly at the transition ("you have a cutoff?" → "15, 20?") |
| B2 Discovery discipline | **9** | ~40 minutes of plant walk with **zero pitching**. Product only came out after Edgar said he knew nothing about Schneider. Textbook earning the right |
| B3 Question quality | **8** | 14+ strong open questions; several unlocked the account (see below) |
| B4 Talk ratio | 7 | Edgar dominates the walk; inverts in the sit-down |
| B5 Pain development | 6 | Four real pains surfaced. None quantified — energy question asked but abandoned when Edgar didn't know |
| B6 Qualification | **8** | Best dimension. Authority, budget mechanism, timeline, incumbent, target site, and motive for taking the meeting — all established |
| B7 Objection handling | 7 | "We're not doing digital transformation" reframed well to "we can just get data out without taking control." Edgar softened to "eventually we would" |
| B8 Value articulation | 5 | "Long story short, we pretty much can do it all" — no wedge. Water/wastewater slide shown to a dairy. Phase 1 price never stated |
| B9 Next step | 6.5 | Right ask (meet Mark & Lawrence), conditional yes, but undated and no reciprocal commitment extracted |
| B10 Orchestration | N/A | Solo |

**Execution average: 6.9 / 10** — up from 4.2 (AStech, 2026-08-12)

---

## Part C — Outcome

**Grade: C+** — Conditional intro to the technical decision-makers, undated. Upgrades to **B** the moment Mark & Lawrence are on a calendar.

---

## Anti-patterns flagged

- **Price Silence** (repeat) — ~$4-6k Phase 1 never stated, to a customer who allocates $2M+ per facility per year.
- **"We can do it all"** (new) — the opposite of a wedge. Portfolio breadth answered "who is Schneider," then kept going and diluted the one thing that mattered (hardware-independent software vs. AB end-of-life churn).
- **Wrong-segment proof** — water/wastewater conversion slide shown to a dairy engineer, who immediately and explicitly asked for dairy.
- **Mirroring the buyer's limitation** — "I know you're not an automation guy," said aloud to someone who had just spent 40 minutes proudly walking through a controls project he was part of.
- **Pitching past the buyer** — Edgar said he isn't technical and can't approve, in the first minute. The sit-down still aimed at making *Edgar* understand EAE rather than arming him to carry it to Mark & Lawrence.

## Anti-patterns NOT repeated (from AStech)

- **Pitch-on-No — fixed.** "Has integrating the skids been a headache?" → "Not really, our programmers are pretty good." Took the no cleanly and moved on. This was the exact failure at AStech.
- **Empty-Handed** — had the laptop and slides ready.
- **Buried Signal — partially fixed.** Caught and used "by the time you install it, it's already end of life" as the pitch anchor.

---

## What worked (keep doing)

- **The whole plant walk.** Same strength as the AStech floor walk, this time recorded. Confirms the pattern: unstructured + curious is where this seller performs.
- **"Was there any reason you took this meeting? Have you been looking for something?"** — direct, unembarrassed qualification. Got an honest "just curious, we stick to the usual." Ask this in every first meeting.
- **"Are you guys happy with your Allen-Bradley stuff?"** — unlocked the entire commercial thesis in one question.
- **"Is that a plant thing you control, or a corporate initiative?"** → Mark & Lawrence. Authority mapped in one question.
- **"If something different were introduced, is that something you're open to?"** → "Would have to be approved by the controls guys." Veto confirmed, cleanly, without defensiveness.
- **"When you're having downtime, is there a specific section that has the most?"** → butter room. Perfect funnel question.
- **Reframe on digital transformation** — "we don't have to take over PLC control, we can just help you get data out." Moved a hard no to "eventually we would."

---

## Missed threads

1. **The energy number — the biggest miss.** "How much is your OpEx on energy?" → "I have no clue." That was the moment to say: *"Would it be worth knowing? You've got three of four air compressors on soft starters running flat out, and leaks you can hear but can't locate. That's a metering and data problem, not a controls problem — and the number it produces is usually how these projects get funded."* Phase 1 overlay, ~$4-6k, at a site with $2M+ allocations.
2. **Compressor #5.** Edgar did the math out loud: leaks push load from 50% to 60/70/80%, "to the point where you need another compressor." They may be about to spend capex on a compressor they don't need. Fully-formed business case, requires no PLC changes, needs no blessing from Mark & Lawrence, threatens no standard. **Politically free.** This is the wedge.
3. **Quantifying AB end-of-life.** Used the quote, never costed it. Missing: how many upgrades in the queue across three plants, what one costs all-in including Mark & Lawrence's time, and whether the application gets re-engineered each time.
4. **The next allocation date.** Learned money is allocated ~a month before the year. Never asked *when*. Single most actionable date in the account, one question away.
5. **iFIX.** Edgar volunteered that iFIX is off-version and "has to be converted as well." Schneider owns AVEVA. That is an in-portfolio displacement against GE/Emerson with a customer-stated need — and it drew zero follow-up questions. Possibly larger near-term revenue than the EAE thread.
6. **The four integrators.** Asked the question, got four names (E-Tech / ex-Automation Group, "Avery/Barry Controls," "TNT Process," + one more), never used the answer. These are both channel-recruit targets and the people who would deliver an EAE project here.
7. **Zach sold California Dairies Allen-Bradley for years.** Mentioned in passing. Mark & Lawrence are ex-integrators — they may know him personally. This is the strongest credibility asset in the account and it should headline the intro, not trail it.
8. **Leprino.** Edgar named the specific reference that would move his organization, and explained the psychology: this company doesn't believe claims, it believes proof from peers. He handed over the exact key.

---

## Account map (established in-call)

- **Edgar Santos** — Sr. Projects Engineer. Guide and door-opener, *not* a buyer, self-declared non-PLC. Genuinely helpful, proud of the Visalia butter room project (IO-Link / remote IO / Ethernet, ~1-2 yrs ago), which he pushed for against internal resistance.
- **Mark & Lawrence** — the two controls programmers **for the entire company**. Ex-integrators. Hold technical veto: "they'd have to give their blessing." Lawrence based in Visalia. **These are the real buyers.**
- **Controls capacity: 3 people for all plants.** Structural constraint and a strong argument for reusable/portable applications.
- **Budget:** corporate, annual, allocated ~1 month before the year. Scale: "$2M for this facility, $10M for this other." One to two upgrades per plant per year.
- **Install base:** Allen-Bradley standard; PLC-5 at multiple sites; GE PLCs + iFIX at Fresno; OEM skids arrive with their own panels (German butter packaging, Columbia palletizer, Yaskawa servos/VFDs).
- **Target site: Fresno.** Edgar's own pick — smallest, worst shape, most manual work, and a specific live failure: old proxes on an old PLC that don't appear on the HMI, so operators can't troubleshoot without pulling a programmer.
- **Zach is based in Fresno.** Alignment is free.

---

## Cadence set

`CADENCE_TEMPLATES.md` → **Template 2: End User, Trigger Identified**

- [ ] **T+24h (Thu 8/20)** Recap email to Edgar. Dairy proof, not water/wastewater. Chase Leprino internally first — if unavailable, any dairy/F&B modernization reference. One page, his words back to him ("by the time you install it, it's already end of life"), and the compressor/leak angle as the low-risk entry.
- [ ] **T+24h** Ask the one question that was missed: *when does the next budget allocation get decided?*
- [ ] **T+48h (Fri 8/21)** Internal: hunt the Leprino case study + any CA dairy references. This is the deliverable the account turns on.
- [ ] **T+48h** Brief Zach. Confirm whether he knows Mark or Lawrence personally from his Allen-Bradley years. If yes, that is the intro path, not Edgar.
- [ ] **T+3d** Reciprocal ask to Edgar: *"If I get you the dairy references this week, can you forward them to Mark and Lawrence and ask for 30 minutes?"* Trade the deliverable for the intro — do not just hand it over.
- [ ] **T+7d** Target: Mark & Lawrence session, Fresno, with Zach. Agenda = the Fresno prox/HMI visibility problem, not an EAE architecture tour.
- [ ] **Open** Price and scope a Phase 1 compressed-air / energy visibility overlay at Visalia or Fresno. State the ~$4-6k number in writing.
- [ ] **Open** iFIX → AVEVA conversion: separate thread, loop in the AVEVA team.
- [ ] **Open** Integrator track: E-Tech, TNT Process, "Avery/Barry Controls" — score against the Integrator Gate.
- [ ] **Trigger** Next annual budget allocation. Put the date in the CRM once known. Everything else is positioning for that moment.
