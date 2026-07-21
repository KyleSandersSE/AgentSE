// ============================================================
// quiz.js — Discovery Quiz flow engine
// Depends on quiz-data.js (PILLARS, QUESTIONS, DEEP_DIVES,
// PIVOTS, MAIN_FLOW, SLIDE_MAP, NEXT_STEPS, DIVE_THRESHOLD)
// ============================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'discoveryQuizSession';

    // ---------------- State ----------------

    function freshState() {
        const scores = {};
        PILLARS.forEach(function (p) { scores[p.id] = 0; });
        return {
            session: { customer: '', industry: '', platform: '', attendees: '', date: todayStr() },
            scores: scores,
            // queue of steps still to run: {type:'question'|'pivot', ref, bank?}
            queue: MAIN_FLOW.slice(),
            answered: [],          // log: {kind, text, selected[], note, pillarTag}
            divesTaken: [],        // pillar ids
            divesDismissed: [],    // pillar ids the rep dismissed
            ranking: null,         // ordered pillar ids after ranking screen
            notes: '',
            phase: 'setup'         // setup | flow | ranking | summary
        };
    }

    let state = freshState();
    let currentSelection = [];     // option indices selected on current card

    // ---------------- Utilities ----------------

    function todayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    function $(id) { return document.getElementById(id); }

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function pillarById(id) {
        return PILLARS.find(function (p) { return p.id === id; });
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    function currentStep() {
        return state.queue.length ? state.queue[0] : null;
    }

    function getQuestion(step) {
        if (step.bank) {
            return DEEP_DIVES[step.bank].find(function (q) { return q.id === step.ref; });
        }
        return QUESTIONS[step.ref];
    }

    // ---------------- Scoring ----------------

    function applyWeights(weights) {
        Object.keys(weights || {}).forEach(function (pid) {
            if (state.scores[pid] != null) state.scores[pid] += weights[pid];
        });
    }

    function rankedPillars() {
        return PILLARS.slice().sort(function (a, b) {
            return state.scores[b.id] - state.scores[a.id];
        });
    }

    function hotPillars() {
        return PILLARS.filter(function (p) {
            return state.scores[p.id] >= DIVE_THRESHOLD &&
                state.divesTaken.indexOf(p.id) === -1 &&
                state.divesDismissed.indexOf(p.id) === -1 &&
                DEEP_DIVES[p.id];
        });
    }

    // ---------------- Deep dives ----------------

    function startDive(pillarId) {
        if (state.divesTaken.indexOf(pillarId) !== -1 || !DEEP_DIVES[pillarId]) return;
        state.divesTaken.push(pillarId);
        const steps = DEEP_DIVES[pillarId].map(function (q) {
            return { type: 'question', ref: q.id, bank: pillarId };
        });
        // Insert dive questions at the front of the queue
        state.queue = steps.concat(state.queue);
        const p = pillarById(pillarId);
        state.answered.push({ kind: 'dive', text: '— Deep dive: ' + p.name + ' —', selected: [], pillarTag: pillarId });
        save();
        render();
    }

    function dismissDive(pillarId) {
        if (state.divesDismissed.indexOf(pillarId) === -1) state.divesDismissed.push(pillarId);
        save();
        render();
    }

    // ---------------- Flow control ----------------

    function advance() {
        state.queue.shift();
        currentSelection = [];
        if (!state.queue.length) {
            state.phase = 'ranking';
            if (!state.ranking) {
                state.ranking = rankedPillars()
                    .filter(function (p) { return state.scores[p.id] > 0; })
                    .map(function (p) { return p.id; });
            }
        }
        save();
        render();
    }

    function logQuestionAnswer(q, step) {
        const labels = currentSelection.map(function (i) { return q.options[i].label; });
        currentSelection.forEach(function (i) { applyWeights(q.options[i].weights); });
        state.answered.push({
            kind: step.bank ? 'dive-q' : 'question',
            text: q.text,
            selected: labels,
            pillarTag: step.bank || null
        });
    }

    function logPivotChoice(pivot, idx) {
        const c = pivot.choices[idx];
        applyWeights(c.weights);
        state.answered.push({
            kind: 'pivot',
            text: pivot.title,
            selected: [c.label],
            deckKey: c.deckKey
        });
    }

    // ---------------- Rendering ----------------

    function render() {
        renderHeaderStats();
        renderSidebar();
        const stage = $('stage');
        if (state.phase === 'setup') { stage.innerHTML = renderSetup(); bindSetup(); return; }
        if (state.phase === 'ranking') { stage.innerHTML = renderRanking(); bindRanking(); return; }
        if (state.phase === 'summary') { stage.innerHTML = renderSummary(); bindSummary(); return; }
        // flow
        const step = currentStep();
        if (!step) { state.phase = 'ranking'; render(); return; }
        if (step.type === 'pivot') {
            stage.innerHTML = renderPivot(PIVOTS[step.ref]);
            bindPivot(PIVOTS[step.ref]);
        } else {
            const q = getQuestion(step);
            stage.innerHTML = renderQuestion(q, step);
            bindQuestion(q, step);
        }
    }

    function renderHeaderStats() {
        const answeredCount = state.answered.filter(function (a) { return a.kind !== 'dive'; }).length;
        $('statAnswered').textContent = answeredCount;
        $('statDives').textContent = state.divesTaken.length;
        const top = rankedPillars()[0];
        $('statTop').textContent = (top && state.scores[top.id] > 0) ? (top.icon + ' ' + top.name) : '—';
    }

    function renderSidebar() {
        // Priority map bars
        const max = Math.max.apply(null, PILLARS.map(function (p) { return state.scores[p.id]; }).concat([1]));
        $('priorityMap').innerHTML = rankedPillars().map(function (p) {
            const v = state.scores[p.id];
            const pct = Math.round((v / max) * 100);
            return '<div class="pbar-row" title="' + esc(p.name) + ': ' + v + ' pts">' +
                '<span class="pbar-label">' + p.icon + ' ' + esc(p.name) + '</span>' +
                '<div class="pbar-track"><div class="pbar-fill" style="width:' + pct + '%;background:' + p.color + '"></div></div>' +
                '<span class="pbar-val">' + v + '</span>' +
                '</div>';
        }).join('');

        // Hot pillar dive suggestions
        const hot = hotPillars();
        const box = $('diveSuggestions');
        if (state.phase === 'flow' && hot.length) {
            box.style.display = '';
            box.innerHTML = '<h3>🔥 They lit up on…</h3>' + hot.map(function (p) {
                return '<div class="dive-chip">' +
                    '<span>' + p.icon + ' ' + esc(p.name) + '</span>' +
                    '<span class="dive-chip-btns">' +
                    '<button class="mini-btn" data-dive="' + p.id + '">Dive deeper</button>' +
                    '<button class="mini-btn ghost" data-dismiss="' + p.id + '">✕</button>' +
                    '</span></div>';
            }).join('');
            box.querySelectorAll('[data-dive]').forEach(function (b) {
                b.onclick = function () { startDive(b.getAttribute('data-dive')); };
            });
            box.querySelectorAll('[data-dismiss]').forEach(function (b) {
                b.onclick = function () { dismissDive(b.getAttribute('data-dismiss')); };
            });
        } else {
            box.style.display = 'none';
        }

        // Manual dives
        const manual = $('manualDives');
        if (state.phase === 'flow') {
            manual.style.display = '';
            manual.querySelector('.manual-dive-list').innerHTML = PILLARS
                .filter(function (p) { return DEEP_DIVES[p.id] && state.divesTaken.indexOf(p.id) === -1; })
                .map(function (p) {
                    return '<button class="mini-btn ghost" data-mdive="' + p.id + '">' + p.icon + ' ' + esc(p.name) + '</button>';
                }).join('') || '<em>All deep dives used</em>';
            manual.querySelectorAll('[data-mdive]').forEach(function (b) {
                b.onclick = function () { startDive(b.getAttribute('data-mdive')); };
            });
        } else {
            manual.style.display = 'none';
        }

        // History
        $('historyLog').innerHTML = state.answered.slice().reverse().map(function (a) {
            if (a.kind === 'dive') return '<div class="hist-item hist-dive">' + esc(a.text) + '</div>';
            return '<div class="hist-item"><div class="hist-q">' + esc(a.text) + '</div>' +
                '<div class="hist-a">' + (a.selected.length ? esc(a.selected.join('; ')) : '<em>skipped</em>') + '</div></div>';
        }).join('') || '<em class="muted">Answers will appear here as you log them.</em>';

        // Notes persist
        const notes = $('sessionNotes');
        if (notes.value !== state.notes) notes.value = state.notes;
    }

    // ---- Setup screen ----

    function renderSetup() {
        const s = state.session;
        return '' +
            '<div class="card">' +
            '<h2>🧭 New Discovery Session</h2>' +
            '<p class="muted">Fill this out before (or at the start of) the meeting. It frames the summary sheet you\'ll review with the customer at the end.</p>' +
            '<div class="form-grid">' +
            '<label>Customer / Account<input type="text" id="fCustomer" value="' + esc(s.customer) + '" placeholder="e.g. Acme Foods — Modesto plant"></label>' +
            '<label>Industry<select id="fIndustry">' +
            INDUSTRIES.map(function (i) {
                return '<option' + (s.industry === i ? ' selected' : '') + '>' + esc(i) + '</option>';
            }).join('') +
            '</select></label>' +
            '<label>Current control platform(s)<input type="text" id="fPlatform" value="' + esc(s.platform) + '" placeholder="e.g. Legacy PLC-5, mixed vendors"></label>' +
            '<label>Attendees / roles<input type="text" id="fAttendees" value="' + esc(s.attendees) + '" placeholder="e.g. Plant Mgr, Controls Lead, IT"></label>' +
            '<label>Date<input type="date" id="fDate" value="' + esc(s.date) + '"></label>' +
            '</div>' +
            '<div class="btn-row"><button class="primary-btn" id="startBtn">Start Discovery →</button></div>' +
            '</div>';
    }

    function bindSetup() {
        $('startBtn').onclick = function () {
            state.session.customer = $('fCustomer').value.trim();
            state.session.industry = $('fIndustry').value;
            state.session.platform = $('fPlatform').value.trim();
            state.session.attendees = $('fAttendees').value.trim();
            state.session.date = $('fDate').value || todayStr();
            state.phase = 'flow';
            save();
            render();
        };
    }

    // ---- Question card ----

    function renderQuestion(q, step) {
        const diveTag = step.bank
            ? '<div class="dive-tag" style="border-color:' + pillarById(step.bank).color + '">' +
              pillarById(step.bank).icon + ' Deep dive: ' + esc(pillarById(step.bank).name) + '</div>'
            : '';
        return '' +
            '<div class="card">' +
            diveTag +
            '<h2>' + esc(q.text) + '</h2>' +
            (q.talkTrack ? '<details class="talk-track" open><summary>💬 Talk track (only you see this)</summary><p>' + esc(q.talkTrack) + '</p></details>' : '') +
            (q.multi ? '<p class="muted">Select all that apply.</p>' : '') +
            '<div class="options" id="optList">' +
            q.options.map(function (o, i) {
                return '<button class="option-btn" data-idx="' + i + '">' + esc(o.label) + '</button>';
            }).join('') +
            '</div>' +
            '<div class="btn-row">' +
            '<button class="primary-btn" id="logBtn" disabled>Log answer →</button>' +
            '<button class="secondary-btn" id="skipBtn">Skip</button>' +
            '</div>' +
            '</div>';
    }

    function bindQuestion(q, step) {
        const btns = $('optList').querySelectorAll('.option-btn');
        btns.forEach(function (b) {
            b.onclick = function () {
                const idx = parseInt(b.getAttribute('data-idx'), 10);
                const pos = currentSelection.indexOf(idx);
                if (q.multi) {
                    if (pos === -1) currentSelection.push(idx); else currentSelection.splice(pos, 1);
                } else {
                    currentSelection = (pos === -1) ? [idx] : [];
                }
                btns.forEach(function (bb) {
                    const i = parseInt(bb.getAttribute('data-idx'), 10);
                    bb.classList.toggle('selected', currentSelection.indexOf(i) !== -1);
                });
                $('logBtn').disabled = currentSelection.length === 0;
            };
        });
        $('logBtn').onclick = function () {
            logQuestionAnswer(q, step);
            advance();
        };
        $('skipBtn').onclick = function () {
            state.answered.push({ kind: step.bank ? 'dive-q' : 'question', text: q.text, selected: [], pillarTag: step.bank || null });
            advance();
        };
    }

    // ---- Pivot card ----

    function renderPivot(pivot) {
        return '' +
            '<div class="card pivot-card">' +
            '<div class="pivot-banner">🎯 Hand them the wheel</div>' +
            '<h2>' + esc(pivot.title) + '</h2>' +
            (pivot.talkTrack ? '<details class="talk-track" open><summary>💬 Talk track (only you see this)</summary><p>' + esc(pivot.talkTrack) + '</p></details>' : '') +
            '<div class="pivot-choices">' +
            pivot.choices.map(function (c, i) {
                return '<button class="pivot-choice" data-idx="' + i + '">' +
                    '<span class="pivot-choice-label">' + esc(c.label) + '</span>' +
                    '<span class="pivot-choice-desc">' + esc(c.desc) + '</span>' +
                    '</button>';
            }).join('') +
            '</div>' +
            '<div id="pivotJump"></div>' +
            '<div class="btn-row">' +
            '<button class="primary-btn" id="pivotNext" style="display:none">Continue →</button>' +
            '<button class="secondary-btn" id="pivotSkip">Skip</button>' +
            '</div>' +
            '</div>';
    }

    function bindPivot(pivot) {
        let chosen = -1;
        const choices = document.querySelectorAll('.pivot-choice');
        choices.forEach(function (b) {
            b.onclick = function () {
                chosen = parseInt(b.getAttribute('data-idx'), 10);
                choices.forEach(function (bb) { bb.classList.remove('selected'); });
                b.classList.add('selected');
                const key = pivot.choices[chosen].deckKey;
                $('pivotJump').innerHTML = SLIDE_MAP[key]
                    ? '<div class="jump-callout">📽️ ' + esc(SLIDE_MAP[key]) + '</div>'
                    : '';
                $('pivotNext').style.display = '';
            };
        });
        $('pivotNext').onclick = function () {
            logPivotChoice(pivot, chosen);
            advance();
        };
        $('pivotSkip').onclick = function () {
            state.answered.push({ kind: 'pivot', text: pivot.title, selected: [] });
            advance();
        };
    }

    // ---- Ranking screen ----

    function renderRanking() {
        if (!state.ranking || !state.ranking.length) {
            return '<div class="card"><h2>No priorities scored</h2>' +
                '<p class="muted">Nothing was logged this session.</p>' +
                '<div class="btn-row"><button class="primary-btn" id="toSummaryBtn">Finish anyway →</button></div></div>';
        }
        return '' +
            '<div class="card">' +
            '<h2>📋 The ranking close</h2>' +
            '<p class="talk-track-inline">💬 <em>"Based on our conversation, here\'s how I heard your priorities. Can we rank these together so I make sure we focus where it matters most to you?"</em></p>' +
            '<p class="muted">Reorder with the arrows until the customer agrees, then confirm.</p>' +
            '<div id="rankList" class="rank-list">' +
            state.ranking.map(function (pid, i) {
                const p = pillarById(pid);
                return '<div class="rank-item" style="border-left-color:' + p.color + '">' +
                    '<span class="rank-num">' + (i + 1) + '</span>' +
                    '<span class="rank-name">' + p.icon + ' ' + esc(p.name) + '</span>' +
                    '<span class="rank-score">' + state.scores[pid] + ' pts</span>' +
                    '<span class="rank-btns">' +
                    '<button class="mini-btn" data-up="' + i + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
                    '<button class="mini-btn" data-down="' + i + '"' + (i === state.ranking.length - 1 ? ' disabled' : '') + '>↓</button>' +
                    '</span></div>';
            }).join('') +
            '</div>' +
            '<div class="btn-row"><button class="primary-btn" id="toSummaryBtn">Customer confirmed — build summary →</button></div>' +
            '</div>';
    }

    function bindRanking() {
        document.querySelectorAll('[data-up]').forEach(function (b) {
            b.onclick = function () {
                const i = parseInt(b.getAttribute('data-up'), 10);
                const t = state.ranking[i - 1];
                state.ranking[i - 1] = state.ranking[i];
                state.ranking[i] = t;
                save(); render();
            };
        });
        document.querySelectorAll('[data-down]').forEach(function (b) {
            b.onclick = function () {
                const i = parseInt(b.getAttribute('data-down'), 10);
                const t = state.ranking[i + 1];
                state.ranking[i + 1] = state.ranking[i];
                state.ranking[i] = t;
                save(); render();
            };
        });
        $('toSummaryBtn').onclick = function () {
            state.phase = 'summary';
            save(); render();
        };
    }

    // ---- Summary ----

    function buildMarkdown() {
        const s = state.session;
        const lines = [];
        lines.push('# Discovery Summary — ' + (s.customer || 'Unnamed account'));
        lines.push('');
        lines.push('- **Date:** ' + s.date);
        lines.push('- **Industry:** ' + s.industry);
        if (s.platform) lines.push('- **Current platform(s):** ' + s.platform);
        if (s.attendees) lines.push('- **Attendees:** ' + s.attendees);
        lines.push('');
        lines.push('## Confirmed priorities (ranked with customer)');
        lines.push('');
        (state.ranking || []).forEach(function (pid, i) {
            const p = pillarById(pid);
            lines.push((i + 1) + '. **' + p.name + '** (' + state.scores[pid] + ' pts)');
        });
        lines.push('');
        lines.push('## Recommended next steps (top 3 priorities)');
        lines.push('');
        (state.ranking || []).slice(0, 3).forEach(function (pid) {
            const p = pillarById(pid);
            lines.push('### ' + p.name);
            (NEXT_STEPS[pid] || []).forEach(function (n) { lines.push('- [ ] ' + n); });
            lines.push('');
        });
        lines.push('## Conversation log');
        lines.push('');
        state.answered.forEach(function (a) {
            if (a.kind === 'dive') { lines.push('**' + a.text + '**'); return; }
            lines.push('- **Q:** ' + a.text);
            lines.push('  - **A:** ' + (a.selected.length ? a.selected.join('; ') : '(skipped)'));
        });
        if (state.notes.trim()) {
            lines.push('');
            lines.push('## Meeting notes');
            lines.push('');
            lines.push(state.notes.trim());
        }
        return lines.join('\n');
    }

    function renderSummary() {
        const s = state.session;
        const top3 = (state.ranking || []).slice(0, 3);
        return '' +
            '<div class="card" id="summaryCard">' +
            '<h2>✅ Discovery Summary — ' + esc(s.customer || 'Unnamed account') + '</h2>' +
            '<p class="muted">' + esc(s.industry) + (s.platform ? ' · ' + esc(s.platform) : '') + ' · ' + esc(s.date) + '</p>' +
            '<h3>Confirmed priorities</h3>' +
            '<ol class="summary-ranking">' +
            (state.ranking || []).map(function (pid) {
                const p = pillarById(pid);
                return '<li><span class="dot" style="background:' + p.color + '"></span>' + p.icon + ' ' + esc(p.name) +
                    ' <span class="muted">(' + state.scores[pid] + ' pts)</span></li>';
            }).join('') +
            '</ol>' +
            '<h3>Next steps to propose</h3>' +
            top3.map(function (pid) {
                const p = pillarById(pid);
                return '<div class="next-steps-block" style="border-left-color:' + p.color + '">' +
                    '<strong>' + p.icon + ' ' + esc(p.name) + '</strong>' +
                    '<ul>' + (NEXT_STEPS[pid] || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
                    '<div class="jump-callout small">📽️ ' + esc(SLIDE_MAP[pid] || '') + '</div>' +
                    '</div>';
            }).join('') +
            '<div class="btn-row">' +
            '<button class="primary-btn" id="copyBtn">📋 Copy as Markdown</button>' +
            '<button class="secondary-btn" id="downloadBtn">⬇️ Download .md</button>' +
            '<button class="secondary-btn" id="printBtn">🖨️ Print</button>' +
            '<button class="secondary-btn danger" id="newSessionBtn">🔄 New session</button>' +
            '</div>' +
            '<p class="muted" id="copyStatus"></p>' +
            '</div>';
    }

    function bindSummary() {
        $('copyBtn').onclick = function () {
            const md = buildMarkdown();
            const done = function () { $('copyStatus').textContent = 'Copied to clipboard ✓'; };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(md).then(done, function () { fallbackCopy(md); done(); });
            } else {
                fallbackCopy(md); done();
            }
        };
        $('downloadBtn').onclick = function () {
            const md = buildMarkdown();
            const blob = new Blob([md], { type: 'text/markdown' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const name = (state.session.customer || 'discovery').replace(/[^\w-]+/g, '_');
            a.download = 'discovery_' + name + '_' + state.session.date + '.md';
            a.click();
            URL.revokeObjectURL(a.href);
        };
        $('printBtn').onclick = function () { window.print(); };
        $('newSessionBtn').onclick = function () {
            if (!confirm('Start a new session? Current session will be cleared. (Copy or download the summary first if you need it.)')) return;
            state = freshState();
            currentSelection = [];
            save();
            render();
        };
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    // ---------------- Init ----------------

    function init() {
        // Resume prior session if present and meaningful
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (stored && stored.phase && stored.phase !== 'setup') {
                if (confirm('Resume your previous discovery session' +
                    (stored.session && stored.session.customer ? ' with "' + stored.session.customer + '"' : '') + '?')) {
                    state = stored;
                } else {
                    state = freshState();
                    save();
                }
            } else if (stored) {
                state = stored;
            }
        } catch (e) { /* corrupted storage — start fresh */ }

        $('sessionNotes').addEventListener('input', function () {
            state.notes = $('sessionNotes').value;
            save();
        });

        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
