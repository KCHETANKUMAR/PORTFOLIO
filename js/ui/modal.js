import { el } from "../utils/dom.js";

export function initCaseModal() {
  const dlg = document.getElementById("case-modal");
  const body = document.getElementById("case-modal-body");
  let opener = null;

  const close = () => dlg.open && dlg.close();
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close-modal]")) close(); });
  dlg.addEventListener("close", () => { document.documentElement.style.overflow = ""; opener?.focus?.(); opener = null; });

  return function openCase(p, no) {
    opener = document.activeElement;
    body.replaceChildren(
      el("div", { class: "modal-case" },
        el("p", { class: "case__head" }, el("span", { class: "case__no" }, no), el("span", { class: "case__period" }, `${p.kind} · ${p.period}`)),
        el("h3", { id: "case-modal-title" }, p.title),
        el("p", { class: "case__desc" }, p.description),
        el("ul", {}, p.details.map((d, i) => el("li", {}, el("span", {}, String(i + 1).padStart(2, "0")), d))),
        el("ul", { class: "case__tags" }, p.tags.map((t) => el("li", { class: "badge" }, t))),
      ),
    );
    document.documentElement.style.overflow = "hidden";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  };
}
