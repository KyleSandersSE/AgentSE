// ============================================================
// quiz-data.js — Discovery Quiz question bank & deck map
//
// EDIT THIS FILE to tune the quiz to your deck and your patch.
// No code below — it's all content:
//   PILLARS     - the interest dimensions you score against
//   INDUSTRIES  - setup-screen industry choices
//   QUESTIONS   - core discovery flow (asked in order)
//   DEEP_DIVES  - per-pillar follow-up banks (triggered when a
//                 pillar "lights up", or manually)
//   PIVOTS      - "Where would you like to go next?" choice cards
//   MAIN_FLOW   - the order of core questions and pivots
//   SLIDE_MAP   - which section of YOUR PowerPoint each pillar
//                 maps to (update the section names/slide ranges)
//   NEXT_STEPS  - recommended follow-up actions per pillar for
//                 the end-of-meeting summary sheet
//
// Option weights: each option adds points to one or more pillars,
// e.g. { cyber: 2, tco: 1 }. 1 = mild signal, 2 = clear interest,
// 3 = burning pain. A pillar at 4+ points triggers a "dive deeper"
// suggestion in the sidebar.
// ============================================================

const PILLARS = [
    { id: 'cyber',     name: 'Cybersecurity & Risk',                icon: '🔒', color: '#e74c3c' },
    { id: 'open',      name: 'Open Automation & Vendor Freedom',    icon: '🔓', color: '#3498db' },
    { id: 'energy',    name: 'Energy & Sustainability',             icon: '⚡', color: '#f39c12' },
    { id: 'modern',    name: 'Modernization & Obsolescence',        icon: '🏗️', color: '#9b59b6' },
    { id: 'sdauto',    name: 'Software-Defined / Future Tech',      icon: '🚀', color: '#16a085' },
    { id: 'workforce', name: 'Workforce & Knowledge Retention',     icon: '👷', color: '#e67e22' },
    { id: 'tco',       name: 'Lifecycle Cost & TCO',                icon: '💰', color: '#2c3e50' }
];

const INDUSTRIES = [
    'Food & Beverage',
    'Water / Wastewater',
    'Consumer Packaged Goods',
    'Life Sciences',
    'Metals, Minerals & Mining',
    'Chemicals',
    'Rubber & Elastomer Manufacturing',
    'Other'
];

// ---------------- Core discovery questions ----------------
// talkTrack = what YOU say / why you're asking (only you see it).
// multi: true lets you log more than one answer.

