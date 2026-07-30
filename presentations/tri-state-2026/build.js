/**
 * Tri-State Seminar 2026 — Electrical/Instrumentation & Control Track
 * "The Shift to Software-Defined Automation in Water & Wastewater"
 * Wed Aug 5, 2026 · 07:30–08:20 · Sonoma B
 *
 * Build:  node build.js
 */

const pptxgen = require("pptxgenjs");

/* ------------------------------------------------------------------ palette */
const NAVY   = "000000"; // pure black — every slide background
const NAVY_2 = "1B1B1B"; // raised card, tier A
const TEAL   = "00A19C"; // Siemens-flavored teal — supporting accent
const TEAL_L = "6FD9D4"; // light teal for secondary text on cards
const GREEN  = "3DCD58"; // Schneider Electric green — dominant accent
const RED    = "E2231A"; // Rockwell Automation red — targeted accent
const INK    = "FFFFFF"; // primary body text (white, on black)
const MUTED  = "9AA3AA"; // captions — legible gray on black
const PAPER  = "FFFFFF";
const TINT   = "161616"; // card fill, tier B

const HEAD = "Telegraf"; // display + body — deck typeface
const BODY = "Telegraf";

const W = 13.33, H = 7.5;
const M = 0.7;                 // slide margin
const CW = W - M * 2;          // full content width
const BOTW = 11.3;             // bottom-line width — keeps clear of the page number

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Kyle Sanders";
pres.company = "Schneider Electric";
pres.title = "The Shift to Software-Defined Automation in Water & Wastewater";

/* ----------------------------------------------------------------- helpers */
// Every helper builds FRESH option objects — pptxgenjs mutates them in place.

function slideDark() {
  const s = pres.addSlide();
  s.background = { color: NAVY };
  return s;
}
function slideLight() {
  const s = pres.addSlide();
  s.background = { color: PAPER };
  return s;
}

/** The deck's one repeated motif: a rounded pill label. */
function chip(s, text, x, y, w, fillColor, textColor) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h: 0.44, rectRadius: 0.22,
    fill: { color: fillColor }, line: { color: fillColor, width: 1 },
  });
  s.addText(text, {
    x, y, w, h: 0.44, align: "center", valign: "middle", margin: 0,
    fontFace: BODY, fontSize: 15, bold: true, color: textColor, charSpacing: 1.1,
  });
}

/** Eyebrow chip + title block, used on every content slide. */
function head(s, eyebrow, title, dark = false, opts = {}) {
  if (eyebrow) {
    chip(s, eyebrow, M, 0.52, opts.eyebrowW || 2.3, dark ? GREEN : TEAL, dark ? NAVY : PAPER);
  }
  s.addText(title, {
    x: M, y: eyebrow ? 1.12 : 0.7, w: opts.titleW || CW, h: opts.titleH || 1.05,
    fontFace: HEAD, fontSize: opts.titleSize || 38, bold: true,
    color: dark ? PAPER : INK, valign: "top", margin: 0,
  });
}

function card(s, x, y, w, h, dark = false) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: dark ? NAVY_2 : TINT },
    line: { color: dark ? NAVY_2 : TINT, width: 1 },
  });
}

/** Big number + label callout. */
function stat(s, x, y, w, number, label, dark = false, numColor) {
  s.addText(number, {
    x, y, w, h: 1.15, align: "center", valign: "bottom", margin: 0,
    fontFace: HEAD, fontSize: 60, bold: true, color: numColor || (dark ? GREEN : TEAL),
  });
  s.addText(label, {
    x, y: y + 1.22, w, h: 0.95, align: "center", valign: "top", margin: 0,
    fontFace: BODY, fontSize: 17, color: dark ? TEAL_L : MUTED,
  });
}

let pageNo = 0;
function foot(s, dark = false) {
  pageNo++;
  s.addText(String(pageNo), {
    x: 12.28, y: 7.08, w: 0.55, h: 0.32, align: "right", margin: 0,
    fontFace: BODY, fontSize: 11, color: "3A3A3A",
  });
}

/* =================================================================== SLIDES */

/* ---- 1. Title ------------------------------------------------------- */
{
  const s = slideDark();
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 4.62, w: W, h: 2.88, fill: { color: "0A0A0A" }, line: { width: 0 },
  });
  chip(s, "TRI-STATE SEMINAR 2026", M, 0.95, 3.5, GREEN, NAVY);
  s.addText("The Shift to\nSoftware-Defined Automation", {
    x: M, y: 1.7, w: 11.4, h: 1.9, margin: 0,
    fontFace: HEAD, fontSize: 46, bold: true, color: PAPER, lineSpacing: 52,
  });
  s.addText("in Water & Wastewater", {
    x: M, y: 3.72, w: 11.4, h: 0.7, margin: 0,
    fontFace: HEAD, fontSize: 34, italic: true, color: GREEN,
  });
  s.addText("Kyle Sanders  ·  Business Development Manager, Schneider Electric", {
    x: M, y: 5.05, w: 11.4, h: 0.45, margin: 0,
    fontFace: BODY, fontSize: 21, color: PAPER,
  });
  s.addText("Electrical / Instrumentation & Control Track  ·  Wednesday, August 5, 2026  ·  Sonoma B", {
    x: M, y: 5.6, w: 11.4, h: 0.45, margin: 0,
    fontFace: BODY, fontSize: 17, color: TEAL_L,
  });
  s.addNotes(
`OPEN COLD — no "thanks for having me," no logo warm-up. 50 minutes total, plan ~42 speaking + 8 Q&A.

Say something close to: "Everything I'm going to describe this morning was, at the time it was built, the right answer. That's what makes it hard."

Then introduce yourself briefly and move. Do not spend more than 90 seconds before slide 3 — the hook is the question, not your resume.

TIMING CHECKPOINT: off this slide by 0:01.`);
  foot(s, true);
}

/* ---- 2. Who I am ---------------------------------------------------- */
{
  const s = slideLight();
  head(s, "WHO'S TALKING", "Why I'm the one telling you this", false, { eyebrowW: 2.5 });

  card(s, M, 2.4, 5.7, 4.2);
  s.addText([
    { text: "Kyle Sanders\n", options: { fontSize: 25, bold: true, color: INK, fontFace: HEAD, breakLine: true } },
    { text: "Business Development Manager\nSchneider Electric — Western U.S.\n\n", options: { fontSize: 19, color: MUTED, breakLine: true } },
    { text: "I spend my week with utilities and integrators talking about what happens to a control system after the ribbon-cutting.", options: { fontSize: 19, color: INK } },
  ], { x: M + 0.4, y: 2.78, w: 4.9, h: 3.7, fontFace: BODY, margin: 0, valign: "top" });

  card(s, M + 6.23, 2.4, 5.7, 4.2);
  s.addText("A disclosure, up front", {
    x: M + 6.63, y: 2.78, w: 4.95, h: 0.5, margin: 0,
    fontFace: HEAD, fontSize: 25, bold: true, color: TEAL,
  });
  s.addText("I work for one of the companies that built the problem I'm about to describe.\n\nSo does the vendor on your panel. This is not a talk about who to blame — it's a talk about an architecture all of us chose, and what it's now costing you.", {
    x: M + 6.63, y: 3.38, w: 4.95, h: 3.15, margin: 0,
    fontFace: BODY, fontSize: 19, color: INK, valign: "top", lineSpacing: 26,
  });
  s.addNotes(
`Keep this to 60-75 seconds. The left card is credentials; the right card is the real point.

Land the disclosure line deliberately and slow down on it: "I work for one of the companies that built the problem I'm about to describe."

That sentence buys you the next 40 minutes. It tells a room full of people who have been pitched at this conference for twenty years that this is not that. Do not undercut it with a joke.

TIMING CHECKPOINT: off this slide by 0:03.`);
  foot(s);
}

/* ---- 3. The hook ---------------------------------------------------- */
{
  const s = slideDark();
  s.addText("One question,", {
    x: M, y: 1.6, w: CW, h: 0.7, margin: 0,
    fontFace: BODY, fontSize: 26, color: TEAL_L,
  });
  s.addText("Who owns the control logic\nrunning your plant?", {
    x: M, y: 2.3, w: 11.6, h: 2.4, margin: 0,
    fontFace: HEAD, fontSize: 50, bold: true, color: PAPER, lineSpacing: 60,
  });
  s.addText("Not who wrote it. Not who paid for it. Who can move it.", {
    x: M, y: 5.0, w: 11.6, h: 0.7, margin: 0,
    fontFace: BODY, fontSize: 25, italic: true, color: GREEN,
  });
  s.addNotes(
`THE HOOK. Ask the question, then stop talking. Count to three. Let it sit.

Almost everyone in the room will answer "we do — we paid for it." The follow-up line on the slide is the trap door: "Not who wrote it. Not who paid for it. Who can MOVE it."

Optional show of hands: "How many of you could take the logic out of the controller in your headworks and run it on a different manufacturer's box next month?" Expect zero hands. Say "Right. Hold onto that — that's the whole talk."

TIMING CHECKPOINT: off this slide by 0:04.`);
  foot(s, true);
}

