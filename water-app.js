/* Water Districts - EAE Targeting Map
 * Data is embedded by build_water_map.py into water-data.js, so this runs
 * from the filesystem with no server and no CSV fetch.
 */

const AGENCIES = WATER_DATA.agencies;
const UNMAPPED = WATER_DATA.unmapped || [];

const TARGET_ORDER = ["Rural Target", "Open", "Existing Account", "Blocked"];
const TARGET_LABEL = {
    "Rural Target": "Rural target",
    "Open": "Open",
    "Existing Account": "Existing acct",
    "Blocked": "Blocked",
};
// Agencies you can actually pursue. Blocked is the only hard exclusion.
const TARGETABLE = new Set(["Rural Target", "Open", "Existing Account"]);

const STATES = ["CA", "WA", "OR", "NV", "AZ", "HI"];

const filters = {
    q: "",
    targets: new Set(TARGET_ORDER),
    states: new Set(STATES),
    size: "all",
    minScore: 0,
    minValue: 0,
    minHigh: 0,
    priorityOnly: false,
    modernOnly: false,
};

let map, cluster, markers = new Map(), visible = [];

/* ---------------- helpers ---------------- */

const fmtMoney = (v) => {
    if (!v) return "$0";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return "$" + Math.round(v / 1e3) + "K";
    return "$" + Math.round(v);
};
const fmtNum = (v) => (v == null ? "—" : v.toLocaleString());
const esc = (s) => (s == null ? "" : String(s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));

function markerColor(a) {
    if (a.target === "Blocked") return "#ef4444";
    if (a.target === "Rural Target") return "#3dcd58";
    if (a.target === "Existing Account") return "#6aa9ff";
    return a.score >= 50 ? "#8b5cf6" : "#909090";
}

function scoreColor(s) {
    if (s >= 75) return "#8b5cf6";
    if (s >= 50) return "#3ecf8e";
    if (s >= 25) return "#6aa9ff";
    return "#5a6a88";
}

function radius(a) {
    // Scale by opportunity count so dense accounts read first.
    return Math.max(6, Math.min(20, 5 + Math.sqrt(a.n_opps) * 2.4));
}

/* ---------------- filtering ---------------- */

function passes(a) {
    if (!filters.targets.has(a.target)) return false;
    if (!filters.states.has(a.state)) return false;
    if (a.score < filters.minScore) return false;
    if ((a.value_total || 0) < filters.minValue) return false;
    if (a.n_high < filters.minHigh) return false;
    if (filters.priorityOnly && !a.n_priority) return false;
    if (filters.modernOnly && !a.n_modern) return false;

    if (filters.size === "rural") {
        if (a.size !== "Rural (<10k)" && a.size !== "Small (10-50k)") return false;
    } else if (filters.size !== "all" && a.size !== filters.size) return false;

    if (filters.q) {
        const q = filters.q.toLowerCase();
        const hay = [a.owner, a.county, a.city, a.state,
            a.contact && a.contact.name, a.contact && a.contact.email]
            .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
    }
    return true;
}

function apply() {
    visible = AGENCIES.filter(passes);
    drawMarkers();
    drawStats();
    drawRank();
}

/* ---------------- map ---------------- */

function initMap() {
    map = L.map("map", { zoomControl: true, preferCanvas: true })
        .setView([39.5, -119.5], 5);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: "abcd", maxZoom: 19,
    }).addTo(map);

    cluster = L.markerClusterGroup({
        maxClusterRadius: 45,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        disableClusteringAtZoom: 11,
    });
    map.addLayer(cluster);
}

function drawMarkers() {
    cluster.clearLayers();
    markers.clear();
    const layers = [];

    visible.forEach((a) => {
        const m = L.circleMarker([a.lat, a.lon], {
            radius: radius(a),
            fillColor: markerColor(a),
            color: "#ffffff",
            weight: 1.2,
            opacity: 0.85,
            fillOpacity: 0.8,
        });

        m.bindPopup(
            `<div class="pop-name">${esc(a.owner)}</div>
             <div class="pop-meta">${esc(a.county)} County, ${esc(a.state)}
                ${a.population ? " · pop " + fmtNum(a.population) : ""}</div>
             <div class="pop-meta" style="margin-top:6px">
                <b>${a.n_opps}</b> opportunities ·
                <b>${a.n_high}</b> high-fit ·
                <b>${fmtMoney(a.value_total)}</b></div>
             <div class="pop-meta">EAE score <b>${a.score}</b> · ${esc(a.target)}</div>
             <button class="pop-btn" data-key="${esc(a.key)}">View full detail</button>`,
            { maxWidth: 280 }
        );

        markers.set(a.key, m);
        layers.push(m);
    });

    cluster.addLayers(layers);
    document.getElementById("mapBadge").textContent =
        `${visible.length.toLocaleString()} of ${AGENCIES.length.toLocaleString()} agencies shown`;
}