const QUESTIONS = {
    drivers: {
        id: 'drivers',
        multi: true,
        text: "What's driving this conversation for you right now?",
        talkTrack: "Open broad. Let them vent — every option they pick is a pillar lighting up. Don't pitch yet, just listen and log.",
        options: [
            { label: 'Unplanned downtime / reliability problems',        weights: { modern: 2, tco: 1 } },
            { label: 'Aging installed base / parts getting hard to find', weights: { modern: 3 } },
            { label: 'Cyber audit, insurance, or corporate security mandate', weights: { cyber: 3 } },
            { label: 'Energy costs or sustainability targets',           weights: { energy: 3 } },
            { label: 'Retirements / can\'t find controls talent',        weights: { workforce: 3 } },
            { label: 'Expansion, new line, or greenfield project',       weights: { sdauto: 2, open: 1 } },
            { label: 'Feeling locked in to a single automation vendor',  weights: { open: 3, tco: 1 } }
        ]
    },
    installedBase: {
        id: 'installedBase',
        text: 'How old is the control system on your most critical line or process?',
        talkTrack: "Ask about the line that hurts most, not the average. 15+ years usually means obsolescence risk, tribal knowledge, and a rip-and-replace fear you can defuse with a stepwise path.",
        options: [
            { label: 'Under 5 years — fairly modern',                    weights: { sdauto: 1 } },
            { label: '5–15 years — working, but showing age',            weights: { modern: 1 } },
            { label: '15–25 years — obsolescence is a real concern',     weights: { modern: 2, tco: 1 } },
            { label: '25+ years — parts from eBay, knowledge retiring',  weights: { modern: 3, workforce: 2 } }
        ]
    },
    lockIn: {
        id: 'lockIn',
        text: 'Last time you expanded or upgraded, how much freedom did you have to choose hardware or integrators?',
        talkTrack: "This is the vendor lock-in probe. If they grimace, this is your EcoStruxure Automation Expert opening: IEC 61499, hardware-agnostic, application code that's portable instead of welded to one vendor's PLC.",
        options: [
            { label: 'Total freedom — we mix and match vendors',         weights: { open: 1 } },
            { label: 'Some freedom, but switching costs steer us back',  weights: { open: 2, tco: 1 } },
            { label: 'Effectively locked in — one vendor, their terms',  weights: { open: 3, tco: 2 } },
            { label: "Never really thought about it",                    weights: { open: 1 } }
        ]
    },
    cyberPosture: {
        id: 'cyberPosture',
        multi: true,
        text: 'Has OT cybersecurity come up in the last 12 months — audits, insurance, incidents, corporate mandates?',
        talkTrack: "Cyber is often the budget unlocker: it has board visibility and deadlines. If anything here gets a strong reaction, take the cybersecurity deep dive.",
        options: [
            { label: 'Yes — audit findings or insurance requirements',   weights: { cyber: 3 } },
            { label: 'Yes — corporate mandate / new OT security role',   weights: { cyber: 2 } },
            { label: 'We had an incident or a near-miss',                weights: { cyber: 3 } },
            { label: "It's on the radar but nothing formal yet",         weights: { cyber: 1 } },
            { label: 'Not really a topic here',                          weights: {} }
        ]
    },
    energyTargets: {
        id: 'energyTargets',
        text: 'Do you have corporate energy or sustainability targets that plant operations is on the hook for?',
        talkTrack: "If ops owns a number (kWh/unit, CO₂, water), energy becomes an automation conversation, not a facilities one. That's the bridge to power monitoring + process optimization in one platform.",
        options: [
            { label: 'Yes — hard targets with reporting requirements',   weights: { energy: 3 } },
            { label: 'Soft goals — we track but nobody is on the hook',  weights: { energy: 1 } },
            { label: 'Energy is a cost concern, not a sustainability one', weights: { energy: 2, tco: 1 } },
            { label: 'Not a driver for us',                              weights: {} }
        ]
    },
    knowledge: {
        id: 'knowledge',
        text: 'When your most experienced controls person retires, where does their knowledge go?',
        talkTrack: "Almost everyone winces at this one. Bridge: modern, self-documenting, object-oriented automation (reusable software components) means the logic isn't trapped in one person's head or one vendor's toolchain.",
        options: [
            { label: 'Documented and cross-trained — we\'re covered',    weights: {} },
            { label: 'Partially documented, mostly in their head',       weights: { workforce: 2 } },
            { label: 'Out the door with them — it keeps me up at night', weights: { workforce: 3, modern: 1 } },
            { label: 'We outsource that risk to integrators',            weights: { workforce: 1, tco: 1 } }
        ]
    },
    downtimeCost: {
        id: 'downtimeCost',
        text: 'Roughly what does an hour of unplanned downtime cost on your key line?',
        talkTrack: "Get a number, even a rough one — you'll use it in the ranking close and every ROI conversation after. If they don't know, that's itself a finding worth noting.",
        options: [
            { label: 'Under $10k/hr',                                    weights: { tco: 1 } },
            { label: '$10k–$50k/hr',                                     weights: { tco: 2, modern: 1 } },
            { label: '$50k+/hr — downtime is existential',               weights: { tco: 3, modern: 2 } },
            { label: "We don't have a number (note that!)",              weights: { tco: 1 } }
        ]
    },
    itOtPosture: {
        id: 'itOtPosture',
        text: 'How does your team feel about IT-style technology on the plant floor — virtualization, containers, remote access?',
        talkTrack: "This gauges readiness for the software-defined story. Enthusiasts get the full future-forward pitch; skeptics get the 'evolution, not rip-and-replace' framing.",
        options: [
            { label: 'Embracing it — IT/OT convergence is happening',    weights: { sdauto: 3 } },
            { label: 'Curious but cautious',                             weights: { sdauto: 2 } },
            { label: 'OT is OT — keep IT out of my plant',               weights: { sdauto: 1, cyber: 1 } },
            { label: 'Haven\'t gone there yet',                          weights: { sdauto: 1 } }
        ]
    }
};