/* ---- 4. Agenda ------------------------------------------------------ */
{
  const s = slideLight();
  head(s, "WHERE WE'RE GOING", "Three acts, forty minutes", false, { eyebrowW: 3.1 });

  const acts = [
    ["I", "How we got here", "Three generations of automation — and the promise each one made"],
    ["II", "What it's costing you", "Four bills coming due at the same time"],
    ["III", "What actually changes", "Decoupling logic from hardware, and why \"open\" is the word that matters"],
  ];
  let y = 2.55;
  acts.forEach(([num, title, sub]) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y, w: 0.95, h: 0.95, rectRadius: 0.16,
      fill: { color: TEAL }, line: { color: TEAL, width: 1 },
    });
    s.addText(num, {
      x: M, y, w: 0.95, h: 0.95, align: "center", valign: "middle", margin: 0,
      fontFace: HEAD, fontSize: 30, bold: true, color: PAPER,
    });
    s.addText(title, {
      x: M + 1.35, y: y - 0.03, w: 10.4, h: 0.5, margin: 0,
      fontFace: HEAD, fontSize: 27, bold: true, color: INK,
    });
    s.addText(sub, {
      x: M + 1.35, y: y + 0.47, w: 10.4, h: 0.5, margin: 0,
      fontFace: BODY, fontSize: 19, color: MUTED,
    });
    y += 1.42;
  });
  s.addText("Then: what to do about it Monday morning.", {
    x: M, y: 6.55, w: BOTW, h: 0.5, margin: 0,
    fontFace: BODY, fontSize: 20, italic: true, color: TEAL,
  });
  s.addNotes(
`Move fast — 45 seconds. Agendas do not earn attention, they only orient.

The one thing worth saying out loud: "I'm going to spend the first half of this talk on history. Stay with me — the history IS the argument. If you don't see how we got here, the fix sounds like a product pitch."

TIMING CHECKPOINT: off this slide by 0:05.`);
  foot(s);
}

/* ---- 5. ACT I divider ----------------------------------------------- */
{
  const s = slideDark();
  chip(s, "ACT I", M, 2.35, 1.5, GREEN, NAVY);
  s.addText("How we got here", {
    x: M, y: 3.0, w: 11.6, h: 1.1, margin: 0,
    fontFace: HEAD, fontSize: 52, bold: true, color: PAPER,
  });
  s.addText("Every generation of automation solved the previous generation's problem —\nand quietly created the next one.", {
    x: M, y: 4.25, w: 11.0, h: 1.5, margin: 0,
    fontFace: BODY, fontSize: 23, color: TEAL_L, lineSpacing: 32,
  });
  s.addNotes(
`Transition line: "To understand where this is going, we have to be honest about where it came from. And it starts in a car factory, not a water plant."

TIMING CHECKPOINT: off this slide by 0:05:30.`);
  foot(s, true);
}

/* ---- 6. 1968 — the relay panel -------------------------------------- */
{
  const s = slideLight();
  head(s, "1968", "Before the PLC, logic was copper", false, { eyebrowW: 1.4 });

  s.addText("A machine's control logic wasn't written. It was wired — hundreds of electromechanical relays, hard-wired into a panel.", {
    x: M, y: 2.4, w: 6.5, h: 1.55, margin: 0,
    fontFace: BODY, fontSize: 20, color: INK, valign: "top", lineSpacing: 27,
  });
  s.addText([
    { text: "Change the process", options: { bold: true, color: INK } },
    { text: " and you didn't change a program. You sent electricians back into the panel to physically rewire it — for weeks.", options: { color: INK } },
  ], {
    x: M, y: 3.95, w: 6.5, h: 1.85, margin: 0,
    fontFace: BODY, fontSize: 21, valign: "top", lineSpacing: 28,
  });
  s.addText("General Motors was doing this every single model year, across every plant.", {
    x: M, y: 5.95, w: 6.5, h: 1.0, margin: 0,
    fontFace: BODY, fontSize: 20, italic: true, color: TEAL, valign: "top", lineSpacing: 28,
  });

  card(s, M + 7.0, 2.4, 4.93, 4.05);
  stat(s, M + 7.0, 2.85, 4.93, "Weeks", "of downtime to change what a\nmachine did — every time");
  s.addText("The logic and the wiring were the same physical object.", {
    x: M + 7.4, y: 5.15, w: 4.15, h: 1.15, align: "center", margin: 0,
    fontFace: BODY, fontSize: 18, color: INK, valign: "top", lineSpacing: 25,
  });
  s.addNotes(
`Paint the picture physically. A relay panel the size of the back wall of this room. Hundreds of relays. A schematic that only two people in the building can read.

The key idea to plant: logic and wiring were THE SAME PHYSICAL OBJECT. You could not change one without the other. Say that phrase — you'll call back to it three times.

TIMING CHECKPOINT: off this slide by 0:07.`);
  foot(s);
}

/* ---- 7. 1968 — the first decoupling --------------------------------- */
{
  const s = slideLight();
  head(s, "1968", "The PLC was an act of decoupling", false, { eyebrowW: 1.4 });

  card(s, M, 2.3, 5.7, 4.35);
  s.addText("GM Hydramatic wrote a spec", {
    x: M + 0.4, y: 2.65, w: 4.9, h: 0.55, margin: 0,
    fontFace: HEAD, fontSize: 24, bold: true, color: TEAL,
  });
  s.addText([
    { text: "Solid-state, not relays", options: { bullet: true, breakLine: true } },
    { text: "Reprogrammable without rewiring", options: { bullet: true, breakLine: true } },
    { text: "Modular and expandable", options: { bullet: true, breakLine: true } },
    { text: "Survives a factory floor", options: { bullet: true, breakLine: true } },
    { text: "Programmed the way electricians already think — ladder logic", options: { bullet: true } },
  ], {
    x: M + 0.45, y: 3.3, w: 4.9, h: 3.15, margin: 0,
    fontFace: BODY, fontSize: 19, color: INK, valign: "top", paraSpaceAfter: 9,
  });

  card(s, M + 6.23, 2.3, 5.7, 4.35);
  s.addText("Bedford Associates answered", {
    x: M + 6.63, y: 2.65, w: 4.9, h: 0.55, margin: 0,
    fontFace: HEAD, fontSize: 24, bold: true, color: TEAL,
  });
  s.addText([
    { text: "The Modicon 084", options: { fontSize: 26, bold: true, color: INK, breakLine: true } },
    { text: "Their 84th project. The company renamed itself after it.\n", options: { fontSize: 18, color: MUTED, breakLine: true } },
    { text: "The founding promise of the PLC:\n", options: { fontSize: 18, color: INK, breakLine: true } },
    { text: "change what the machine does without touching what the machine is.", options: { fontSize: 20, bold: true, color: TEAL } },
  ], {
    x: M + 6.68, y: 3.28, w: 4.9, h: 3.3, margin: 0,
    fontFace: BODY, valign: "top", lineSpacing: 24,
  });
  s.addNotes(
`This is the most important slide in Act I. Do not rush it.

The PLC was not invented to add features. It was invented to SEPARATE two things that had been welded together: what the machine does (logic) and how the machine is built (wiring).

Say it plainly: "The PLC was the first act of decoupling in our industry. That's the whole reason it exists. Hold that thought, because in about ten minutes I'm going to argue that we stopped doing it."

Detail worth one sentence: GM bought roughly a million dollars of them, which is what turned an 84th side project into an industry.

TIMING CHECKPOINT: off this slide by 0:09.`);
  foot(s);
}

/* ---- 8. 1975 — DCS -------------------------------------------------- */
{
  const s = slideLight();
  head(s, "1975", "Then control spread out across the plant", false, { eyebrowW: 1.4 });

  s.addText("The PLC solved the machine. It didn't solve the plant. Refineries needed hundreds of loops controlled together, and a single central computer was a single point of failure.", {
    x: M, y: 2.35, w: 11.5, h: 1.4, margin: 0,
    fontFace: BODY, fontSize: 22, color: INK, valign: "top", lineSpacing: 30,
  });

  const cols = [
    ["The distributed control system", "Honeywell's TDC 2000 and Yokogawa's CENTUM both landed in 1975. Control functions spread across modules — one failure no longer stopped everything."],
    ["What you bought was a system", "Controllers, I/O, operator stations, the network between them — engineered together, sold together, supported together. That was the value."],
    ["And that was the trade", "Integration you didn't have to build yourself, in exchange for a stack that only worked because one company controlled every layer of it."],
  ];
  let x = M;
  cols.forEach(([t, b], i) => {
    card(s, x, 3.85, 3.72, 3.05);
    s.addText(t, {
      x: x + 0.3, y: 4.08, w: 3.12, h: 0.78, margin: 0,
      fontFace: HEAD, fontSize: 20, bold: true, color: i === 2 ? GREEN : TEAL, valign: "top",
    });
    s.addText(b, {
      x: x + 0.3, y: 4.88, w: 3.12, h: 1.9, margin: 0,
      fontFace: BODY, fontSize: 16, color: INK, valign: "top", lineSpacing: 21,
    });
    x += 4.11;
  });
  s.addNotes(
`Move briskly — 90 seconds. This slide exists to set up the third card, which is the first appearance of the villain.

The trade: integration you didn't have to build, in exchange for a stack that only works because one company owns every layer.

Nobody was tricked here. That trade was a genuinely good deal in 1975. Say so — your credibility depends on the audience believing you're being fair.

TIMING CHECKPOINT: off this slide by 0:11.`);
  foot(s);
}

