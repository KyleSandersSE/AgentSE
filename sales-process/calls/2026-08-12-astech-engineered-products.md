# AStech Engineered Products (Santa Ana) — 2026-08-12

**Contacts:** Greg Rasmussen — Automation Engineer, AStech Engineered Products. Also runs an independent systems integration business.
**Others present:** Myron — Stevens Engineering (channel partner; first EAE exposure)
**Track:** **Integrator / Channel** — reclassified after the plant-floor walk
**Transcript:** conference-room portion recorded; plant-floor walk not recorded (notes only)

> **Classification note.** Scored initially as End User and graded poorly. Reclassified after the unrecorded floor walk revealed Greg runs his own integration business. On the End User track this account gates at ~1.5 (no trigger, no repeatability, "we're pretty old school here," rare PLC failures, hard safety requirement). On the Integrator track it gates at 3.5. **The account was fine; the initial read was wrong.** Lesson: classify the *person*, not the building — and record the floor walk, because that is where the real conversation happened.

---

## Part A — Pre-Call Gate (Integrator)

| # | Criterion | Y/P/N | Evidence |
|---|---|---|---|
| I1 Scaling motive | **Y** | Runs an integration business on the side; actively considering whether he stays at AStech. Wants to grow the book. |
| I2 Segment fit | **Y** | Machine-level work for manufacturing — exactly the profile EAE needs more integrators in. Aerospace-adjacent segments. |
| I3 Capability gap | **P** | Discussed segments served and needs; the specific constraint on his scale is not yet pinned down. Open question. |
| I4 Willingness to learn | **Y** | Asked unprompted to see the IDE, defined his own test ("build it, then drag a new controller in"), accepted the engineer session. |

**Gate: 3.5 / 4.0 → full engagement authorized, engineer time justified**

---

## Part B — Execution

| Dim | Score | Note |
|---|---|---|
| B1 Opening | 4 | No agenda, no time-box, no "what would make this worth your time" |
| B2 Discovery discipline | 5 | Strong open questions for ~4 min, then Pitch-on-No |
| B3 Question quality | 5 | Good early ("how does that process look for you today?"); later round closed and feature-sourced, drawing four consecutive no's |
| B4 Talk ratio | 4 | Inverted through the middle third — 61499 monologue, container/puzzle-piece explanation |
| B5 Pain development | **3** | Capped. "Down for days to weeks" surfaced and never costed |
| B6 Qualification | 3 | (Conference room only. The floor walk did the real qualification work — needs, segments, tenure intent) |
| B7 Objection handling | 6 | Honest on safety and motion; credibility earned. No isolate attempted on either |
| B8 Value articulation | **4** | Capped. Phase 1 ~$4–6k never stated. Led with architecture into a stated non-problem |
| B9 Next step | 6 | Meeting agreed with a buyer-authored agenda. Undated, attendees not confirmed, no success criterion |
| B10 Orchestration | 2 | Unbriefed partner voiced a competitive doubt in front of the prospect |

**Execution average: 4.2 / 10**

Floor walk, unscored (no recording) but by report materially better — rapport built on genuine shared interest in aerospace and local familiarity, plus real discovery on needs, segments, and intent to stay. **Record the walk next time.** The gap between the two halves is the most useful data point in this call.

---

## Part C — Outcome

**Grade: C** — 45-minute session with Zach agreed, undated, buyer-framed as "for my own information." Upgrades to **B** once dated with the trial license sent.

---

## Anti-patterns flagged

- **Pitch-on-No** — "Is that reprogramming a frustration?" → "Not in particular." → immediate 200-word pitch on IEC 61499. The correct move was a second question.
- **Self-Disqualifying Question** — "Down for days to weeks" → "How often is that the PLC itself?" → "Rarely." Narrowed a real pain to the one component guaranteed to lose. Better: *"What does a week down cost you?"* then *"Is the part hard to find because it's obsolete, or because your controller only talks to that specific part?"*
- **Buried Signal** — "One a year for at least another two, three, four machines" plus "we'll be able to use the skeleton, if you will" — a named multi-year cadence *and* the buyer articulating your own reuse value prop, in the first 90 seconds. Never returned to.
- **Unbriefed Partner** — Myron: "I would be surprised if Schneider doesn't have that already in the roadmap because that would be a major knock on the selling side."
- **Price Silence** — ~$4–6k Phase 1 never mentioned.
- **Empty-Handed Demo** — "I don't have the programming environment," which was the one thing he asked to see.
- **Deference Tell** — "I don't want to take up your time" / closing on a request for feedback about your own articulation, which confirmed his "this is just for my own information" framing.

---

## What worked (keep doing)

- **"Is that reprogramming a frustration, or would you rather use your time elsewhere?"** — genuinely good question. Two-option, non-leading, open.
- **Never bluffed.** Said "I'm not the engineer" three times and committed to bringing the right person. With a technical buyer this buys more than a confident wrong answer ever would — Greg said "I appreciate the transparency" twice.
- **Honest on safety.** "We do not do safety. On the roadmap, late 2027." Costly, correct, and the reason he'll take the next call.
- **Asked the trial close and got a yes.** "Would you be open to 45 minutes on a Friday with my engineer?"
- **Asked which he'd rather see** — applications or environment — and he wrote the follow-up agenda himself: *"we programmed this little system here, now let's drag a completely new controller in and what's involved with the changeover."*
- **Ran the floor walk.** Unstructured, curiosity-driven, and it produced the entire real opportunity. This is the strength to build the process around, not a detour from it.

---

## Missed threads

- **Engineering cost per rebuild.** "One machine a year for 3–4 more years" + "we'll use the skeleton" = the actual pitch. *What does the controls engineering cost per machine, in weeks and dollars? If #2 were built as reusable objects, #3–#5 inherit it. Over four machines, what's that worth?* Sidesteps safety and motion entirely — you're selling the application layer, not machine control.
- **"Depends on what our sales team can drum up"** — does AStech *sell* these machines? If so they're an OEM, which is a different and better motion. Never asked.
- **Cost of a week of downtime.** Never quantified.
- **Why field parts are hard to source** — obsolescence vs. controller lock-in. The second answer puts EAE straight back in play.
- **Myron's phone analogy** — "most cell phones are the same, Apple, Android, they're just passthrough; it's the apps that have the magic." Landed better than anything in the deck; Greg warmed immediately. **Steal it. Retire the puzzle-piece slide** — he asked what the shapes meant twice and it broke the explanation both times.

---

## Cadence set

`CADENCE_TEMPLATES.md` → **Template 1: Integrator / Channel Recruit**

- [ ] **T+24h** Recap email — answers on scan-time/latency, protocol & I/O mapping, safety roadmap timing. Confirm the session, name Zach and his Rockwell background, restate the agenda in Greg's words.
- [ ] **T+24h** Send free trial license + virtual training enrollment. **Do not wait for the technical session.**
- [ ] **Before the session** Brief Myron — partner checklist. Realign on known gaps and no roadmap speculation. Thank him for the phone analogy; it worked.
- [ ] **Session** Zach, 45 min, dated. Build-and-swap exercise only, Greg's hands on the keyboard. Not a feature demo.
- [ ] **Session** Pin down I3 — what actually limits the scale of his integration business today?
- [ ] **T+30d** The qualifier: *"Did you get a chance to spin it up?"* Installed = invest. Not installed = quarterly.
- [ ] **Open** Explore the integration business properly — segments served, customer base, whether EAE lets him bid work he currently can't.
- [ ] **Trigger (secondary)** AStech machine #3 controls scope definition. Ask Greg for the date. Low priority relative to the channel track.