// ---------------- Deep-dive banks (per pillar) ----------------

const DEEP_DIVES = {
    cyber: [
        {
            id: 'dd_cyber_1',
            text: 'Do you know what\'s actually on your OT network today — a live asset inventory?',
            talkTrack: "Most plants don't. An OT asset inventory / cybersecurity assessment is a low-friction paid next step.",
            options: [
                { label: 'Yes, current and maintained',                  weights: { cyber: 1 } },
                { label: 'A spreadsheet from a while ago',               weights: { cyber: 2 } },
                { label: 'Honestly, no',                                 weights: { cyber: 3 } }
            ]
        },
        {
            id: 'dd_cyber_2',
            text: 'Are you working toward a standard — IEC 62443, NIST, AWIA (water) — or is it ad hoc?',
            talkTrack: "EcoStruxure Automation Expert and Schneider's portfolio are built around IEC 62443. If they name a standard, mirror their language for the rest of the meeting.",
            options: [
                { label: 'Formal program against a named standard',      weights: { cyber: 2 } },
                { label: 'Ad hoc — firewalls and hope',                  weights: { cyber: 3 } },
                { label: 'Compliance-driven only (checkbox mode)',       weights: { cyber: 1 } }
            ]
        },
        {
            id: 'dd_cyber_3',
            text: 'Can your legacy controllers even be patched, or are they secure-by-isolation only?',
            talkTrack: "Ties cyber back to modernization: unpatchable legacy gear is a risk you can't mitigate away. Two pillars, one project.",
            options: [
                { label: 'Mostly patchable and managed',                 weights: { cyber: 1 } },
                { label: 'Mixed — some gear can never be patched',       weights: { cyber: 2, modern: 2 } },
                { label: 'Largely unpatchable — we rely on air gaps',    weights: { cyber: 3, modern: 2 } }
            ]
        }
    ],
    open: [
        {
            id: 'dd_open_1',
            text: 'If your PLC vendor doubled support costs tomorrow, what would it take to move your application code?',
            talkTrack: "The portability question. With IEC 61499 the application is decoupled from the hardware — that's the heart of the open automation story.",
            options: [
                { label: 'A full rewrite — the code is vendor-specific', weights: { open: 3, tco: 2 } },
                { label: 'Painful but possible',                         weights: { open: 2 } },
                { label: 'We\'ve already been burned by this',           weights: { open: 3 } }
            ]
        },
        {
            id: 'dd_open_2',
            text: 'How much engineering do you re-do from scratch on every project — versus reusing proven components?',
            talkTrack: "Object-oriented, reusable components in EAE typically cut engineering hours dramatically. Ask for their rough % of copy-paste-modify vs. true reuse.",
            options: [
                { label: 'Heavy reuse — good component library',         weights: { open: 1 } },
                { label: 'Copy-paste-modify, then debug it all again',   weights: { open: 2, workforce: 1 } },
                { label: 'Every project starts near zero',               weights: { open: 3, tco: 2 } }
            ]
        },
        {
            id: 'dd_open_3',
            text: 'Have you come across UniversalAutomation.Org or IEC 61499 — automation apps portable across vendors?',
            talkTrack: "Gauge awareness before the three-pillars section. If it's new to them, this is your 'next generation' reveal moment — don't spoil it here, tee it up.",
            options: [
                { label: 'Yes, following it with interest',              weights: { open: 3, sdauto: 1 } },
                { label: 'Heard the name, fuzzy on details',             weights: { open: 2 } },
                { label: 'New to me — tell me more',                     weights: { open: 2 } }
            ]
        }
    ],
    energy: [
        {
            id: 'dd_energy_1',
            text: 'Can you see energy use per line or per unit produced — or only the utility bill at the gate?',
            talkTrack: "Granularity is everything. If they can't see it, they can't manage it — power monitoring integrated into the same platform is the hook.",
            options: [
                { label: 'Per line / per batch visibility today',        weights: { energy: 1 } },
                { label: 'Building-level only',                          weights: { energy: 2 } },
                { label: 'Just the monthly bill',                        weights: { energy: 3 } }
            ]
        },
        {
            id: 'dd_energy_2',
            text: 'Who owns energy in the plant — operations, facilities, or corporate sustainability?',
            talkTrack: "Find the economic buyer for the energy story. If it's corporate, ask who locally feeds them data — that person needs what you sell.",
            options: [
                { label: 'Operations owns it (with a target)',           weights: { energy: 3 } },
                { label: 'Facilities — separate from process',           weights: { energy: 2 } },
                { label: 'Corporate — plant just reports up',            weights: { energy: 1 } }
            ]
        },
        {
            id: 'dd_energy_3',
            text: 'Biggest energy hogs — compressed air, refrigeration, pumping, thermal? Do you actively optimize them with controls?',
            talkTrack: "Industry cue: F&B = refrigeration/CIP, water/WW = pumping & aeration (often 60%+ of plant energy). Optimizing with VSDs + smarter control is a concrete, quantifiable win.",
            options: [
                { label: 'Yes — active control-based optimization',      weights: { energy: 1, sdauto: 1 } },
                { label: 'We know the hogs but run them flat out',       weights: { energy: 3 } },
                { label: 'Never analyzed it',                            weights: { energy: 2 } }
            ]
        }
    ],
    modern: [
        {
            id: 'dd_modern_1',
            text: 'What\'s your biggest fear about modernizing — cost, downtime during cutover, or losing working logic?',
            talkTrack: "Name the fear, then defuse it: stepwise migration, wrap-and-extend, and running new alongside old. Rip-and-replace is THEIR mental model, not your proposal.",
            options: [
                { label: 'Downtime during cutover',                      weights: { modern: 3, tco: 1 } },
                { label: 'Capital cost / making the business case',      weights: { modern: 2, tco: 2 } },
                { label: 'Losing 20 years of working logic',             weights: { modern: 2, workforce: 2 } }
            ]
        },
        {
            id: 'dd_modern_2',
            text: 'Do you have a documented migration roadmap, or does gear get replaced when it dies?',
            talkTrack: "Run-to-fail means every failure is an emergency purchase — at panic prices, from the incumbent. A roadmap workshop is a natural next step you can offer.",
            options: [
                { label: 'Documented multi-year roadmap',                weights: { modern: 1 } },
                { label: 'Loose plan, constantly deferred',              weights: { modern: 2 } },
                { label: 'Run to fail',                                  weights: { modern: 3, tco: 2 } }
            ]
        },
        {
            id: 'dd_modern_3',
            text: 'When you do modernize, do you want a like-for-like swap or a platform you won\'t have to rip out again in 15 years?',
            talkTrack: "The bridge from modernization to open/software-defined: this is the moment to plant 'your next platform should be your LAST forced migration.'",
            options: [
                { label: 'Like-for-like — lowest risk',                  weights: { modern: 1 } },
                { label: 'Open to something better if risk is managed',  weights: { modern: 2, open: 2 } },
                { label: 'Want future-proof — never again',              weights: { open: 3, sdauto: 2 } }
            ]
        }
    ],
    sdauto: [
        {
            id: 'dd_sdauto_1',
            text: 'Where does your plant data live today — and can the people who need it actually get to it?',
            talkTrack: "Software-defined automation makes contextualized data a native output, not a bolt-on historian project. Listen for 'we have the data but nobody can use it.'",
            options: [
                { label: 'Unified, contextualized, accessible',          weights: { sdauto: 1 } },
                { label: 'Historians and spreadsheets — data islands',   weights: { sdauto: 2 } },
                { label: 'Trapped in the controllers',                   weights: { sdauto: 3, open: 1 } }
            ]
        },
        {
            id: 'dd_sdauto_2',
            text: 'Have you virtualized anything at the plant level yet — servers, SCADA, engineering stations?',
            talkTrack: "If IT already virtualized SCADA servers, soft-PLCs / control on standard compute is a smaller mental leap. Find their current rung on the ladder.",
            options: [
                { label: 'Yes — comfortable with virtualization in OT',  weights: { sdauto: 3 } },
                { label: 'IT side only, not touching control',           weights: { sdauto: 2 } },
                { label: 'All physical, all dedicated boxes',            weights: { sdauto: 1 } }
            ]
        },
        {
            id: 'dd_sdauto_3',
            text: 'If you could change your automation logic like deploying software — versioned, tested, rolled back — what would that unlock for you?',
            talkTrack: "Vision question — let them dream out loud. Their answer is your closing slide. Write down their exact words.",
            options: [
                { label: 'Faster changeovers / new products',            weights: { sdauto: 3 } },
                { label: 'Fewer errors, safer changes',                  weights: { sdauto: 2, cyber: 1 } },
                { label: 'Hard to picture — show me',                    weights: { sdauto: 2 } }
            ]
        }
    ],
    workforce: [
        {
            id: 'dd_workforce_1',
            text: 'How long does it take a new controls engineer to become productive on your current systems?',
            talkTrack: "Proprietary toolchains = long ramp. Modern, standards-based environments look like the software tools young engineers already know.",
            options: [
                { label: 'Months — our systems are approachable',        weights: { workforce: 1 } },
                { label: 'A year or more',                               weights: { workforce: 2 } },
                { label: 'Years — and they leave before then',           weights: { workforce: 3 } }
            ]
        },
        {
            id: 'dd_workforce_2',
            text: 'Can your team make changes remotely / securely, or does everything need someone physically at the panel?',
            talkTrack: "Remote engineering ties workforce to cyber (secure access) and software-defined (central deployment). One answer, three pillars.",
            options: [
                { label: 'Secure remote engineering today',              weights: { workforce: 1, cyber: 1 } },
                { label: 'Some remote, mostly windshield time',          weights: { workforce: 2 } },
                { label: 'Truck rolls for everything',                   weights: { workforce: 3, tco: 1 } }
            ]
        }
    ],
    tco: [
        {
            id: 'dd_tco_1',
            text: 'When you evaluate automation spend, is it purchase price or total lifecycle cost — licenses, support contracts, forced upgrades, migration?',
            talkTrack: "Lock-in hides in the lifecycle line items. Walk them toward totaling what the incumbent really costs over 10 years.",
            options: [
                { label: 'Full lifecycle TCO analysis',                  weights: { tco: 1 } },
                { label: 'Mostly upfront price',                         weights: { tco: 2 } },
                { label: 'Whatever keeps us running this quarter',       weights: { tco: 3, modern: 1 } }
            ]
        },
        {
            id: 'dd_tco_2',
            text: 'Have you ever been forced into an upgrade you didn\'t want — end-of-life announcement, mandatory version migration?',
            talkTrack: "Forced migrations are the emotional core of the lock-in story. Get the anecdote — you'll reference it in the close.",
            options: [
                { label: 'Yes, and it was expensive/painful',            weights: { tco: 3, open: 2 } },
                { label: 'Yes, but manageable',                          weights: { tco: 2, open: 1 } },
                { label: 'Not yet',                                      weights: { tco: 1 } }
            ]
        }
    ]
};