/* ---- 9. 1989 — SCADA ------------------------------------------------ */
{
  const s = slideLight();
  head(s, "1989", "Then we put a window on top of it", false, { eyebrowW: 1.4 });

  s.addText("Wonderware shipped InTouch — the first HMI built for Windows. For the first time, a supervisory layer sat on top of the control system, independent of it.", {
    x: M, y: 2.35, w: 7.1, h: 1.75, margin: 0,
    fontFace: BODY, fontSize: 22, color: INK, valign: "top", lineSpacing: 30,
  });
  s.addText([
    { text: "This is the layer most of you actually live in.", options: { bold: true, color: INK, breakLine: true } },
    { text: "Alarms. Trends. Historian. The monthly compliance report. Situational awareness across a system too big to walk.", options: { color: INK } },
  ], {
    x: M, y: 4.15, w: 7.1, h: 1.85, margin: 0,
    fontFace: BODY, fontSize: 19, valign: "top", lineSpacing: 26,
  });
  s.addText("It was, genuinely, a leap. And it is still doing that job in your plant today.", {
    x: M, y: 6.05, w: 7.1, h: 0.9, margin: 0,
    fontFace: BODY, fontSize: 19, italic: true, color: TEAL, valign: "top", lineSpacing: 26,
  });

  const lx = M + 7.65, lw = 4.28;
  const layers = [
    ["SUPERVISORY", "SCADA / HMI — 1989", GREEN, NAVY],
    ["CONTROL", "PLC / DCS — 1968, 1975", TEAL, PAPER],
    ["FIELD", "Pumps, valves, instruments", RED, PAPER],
  ];
  let ly = 2.5;
  layers.forEach(([lab, sub, fill, txt]) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: lx, y: ly, w: lw, h: 1.25, rectRadius: 0.12,
      fill: { color: fill }, line: { color: fill, width: 1 },
    });
    s.addText(lab, {
      x: lx + 0.3, y: ly + 0.18, w: lw - 0.6, h: 0.42, margin: 0,
      fontFace: BODY, fontSize: 17, bold: true, color: txt, charSpacing: 1.5,
    });
    s.addText(sub, {
      x: lx + 0.3, y: ly + 0.62, w: lw - 0.6, h: 0.42, margin: 0,
      fontFace: BODY, fontSize: 16, color: txt,
    });
    ly += 1.42;
  });
  s.addText("Three layers. Two vendors' worth of lock-in.", {
    x: lx, y: 6.35, w: lw, h: 0.6, align: "center", margin: 0,
    fontFace: BODY, fontSize: 16, italic: true, color: MUTED,
  });
  s.addNotes(
`Most of this room lives in the top layer, so this is where they recognize themselves. Acknowledge that — "this is probably the screen you were looking at yesterday."

Be generous about what SCADA solved. Visibility, alarming, trending, compliance reporting, running a system too geographically spread out to walk. Real problems, really solved.

Then the setup line for Act II, pointing at the diagram: "Look at what we built. Three layers. Each one solved a real problem. And each one came from a vendor who needed the layer below it to be theirs."

TIMING CHECKPOINT: off this slide by 0:13.`);
  foot(s);
}

/* ---- 10. The pattern ------------------------------------------------ */
{
  const s = slideDark();
  head(s, "THE PATTERN", "Sixty years, three promises", true, { eyebrowW: 2.6 });

  const eras = [
    ["1968", "The PLC", "\"Change the logic\nwithout rewiring\nthe panel.\""],
    ["1975", "The DCS", "\"Control the whole\nplant without one\npoint of failure.\""],
    ["1989", "SCADA", "\"See everything,\nfrom one screen,\nfrom anywhere.\""],
  ];
  let x = M;
  const eraAccent = [ [GREEN, NAVY], [TEAL, PAPER], [RED, PAPER] ];
  eras.forEach(([yr, name, promise], i) => {
    card(s, x, 2.5, 3.72, 3.15, true);
    chip(s, yr, x + 0.3, 2.78, 1.15, eraAccent[i][0], eraAccent[i][1]);
    s.addText(name, {
      x: x + 0.3, y: 3.35, w: 3.1, h: 0.5, margin: 0,
      fontFace: HEAD, fontSize: 25, bold: true, color: PAPER,
    });
    s.addText(promise, {
      x: x + 0.3, y: 3.92, w: 3.15, h: 1.5, margin: 0,
      fontFace: BODY, fontSize: 18, color: TEAL_L, valign: "top", lineSpacing: 25,
    });
    x += 4.11;
  });
  s.addText("Every one of those promises was kept. That is not the problem.", {
    x: M, y: 6.05, w: BOTW, h: 0.7, margin: 0,
    fontFace: BODY, fontSize: 24, italic: true, color: GREEN,
  });
  s.addNotes(
`Deliver the bottom line and then pause: "Every one of those promises was kept. That is not the problem."

This is the pivot of the whole talk. You have just spent eight minutes being fair to the technology — which means the room will let you turn now.

Transition: "The problem is what we DIDN'T do. There was a second seam nobody ever cut."

TIMING CHECKPOINT: off this slide by 0:14.`);
  foot(s, true);
}

/* ---- 11. ACT II divider --------------------------------------------- */
{
  const s = slideDark();
  chip(s, "ACT II", M, 2.35, 1.65, GREEN, NAVY);
  s.addText("The seam we never cut", {
    x: M, y: 3.0, w: 11.6, h: 1.1, margin: 0,
    fontFace: HEAD, fontSize: 52, bold: true, color: PAPER,
  });
  s.addText("The PLC separated logic from wiring. Nobody ever separated logic from the box.", {
    x: M, y: 4.3, w: 11.0, h: 1.4, margin: 0,
    fontFace: BODY, fontSize: 23, color: TEAL_L, lineSpacing: 32,
  });
  s.addNotes(`Short beat. Say the subtitle out loud — it's the thesis sentence of the talk.

TIMING CHECKPOINT: off this slide by 0:14:30.`);
  foot(s, true);
}

/* ---- 12. The villain ------------------------------------------------ */
{
  const s = slideLight();
  head(s, "THE VILLAIN", "Your control logic has a serial number", false, { eyebrowW: 2.5 });

  s.addText("The logic that runs your plant is compiled for one manufacturer's controller, spoken over that manufacturer's protocol, and edited in that manufacturer's software.", {
    x: M, y: 2.35, w: 11.5, h: 1.4, margin: 0,
    fontFace: BODY, fontSize: 23, color: INK, valign: "top", lineSpacing: 31,
  });
  s.addText("Move any one of those three and the logic doesn't travel. It gets rewritten.", {
    x: M, y: 3.85, w: 11.5, h: 0.85, margin: 0,
    fontFace: BODY, fontSize: 23, bold: true, color: INK, valign: "top",
  });

  card(s, M, 4.85, 5.7, 2.25);
  s.addText([
    { text: "You own it on paper.\n", options: { bold: true, color: INK, breakLine: true } },
    { text: "It's in your capital budget, your as-builts, your O&M manual.", options: { color: MUTED } },
  ], {
    x: M + 0.4, y: 5.1, w: 4.95, h: 1.9, margin: 0,
    fontFace: BODY, fontSize: 18, valign: "top", lineSpacing: 26,
  });

  card(s, M + 6.23, 4.85, 5.7, 2.25);
  s.addText([
    { text: "You don't own it in practice.\n", options: { bold: true, color: GREEN, breakLine: true } },
    { text: "You can't move it, price it against an alternative, or outlive the hardware it was written for.", options: { color: INK } },
  ], {
    x: M + 6.63, y: 5.1, w: 4.95, h: 1.9, margin: 0,
    fontFace: BODY, fontSize: 18, valign: "top", lineSpacing: 26,
  });
  s.addNotes(
`The villain reveal. Deliver the title line as a flat statement of fact, not an accusation: "Your control logic has a serial number."

Concrete example that lands with this audience: a pump station sequence — the interlocks, the lead-lag rotation, the alarm logic. It's yours; a utility engineer or an integrator you paid wrote it. But it lives inside a part number. When that part number goes end-of-support, the logic doesn't move. It gets re-engineered, re-tested, re-commissioned. You pay for the same thinking twice.

Callback: "Remember the relay panel? Logic and wiring were the same physical object. We fixed that in 1968. But logic and HARDWARE are still the same object — we just made the object smaller and put a vendor's name on it."

TIMING CHECKPOINT: off this slide by 0:17.`);
  foot(s);
}

/* ---- 13. Why (the honest part) -------------------------------------- */
{
  const s = slideDark();
  head(s, "WHY IT HAPPENED", "Nobody set out to trap you", true, { eyebrowW: 3.1 });

  const rows = [
    ["There were no standards to use.", "In 1975 there was no Ethernet on a plant floor, no OPC, no common runtime. If you wanted controllers to talk, you invented the protocol yourself."],
    ["Proprietary was the engineering answer.", "Owning every layer was how you guaranteed determinism, timing, and support. It made the system work — and it made it supportable."],
    ["And then it became the business model.", "Once the stack only worked end-to-end, the next controller, the next license, and the next migration were all decided by the vendor's calendar, not yours."],
  ];
  let y = 2.35;
  const badgeAccent = [TEAL, RED, GREEN];
  rows.forEach(([t, b], i) => {
    const bc = badgeAccent[i];
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y: y + 0.05, w: 0.62, h: 0.62, rectRadius: 0.12,
      fill: { color: bc }, line: { color: bc, width: 1 },
    });
    s.addText(String(i + 1), {
      x: M, y: y + 0.05, w: 0.62, h: 0.62, align: "center", valign: "middle", margin: 0,
      fontFace: HEAD, fontSize: 22, bold: true, color: i === 0 ? NAVY : PAPER,
    });
    s.addText(t, {
      x: M + 1.0, y, w: 10.6, h: 0.5, margin: 0,
      fontFace: HEAD, fontSize: 24, bold: true, color: bc,
    });
    s.addText(b, {
      x: M + 1.0, y: y + 0.52, w: 10.6, h: 0.95, margin: 0,
      fontFace: BODY, fontSize: 18, color: TEAL_L, valign: "top", lineSpacing: 24,
    });
    y += 1.45;
  });
  s.addText("Schneider Electric. Rockwell. Siemens. Emerson. Honeywell. All of us. Including us.", {
    x: M, y: 6.8, w: BOTW, h: 0.6, margin: 0,
    fontFace: BODY, fontSize: 18, italic: true, color: PAPER,
  });
  s.addNotes(
`This is the slide that separates you from every vendor talk this audience has sat through. Do not soften it and do not over-apologize — state it and move.

The arc is 1 → 2 → 3: a real constraint became a real engineering answer became a business model. Nobody woke up in 1975 and decided to trap a water utility in 2026. It just compounded.

Read the bottom line naming your own company last and slowest: "...All of us. Including us."

Then transition hard into consequences: "So here's the bill."

TIMING CHECKPOINT: off this slide by 0:19.`);
  foot(s, true);
}

