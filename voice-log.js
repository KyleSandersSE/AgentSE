// ============================================================
// voice-log.js — Voice Dump logging module
// Depends on globals from app-all-ca.js (must load AFTER it):
//   bdmData, getBDMData(), updateBDMData(), saveBDMData(),
//   allProjects, renderKanbanBoard()
// ============================================================

(function () {
    'use strict';

    const SETTINGS_KEY = 'voiceLogSettings';
    const DEFAULT_TARGETS = { dials: 20, conversations: 3, touches: 12 };

    let pendingParse = null;      // holds parsed fields awaiting confirm
    let accountIndex = null;      // cached fuzzy-match index
    let accountIndexSize = -1;    // allProjects.length when index was built

    // ---------------- Settings ----------------

    function getVoiceSettings() {
        try {
            const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            return {
                apiKey: stored.apiKey || '',
                repName: stored.repName || 'Kyle Sanders',
                targets: Object.assign({}, DEFAULT_TARGETS, stored.targets || {})
            };
        } catch (e) {
            return { apiKey: '', repName: 'Kyle Sanders', targets: Object.assign({}, DEFAULT_TARGETS) };
        }
    }

    function saveVoiceSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // ---------------- Parsing: shared result shape ----------------
    // { company, contactName, contactTitle, phone, email,
    //   method, reached, summary, nextSteps, nextDate,
    //   referredToName, referredToTitle, parser }

    function emptyParse() {
        return {
            company: '', contactName: '', contactTitle: '', phone: '', email: '',
            method: 'Call', reached: '', summary: '', nextSteps: '', nextDate: '',
            referredToName: '', referredToTitle: '', parser: 'heuristic'
        };
    }

    // ---------------- Claude API parser ----------------

    const EXTRACTION_SCHEMA = {
        type: 'object',
        properties: {
            company: { type: 'string' },
            contactName: { type: 'string' },
            contactTitle: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            method: { type: 'string', enum: ['Call', 'Email', 'VM', 'Meeting', 'LinkedIn', 'Other'] },
            reached: { type: 'string', enum: ['Answered', 'Voicemail', 'No Answer', 'Email Sent', 'Referred', ''] },
            summary: { type: 'string' },
            nextSteps: { type: 'string' },
            nextDate: { type: 'string' },
            referredToName: { type: 'string' },
            referredToTitle: { type: 'string' }
        },
        required: ['company', 'contactName', 'contactTitle', 'phone', 'email',
            'method', 'reached', 'summary', 'nextSteps', 'nextDate',
            'referredToName', 'referredToTitle'],
        additionalProperties: false
    };

    function buildSystemPrompt() {
        const now = new Date();
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        const today = toISODate(now);
        return [
            "You extract structured CRM data from a salesperson's free-form dictated call note.",
            'Today is ' + today + ' (' + weekday + '). The rep sells industrial automation software (EAE) to manufacturing plants.',
            'Rules:',
            '- Extract only what is stated; use "" for anything not mentioned. Never invent values.',
            '- method: how the touch happened (Call, Email, VM = a call where only a voicemail was left, Meeting, LinkedIn, Other).',
            '- reached: "Answered" if a live conversation happened (even if the contact then referred the rep onward); "Voicemail"; "No Answer"; "Email Sent"; "Referred" only for a referral passed along without any live call; "" if unclear.',
            '- If the note says the contact referred the rep to someone (e.g. "referred me to John Hill his maintenance manager"), set referredToName/referredToTitle and keep reached="Answered".',
            '- phone: normalize to digits with dashes, e.g. 509-543-4258.',
            '- nextDate: resolve relative dates ("Tuesday 7/14", "next Thursday") to YYYY-MM-DD using today\'s date; "" if none mentioned.',
            '- summary: 1-3 sentences of what happened, keeping plant/project intel (project names, timelines, dollar values).',
            '- nextSteps: the concrete next action, if any.'
        ].join('\n');
    }

    async function parseWithClaude(text, apiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5',
                max_tokens: 1024,
                system: buildSystemPrompt(),
                output_config: { format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
                messages: [{ role: 'user', content: text }]
            })
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            throw new Error('API ' + response.status + ': ' + errBody.slice(0, 200));
        }
        const data = await response.json();
        if (data.stop_reason === 'refusal' || data.stop_reason === 'max_tokens') {
            throw new Error('Unusable stop_reason: ' + data.stop_reason);
        }
        const textBlock = (data.content || []).find(b => b.type === 'text');
        if (!textBlock) {
            throw new Error('No text block in response');
        }
        const parsed = JSON.parse(textBlock.text); // throws -> heuristic fallback
        const result = Object.assign(emptyParse(), parsed);
        result.parser = 'claude';
        return result;
    }

    // ---------------- Heuristic fallback parser ----------------

    const TITLE_KEYWORDS = ['manager', 'engineer', 'programmer', 'director', 'maintenance',
        'controls', 'supervisor', 'plant', 'operations', 'president', 'vp', 'lead',
        'technician', 'electrician', 'automation', 'process', 'reliability', 'capex',
        'purchasing', 'procurement', 'owner', 'ceo', 'coo', 'superintendent'];

    function parseHeuristic(text) {
        const result = emptyParse();
        let working = text;

        // Phone
        const phoneMatch = working.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch) {
            const digits = phoneMatch[0].replace(/\D/g, '');
            result.phone = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
            working = working.replace(phoneMatch[0], '');
        }

        // Email
        const emailMatch = working.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        if (emailMatch) {
            result.email = emailMatch[0];
            working = working.replace(emailMatch[0], '');
        }

        // Reached / method keywords
        const lower = working.toLowerCase();
        if (/\b(answered|spoke|connected|picked up|talked to|reached)\b/.test(lower)) {
            result.reached = 'Answered';
        } else if (/\b(voicemail|left a message|left message|\bvm\b)\b/.test(lower)) {
            result.reached = 'Voicemail';
        } else if (/\bno answer\b/.test(lower)) {
            result.reached = 'No Answer';
        } else if (/\b(emailed|sent (an |the )?email|email sent)\b/.test(lower)) {
            result.reached = 'Email Sent';
        } else if (/\breferred\b/.test(lower)) {
            result.reached = 'Referred';
        }

        // Method: the reached-outcome is the strongest signal (a mention of a
        // future "meeting" is usually the next step, not how the touch happened)
        if (/\blinkedin\b/.test(lower)) {
            result.method = 'LinkedIn';
        } else if (result.reached === 'Answered' || result.reached === 'No Answer') {
            result.method = 'Call';
        } else if (result.reached === 'Voicemail') {
            result.method = 'VM';
        } else if (result.reached === 'Email Sent' ||
            (/\b(emailed|sent (an |the )?email|email)\b/.test(lower) && !/\b(call|called)\b/.test(lower))) {
            result.method = 'Email';
        } else if (/\b(met with|had a meeting|meeting with|gave a demo|did a demo)\b/.test(lower)) {
            result.method = 'Meeting';
        } else {
            result.method = 'Call';
        }

        // Referral: "referred me to John Hill(,)? his maintenance manager"
        const refMatch = working.match(/referred (?:me )?(?:up )?to ([A-Z][\w'-]+(?: [A-Z][\w'-]+)?)(?:,? (?:his|her|their|the) ([\w ]+?))?(?=[,.;]|$)/);
        if (refMatch) {
            result.referredToName = refMatch[1] || '';
            result.referredToTitle = (refMatch[2] || '').trim();
            if (result.reached === 'Referred' && /\b(answered|spoke|talked)\b/.test(lower)) {
                result.reached = 'Answered';
            }
        }

        // Date: explicit M/D or M/D/YY(YY), else weekday word
        result.nextDate = resolveDate(working);

        // Comma-segment heuristics: seg1=company, seg2=contact if proper noun, seg3=title if keyword hit
        const segments = text.split(',').map(s => s.trim()).filter(Boolean);
        if (segments.length > 0) {
            result.company = segments[0];
        }
        if (segments.length > 1) {
            const seg = segments[1];
            if (/^[A-Z][\w'-]+( [A-Z][\w'-]+)+$/.test(seg)) {
                result.contactName = seg;
            }
        }
        if (segments.length > 2) {
            const seg = segments[2].toLowerCase();
            if (TITLE_KEYWORDS.some(k => seg.includes(k))) {
                result.contactTitle = segments[2];
            }
        }

        // Summary = full dump; nextSteps = clause after follow-up phrasing
        result.summary = text.trim();
        const nsMatch = text.match(/(?:next step[s]?|follow(?:ing)? up|meeting)(?:\s*(?:is|on|:|-)?\s*)(.+?)(?=[.;]|$)/i);
        if (nsMatch) {
            result.nextSteps = nsMatch[0].trim();
        }

        result.parser = 'heuristic';
        return result;
    }

    function resolveDate(text) {
        const today = new Date();
        // M/D or M/D/YY(YY)
        const mdMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
        if (mdMatch) {
            const month = parseInt(mdMatch[1], 10);
            const day = parseInt(mdMatch[2], 10);
            let year = mdMatch[3] ? parseInt(mdMatch[3], 10) : today.getFullYear();
            if (year < 100) year += 2000;
            let d = new Date(year, month - 1, day);
            // Year-roll: if no explicit year and date already passed, assume next year
            if (!mdMatch[3] && d < today && (today - d) > 86400000) {
                d = new Date(year + 1, month - 1, day);
            }
            if (!isNaN(d.getTime())) return toISODate(d);
        }
        // Weekday word -> next occurrence
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const wdMatch = text.toLowerCase().match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
        if (wdMatch) {
            const target = weekdays.indexOf(wdMatch[1]);
            const d = new Date(today);
            let delta = (target - d.getDay() + 7) % 7;
            if (delta === 0) delta = 7;
            d.setDate(d.getDate() + delta);
            return toISODate(d);
        }
        // "tomorrow"
        if (/\btomorrow\b/i.test(text)) {
            const d = new Date(today);
            d.setDate(d.getDate() + 1);
            return toISODate(d);
        }
        return '';
    }

    function toISODate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    // ---------------- Parse orchestration ----------------

    async function parseDump() {
        const input = document.getElementById('voiceDumpInput');
        const status = document.getElementById('parseStatus');
        const btn = document.getElementById('parseDumpBtn');
        const text = (input.value || '').trim();

        if (!text) {
            status.textContent = 'Nothing to parse — dictate or paste your note first.';
            return;
        }

        btn.disabled = true;
        const settings = getVoiceSettings();
        let parsed;

        if (settings.apiKey) {
            status.textContent = '🤖 AI parsing…';
            try {
                parsed = await parseWithClaude(text, settings.apiKey);
                status.textContent = '';
            } catch (err) {
                console.warn('Claude parse failed, using offline parser:', err);
                parsed = parseHeuristic(text);
                status.textContent = '⚠️ AI parse failed (' + (err.message || 'error') + ') — offline parser used. Review carefully.';
            }
        } else {
            parsed = parseHeuristic(text);
            status.textContent = 'Offline parser used (no API key set). Review the fields.';
        }

        btn.disabled = false;
        pendingParse = { fields: parsed, rawText: text };
        showReviewCard(parsed);
    }

    // ---------------- Fuzzy account matching ----------------

    const COMPANY_STOPWORDS = new Set(['inc', 'incorporated', 'llc', 'corp', 'corporation',
        'co', 'company', 'ltd', 'lp', 'foods', 'food', 'group', 'holdings', 'industries',
        'intl', 'international', 'usa', 'the', 'of', 'and']);

    function normalizeCompanyTokens(name) {
        const tokens = String(name || '').toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
        const filtered = tokens.filter(t => !COMPANY_STOPWORDS.has(t));
        return filtered.length > 0 ? filtered : tokens;
    }

    function buildAccountIndex() {
        const projects = (typeof allProjects !== 'undefined') ? allProjects : [];
        if (accountIndex && accountIndexSize === projects.length) {
            return accountIndex;
        }
        const entries = [];
        projects.forEach(project => {
            const projectId = project.PLANT_ID || project.PROJ_NAME;
            ['OWNER_NAME', 'PLANT_NAME', 'PARENTNAME', 'P_ULT_NAME'].forEach(field => {
                const val = (project[field] || '').trim();
                if (val) {
                    entries.push({
                        projectId: projectId,
                        displayName: val,
                        location: [(project.PLANT_CITY || '').trim(), (project.PLANT_ST || '').trim()].filter(Boolean).join(', '),
                        tokens: normalizeCompanyTokens(val),
                        isManual: false
                    });
                }
            });
        });
        // Include existing manual accounts so re-logging matches instead of duplicating
        Object.keys(bdmData).forEach(id => {
            const rec = bdmData[id];
            if (rec && rec.isManual && rec.accountName) {
                entries.push({
                    projectId: id,
                    displayName: rec.accountName + ' (manually added)',
                    location: [rec.city, rec.state].filter(Boolean).join(', '),
                    tokens: normalizeCompanyTokens(rec.accountName),
                    isManual: true
                });
            }
        });
        accountIndex = entries;
        accountIndexSize = projects.length;
        return entries;
    }

    // Called by app-all-ca.js after dataset changes
    window.invalidateAccountIndex = function () {
        accountIndex = null;
        accountIndexSize = -1;
    };

    function diceScore(tokensA, tokensB) {
        if (!tokensA.length || !tokensB.length) return 0;
        const setB = new Set(tokensB);
        const overlap = tokensA.filter(t => setB.has(t)).length;
        return (2 * overlap) / (tokensA.length + tokensB.length);
    }

    function matchAccounts(companyName) {
        if (!companyName) return [];
        const queryTokens = normalizeCompanyTokens(companyName);
        const queryStr = queryTokens.join(' ');
        const index = buildAccountIndex();
        const best = {}; // projectId -> {score, entry}

        index.forEach(entry => {
            let score = diceScore(queryTokens, entry.tokens);
            const entryStr = entry.tokens.join(' ');
            if (entryStr && queryStr && (entryStr.includes(queryStr) || queryStr.includes(entryStr))) {
                score += 0.15;
            }
            if (score > 0 && (!best[entry.projectId] || score > best[entry.projectId].score)) {
                best[entry.projectId] = { score: score, entry: entry };
            }
        });

        return Object.values(best)
            .filter(m => m.score >= 0.4)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }

    function createManualAccount(name) {
        const id = 'manual-' + Date.now();
        bdmData[id] = {
            stage: 'leads',
            interactions: [],
            isManual: true,
            accountName: name,
            city: '',
            state: '',
            createdAt: new Date().toISOString()
        };
        saveBDMData();
        window.invalidateAccountIndex();
        return id;
    }

    // ---------------- Review & confirm card ----------------

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function showReviewCard(parsed) {
        const card = document.getElementById('reviewCard');
        const matches = matchAccounts(parsed.company);
        const today = toISODate(new Date());
        const preselectTop = matches.length > 0 && matches[0].score >= 0.85;

        const methodOptions = ['Call', 'Email', 'VM', 'Meeting', 'LinkedIn', 'Other']
            .map(m => '<option value="' + m + '"' + (parsed.method === m ? ' selected' : '') + '>' + m + '</option>').join('');
        const reachedOptions = ['', 'Answered', 'Voicemail', 'No Answer', 'Email Sent', 'Referred']
            .map(r => '<option value="' + r + '"' + (parsed.reached === r ? ' selected' : '') + '>' + (r || '—') + '</option>').join('');

        const matchRadios = matches.map((m, i) =>
            '<label class="match-option">' +
            '<input type="radio" name="accountMatch" value="' + esc(m.entry.projectId) + '"' + ((preselectTop && i === 0) ? ' checked' : '') + '>' +
            ' ' + esc(m.entry.displayName) +
            (m.entry.location ? ' — ' + esc(m.entry.location) : '') +
            ' <span class="match-score">(' + Math.round(m.score * 100) + '%)</span>' +
            '</label>'
        ).join('');

        card.innerHTML =
            '<h3>✅ Review & Confirm' + (parsed.parser === 'heuristic' ? ' <span class="parser-tag">offline parse</span>' : '') + '</h3>' +
            '<div class="review-grid">' +
            '<label>Company<input type="text" id="rv_company" value="' + esc(parsed.company) + '"></label>' +
            '<label>Contact<input type="text" id="rv_contactName" value="' + esc(parsed.contactName) + '"></label>' +
            '<label>Title<input type="text" id="rv_contactTitle" value="' + esc(parsed.contactTitle) + '"></label>' +
            '<label>Phone<input type="text" id="rv_phone" value="' + esc(parsed.phone) + '"></label>' +
            '<label>Email<input type="text" id="rv_email" value="' + esc(parsed.email) + '"></label>' +
            '<label>Date<input type="date" id="rv_date" value="' + today + '"></label>' +
            '<label>Method<select id="rv_method">' + methodOptions + '</select></label>' +
            '<label>Reached?<select id="rv_reached">' + reachedOptions + '</select></label>' +
            '<label class="review-wide">What happened<textarea id="rv_summary" rows="3">' + esc(parsed.summary) + '</textarea></label>' +
            '<label class="review-wide">Next step<input type="text" id="rv_nextSteps" value="' + esc(parsed.nextSteps) + '"></label>' +
            '<label>Next date<input type="date" id="rv_nextDate" value="' + esc(parsed.nextDate) + '"></label>' +
            '<label>Referred to<input type="text" id="rv_referredTo" value="' + esc(parsed.referredToName + (parsed.referredToTitle ? ' (' + parsed.referredToTitle + ')' : '')) + '"></label>' +
            '</div>' +
            '<div class="match-block">' +
            '<h4>📌 File under account:</h4>' +
            matchRadios +
            '<label class="match-option">' +
            '<input type="radio" name="accountMatch" value="__new__"' + (preselectTop ? '' : ' checked') + '>' +
            ' ➕ Create new account: <strong id="newAccountName">' + esc(parsed.company || '(enter company above)') + '</strong>' +
            '</label>' +
            '</div>' +
            '<div class="review-actions">' +
            '<button id="confirmLogBtn" class="primary-btn">✔ Confirm & File</button>' +
            '<button id="cancelLogBtn" class="secondary-btn">Cancel</button>' +
            '</div>';

        card.style.display = 'block';
        document.getElementById('confirmLogBtn').addEventListener('click', confirmLogEntry);
        document.getElementById('cancelLogBtn').addEventListener('click', function () {
            card.style.display = 'none';
            pendingParse = null;
        });
        // Keep "create new" label synced with edits to Company
        document.getElementById('rv_company').addEventListener('input', function (e) {
            document.getElementById('newAccountName').textContent = e.target.value || '(enter company above)';
        });
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---------------- Confirm & file ----------------

    function confirmLogEntry() {
        const card = document.getElementById('reviewCard');
        const status = document.getElementById('parseStatus');

        const company = document.getElementById('rv_company').value.trim();
        const selected = document.querySelector('input[name="accountMatch"]:checked');
        if (!selected) {
            status.textContent = 'Pick an account (or "Create new") before confirming.';
            return;
        }
        if (selected.value === '__new__' && !company) {
            status.textContent = 'Enter a company name to create a new account.';
            return;
        }

        const targetId = selected.value === '__new__' ? createManualAccount(company) : selected.value;

        // Parse the referredTo field back to {name, title}
        const refRaw = document.getElementById('rv_referredTo').value.trim();
        let referredTo = null;
        if (refRaw) {
            const refMatch = refRaw.match(/^(.*?)(?:\s*\((.*)\))?$/);
            referredTo = { name: (refMatch[1] || '').trim(), title: (refMatch[2] || '').trim() };
        }

        const method = document.getElementById('rv_method').value;
        const legacyType = (method === 'LinkedIn') ? 'Other' : method;
        const settings = getVoiceSettings();

        const interaction = {
            date: document.getElementById('rv_date').value || toISODate(new Date()),
            type: legacyType,
            rep: settings.repName,
            details: document.getElementById('rv_summary').value.trim(),
            nextSteps: document.getElementById('rv_nextSteps').value.trim(),
            followUpDate: document.getElementById('rv_nextDate').value || '',
            contactName: document.getElementById('rv_contactName').value.trim(),
            contactTitle: document.getElementById('rv_contactTitle').value.trim(),
            phone: document.getElementById('rv_phone').value.trim(),
            email: document.getElementById('rv_email').value.trim(),
            method: method,
            reached: document.getElementById('rv_reached').value,
            referredTo: referredTo,
            source: 'voice',
            createdAt: new Date().toISOString()
        };

        const bdm = getBDMData(targetId);
        bdm.interactions.push(interaction);
        bdm.interactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Stage auto-bump (never downgrade)
        const stageOrder = ['leads', 'qualified/contacted', 'followup', 'won'];
        let newStage = bdm.stage || 'leads';
        if (stageOrder.indexOf(newStage) < 1) newStage = 'qualified/contacted';
        if (interaction.followUpDate && stageOrder.indexOf(newStage) < 2) newStage = 'followup';
        bdm.stage = newStage;

        updateBDMData(targetId, bdm);

        // Reset UI + refresh
        card.style.display = 'none';
        document.getElementById('voiceDumpInput').value = '';
        pendingParse = null;
        status.textContent = '✅ Filed under "' + (selected.value === '__new__' ? company : selected.parentElement.textContent.trim().split(' — ')[0]) + '" — stage: ' + newStage;
        setTimeout(() => { if (status.textContent.startsWith('✅')) status.textContent = ''; }, 6000);

        renderKPIs();
        renderFollowUpQueue();
        if (typeof renderKanbanBoard === 'function') {
            try { renderKanbanBoard(); } catch (e) { /* kanban not visible */ }
        }
    }

    // ---------------- KPI scorecard ----------------

    function startOfWeek(d) {
        const day = d.getDay(); // 0=Sun
        const diff = (day === 0) ? -6 : 1 - day; // Monday start
        const monday = new Date(d);
        monday.setDate(d.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    function computeKPIs() {
        const todayStr = toISODate(new Date());
        const weekStart = startOfWeek(new Date());
        const zero = () => ({ dials: 0, conversations: 0, voicemails: 0, emails: 0, meetings: 0, touches: 0 });
        const today = zero();
        const week = zero();

        Object.keys(bdmData).forEach(id => {
            const rec = bdmData[id];
            if (!rec || !Array.isArray(rec.interactions)) return;
            rec.interactions.forEach(it => {
                if (!it.date) return;
                const d = new Date(it.date + 'T12:00:00');
                if (isNaN(d.getTime())) return;
                const buckets = [];
                if (it.date === todayStr) buckets.push(today);
                if (d >= weekStart) buckets.push(week);
                if (!buckets.length) return;

                const isDial = it.type === 'Call' || it.type === 'VM' || it.method === 'Call' || it.method === 'VM';
                const isConvo = it.reached === 'Answered';
                const isVM = it.reached === 'Voicemail' || it.type === 'VM' || it.method === 'VM';
                const isEmail = it.type === 'Email' || it.method === 'Email' || it.reached === 'Email Sent';
                const isMeeting = it.type === 'Meeting' || it.method === 'Meeting' || /meeting|demo/i.test(it.nextSteps || '');

                buckets.forEach(b => {
                    b.touches += 1;
                    if (isDial) b.dials += 1;
                    if (isConvo) b.conversations += 1;
                    if (isVM) b.voicemails += 1;
                    if (isEmail) b.emails += 1;
                    if (isMeeting) b.meetings += 1;
                });
            });
        });
        return { today: today, week: week };
    }

    function kpiTile(label, value, target, weekValue) {
        const hasTarget = typeof target === 'number';
        const cls = hasTarget ? (value >= target ? 'kpi-ok' : 'kpi-behind') : '';
        return '<div class="kpi-tile ' + cls + '">' +
            '<div class="kpi-value">' + value + (hasTarget ? '<span class="kpi-target">/' + target + '</span>' : '') + '</div>' +
            '<div class="kpi-label">' + label + '</div>' +
            '<div class="kpi-week">wk: ' + weekValue + '</div>' +
            '</div>';
    }

    function renderKPIs() {
        const strip = document.getElementById('kpiStrip');
        if (!strip) return;
        const k = computeKPIs();
        const t = getVoiceSettings().targets;
        strip.innerHTML =
            '<div class="kpi-title">📊 Today\'s Scorecard</div>' +
            kpiTile('Dials', k.today.dials, t.dials, k.week.dials) +
            kpiTile('Conversations', k.today.conversations, t.conversations, k.week.conversations) +
            kpiTile('Touches', k.today.touches, t.touches, k.week.touches) +
            kpiTile('Voicemails', k.today.voicemails, null, k.week.voicemails) +
            kpiTile('Emails', k.today.emails, null, k.week.emails) +
            kpiTile('Mtgs booked', k.today.meetings, null, k.week.meetings);
    }

    // ---------------- Follow-up queue ----------------

    function accountDisplayName(id) {
        const rec = bdmData[id];
        if (rec && rec.isManual) return rec.accountName || id;
        const projects = (typeof allProjects !== 'undefined') ? allProjects : [];
        const project = projects.find(p => (p.PLANT_ID || p.PROJ_NAME) === id);
        if (project) return project.OWNER_NAME || project.PLANT_NAME || project.PROJ_NAME || id;
        return id;
    }

    function renderFollowUpQueue() {
        const queue = document.getElementById('followUpQueue');
        if (!queue) return;
        const todayStr = toISODate(new Date());
        const due = [];

        Object.keys(bdmData).forEach(id => {
            const rec = bdmData[id];
            if (!rec || !Array.isArray(rec.interactions)) return;
            rec.interactions.forEach((it, idx) => {
                if (it.followUpDate && it.followUpDate <= todayStr) {
                    due.push({ id: id, idx: idx, it: it });
                }
            });
        });

        due.sort((a, b) => a.it.followUpDate.localeCompare(b.it.followUpDate));

        if (!due.length) {
            queue.innerHTML = '<p class="queue-empty">🎉 Nothing due. Go make some dials.</p>';
            return;
        }

        queue.innerHTML = due.map(d => {
            const overdue = d.it.followUpDate < todayStr;
            const phone = (d.it.phone || '').trim();
            return '<div class="queue-item ' + (overdue ? 'queue-overdue' : '') + '" data-account="' + esc(d.id) + '" data-idx="' + d.idx + '">' +
                '<div class="queue-head">' +
                '<strong>' + esc(accountDisplayName(d.id)) + '</strong>' +
                '<span class="queue-date">' + (overdue ? '⚠️ ' : '📅 ') + esc(d.it.followUpDate) + '</span>' +
                '</div>' +
                '<div class="queue-body">' +
                esc(d.it.contactName || '') + (d.it.contactTitle ? ' — ' + esc(d.it.contactTitle) : '') +
                (phone ? ' · <a href="tel:' + esc(phone) + '">' + esc(phone) + '</a>' : '') +
                '</div>' +
                (d.it.nextSteps ? '<div class="queue-next">→ ' + esc(d.it.nextSteps) + '</div>' : '') +
                '<button class="queue-done secondary-btn">Done ✓</button>' +
                '</div>';
        }).join('');

        queue.querySelectorAll('.queue-done').forEach(btn => {
            btn.addEventListener('click', function () {
                const item = this.closest('.queue-item');
                const id = item.getAttribute('data-account');
                const idx = parseInt(item.getAttribute('data-idx'), 10);
                const rec = bdmData[id];
                if (rec && rec.interactions[idx]) {
                    rec.interactions[idx].followUpDate = '';
                    saveBDMData();
                }
                renderFollowUpQueue();
                renderKPIs();
            });
        });
    }

    // ---------------- Salesforce Task CSV export ----------------

    const SF_TASK_COLUMNS = ['Subject', 'Type', 'ActivityDate', 'Status', 'Priority',
        'Description', 'Company', 'ContactName', 'ContactTitle', 'Phone', 'Email',
        'NextStep', 'NextStepDate'];

    function csvEscape(v) {
        const s = String(v == null ? '' : v);
        if (/[",\n\r]/.test(s)) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function exportSalesforceCSV() {
        const start = document.getElementById('sfExportStart').value;
        const end = document.getElementById('sfExportEnd').value;
        const status = document.getElementById('parseStatus');
        const rows = [SF_TASK_COLUMNS.join(',')];

        Object.keys(bdmData).forEach(id => {
            const rec = bdmData[id];
            if (!rec || !Array.isArray(rec.interactions)) return;
            const company = accountDisplayName(id);
            rec.interactions.forEach(it => {
                if (!it.date) return;
                if (start && it.date < start) return;
                if (end && it.date > end) return;

                const sfType = (it.type === 'VM' || it.method === 'VM') ? 'Call' : (it.type || 'Call');
                const subject = sfType + ' - ' + company + ' - ' + (it.contactName || 'Unknown') +
                    ' (' + (it.reached || it.type || '') + ')';
                let description = it.details || '';
                if (it.referredTo && it.referredTo.name) {
                    description += ' | Referred to: ' + it.referredTo.name +
                        (it.referredTo.title ? ' (' + it.referredTo.title + ')' : '');
                }
                if (it.nextSteps) {
                    description += ' | Next: ' + it.nextSteps;
                }

                rows.push([
                    subject, sfType, it.date, 'Completed', 'Normal', description,
                    company, it.contactName || '', it.contactTitle || '',
                    it.phone || '', it.email || '', it.nextSteps || '', it.followUpDate || ''
                ].map(csvEscape).join(','));
            });
        });

        if (rows.length === 1) {
            status.textContent = 'No interactions in that date range.';
            return;
        }

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Salesforce_Tasks_' + (start || 'all') + '_to_' + (end || 'all') + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        status.textContent = '📤 Exported ' + (rows.length - 1) + ' task rows for Salesforce import.';
    }

    // ---------------- Init & render ----------------

    window.renderVoiceLog = function () {
        renderKPIs();
        renderFollowUpQueue();
    };

    function loadSettingsIntoForm() {
        const s = getVoiceSettings();
        document.getElementById('settingsApiKey').value = s.apiKey;
        document.getElementById('settingsRepName').value = s.repName;
        document.getElementById('settingsTargetDials').value = s.targets.dials;
        document.getElementById('settingsTargetConvos').value = s.targets.conversations;
        document.getElementById('settingsTargetTouches').value = s.targets.touches;
    }

    function initVoiceLog() {
        const parseBtn = document.getElementById('parseDumpBtn');
        if (!parseBtn) return; // voice view not present

        parseBtn.addEventListener('click', parseDump);

        // Ctrl+Enter / Cmd+Enter in the textarea triggers parse
        document.getElementById('voiceDumpInput').addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') parseDump();
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', function () {
            const s = {
                apiKey: document.getElementById('settingsApiKey').value.trim(),
                repName: document.getElementById('settingsRepName').value.trim() || 'Kyle Sanders',
                targets: {
                    dials: parseInt(document.getElementById('settingsTargetDials').value, 10) || DEFAULT_TARGETS.dials,
                    conversations: parseInt(document.getElementById('settingsTargetConvos').value, 10) || DEFAULT_TARGETS.conversations,
                    touches: parseInt(document.getElementById('settingsTargetTouches').value, 10) || DEFAULT_TARGETS.touches
                }
            };
            saveVoiceSettings(s);
            document.getElementById('settingsStatus').textContent = 'Saved ✓';
            setTimeout(() => { document.getElementById('settingsStatus').textContent = ''; }, 3000);
            renderKPIs();
        });

        document.getElementById('exportSalesforceBtn').addEventListener('click', exportSalesforceCSV);

        // Dataset add button
        const addBtn = document.getElementById('addDatasetBtn');
        const addInput = document.getElementById('addDatasetInput');
        if (addBtn && addInput) {
            addBtn.addEventListener('click', () => addInput.click());
            addInput.addEventListener('change', handleAddDataset);
        }

        // Default export range: current week
        const monday = startOfWeek(new Date());
        document.getElementById('sfExportStart').value = toISODate(monday);
        document.getElementById('sfExportEnd').value = toISODate(new Date());

        loadSettingsIntoForm();
    }

    // ---------------- Multi-dataset additive import ----------------

    function handleAddDataset(event) {
        const file = event.target.files[0];
        const status = document.getElementById('datasetStatus');
        if (!file) return;

        status.textContent = 'Loading ' + file.name + '…';
        const reader = new FileReader();
        reader.onload = function (e) {
            Papa.parse(e.target.result, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    try {
                        // Dedupe on PLANT_ID + PROJ_NAME: a plant can host several
                        // distinct projects, so PLANT_ID alone would drop real rows
                        const projectKey = p => String(p.PLANT_ID || '') + '||' + String((p.PROJ_NAME || '')).trim();
                        const existingKeys = new Set(allProjects.map(projectKey));
                        let added = 0, skipped = 0;
                        results.data.forEach(row => {
                            // Trim keys (some IIR exports pad headers with spaces)
                            const clean = {};
                            Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
                            const key = projectKey(clean);
                            if (key === '||' || existingKeys.has(key)) { skipped++; return; }
                            existingKeys.add(key);
                            allProjects.push(clean);
                            added++;
                        });

                        if (added > 0) {
                            // Re-run the standard pipeline (processProjects re-normalizes everything)
                            processProjects();
                            populateIndustryFilter();
                            populateFilters();
                            renderMarkers();
                            updateStatistics();
                            updateIndustryBreakdown();
                            window.invalidateAccountIndex();
                        }
                        status.textContent = '✅ ' + added + ' projects added from ' + file.name +
                            (skipped ? ' (' + skipped + ' duplicates/invalid skipped)' : '');
                    } catch (err) {
                        console.error('Dataset merge failed:', err);
                        status.textContent = '❌ Merge failed: ' + err.message;
                    }
                },
                error: function (err) {
                    status.textContent = '❌ Could not parse ' + file.name + ': ' + err.message;
                }
            });
        };
        reader.onerror = function () {
            status.textContent = '❌ Could not read file.';
        };
        reader.readAsText(file);
        event.target.value = ''; // allow re-selecting the same file
    }

    document.addEventListener('DOMContentLoaded', initVoiceLog);
})();