// ---------------- Pivot cards ----------------
// "Where would you like to go next?" — the customer chooses,
// you jump to that section of your deck.

const PIVOTS = {
    midPivot: {
        id: 'midPivot',
        title: 'Where would you like to go next?',
        talkTrack: "Hand them the wheel — this is the consultative moment. Whatever they pick, jump your deck to that section and let their choice add to the priority map.",
        choices: [
            {
                label: 'The future of industrial automation',
                desc: 'Where the industry is heading — IT/OT convergence, software-defined everything',
                weights: { sdauto: 2 },
                deckKey: 'sdauto'
            },
            {
                label: 'Open automation & the three pillars',
                desc: 'IEC 61499, portable applications, breaking vendor lock-in',
                weights: { open: 2 },
                deckKey: 'open'
            },
            {
                label: 'What we have today & where it\'s going',
                desc: 'EcoStruxure Automation Expert now — and the software-defined roadmap',
                weights: { sdauto: 1, modern: 1 },
                deckKey: 'today'
            }
        ]
    },
    closePivot: {
        id: 'closePivot',
        title: 'Before we wrap — anything you want to go deeper on?',
        talkTrack: "Last open door before the ranking close. If they pick one, note it as a follow-up topic even if you don't present it today.",
        choices: [
            {
                label: 'Cybersecurity',
                desc: 'IEC 62443, secure-by-design, OT security services',
                weights: { cyber: 2 },
                deckKey: 'cyber'
            },
            {
                label: 'Energy & sustainability',
                desc: 'Power monitoring, energy optimization, reporting',
                weights: { energy: 2 },
                deckKey: 'energy'
            },
            {
                label: 'Migration & modernization paths',
                desc: 'Stepwise migration — no rip and replace',
                weights: { modern: 2 },
                deckKey: 'modern'
            }
        ]
    }
};