/* ---- 14. Four bills — overview -------------------------------------- */
{
  const s = slideLight();
  head(s, "THE BILL", "Four things are coming due at once", false, { eyebrowW: 1.9 });

  const bills = [
    ["Lifecycle", "A chip goes end-of-support and a maintenance decision becomes a capital project."],
    ["Cybersecurity", "Systems designed before the threat model existed, in a sector now being targeted."],
    ["Data & AI", "The data exists. It's stranded behind a protocol built to talk to one screen."],
    ["Workforce", "The people who can read your ladder logic are retiring. Their replacements are IT-native."],
  ];
  const px = [M, M + 6.13], py = [2.4, 4.6];
  bills.forEach(([t, b], i) => {
    const x = px[i % 2], y = py[Math.floor(i / 2)];
    card(s, x, y, 5.8, 1.95);
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.35, y: y + 0.38, w: 0.6, h: 0.6, rectRadius: 0.3,
      fill: { color: GREEN }, line: { color: GREEN, width: 1 },
    });
    s.addText(String(i + 1), {
      x: x + 0.35, y: y + 0.38, w: 0.6, h: 0.6, align: "center", valign: "middle", margin: 0,
      fontFace: HEAD, fontSize: 21, bold: true, color: NAVY,
    });
    s.addText(t, {
      x: x + 1.15, y: y + 0.32, w: 4.3, h: 0.5, margin: 0,
      fontFace: HEAD, fontSize: 24, bold: true, color: TEAL,
    });
    s.addText(b, {
      x: x + 1.15, y: y + 0.88, w: 4.35, h: 0.95, margin: 0,
      fontFace: BODY, fontSize: 17, color: INK, valign: "top", lineSpacing: 22,
    });
  });
  s.addText("Any one of these is survivable. They are arriving together.", {
    x: M, y: 6.75, w: BOTW, h: 0.5, margin: 0,
    fontFace: BODY, fontSize: 20, italic: true, color: GREEN,
  });
  s.addNotes(
`Roadmap slide — 45 seconds, don't explain all four here. Just name them and land the closing line.

"Any one of these your utility could absorb. The reason this conversation is happening in 2026 and not 2016 is that all four are arriving in the same budget cycle."

TIMING CHECKPOINT: off this slide by 0:20.`);
  foot(s);
}

/* ---- 15. Bill 1 — lifecycle ----------------------------------------- */
{
  const s = slideLight();
  head(s, "BILL ONE", "Lifecycle: someone else owns your calendar", false, { eyebrowW: 2.1 });

  s.addText("A processor goes end-of-support. Nothing about your process changed. Nothing about your logic changed. But the logic can only run on that processor —", {
    x: M, y: 2.35, w: 7.0, h: 1.7, margin: 0,
    fontFace: BODY, fontSize: 21, color: INK, valign: "top", lineSpacing: 29,
  });
  s.addText("— so a component decision becomes a capital project, on a schedule you didn't set.", {
    x: M, y: 4.15, w: 7.0, h: 1.0, margin: 0,
    fontFace: BODY, fontSize: 21, bold: true, color: INK, valign: "top", lineSpacing: 29,
  });
  s.addText([
    { text: "And the second cost is worse: ", options: { color: INK } },
    { text: "every migration re-engineers logic that was already correct.", options: { bold: true, color: GREEN } },
    { text: " You pay twice for the same thinking, and you re-introduce risk into a plant that was running fine.", options: { color: INK } },
  ], {
    x: M, y: 5.25, w: 7.0, h: 1.55, margin: 0,
    fontFace: BODY, fontSize: 17, valign: "top", lineSpacing: 22,
  });

  card(s, M + 7.55, 2.35, 4.38, 4.3);
  s.addText("Typical water/wastewater\ncontrol system in service", {
    x: M + 7.85, y: 2.6, w: 3.78, h: 0.95, align: "center", margin: 0,
    fontFace: BODY, fontSize: 17, color: MUTED, valign: "top", lineSpacing: 23,
  });
  s.addText("25–35", {
    x: M + 7.85, y: 3.6, w: 3.78, h: 1.1, align: "center", valign: "middle", margin: 0,
    fontFace: HEAD, fontSize: 66, bold: true, color: TEAL,
  });
  s.addText("years", {
    x: M + 7.85, y: 4.68, w: 3.78, h: 0.45, align: "center", margin: 0,
    fontFace: BODY, fontSize: 22, color: TEAL,
  });
  s.addText("Hardware generations that logic has now outlived: three or four.", {
    x: M + 7.85, y: 5.3, w: 3.78, h: 1.2, align: "center", margin: 0,
    fontFace: BODY, fontSize: 16, italic: true, color: INK, valign: "top", lineSpacing: 21,
  });
  s.addText("Source: Frost & Sullivan, Modernising Water and Wastewater Operations, 2025", {
    x: M, y: 6.95, w: BOTW, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, color: MUTED,
  });
  s.addNotes(
`Ask the room: "How many of you have a system in service today that's older than the person who maintains it?" Hands will go up. That IS the point.

The 25-35 year figure is from the Frost & Sullivan paper — it's a sector-typical range, not a claim about any one utility.

The line to land: "You pay twice for the same thinking." A utility funded that logic once. Every forced migration makes them fund it again — and re-validating logic in a live plant is where risk actually lives.

TIMING CHECKPOINT: off this slide by 0:22.`);
  foot(s);
}

/* ---- 16. Bill 2 — cyber --------------------------------------------- */
{
  const s = slideLight();
  head(s, "BILL TWO", "Cybersecurity: built before the threat existed", false,
       { eyebrowW: 2.2, titleSize: 34, titleH: 1.15 });

  s.addText("These systems were designed for a world where the threat was a lightning strike, not a nation-state. Now water is a named target.", {
    x: M, y: 2.4, w: 11.5, h: 1.05, margin: 0,
    fontFace: BODY, fontSize: 22, color: INK, valign: "top", lineSpacing: 29,
  });

  card(s, M, 3.55, 5.7, 2.4);
  s.addText("Aliquippa, PA — Nov 2023", {
    x: M + 0.4, y: 3.8, w: 4.95, h: 0.45, margin: 0,
    fontFace: HEAD, fontSize: 22, bold: true, color: TEAL,
  });
  s.addText("A booster station PLC reached over the internet with a default password. Crews caught it on alarm and went to manual. That was the whole defense.", {
    x: M + 0.4, y: 4.32, w: 4.95, h: 1.5, margin: 0,
    fontFace: BODY, fontSize: 18, color: INK, valign: "top", lineSpacing: 24,
  });

  card(s, M + 6.23, 3.55, 5.7, 2.4);
  s.addText("70%+", {
    x: M + 6.63, y: 3.72, w: 4.95, h: 0.85, margin: 0,
    fontFace: HEAD, fontSize: 46, bold: true, color: GREEN,
  });
  s.addText("of drinking-water systems EPA inspected were out of compliance with Safe Drinking Water Act §1433 cybersecurity requirements.", {
    x: M + 6.63, y: 4.58, w: 4.95, h: 1.3, margin: 0,
    fontFace: BODY, fontSize: 17, color: INK, valign: "top", lineSpacing: 23,
  });

  s.addText("The architectural problem: you can't patch what you can't take offline — and you can't take it offline when there's no way to test the change first.", {
    x: M, y: 6.1, w: 11.5, h: 0.9, margin: 0,
    fontFace: BODY, fontSize: 20, bold: true, color: INK, valign: "top", lineSpacing: 27,
  });
  s.addText("Sources: EPA Enforcement Alert, May 2024; Municipal Water Authority of Aliquippa incident, Nov 2023 (CISA / WaterISAC)", {
    x: M, y: 7.05, w: BOTW, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, color: MUTED,
  });
  s.addNotes(
`Be careful and factual here — this room includes people who have lived through an incident and they will know if you exaggerate.

Aliquippa is the right example precisely because it was UNSOPHISTICATED: internet-exposed controller, default credentials. No zero-day. The failure was architectural, not clever.

Deliberately skip Oldsmar — it was later attributed to operator error, and citing it costs you credibility with anyone who followed the story.

The line that matters is the last one, and it's the bridge to Act III: you can't patch what you can't take offline, and you can't take it offline when there's no way to test the change first. Nobody in this room is reckless — they're stuck. Say that.

TIMING CHECKPOINT: off this slide by 0:24.`);
  foot(s);
}