/* ---------------- stats + ranked list ---------------- */

function drawStats() {
    const opps = visible.reduce((s, a) => s + a.n_opps, 0);
    const high = visible.reduce((s, a) => s + a.n_high, 0);
    const val = visible.reduce((s, a) => s + (a.value_total || 0), 0);
    const tgt = visible.filter((a) => TARGETABLE.has(a.target)).length;

    document.getElementById("sAgencies").textContent = visible.length.toLocaleString();
    document.getElementById("sOpps").textContent = opps.toLocaleString();
    document.getElementById("sHigh").textContent = high.toLocaleString();
    document.getElementById("sValue").textContent = fmtMoney(val);
    document.getElementById("sTargetable").textContent = tgt.toLocaleString();
}

function drawRank() {
    const top = [...visible].sort((a, b) => b.score - a.score).slice(0, 80);
    document.getElementById("rank").innerHTML = top.map((a) => `
        <div class="rank-row" data-key="${esc(a.key)}">
            <div class="rank-score" style="background:${scoreColor(a.score)}">${Math.round(a.score)}</div>
            <div class="rank-main">
                <div class="rank-name">${esc(a.owner)}</div>
                <div class="rank-meta">${esc(a.state)} · ${a.n_high} high-fit ·
                    ${fmtMoney(a.value_total)} · ${esc(TARGET_LABEL[a.target] || a.target)}</div>
            </div>
        </div>`).join("") || `<p class="note">No agencies match these filters.</p>`;
}

/* ---------------- detail panel ---------------- */