// ---------------- Core flow order ----------------
// Items: { type: 'question', ref: <QUESTIONS key> } or { type: 'pivot', ref: <PIVOTS key> }

const MAIN_FLOW = [
    { type: 'question', ref: 'drivers' },
    { type: 'question', ref: 'installedBase' },
    { type: 'question', ref: 'lockIn' },
    { type: 'question', ref: 'cyberPosture' },
    { type: 'pivot',    ref: 'midPivot' },
    { type: 'question', ref: 'energyTargets' },
    { type: 'question', ref: 'knowledge' },
    { type: 'question', ref: 'downtimeCost' },
    { type: 'question', ref: 'itOtPosture' },
    { type: 'pivot',    ref: 'closePivot' }
];

// ---------------- Deck section map ----------------
// UPDATE these to match your actual PowerPoint sections/slide numbers.

const SLIDE_MAP = {
    cyber:  'Deck section: Cybersecurity — IEC 62443 & defense in depth (update slide #s)',
    open:   'Deck section: Open Automation — the three pillars / IEC 61499 (update slide #s)',
    energy: 'Deck section: Energy & Sustainability — power + process in one platform (update slide #s)',
    modern: 'Deck section: Modernization — stepwise migration paths (update slide #s)',
    sdauto: 'Deck section: The Future — software-defined automation (update slide #s)',
    today:  'Deck section: EcoStruxure Automation Expert today — demo & roadmap (update slide #s)',
    workforce: 'Deck section: Workforce — engineering efficiency & knowledge capture (update slide #s)',
    tco:    'Deck section: Lifecycle value — TCO comparison (update slide #s)'
};