/* ---- 17. Bill 3 — data ---------------------------------------------- */
{
  const s = slideLight();
  head(s, "BILL THREE", "Data & AI: it's not missing, it's stranded", false, { eyebrowW: 2.6 });

  s.addText("Every conversation about AI in water skips the boring part. Predictive maintenance, anomaly detection, optimization — none of it is a modeling problem first. It's an access problem.", {
    x: M, y: 2.35, w: 6.9, h: 1.75, margin: 0,
    fontFace: BODY, fontSize: 21, color: INK, valign: "top", lineSpacing: 29,
  });
  s.addText("Your plant already generates the data. It's sitting inside a controller, in a proprietary format, behind a protocol designed in 1985 to talk to exactly one screen.", {
    x: M, y: 4.2, w: 6.9, h: 1.7, margin: 0,
    fontFace: BODY, fontSize: 21, color: INK, valign: "top", lineSpacing: 29,
  });
  s.addText("There is no AI strategy that survives contact with a system that can't hand over its own data.", {
    x: M, y: 5.95, w: 6.9, h: 1.15, margin: 0,
    fontFace: BODY, fontSize: 20, italic: true, bold: true, color: GREEN, valign: "top", lineSpacing: 27,
  });

  card(s, M + 7.45, 2.35, 4.48, 4.35);
  s.addText("What that looked like in\nConroe, Texas — before", {
    x: M + 7.75, y: 2.58, w: 3.88, h: 0.95, align: "center", margin: 0,
    fontFace: BODY, fontSize: 17, color: MUTED, valign: "top", lineSpacing: 23,
  });
  s.addText("5 hours", {
    x: M + 7.75, y: 3.55, w: 3.88, h: 1.0, align: "center", valign: "middle", margin: 0,
    fontFace: HEAD, fontSize: 52, bold: true, color: TEAL,
  });
  s.addText("every day", {
    x: M + 7.75, y: 4.55, w: 3.88, h: 0.45, align: "center", margin: 0,
    fontFace: BODY, fontSize: 22, color: TEAL,
  });
  s.addText("of staff time spent collecting, by hand, data the plant had already produced.", {
    x: M + 7.75, y: 5.15, w: 3.88, h: 1.35, align: "center", margin: 0,
    fontFace: BODY, fontSize: 17, color: INK, valign: "top", lineSpacing: 23,
  });
  s.addNotes(
`Do not get technical about AI — you don't need to and this audience doesn't want it.

The single reframe: AI in water is not a modeling problem, it's an access problem. Every utility already generates the data. It's stranded.

Conroe's five-hours-a-day is the perfect proof because it's not exotic — it's somebody with a clipboard and a spreadsheet, which is happening in half the plants represented in this room. Set up Conroe here so the results slide later lands as a payoff, not a new story.

TIMING CHECKPOINT: off this slide by 0:26.`);
  foot(s);
}

/* ---- 18. Bill 4 — workforce ----------------------------------------- */
{
  const s = slideLight();
  head(s, "BILL FOUR", "Workforce: the logic is in someone's head", false, { eyebrowW: 2.5 });

  s.addText("The person who knows why that interlock is there didn't document it. They remember it. And they are retiring.", {
    x: M, y: 2.32, w: 11.5, h: 1.1, margin: 0,
    fontFace: BODY, fontSize: 22, color: INK, valign: "top", lineSpacing: 29,
  });

  stat(s, M, 3.5, 3.72, "21%", "of utility employees eligible to\nretire within five years");
  stat(s, M + 4.11, 3.5, 3.72, "9%", "average vacancy rate — before\nthose retirements land", false, GREEN);
  stat(s, M + 8.21, 3.5, 3.72, "~10k", "operator openings per year\nthrough 2034, nationally");

  s.addText("Meanwhile, the engineers you can actually hire grew up with version control, containers, and Python — not with a proprietary IDE and a ladder-logic printout in a binder.", {
    x: M, y: 5.8, w: 11.5, h: 1.15, margin: 0,
    fontFace: BODY, fontSize: 20, bold: true, color: INK, valign: "top", lineSpacing: 27,
  });
  s.addText("Sources: AWWA 2025 Utility Benchmarking Survey; U.S. Bureau of Labor Statistics projections through 2034", {
    x: M, y: 7.05, w: BOTW, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, color: MUTED,
  });
  s.addNotes(
`This is the bill that gets the most head-nodding — lead with the human line, not the numbers: "The person who knows WHY that interlock is there didn't document it. They remember it."

Then the numbers, quickly. 21% eligible in five years against a 9% vacancy rate is the one to emphasize — the hole is already there before the retirements.

Close on the mismatch: you cannot hire your way out of this with people who want to learn a proprietary IDE from 1994. The talent you can actually recruit expects the tools they already know.

TIMING CHECKPOINT: off this slide by 0:28.`);
  foot(s);
}

/* ---- 19. Audience beat ---------------------------------------------- */
{
  const s = slideDark();
  chip(s, "A QUESTION FOR YOU", M, 1.5, 3.6, GREEN, NAVY);
  s.addText("If your control logic could outlive\nthree generations of hardware —", {
    x: M, y: 2.35, w: 11.6, h: 1.8, margin: 0,
    fontFace: HEAD, fontSize: 40, bold: true, color: PAPER, lineSpacing: 50,
  });
  s.addText("what would change about how you plan a capital project?", {
    x: M, y: 4.35, w: 11.6, h: 1.45, margin: 0,
    fontFace: HEAD, fontSize: 40, bold: true, color: GREEN, lineSpacing: 50,
  });
  s.addText("Hold that. We'll come back to it.", {
    x: M, y: 6.0, w: 11.6, h: 0.6, margin: 0,
    fontFace: BODY, fontSize: 22, italic: true, color: TEAL_L,
  });
  s.addNotes(
`ASK IT AND STOP. Real silence — five full seconds. It will feel long to you and normal to them.

If someone answers, take it. If nobody does, say: "Nobody plans a twenty-year project around a controller with a seven-year support window. But that's exactly what we all do."

This is the emotional hinge of the talk — the room has been absorbing bad news for ten minutes and needs to be handed agency before you offer a solution. Do not skip it for time; cut a proof slide in Act III instead.

TIMING CHECKPOINT: off this slide by 0:29.`);
  foot(s, true);
}

/* ---- 20. ACT III divider -------------------------------------------- */
{
  const s = slideDark();
  chip(s, "ACT III", M, 2.35, 1.8, GREEN, NAVY);
  s.addText("What actually changes", {
    x: M, y: 3.0, w: 11.6, h: 1.1, margin: 0,
    fontFace: HEAD, fontSize: 52, bold: true, color: PAPER,
  });
  s.addText("Software-defined automation is the third act of a story that started in 1968.\nIt finishes the job the PLC started.", {
    x: M, y: 4.3, w: 11.2, h: 1.5, margin: 0,
    fontFace: BODY, fontSize: 23, color: TEAL_L, lineSpacing: 32,
  });
  s.addNotes(`Transition energy shifts here — you've been diagnosing for fifteen minutes, now you're building. Pick the pace up.

"This isn't a new idea. It's the OLD idea, finished."

TIMING CHECKPOINT: off this slide by 0:29:30.`);
  foot(s, true);
}

/* ---- 21. The core idea ---------------------------------------------- */
{
  const s = slideLight();
  head(s, "THE IDEA", "Cut the seam between logic and hardware", false, { eyebrowW: 1.8 });

  card(s, M, 2.4, 5.7, 4.0);
  chip(s, "TODAY", M + 0.4, 2.72, 1.5, RED, PAPER);
  s.addText("The logic lives inside the controller.", {
    x: M + 0.4, y: 3.4, w: 4.95, h: 0.95, margin: 0,
    fontFace: HEAD, fontSize: 24, bold: true, color: INK, valign: "top", lineSpacing: 32,
  });
  s.addText("Replace the controller and you rewrite the logic. Change vendors and you start over. The hardware decision is the software decision.", {
    x: M + 0.4, y: 4.45, w: 4.95, h: 1.85, margin: 0,
    fontFace: BODY, fontSize: 19, color: INK, valign: "top", lineSpacing: 26,
  });

  card(s, M + 6.23, 2.4, 5.7, 4.0);
  chip(s, "SOFTWARE-DEFINED", M + 6.63, 2.72, 3.2, TEAL, PAPER);
  s.addText("The logic is a portable application.", {
    x: M + 6.63, y: 3.4, w: 4.95, h: 0.95, margin: 0,
    fontFace: HEAD, fontSize: 24, bold: true, color: TEAL, valign: "top", lineSpacing: 32,
  });
  s.addText("It runs on the hardware you choose, and it keeps running when you choose different hardware. The two decisions come apart.", {
    x: M + 6.63, y: 4.45, w: 4.95, h: 1.85, margin: 0,
    fontFace: BODY, fontSize: 19, color: INK, valign: "top", lineSpacing: 26,
  });

  s.addText("That's it. That's the whole technical idea in this talk.", {
    x: M, y: 6.65, w: BOTW, h: 0.5, margin: 0,
    fontFace: BODY, fontSize: 20, italic: true, color: GREEN,
  });
  s.addNotes(
`Resist every urge to add technical detail here. Containers, runtimes, virtualization — none of it belongs on this slide. If someone wants that, it's a Q&A conversation.

The one sentence: "Today the hardware decision IS the software decision. Software-defined automation pulls those two apart."

Then say the bottom line to give the room permission to relax: "That's it. That's the whole technical idea in this talk." It signals you're not going to bury them, and it's true.

TIMING CHECKPOINT: off this slide by 0:31.`);
  foot(s);
}

