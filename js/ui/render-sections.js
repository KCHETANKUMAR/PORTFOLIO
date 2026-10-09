import { el, icon, svgEl, $, $$, getPath } from "../utils/dom.js";

/** Fill every data-driven part of the page from SITE_CONFIG. Empty values hide their element. */
export function renderSite(C, { openCase }) {
  bindLinks(C);
  $("#year").textContent = new Date().getFullYear();
  $("#contact-loc").textContent = C.location;

  // About facts
  const facts = $("#about-facts");
  C.about.facts.forEach((f) => facts.append(el("div", {}, el("dt", {}, f.label), el("dd", {}, f.value))));

  // Expertise
  const grid = $("#expertise-grid");
  C.expertise.forEach((x, i) => {
    grid.append(
      el("article", { class: "feature glass glass--card glass--lit tilt" },
        el("div", { class: "feature__top" },
          el("span", { class: "feature__no" }, String(i + 1).padStart(2, "0")),
          el("span", { class: "feature__icon" }, icon(x.icon, "icon--draw")),
        ),
        el("h3", {}, x.title),
        el("p", { class: "feature__short" }, x.short),
        el("ul", {}, x.items.map((t) => el("li", {}, t))),
      ),
    );
  });
  const chips = $("#supporting-chips");
  C.supporting.forEach((s) => chips.append(el("li", { class: "badge" }, s)));

  // Education timeline
  const tl = $("#timeline");
  C.education.forEach((e) => {
    tl.append(
      el("li", { class: `t-item glass glass--card${e.featured ? " is-featured" : ""}` },
        el("p", { class: "t-item__period" }, e.period),
        el("h3", {}, e.title),
        el("p", { class: "t-item__inst" }, e.institution),
        e.affiliation && el("p", { class: "t-item__aff" }, e.affiliation),
        e.grade && el("span", { class: "badge t-item__grade" }, e.grade),
      ),
    );
  });

  // Certifications
  const cg = $("#cert-grid");
  C.certifications.forEach((c) => {
    cg.append(
      el("li", { class: "cert glass glass--card glass--lit" },
        el("span", { class: "cert__icon" }, icon(c.icon || "award")),
        el("div", {}, el("p", { class: "cert__issuer" }, c.issuer), el("h3", {}, c.title)),
        (c.date || c.credentialUrl) &&
          el("div", { class: "cert__foot" },
            c.date && el("span", { class: "badge" }, c.date),
            c.credentialUrl && el("a", { class: "cert__link", href: c.credentialUrl, target: "_blank", rel: "noopener noreferrer" }, "View credential", icon("arrow-up-right")),
          ),
      ),
    );
  });

  // Training
  const tg = $("#train-grid");
  C.training.forEach((t) => {
    tg.append(
      el("li", { class: "train glass glass--card glass--lit" },
        el("span", { class: "train__icon" }, icon(t.icon, "icon--draw")),
        el("h3", {}, t.title),
        el("p", {}, t.text),
        t.provider && el("span", { class: "badge" }, t.provider),
      ),
    );
  });
  const it = C.internship;
  $("#intern").append(
    el("div", {}, el("p", { class: "meta" }, "Industrial training"), el("p", { class: "meta", style: { color: "var(--ink-2)", "margin-top": "8px" } }, it.period)),
    el("div", {}, el("h3", {}, it.role), el("p", { class: "intern__org" }, it.org), el("p", { class: "body" }, it.text)),
  );

  // Projects as case studies
  const cases = $("#cases");
  C.projects.forEach((p, i) => cases.append(buildCase(p, i, openCase)));

  // Contact
  const ol = $("#open-list");
  C.contact.openTo.forEach((t) => ol.append(el("li", {}, t)));

  // About ring ticks (decorative)
  const g = $("#about-ticks");
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    const r1 = 392, r2 = major ? 368 : 380;
    g.append(svgEl("line", { x1: 400 + Math.sin(a) * r1, y1: 400 - Math.cos(a) * r1, x2: 400 + Math.sin(a) * r2, y2: 400 - Math.cos(a) * r2, class: major ? "major" : "" }));
  }
}

function bindLinks(C) {
  $$("[data-bind-href]").forEach((a) => {
    const key = a.dataset.bindHref;
    let v = getPath(C, key);
    if (!v) { a.removeAttribute("href"); return; }
    if (key === "social.email" && !v.startsWith("mailto:")) v = `mailto:${v}`;
    a.setAttribute("href", v);
  });
}