// ---------------- Recommended next steps per pillar ----------------

const NEXT_STEPS = {
    cyber: [
        'Offer an OT cybersecurity / asset-inventory assessment',
        'Send IEC 62443 positioning one-pager',
        'Intro to cybersecurity services team'
    ],
    open: [
        'Schedule an EcoStruxure Automation Expert demo (portability + reusable components)',
        'Share UniversalAutomation.Org / IEC 61499 primer',
        'Scope a small proof-of-concept on a non-critical asset'
    ],
    energy: [
        'Propose an energy monitoring walkdown of the biggest loads',
        'Share power + process single-platform reference story',
        'Connect with energy/sustainability solutions team'
    ],
    modern: [
        'Offer an installed-base audit / obsolescence risk report',
        'Build a stepwise migration roadmap workshop',
        'Share a no-shutdown migration case study from their industry'
    ],
    sdauto: [
        'Demo software-defined automation (virtualized control, versioned deployment)',
        'Share the future-of-automation vision deck section as a leave-behind',
        'Identify a pilot use case for contextualized plant data'
    ],
    workforce: [
        'Demo engineering efficiency: reusable objects, self-documenting logic',
        'Discuss training/services to de-risk retirements',
        'Show secure remote engineering workflow'
    ],
    tco: [
        'Build a 10-year TCO comparison vs. incumbent (licenses, support, forced migrations)',
        'Quantify downtime cost against modernization investment',
        'Share lifecycle-value customer story'
    ]
};

// Score threshold at which a pillar is "hot" and a deep dive is suggested
const DIVE_THRESHOLD = 4;