/* ---- 22. CarPlay analogy -------------------------------------------- */
{
  const s = slideLight();
  head(s, "WHAT IT FEELS LIKE", "You already live this way", false, { eyebrowW: 3.2 });

  s.addText("You get in a rental car you've never driven. You plug in your phone. Your maps, your music, your contacts, your layout — on somebody else's dashboard, instantly.", {
    x: M, y: 2.35, w: 11.5, h: 1.35, margin: 0,
    fontFace: BODY, fontSize: 22, color: INK, valign: "top", lineSpacing: 30,
  });
  s.addText("Nobody re-teaches the car. The experience is yours; the hardware is rented.", {
    x: M, y: 3.75, w: 11.5, h: 0.8, margin: 0,
    fontFace: BODY, fontSize: 22, bold: true, color: INK, valign: "top",
  });

  card(s, M, 4.65, 5.7, 2.3);
  s.addText([
    { text: "Before CarPlay\n", options: { bold: true, color: MUTED, breakLine: true } },
    { text: "Your navigation was a feature of the car. Buy a different car, learn a different system, lose your saved places.", options: { color: INK } },
  ], {
    x: M + 0.4, y: 4.9, w: 4.95, h: 2.0, margin: 0,
    fontFace: BODY, fontSize: 18, valign: "top", lineSpacing: 24,
  });

  card(s, M + 6.23, 4.65, 5.7, 2.3);
  s.addText([
    { text: "Your plant, today\n", options: { bold: true, color: GREEN, breakLine: true } },
    { text: "Your control logic is a feature of the controller. Buy a different controller, rebuild the logic, retrain the staff.", options: { color: INK } },
  ], {
    x: M + 6.63, y: 4.9, w: 4.95, h: 2.0, margin: 0,
    fontFace: BODY, fontSize: 18, valign: "top", lineSpacing: 24,
  });
  s.addNotes(
`Tell this as a story in second person, not as an analogy announcement. "You land in Phoenix, you get the rental, you've never sat in this car before..."

Let the room arrive at the parallel a beat before you state it. That's what makes an analogy work — the audience feels smart instead of lectured.

Then the turn: "Your control logic is a feature of the controller. Same relationship. Nobody would accept it in a rental car."

TIMING CHECKPOINT: off this slide by 0:32:30.`);
  foot(s);
}

/* ---- 23. Number portability ----------------------------------------- */
{
  const s = slideDark();
  head(s, "WHY IT MATTERS", "A better analogy — this one's about ownership", true,
       { eyebrowW: 3.0, titleSize: 34, titleH: 1.15 });

  s.addText("Before 1996, your phone number belonged to your carrier. Switching meant giving it up — so almost nobody switched. Not because the service was good.", {
    x: M, y: 2.5, w: 11.4, h: 1.3, margin: 0,
    fontFace: BODY, fontSize: 22, color: TEAL_L, valign: "top", lineSpacing: 30,
  });
  s.addText("Number portability didn't invent a single new phone. It moved one asset — the number — from the carrier's balance sheet to yours.", {
    x: M, y: 3.9, w: 11.4, h: 1.3, margin: 0,
    fontFace: BODY, fontSize: 22, color: PAPER, valign: "top", lineSpacing: 30,
  });
  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 5.3, w: 11.93, h: 1.75, rectRadius: 0.14,
    fill: { color: NAVY_2 }, line: { color: NAVY_2, width: 1 },
  });
  s.addText("Software-defined automation does that for control logic. Same plant, same pumps, same people — the thing that changes hands is who owns the application.", {
    x: M + 0.45, y: 5.55, w: 11.0, h: 1.35, margin: 0,
    fontFace: BODY, fontSize: 22, bold: true, color: GREEN, valign: "top", lineSpacing: 30,
  });
  s.addNotes(
`This is the analogy that will stay with them after lunch — CarPlay explains the feeling, portability explains the STAKE.

Land the middle line hard: portability didn't invent a new phone. It moved an asset from the carrier's balance sheet to the customer's. Overnight, carriers had to compete on service instead of on hostage-taking.

Optional aside if the room is with you: "Notice what happened to phone plan pricing after 1996." Small laugh, real point.

TIMING CHECKPOINT: off this slide by 0:34.`);
  foot(s, true);
}

/* ---- 24. What it unlocks -------------------------------------------- */
{
  const s = slideLight();
  head(s, "IN PRACTICE", "What that buys an operations team", false, { eyebrowW: 2.2 });

  const items = [
    ["Test before you touch", "Run the logic against a simulated plant on a laptop. Prove the change works before it goes near a live process."],
    ["Recover by redeploy", "A failed node isn't a hunt for a discontinued card. The application redeploys onto working hardware."],
    ["Write once, deploy everywhere", "One lift-station sequence, written once, deployed to forty sites instead of re-engineered forty times."],
    ["Get data out without a new box", "Data access stops being a bolt-on middleware project and becomes part of the control application itself."],
  ];
  const px = [M, M + 6.13], py = [2.4, 4.55];
  items.forEach(([t, b], i) => {
    const x = px[i % 2], y = py[Math.floor(i / 2)];
    card(s, x, y, 5.8, 1.95);
    s.addText(t, {
      x: x + 0.4, y: y + 0.24, w: 5.05, h: 0.55, margin: 0,
      fontFace: HEAD, fontSize: 20, bold: true, color: TEAL,
    });
    s.addText(b, {
      x: x + 0.4, y: y + 0.82, w: 5.05, h: 1.05, margin: 0,
      fontFace: BODY, fontSize: 17, color: INK, valign: "top", lineSpacing: 22,
    });
  });
  s.addText("Notice none of these are features. They're all consequences of one decision.", {
    x: M, y: 6.7, w: BOTW, h: 0.5, margin: 0,
    fontFace: BODY, fontSize: 20, italic: true, color: GREEN,
  });
  s.addNotes(
`Keep every one of these in operator language. No product names, no acronyms.

"Test before you touch" is the one that answers the cybersecurity slide — this is why patching becomes possible. Make that connection explicitly: "Remember 'you can't patch what you can't take offline'? This is the answer to that."

"Standardize once" is the one that answers the workforce slide.

Bottom line: these aren't features somebody added. They all fall out of the single decision to separate logic from hardware.

TIMING CHECKPOINT: off this slide by 0:36.`);
  foot(s);
}

/* ---- 25. Software-defined vs OPEN ----------------------------------- */
{
  const s = slideDark();
  head(s, "THE FINE PRINT", "\"Software-defined\" is not the same as \"open\"", true,
       { eyebrowW: 2.7, titleSize: 34, titleH: 1.15 });

  s.addText("This is the question to ask every vendor who shows up at your plant with this pitch — including mine.", {
    x: M, y: 2.4, w: 11.5, h: 0.8, margin: 0,
    fontFace: BODY, fontSize: 21, color: TEAL_L, valign: "top",
  });

  card(s, M, 3.25, 5.7, 3.25, true);
  s.addText("Software-defined", {
    x: M + 0.4, y: 3.5, w: 4.95, h: 0.5, margin: 0,
    fontFace: HEAD, fontSize: 25, bold: true, color: TEAL,
  });
  s.addText("The vendor's stack, virtualized. It runs in a container now — but it's still their runtime, their tools, their hardware roadmap.", {
    x: M + 0.4, y: 4.08, w: 4.95, h: 1.55, margin: 0,
    fontFace: BODY, fontSize: 18, color: TEAL_L, valign: "top", lineSpacing: 24,
  });
  s.addText("You changed where the lock-in lives. You didn't remove it.", {
    x: M + 0.4, y: 5.65, w: 4.95, h: 0.75, margin: 0,
    fontFace: BODY, fontSize: 18, bold: true, italic: true, color: RED, valign: "top", lineSpacing: 24,
  });

  card(s, M + 6.23, 3.25, 5.7, 3.25, true);
  s.addText("Open software-defined", {
    x: M + 6.63, y: 3.5, w: 4.95, h: 0.5, margin: 0,
    fontFace: HEAD, fontSize: 25, bold: true, color: GREEN,
  });
  s.addText("A shared runtime any vendor can implement, built on a public standard. Your application is portable across manufacturers.", {
    x: M + 6.63, y: 4.08, w: 4.95, h: 1.55, margin: 0,
    fontFace: BODY, fontSize: 18, color: TEAL_L, valign: "top", lineSpacing: 24,
  });
  s.addText("The lock-in is actually gone — including ours.", {
    x: M + 6.63, y: 5.65, w: 4.95, h: 0.75, margin: 0,
    fontFace: BODY, fontSize: 18, bold: true, italic: true, color: GREEN, valign: "top", lineSpacing: 24,
  });
  s.addNotes(
`The most valuable ninety seconds in the talk for this audience. It is also the slide that proves you meant the disclosure on slide 2.

"Software-defined" is going to be on every booth banner within two years, and most of it will mean "our same proprietary stack, in a VM." That moves the lock-in. It doesn't remove it.

Say clearly: "Ask this of every vendor who shows up — including mine. If the answer is 'it's portable across our portfolio,' that's not open. That's the same deal in a container."

Giving the room a weapon they can use against your own employer is exactly why they'll believe the last five minutes.

TIMING CHECKPOINT: off this slide by 0:37:30.`);
  foot(s, true);
}