function buildCase(p, i, openCase) {
  const no = `Project ${String(i + 1).padStart(2, "0")}`;
  const hasExternal = !!p.caseStudyUrl;
  const caseLink = hasExternal
    ? el("a", { class: "arrow-link", href: p.caseStudyUrl, target: "_blank", rel: "noopener noreferrer" }, el("span", { class: "ring" }, icon("arrow-right")), "View case study")
    : el("button", { class: "arrow-link", type: "button", onclick: () => openCase(p, no) }, el("span", { class: "ring" }, icon("arrow-right")), "View case study");

  const art = el("article", { class: `case glass glass--card glass--lit${p.visual === "uv" ? "" : " case--solo"}`, "aria-labelledby": `case-${i}` },
    el("i", { class: "case__glow", "aria-hidden": "true" }),
    el("div", {},
      el("div", { class: "case__head" }, el("span", { class: "case__no" }, no), el("span", { class: "case__period" }, `${p.kind} · ${p.period}`)),
      el("h3", { id: `case-${i}` }, p.title),
      el("p", { class: "case__desc" }, p.description),
      el("div", { class: "case__role" }, el("p", { class: "meta" }, "Role / contribution"), el("p", {}, p.role)),
      el("ul", { class: "case__tags", "aria-label": "Skills and technologies" }, p.tags.map((t) => el("li", { class: "badge" }, t))),
      el("div", { class: "case__links" },
        caseLink,
        p.codeUrl && el("a", { class: "arrow-link", href: p.codeUrl, target: "_blank", rel: "noopener noreferrer" }, el("span", { class: "ring" }, icon("arrow-right")), "View code"),
      ),
    ),
    p.visual === "uv" && buildUVVisual(),
  );
  return art;
}

/** Purely illustrative schematic of a UV-Vis absorbance peak + calibration line. No data is implied. */
function buildUVVisual() {
  const fig = el("figure", { class: "case__visual", "aria-hidden": "true" });
  fig.innerHTML = `
  <svg viewBox="0 0 480 320" preserveAspectRatio="xMidYMid meet" fill="none">
    <defs>
      <linearGradient id="uv-grad" x1="0" x2="1"><stop offset="0" stop-color="#2F80FF"/><stop offset="1" stop-color="#3CE0FF"/></linearGradient>
      <linearGradient id="uv-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3CC8FF" stop-opacity=".22"/><stop offset="1" stop-color="#3CC8FF" stop-opacity="0"/></linearGradient>
    </defs>
    <g class="uv-grid">${Array.from({ length: 8 }, (_, k) => `<line x1="${40 + k * 56}" y1="30" x2="${40 + k * 56}" y2="200"/>`).join("")}${Array.from({ length: 5 }, (_, k) => `<line x1="40" y1="${30 + k * 42.5}" x2="432" y2="${30 + k * 42.5}"/>`).join("")}</g>
    <path class="uv-axis" d="M40 30V200H432"/>
    <path class="uv-area" d="M40 200 C 110 198, 150 190, 188 150 S 236 40, 262 40 S 320 160, 372 190 S 420 199, 432 200 V200 H40Z"/>
    <path class="uv-curve" pathLength="1" d="M40 200 C 110 198, 150 190, 188 150 S 236 40, 262 40 S 320 160, 372 190 S 420 199, 432 200"/>
    <line class="uv-dash" x1="262" y1="40" x2="262" y2="200"/>
    <circle class="uv-dot" cx="262" cy="40" r="4.5"/>
    <text class="uv-label" x="274" y="52">λmax</text>
    <text class="uv-label" x="40" y="218" opacity=".6">WAVELENGTH</text>
    <g transform="translate(40 232)">
      <path class="uv-axis" d="M0 0V74H150"/>
      <line class="uv-lin" x1="6" y1="68" x2="144" y2="8"/>
      <g class="uv-pt"><circle cx="24" cy="60" r="2.8"/><circle cx="52" cy="48" r="2.8"/><circle cx="80" cy="38" r="2.8"/><circle cx="108" cy="26" r="2.8"/><circle cx="134" cy="14" r="2.8"/></g>
      <text class="uv-label" x="164" y="40" opacity=".6">CALIBRATION</text>
      <text class="uv-label" x="164" y="56" opacity=".6">LINEARITY</text>
    </g>
  </svg>
  <figcaption>Illustrative schematic — not study data</figcaption>`;
  return fig;
}