function openDetail(key) {
    const a = AGENCIES.find((x) => x.key === key);
    if (!a) return;

    const tagBg = markerColor(a);
    const c = a.contact;

    const opps = a.opps.map((o) => {
        const ind = (o.ind && o.ind.length ? o.ind.join(" · ") : "Unspecified");
        const fit = (o.fit || "Low").toLowerCase();
        return `
        <div class="opp">
            <div class="opp-top">
                <div class="opp-ind">${esc(ind)}</div>
                ${o.value ? `<div class="opp-val">${fmtMoney(o.value)}</div>` : ""}
            </div>
            <div class="opp-meta">
                <span class="pill ${fit}">${esc(o.fit)} fit</span>
                ${o.rank === "Priority" ? `<span class="pill pri">Priority</span>` : ""}
                ${o.types ? `<span>${esc(o.types)}</span>` : ""}
                ${o.date ? `<span>· ${esc(o.date)}</span>` : ""}
            </div>
            ${o.facility ? `<div class="opp-meta"><span>🏭 ${esc(o.facility)}${o.mgd ? ` · ${o.mgd} MGD` : ""}</span></div>` : ""}
            ${o.consultants ? `<div class="opp-meta"><span>👷 ${esc(o.consultants)}</span></div>` : ""}
            ${o.summary ? `<div class="opp-sum">${esc(o.summary)}</div>` : ""}
            ${o.c1 ? `<div class="opp-meta" style="margin-top:6px">
                <span>👤 ${esc(o.c1)}${o.c1t ? `, ${esc(o.c1t)}` : ""}</span>
                ${o.c1e ? `<a class="src" href="mailto:${esc(o.c1e)}">${esc(o.c1e)}</a>` : ""}
              </div>` : ""}
            ${o.url ? `<a class="src" href="${esc(o.url)}" target="_blank" rel="noopener">Open in Citylitics ↗</a>` : ""}
        </div>`;
    }).join("");

    document.getElementById("detailBody").innerHTML = `
      <div class="d-pad">
        <div class="d-name">${esc(a.owner)}</div>
        <div class="d-sub">${esc(a.county)} County, ${esc(a.state)}
            ${a.population ? ` · population ${fmtNum(a.population)}` : ""}
            ${a.city ? ` · ${esc(a.city)}` : ""}</div>
        <span class="d-tag" style="background:${tagBg};color:#08111f">
            ${esc(a.target)} — EAE score ${a.score}</span>
        <div class="d-sub" style="margin-top:6px">${esc(a.target_reason)}</div>

        <div class="d-grid">
            <div class="d-cell"><div class="v">${a.n_opps}</div><div class="l">Opportunities</div></div>
            <div class="d-cell"><div class="v" style="color:#8b5cf6">${a.n_high}</div><div class="l">High-fit</div></div>
            <div class="d-cell"><div class="v">${fmtMoney(a.value_total)}</div><div class="l">Total value</div></div>
            <div class="d-cell"><div class="v" style="color:#3ecf8e">${fmtMoney(a.value_high)}</div><div class="l">High-fit value</div></div>
            <div class="d-cell"><div class="v">${a.n_priority}</div><div class="l">Priority-ranked</div></div>
            <div class="d-cell"><div class="v">${a.n_modern}</div><div class="l">Upgrade / replace</div></div>
        </div>

        ${c ? `<div class="d-h">Primary contact</div>
        <div class="d-contact">
            <div class="nm">${esc(c.name)}</div>
            <div class="ti">${esc(c.title) || ""}</div>
            ${c.email ? `<a href="mailto:${esc(c.email)}">✉ ${esc(c.email)}</a>` : ""}
            ${c.phone ? `<a href="tel:${esc(c.phone)}">☎ ${esc(c.phone)}</a>` : ""}
            ${c.li ? `<a href="${esc(c.li)}" target="_blank" rel="noopener">in LinkedIn ↗</a>` : ""}
        </div>` : ""}

        ${a.address ? `<div class="d-h">Address</div>
          <div class="d-sub">${esc(a.address)}${a.zip ? `, ${esc(a.zip)}` : ""}</div>` : ""}

        <div class="d-h">Opportunities (${a.opps.length})</div>
        ${opps}
      </div>`;

    document.getElementById("detail").classList.add("open");

    const m = markers.get(key);
    if (m) {
        map.setView([a.lat, a.lon], Math.max(map.getZoom(), 9), { animate: true });
    }
}
window.openDetail = openDetail;

/* ---------------- export ---------------- */