/* ---- 26. What open means concretely --------------------------------- */
{
  const s = slideLight();
  head(s, "OPEN, SPECIFICALLY", "There is an actual standard behind this", false, { eyebrowW: 3.1 });

  card(s, M, 2.4, 5.7, 2.25);
  s.addText("IEC 61499", {
    x: M + 0.4, y: 2.62, w: 4.95, h: 0.5, margin: 0,
    fontFace: HEAD, fontSize: 26, bold: true, color: TEAL,
  });
  s.addText("An international standard for portable, distributed control applications — the successor thinking to the IEC 61131-3 languages you already use.", {
    x: M + 0.4, y: 3.2, w: 4.95, h: 1.3, margin: 0,
    fontFace: BODY, fontSize: 17, color: INK, valign: "top", lineSpacing: 22,
  });

  card(s, M + 6.23, 2.4, 5.7, 2.25);
  s.addText("UniversalAutomation.org", {
    x: M + 6.63, y: 2.62, w: 4.95, h: 0.5, margin: 0,
    fontFace: HEAD, fontSize: 26, bold: true, color: TEAL,
  });
  s.addText("A non-profit, founded November 2021, that stewards a shared implementation of that runtime. Any vendor can license and ship it.", {
    x: M + 6.63, y: 3.2, w: 4.95, h: 1.3, margin: 0,
    fontFace: BODY, fontSize: 17, color: INK, valign: "top", lineSpacing: 22,
  });

  s.addText("Who's actually in it", {
    x: M, y: 4.85, w: 11.5, h: 0.45, margin: 0,
    fontFace: HEAD, fontSize: 24, bold: true, color: INK,
  });
  s.addText("90+ members. Board seats held by ExxonMobil, Yokogawa, Intel, Kongsberg Maritime, Novo Nordisk, Schneider Electric and others — end users and competitors sitting at the same table.", {
    x: M, y: 5.35, w: 11.5, h: 1.2, margin: 0,
    fontFace: BODY, fontSize: 20, color: INK, valign: "top", lineSpacing: 27,
  });
  s.addText("That matters more than any vendor's roadmap: when the buyers write the standard, portability stops being a favor.", {
    x: M, y: 6.6, w: BOTW, h: 0.72, margin: 0,
    fontFace: BODY, fontSize: 19, italic: true, color: GREEN, valign: "top",
  });
  s.addNotes(
`Keep this factual and fast — it's the evidence slide, not a persuasion slide. 75 seconds.

The detail that carries weight with a utility audience isn't the standard number, it's WHO is on the board. ExxonMobil is there as a buyer who got tired of the same problem and organized about it. Novo Nordisk likewise. These are end users, not vendors.

The takeaway line: when the buyers write the standard, portability stops being a favor the vendor grants you.

If someone asks about the Open Process Automation Forum / ExxonMobil's O-PAS work — same movement, process-industry origin, worth acknowledging as a fellow traveler.

TIMING CHECKPOINT: off this slide by 0:39.`);
  foot(s);
}

/* ---- 27. Conroe ------------------------------------------------------ */
{
  const s = slideDark();
  head(s, "PROOF", "Conroe, Texas — 19 facilities", true, { eyebrowW: 1.6 });

  s.addText("A fast-growing city north of Houston, modernizing water and wastewater across a $50 million infrastructure program — with open software-defined automation as the control layer.", {
    x: M, y: 2.35, w: 11.5, h: 1.3, margin: 0,
    fontFace: BODY, fontSize: 21, color: TEAL_L, valign: "top", lineSpacing: 28,
  });

  stat(s, M, 3.7, 3.72, "70%", "gain in engineering\nefficiency", true);
  stat(s, M + 4.11, 3.7, 3.72, "80%", "faster recovery when\nsomething goes down", true, GREEN);
  stat(s, M + 8.21, 3.7, 3.72, "5 hrs", "of daily manual data\ncollection → minutes", true);

  s.addText("Post-Harvey, the recovery number is the one Conroe talks about. Note that none of these required replacing the plant.", {
    x: M, y: 6.35, w: BOTW, h: 0.7, margin: 0,
    fontFace: BODY, fontSize: 19, italic: true, color: PAPER, valign: "top",
  });
  s.addText("Source: City of Conroe / Schneider Electric, announced WEFTEC 2025", {
    x: M, y: 7.08, w: BOTW, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, color: "3A3A3A",
  });
  s.addNotes(
`Payoff slide — this is where the five-hours-a-day from Bill Three gets resolved. Call that back explicitly: "Remember the five hours a day with a clipboard? Minutes."

For a Gulf Coast utility crowd, the 80% recovery figure is the one that matters and Harvey is why. Don't oversell it — just note that Conroe is a city that has thought hard about coming back up after an event.

The most important sentence is the last one: none of this required replacing the plant. This audience's instinctive objection is "we can't afford a rip-and-replace." Answer it before they raise it.

TIMING CHECKPOINT: off this slide by 0:41.`);
  foot(s, true);
}

/* ---- 28. Not just one city ------------------------------------------ */
{
  const s = slideLight();
  head(s, "PROOF", "And it isn't one city in Texas", false, { eyebrowW: 1.6 });

  const cases = [
    ["İZSU — İzmir, Turkey", "Water reuse for Turkey's 3rd city", "2,000–3,000 m³/day recovered for agriculture · 20% less engineering time"],
    ["Anglian Water — U.K.", "Largest water recycling co. by area", "Leakage cut 10% — among the lowest in the U.K. · 10% operational efficiency gain"],
    ["Acqua Novara.VCO — Italy", "139 municipalities, 450,000 people", "10% less water loss · 15% less energy used"],
  ];
  let y = 2.42;
  cases.forEach(([name, who, result]) => {
    card(s, M, y, 11.93, 1.28);
    s.addText(name, {
      x: M + 0.4, y: y + 0.16, w: 4.5, h: 0.45, margin: 0,
      fontFace: HEAD, fontSize: 21, bold: true, color: TEAL,
    });
    s.addText(who, {
      x: M + 0.4, y: y + 0.62, w: 4.5, h: 0.45, margin: 0,
      fontFace: BODY, fontSize: 16, color: MUTED,
    });
    s.addText(result, {
      x: M + 5.2, y: y + 0.28, w: 6.4, h: 0.75, margin: 0,
      fontFace: BODY, fontSize: 18, color: INK, valign: "middle", lineSpacing: 24,
    });
    y += 1.45;
  });
  s.addText("Different regulators, different climates, different vendors on site. Same architectural move.", {
    x: M, y: 6.72, w: BOTW, h: 0.42, margin: 0,
    fontFace: BODY, fontSize: 17, italic: true, color: GREEN, valign: "top",
  });
  s.addText("Source: Frost & Sullivan, Modernising Water and Wastewater Operations, 2025", {
    x: M, y: 7.14, w: BOTW, h: 0.28, margin: 0,
    fontFace: BODY, fontSize: 11, color: MUTED,
  });
  s.addNotes(
`Fast slide — 45 seconds. Do not read all nine numbers. Pick one and move.

Suggested: "İzmir is recovering three thousand cubic meters a day for agriculture in a water-scarce region. Anglian cut leakage ten percent."

The purpose is breadth, not depth: this is not a single lucky reference account. Land the bottom line — different regulators, different climates, same architectural move — and go.

CUT THIS SLIDE FIRST if you're running long.

TIMING CHECKPOINT: off this slide by 0:42.`);
  foot(s);
}

/* ---- 29. Day in the life -------------------------------------------- */
{
  const s = slideLight();
  head(s, "PICTURE IT", "A Tuesday, five years from now", false, { eyebrowW: 2.1 });

  const beats = [
    ["7:10 AM", "A lift station controller fails overnight. The on-call tech doesn't hunt for a discontinued card — the application has already restarted on a spare node. Nobody got called out at 2 AM."],
    ["10:30 AM", "An engineer changes a chemical dosing sequence, tests it against a simulated plant on her laptop, and sends it for review the way she'd send code — with a record of what changed and why."],
    ["2:00 PM", "The utility's asset team pulls pump vibration trends straight from the control application. No new gateway, no integration project, no purchase order."],
    ["4:45 PM", "Procurement issues an RFP for the next expansion without specifying a controller brand — because the logic they already own will run on whoever wins."],
  ];
  let y = 2.35;
  beats.forEach(([t, b]) => {
    chip(s, t, M, y + 0.16, 1.45, TEAL, PAPER);
    s.addText(b, {
      x: M + 1.75, y, w: 10.2, h: 1.1, margin: 0,
      fontFace: BODY, fontSize: 18, color: INK, valign: "top", lineSpacing: 24,
    });
    y += 1.18;
  });
  s.addText("Nothing on this slide is science fiction. All four are happening somewhere today.", {
    x: M, y: 6.95, w: BOTW, h: 0.45, margin: 0,
    fontFace: BODY, fontSize: 19, italic: true, color: GREEN, valign: "top",
  });
  s.addNotes(
`Slow down and narrate this. It's the emotional payoff of the whole talk — the room needs to SEE themselves in it, not evaluate it.

The 4:45 PM beat is the one that actually changes a utility's economics: writing an RFP that doesn't name a brand. Let that one breathe.

Close with the bottom line and mean it: none of this is speculative. Every one of those four is in production somewhere right now.

TIMING CHECKPOINT: off this slide by 0:44.`);
  foot(s);
}

/* ---- 30. Where Schneider fits --------------------------------------- */
{
  const s = slideLight();
  head(s, "FULL DISCLOSURE, AGAIN", "Where my employer sits in this", false, { eyebrowW: 3.7 });

  s.addText("I've spent forty minutes arguing against the business model my industry built. Here's what my company actually did about it, so you can judge it for yourself.", {
    x: M, y: 2.35, w: 11.5, h: 1.05, margin: 0,
    fontFace: BODY, fontSize: 21, color: INK, valign: "top", lineSpacing: 28,
  });

  const facts = [
    ["Founding member of UniversalAutomation.org", "One of nine founders in 2021 — alongside competitors and end users."],
    ["Donated the runtime source code", "The shared IEC 61499 runtime UAO stewards came from Schneider Electric. Any vendor, including our competitors, can license and ship it."],
    ["EcoStruxure Automation Expert", "Our implementation of it. 530+ active projects globally. It is one option, not the only one — and that's the point of a standard."],
  ];
  let y = 3.55;
  facts.forEach(([t, b], i) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y: y + 0.04, w: 0.55, h: 0.55, rectRadius: 0.28,
      fill: { color: TEAL }, line: { color: TEAL, width: 1 },
    });
    s.addText(String(i + 1), {
      x: M, y: y + 0.04, w: 0.55, h: 0.55, align: "center", valign: "middle", margin: 0,
      fontFace: HEAD, fontSize: 19, bold: true, color: PAPER,
    });
    s.addText(t, {
      x: M + 0.9, y, w: 10.9, h: 0.45, margin: 0,
      fontFace: HEAD, fontSize: 21, bold: true, color: INK,
    });
    s.addText(b, {
      x: M + 0.9, y: y + 0.46, w: 10.9, h: 0.6, margin: 0,
      fontFace: BODY, fontSize: 17, color: MUTED, valign: "top", lineSpacing: 22,
    });
    y += 1.10;
  });
  s.addText("If this leads you to a competitor's open platform, the talk still worked.", {
    x: M, y: 6.88, w: BOTW, h: 0.42, margin: 0,
    fontFace: BODY, fontSize: 18, italic: true, color: GREEN, valign: "top",
  });
  s.addNotes(
`Under two minutes. Tri-State's rules are explicit that this is not a sales slot, and more importantly the room will punish a pitch here after you've spent forty minutes earning trust.

Frame it as disclosure, not promotion: "You've listened to me for forty minutes. You're entitled to know where I sit."

The donated-source-code fact is the strongest thing you have and it's genuinely unusual — a vendor gave away the runtime so competitors could ship it. State it flatly and let it do the work.

Then the closing line, and MEAN it: if this leads someone to a competitor's open platform, the talk still worked. Say it, don't wink at it.

VERIFY BEFORE YOU PRESENT: confirm the current project count with SE marketing — 530+ is the last public figure I could source (Aug 2025). Use whatever number is approved on the day.

TIMING CHECKPOINT: off this slide by 0:46.`);
  foot(s);
}

/* ---- 31. Phased path ------------------------------------------------- */
{
  const s = slideLight();
  head(s, "HOW IT STARTS", "Nobody is asking you to rip anything out", false, { eyebrowW: 2.6 });

  const phases = [
    ["1", "Listen", "The new layer goes in alongside your existing PLCs and SCADA with no control authority at all. It reads data, publishes it securely, adds analytics. If it fails, nothing happens to your process."],
    ["2", "Rehearse", "Build the control logic in parallel. Simulate it. Run it beside the live controller and watch its outputs without letting it act. You are proving it before you trust it."],
    ["3", "Hand over", "Only when it's proven does control authority move — one asset at a time. The existing I/O, wiring, cabinets and drives stay exactly where they are."],
  ];
  let x = M;
  phases.forEach(([n, t, b]) => {
    card(s, x, 2.4, 3.72, 4.2);
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.35, y: 2.7, w: 0.62, h: 0.62, rectRadius: 0.14,
      fill: { color: GREEN }, line: { color: GREEN, width: 1 },
    });
    s.addText(n, {
      x: x + 0.35, y: 2.7, w: 0.62, h: 0.62, align: "center", valign: "middle", margin: 0,
      fontFace: HEAD, fontSize: 24, bold: true, color: NAVY,
    });
    s.addText(t, {
      x: x + 0.35, y: 3.48, w: 3.1, h: 0.5, margin: 0,
      fontFace: HEAD, fontSize: 25, bold: true, color: TEAL,
    });
    s.addText(b, {
      x: x + 0.35, y: 4.05, w: 3.12, h: 2.45, margin: 0,
      fontFace: BODY, fontSize: 16, color: INK, valign: "top", lineSpacing: 21,
    });
    x += 4.11;
  });
  s.addText("Phase 1 is a data project with a hardware bill in the low thousands. It is not a control decision, and it is reversible.", {
    x: M, y: 6.72, w: BOTW, h: 0.7, margin: 0,
    fontFace: BODY, fontSize: 19, bold: true, color: INK, valign: "top",
  });
  s.addNotes(
`The de-risking slide. Everything before this was "why"; this is the only "how" they need.

The word to repeat is REVERSIBLE. Phase 1 touches no control authority. If it doesn't work out, you unplug an industrial PC and you're exactly where you started.

That framing matters because it moves this out of the capital-project conversation — where it competes with a clarifier rebuild and loses — and into something a utility can actually try.

Don't quote specific pricing from the stage. If asked in Q&A: an industrial PC plus licensing, low single-digit thousands for a pilot, and point them to a follow-up conversation.

TIMING CHECKPOINT: off this slide by 0:47:30.`);
  foot(s);
}

/* ---- 32. Monday morning ---------------------------------------------- */
{
  const s = slideDark();
  head(s, "MONDAY MORNING", "Three things, none of which cost money", true, { eyebrowW: 3.0 });

  const actions = [
    ["Find your cliff edge", "Pull the list of controllers, drives and operator stations past or nearing end-of-support. Most utilities have never seen that list on one page — and it is usually worse than expected."],
    ["Ask one question in every vendor meeting", "\"Is your software-defined offering portable to hardware you don't manufacture — yes or no?\" Write the answer down. You'll learn a lot from who hesitates."],
    ["Pick one place to prove it", "Not the headworks. A remote site, a lift station, a well — somewhere a failure is inconvenient rather than catastrophic. Prove the architecture where the stakes are low."],
  ];
  let y = 2.25;
  actions.forEach(([t, b], i) => {
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y: y + 0.04, w: 0.62, h: 0.62, rectRadius: 0.31,
      fill: { color: GREEN }, line: { color: GREEN, width: 1 },
    });
    s.addText(String(i + 1), {
      x: M, y: y + 0.04, w: 0.62, h: 0.62, align: "center", valign: "middle", margin: 0,
      fontFace: HEAD, fontSize: 22, bold: true, color: NAVY,
    });
    s.addText(t, {
      x: M + 1.0, y, w: 10.6, h: 0.5, margin: 0,
      fontFace: HEAD, fontSize: 24, bold: true, color: PAPER,
    });
    s.addText(b, {
      x: M + 1.0, y: y + 0.52, w: 10.6, h: 1.02, margin: 0,
      fontFace: BODY, fontSize: 18, color: TEAL_L, valign: "top", lineSpacing: 24,
    });
    y += 1.60;
  });
  s.addText("None of this requires a budget cycle. All of it changes the next one.", {
    x: M, y: 7.03, w: BOTW, h: 0.38, margin: 0,
    fontFace: BODY, fontSize: 19, italic: true, color: GREEN, valign: "top",
  });
  s.addNotes(
`Deliver these as instructions, not suggestions. Short sentences.

Action 2 is the one that will actually get used, and it's the gift you're giving this room — a single yes/no question that cuts through every vendor pitch they'll hear for the next five years, mine included.

Action 3 matters because the failure mode of this movement is a utility trying it on the most critical asset first and getting scared. Prove it where a failure is inconvenient, not catastrophic.

Close: "None of this requires a budget cycle. All of it changes the next one."

TIMING CHECKPOINT: off this slide by 0:49.`);
  foot(s, true);
}

/* ---- 33. Close / Q&A -------------------------------------------------- */
{
  const s = slideDark();
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 4.85, w: W, h: 2.65, fill: { color: "0A0A0A" }, line: { width: 0 },
  });
  s.addText("In 1968 we decided logic\nshouldn't be welded to copper.", {
    x: M, y: 1.15, w: 11.6, h: 1.7, margin: 0,
    fontFace: HEAD, fontSize: 36, color: TEAL_L, lineSpacing: 46,
  });
  s.addText("We were right. We just stopped halfway.", {
    x: M, y: 3.15, w: 11.6, h: 1.2, margin: 0,
    fontFace: HEAD, fontSize: 40, bold: true, color: GREEN, lineSpacing: 50,
  });
  s.addText("Questions", {
    x: M, y: 5.2, w: 5.5, h: 0.75, margin: 0,
    fontFace: HEAD, fontSize: 34, bold: true, color: PAPER,
  });
  s.addText([
    { text: "Kyle Sanders\n", options: { fontSize: 21, bold: true, color: PAPER, breakLine: true } },
    { text: "Business Development Manager\nSchneider Electric", options: { fontSize: 18, color: TEAL_L } },
  ], {
    x: M + 6.4, y: 5.2, w: 5.5, h: 1.6, margin: 0,
    fontFace: BODY, valign: "top", lineSpacing: 24,
  });
  s.addNotes(
`Do not end on "any questions?" — end on the callback, then open the floor.

"In 1968 we decided logic shouldn't be welded to copper. We were right. We just stopped halfway."

Pause. Then: "I've got a few minutes — what did I get wrong?" That framing gets better questions than "any questions?" and it stays consistent with the tone of the whole talk.

ANTICIPATED QUESTIONS
· "What about determinism / safety-rated control?" — Safety instrumented systems stay where they are. Nothing in this talk asks you to move an SIS.
· "Who supports it when it breaks at 2 AM?" — Same integrator model you use now; the difference is you're no longer locked to one vendor's support desk.
· "Our integrator only knows Rockwell." — Fair, and real. Phase 1 doesn't ask them to change anything. It's also why the workforce math eventually favors open.
· "Isn't this just another vendor lock-in with extra steps?" — Best question in the room. Answer: that's exactly why the standard and the non-profit matter more than my product. Point back to the fine-print slide.
· "What does it cost?" — Don't quote numbers from stage. Phase 1 is an industrial PC plus licensing; take it offline.

BRING: the deck on a flash drive, PowerPoint 2013-compatible. Arrive 15 minutes early to load onto the conference laptop. No personal laptop on the projector.
QR code / handout: swap in a link to a follow-up resource rather than printing 300 brochures — the conference explicitly asks for this.`);
  foot(s, true);
}

/* ------------------------------------------------------------------ write */
pres.writeFile({ fileName: "SDA-Water-Wastewater-TriState-2026.pptx" })
  .then((f) => console.log("wrote", f, "—", pageNo, "slides"));