function exportCsv() {
    const cols = ["owner", "state", "county", "population", "size", "target",
        "geo",
        "score", "n_opps", "n_high", "n_priority", "n_modern",
        "value_total", "value_high", "contact_name", "contact_title",
        "contact_email", "contact_phone", "address", "zip", "lat", "lon"];
    const rows = [cols.join(",")];
    [...visible].sort((a, b) => b.score - a.score).forEach((a) => {
        const c = a.contact || {};
        const vals = {
            ...a,
            contact_name: c.name, contact_title: c.title,
            contact_email: c.email, contact_phone: c.phone,
        };
        rows.push(cols.map((k) => {
            const v = vals[k];
            if (v == null) return "";
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(","));
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "EAE_water_targets_filtered.csv";
    link.click();
    URL.revokeObjectURL(url);
}

/* ---------------- controls ---------------- */

function buildChips() {
    const counts = {};
    AGENCIES.forEach((a) => { counts[a.target] = (counts[a.target] || 0) + 1; });

    document.getElementById("targetFilters").innerHTML = TARGET_ORDER
        .filter((t) => counts[t])
        .map((t) => `<span class="chip on" data-target="${t}">
            ${TARGET_LABEL[t]}<span class="c">${counts[t]}</span></span>`).join("");

    const sc = {};
    AGENCIES.forEach((a) => { sc[a.state] = (sc[a.state] || 0) + 1; });
    document.getElementById("stateFilters").innerHTML = STATES
        .filter((s) => sc[s])
        .map((s) => `<span class="chip on" data-state="${s}">
            ${s}<span class="c">${sc[s]}</span></span>`).join("");

    document.querySelectorAll("[data-target]").forEach((el) => {
        el.onclick = () => {
            const t = el.dataset.target;
            el.classList.toggle("on");
            filters.targets.has(t) ? filters.targets.delete(t) : filters.targets.add(t);
            apply();
        };
    });
    document.querySelectorAll("[data-state]").forEach((el) => {
        el.onclick = () => {
            const s = el.dataset.state;
            el.classList.toggle("on");
            filters.states.has(s) ? filters.states.delete(s) : filters.states.add(s);
            apply();
        };
    });
}

function bind() {
    const q = document.getElementById("q");
    q.oninput = () => { filters.q = q.value.trim(); apply(); };
    document.getElementById("qClear").onclick = () => {
        q.value = ""; filters.q = ""; apply();
    };

    document.getElementById("fSize").onchange = (e) => {
        filters.size = e.target.value; apply();
    };

    const sScore = document.getElementById("fScore");
    sScore.oninput = () => {
        filters.minScore = +sScore.value;
        document.getElementById("lScore").textContent = sScore.value;
        apply();
    };

    const sValue = document.getElementById("fValue");
    sValue.oninput = () => {
        filters.minValue = +sValue.value;
        document.getElementById("lValue").textContent = fmtMoney(+sValue.value);
        apply();
    };

    const sHigh = document.getElementById("fHigh");
    sHigh.oninput = () => {
        filters.minHigh = +sHigh.value;
        document.getElementById("lHigh").textContent = sHigh.value;
        apply();
    };

    document.getElementById("fPriority").onchange = (e) => {
        filters.priorityOnly = e.target.checked; apply();
    };
    document.getElementById("fModern").onchange = (e) => {
        filters.modernOnly = e.target.checked; apply();
    };

    document.getElementById("reset").onclick = () => {
        filters.q = ""; q.value = "";
        filters.size = "all"; document.getElementById("fSize").value = "all";
        filters.minScore = 0; sScore.value = 0;
        document.getElementById("lScore").textContent = "0";
        filters.minValue = 0; sValue.value = 0;
        document.getElementById("lValue").textContent = "$0";
        filters.minHigh = 0; sHigh.value = 0;
        document.getElementById("lHigh").textContent = "0";
        filters.priorityOnly = false;
        document.getElementById("fPriority").checked = false;
        filters.modernOnly = false;
        document.getElementById("fModern").checked = false;
        filters.targets = new Set(TARGET_ORDER);
        filters.states = new Set(STATES);
        document.querySelectorAll(".chip").forEach((c) => c.classList.add("on"));
        apply();
    };

    // Delegated so it covers ranked rows and popup buttons alike, including
    // popups Leaflet builds after this runs.
    document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-key]");
        if (el) openDetail(el.dataset.key);
    });

    document.getElementById("exportBtn").onclick = exportCsv;
    document.getElementById("detailClose").onclick = () =>
        document.getElementById("detail").classList.remove("open");

    // sidebar resize
    const rz = document.getElementById("resizer");
    const side = document.getElementById("side");
    let dragging = false;
    rz.onmousedown = () => { dragging = true; document.body.style.cursor = "col-resize"; };
    document.onmousemove = (e) => {
        if (!dragging) return;
        const w = Math.max(260, Math.min(560, e.clientX));
        side.style.width = w + "px";
    };
    document.onmouseup = () => {
        if (dragging) { dragging = false; document.body.style.cursor = ""; map.invalidateSize(); }
    };
}

function drawUnmapped() {
    document.getElementById("unmappedCount").textContent = UNMAPPED.length;
    if (!UNMAPPED.length) {
        document.getElementById("unmappedSec").style.display = "none";
        return;
    }
    document.getElementById("unmapped").innerHTML = UNMAPPED
        .sort((a, b) => b.score - a.score)
        .map((a) => `<div><b>${esc(a.owner)}</b> (${esc(a.state)}) —
            score ${a.score}, ${a.n_opps} opps, ${fmtMoney(a.value_total)}</div>`).join("");
}

function drawListNote() {
    const s = WATER_DATA.lists_supplied || {};
    const missing = Object.entries(s).filter(([, n]) => !n).map(([k]) => k);
    const el = document.getElementById("listNote");
    if (!missing.length) {
        el.textContent = `Account lists loaded · built ${WATER_DATA.generated}`;
        return;
    }
    el.textContent = "Account lists not yet loaded (" + missing.join(", ") +
        "), so every agency shows as Open / Unverified. Drop the CSVs into data/ " +
        "and re-run build_water_map.py to classify them.";
}

/* ---------------- boot ---------------- */

initMap();
buildChips();
bind();
drawUnmapped();
drawListNote();
apply();
