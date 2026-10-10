/* Stakeholdermap Star Wars Xperience: bouwt de pagina op uit data.js en documenten.js. */
(function () {
  "use strict";

  const data = window.STAKEHOLDERMAP;
  const byId = (id) => document.getElementById(id);
  const fallback = byId("fallback");

  if (!data) {
    if (fallback) {
      fallback.textContent =
        "De inhoud kon niet geladen worden. Controleer of data.js naast index.html staat en geen typefout bevat.";
    }
    return;
  }
  if (fallback) fallback.remove();

  const teksten = data.teksten;
  const T = teksten.documenten;
  const TT = teksten.team;
  const V = teksten.voortgang;
  const kwadrantById = new Map(data.kwadranten.map((k) => [k.id, k]));
  const stakeholderById = new Map(data.stakeholders.map((s) => [s.id, s]));
  const planById = new Map(data.plan.rijen.map((r) => [r.id, r]));

  /* index.html is voor bezoekers en alleen om te lezen; editor.html is voor het team en kan bewerken. */
  const EDITOR = document.body.dataset.modus === "editor";

  /* De planeten komen uit planeten.js; een planeet heeft minstens een id en een naam. */
  let onderdelen = [];
  let onderdeelById = new Map();

  function setPlaneten(lijst) {
    onderdelen = (Array.isArray(lijst) ? lijst : []).filter(
      (o) => o && typeof o.id === "string" && o.id && typeof o.naam === "string" && o.naam
    );
    onderdeelById = new Map(onderdelen.map((o) => [o.id, o]));
  }
  setPlaneten(window.STAKEHOLDERMAP_PLANETEN);

  const root = document.documentElement;
  const stage = byId("stage");
  const map = byId("map");
  const dialog = byId("detail");
  const detailNaam = byId("detail-naam");
  const detailSub = byId("detail-sub");
  const detailPositie = byId("detail-positie");
  const detailPlan = byId("detail-plan");
  const detailDocs = byId("detail-docs");
  /* Alleen in de editor: de balk bovenaan en het venster om met GitHub te verbinden (zie buildEditorShell). */
  let teamDialog = null;
  let teamInhoud = null;
  let teamKnop = null;
  let editorTekst = null;
  const intro = byId("weergave-intro");
  const galaxy = byId("galaxy");
  const planetview = byId("planetview");

  const sheetQuery = window.matchMedia("(max-width: 1023.98px)");
  const wideQuery = window.matchMedia("(min-width: 640px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const CLOSE_MS = 240;
  const MAX_BYTES = 25 * 1024 * 1024;
  const TEAM_KEY = "stakeholdermap.team";
  const GITHUB = "https://api.github.com";

  let currentId = null;
  let lastTrigger = null;
  let closeTimer = 0;
  let currentView = null;
  let skyTimer = 0;

  let documenten = Array.isArray(window.STAKEHOLDERMAP_DOCUMENTEN) ? window.STAKEHOLDERMAP_DOCUMENTEN.slice() : [];
  let team = null;
  let docFormOpen = false;
  let docStatus = "";
  let confirmId = null;

  const startVoortgang = window.STAKEHOLDERMAP_VOORTGANG;
  let voortgang = startVoortgang && typeof startVoortgang === "object" && !Array.isArray(startVoortgang) ? startVoortgang : {};
  let currentPlanet = null;
  let jumping = false;
  let stepError = "";
  let currentMoon = null;
  let moonDocFormOpen = false;
  let moonDocStatus = "";
  let moonConfirmId = null;
  let newMoonId = null;
  let arriveTimer = 0;
  let svgCount = 0;

  /* Planeten en manen beheren: welk formulier of welke bevestiging open staat, en de melding erna. */
  let galaxyTools = null;
  let galaxyForm = false;
  let galaxyStatus = "";
  let planetEdit = false;
  let planetConfirm = false;
  let planetStatus = "";
  let planetError = "";
  let moonRemoveId = null;

  /* ---------- Hulpjes ---------- */

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key === "dataset") Object.assign(node.dataset, value);
        else node.setAttribute(key, value === true ? "" : value);
      }
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child);
    }
    return node;
  }

  function svg(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
  }

  function fill(text, values) {
    return String(text).replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
  }

  const ICONS = {
    document:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 1.75h5.25L12.5 5v9.25H4z M9 1.75V5.25h3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    link:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6.75 9.25a3 3 0 0 0 4.25 0l2-2a3 3 0 0 0-4.25-4.25l-.75.75 M9.25 6.75a3 3 0 0 0-4.25 0l-2 2a3 3 0 0 0 4.25 4.25l.75-.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    trash:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.75 4.25h10.5 M6.25 4.25V2.5h3.5v1.75 M4.25 4.25l.5 9.25h6.5l.5-9.25 M6.75 7v4 M9.25 7v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3v10 M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    back:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M9.75 3.25 5 8l4.75 4.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m5.25 8.25 2 2 3.5-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    todo:
      '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2.5"/></svg>'
  };

  const icon = (name) => svg(ICONS[name]);

  /* Positieteken: de linkerhelft licht amber op bij veel invloed, de rechterhelft blauw bij veel belang. */
  function mark(kwadrant) {
    const node = svg(
      '<svg class="mark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
        '<path class="mark__invloed" d="M8 1.75 1.75 8 8 14.25"/>' +
        '<path class="mark__belang" d="M8 1.75 14.25 8 8 14.25"/>' +
        '<circle cx="8" cy="8" r="1.5"/>' +
        "</svg>"
    );
    node.dataset.invloed = kwadrant.invloed;
    node.dataset.belang = kwadrant.belang;
    return node;
  }

  function levels(kwadrant) {
    return el(
      "ul",
      { class: "levels" },
      ["invloed", "belang"].map((as) =>
        el(
          "li",
          { class: "level level--" + as, dataset: { niveau: kwadrant[as] } },
          el("span", { class: "meter", "aria-hidden": "true" }, el("i"), el("i")),
          el("span", { text: teksten.niveaus[as][kwadrant[as]] })
        )
      )
    );
  }

  /* Een plaatje met een uitsnede: alleen het opgegeven deel is zichtbaar. */
  function croppedImage(beeld, alt) {
    const frame = el("span", { class: "crop" });
    const img = el("img", { src: beeld.bestand, alt: alt || "", decoding: "async" });
    if (beeld.uitsnede) {
      const [l, t, r, b] = beeld.uitsnede;
      frame.style.aspectRatio = r - l + " / " + (b - t);
    }
    const place = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      const [l, t, r, b] = beeld.uitsnede || [0, 0, w, h];
      frame.style.aspectRatio = r - l + " / " + (b - t);
      img.style.width = (w / (r - l)) * 100 + "%";
      img.style.left = (-l / (r - l)) * 100 + "%";
      img.style.top = (-t / (b - t)) * 100 + "%";
      frame.classList.add("is-ready");
      scheduleSky();
    };
    img.addEventListener("load", place);
    img.addEventListener("error", () => frame.remove());
    frame.append(img);
    if (img.complete) place();
    return frame;
  }

  /* ---------- Kop en voet ---------- */

  function renderMasthead() {
    const beelden = data.beelden || {};
    const volledig = data.project.naam;
    const naam = byId("project-naam");
    const logo = beelden.logo;

    if (logo && logo.bestand && logo.vervangt && volledig.startsWith(logo.vervangt)) {
      const frame = croppedImage(logo, logo.vervangt);
      frame.classList.add("lockup__logo");
      frame.querySelector("img").addEventListener("error", () => {
        naam.classList.remove("lockup");
        naam.textContent = volledig;
      });
      naam.classList.add("lockup");
      naam.replaceChildren(
        frame,
        " ",
        el("span", { class: "lockup__rest", text: volledig.slice(logo.vervangt.length).trim() })
      );
    } else {
      naam.textContent = volledig;
    }

    byId("project-ondertitel").textContent = data.project.ondertitel;
    byId("voettekst").textContent = data.project.voettekst;

    const gegevens = byId("project-gegevens");
    for (const item of data.project.gegevens) {
      if (item.waarde !== "vandaag") {
        gegevens.append(el("dt", { text: item.label }), el("dd", { text: item.waarde }));
        continue;
      }
      /* De datum van vandaag; blijft de pagina open, dan springt hij om middernacht mee. */
      const tijd = el("time");
      const zet = () => {
        const iso = today();
        tijd.setAttribute("datetime", iso);
        tijd.textContent = formatDate(iso);
      };
      const wacht = () => {
        const nu = new Date();
        const morgen = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + 1, 0, 0, 5);
        window.setTimeout(() => {
          zet();
          wacht();
        }, morgen - nu);
      };
      zet();
      wacht();
      gegevens.append(el("dt", { text: item.label }), el("dd", null, tijd));
    }

    if (beelden.kop && beelden.kop.bestand) {
      const holo = croppedImage(beelden.kop, "");
      holo.classList.add("holo", "holo--kop");
      holo.setAttribute("aria-hidden", "true");
      byId("masthead-title").append(holo);
    }
    if (beelden.voet && beelden.voet.bestand) {
      const holo = croppedImage(beelden.voet, "");
      holo.classList.add("holo", "holo--voet");
      holo.setAttribute("aria-hidden", "true");
      byId("colophon").append(holo);
    }
  }

  /* ---------- Schakelaar ---------- */

  const tabs = [];

  function renderTabs() {
    const list = byId("tabs");
    list.setAttribute("aria-label", teksten.weergave);
    for (const weergave of data.weergaven) {
      const tab = el("button", {
        class: "tab",
        type: "button",
        role: "tab",
        id: "tab-" + weergave.id,
        "aria-controls": "weergave-" + weergave.id,
        "aria-selected": "false",
        tabindex: "-1",
        text: weergave.tab,
        dataset: { view: weergave.id }
      });
      tab.addEventListener("click", () => {
        if (weergave.id === "voortgang" && currentView === "voortgang" && currentPlanet) showGalaxy();
        else selectView(weergave.id);
      });
      tabs.push(tab);
      list.append(tab);
    }

    list.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(document.activeElement);
      if (index === -1) return;
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectView(tabs[next].dataset.view);
      tabs[next].focus();
    });
  }

  function selectView(id, options) {
    const weergave = data.weergaven.find((w) => w.id === id) || data.weergaven[0];
    const updateHash = !options || options.updateHash !== false;
    if (currentView === weergave.id) return;
    currentView = weergave.id;

    if (weergave.id !== "kaart") closeDetail({ instant: true, restoreFocus: false });

    for (const tab of tabs) {
      const selected = tab.dataset.view === weergave.id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const w of data.weergaven) {
      byId("weergave-" + w.id).hidden = w.id !== weergave.id;
    }
    intro.textContent = weergave.intro;
    if (weergave.id === "voortgang") showGalaxy({ updateHash: false, focus: false });

    if (updateHash) setHash(weergave.id);
    scheduleSky();
  }

  function setHash(value) {
    try {
      history.replaceState(null, "", "#" + value);
    } catch (error) {
      /* Sommige browsers staan dit niet toe op file://; de weergave werkt dan gewoon door. */
    }
    syncEditorLink();
  }

  /* Op de bezoekerspagina: een rustige link in de voet naar de editor, naar dezelfde plek als waar je nu bent.
     Wie de editor opent zonder sleutel met schrijfrechten, kan er niets opslaan. */
  let editorLink = null;

  function syncEditorLink() {
    if (editorLink) editorLink.setAttribute("href", "editor.html" + window.location.hash);
  }

  function buildEditorLink() {
    editorLink = el("a", { class: "linkbtn", id: "editor-link", text: TT.editorLink });
    byId("voettekst").after(editorLink);
    syncEditorLink();
  }

  /* ---------- Kaart ---------- */

  function quadrantOrder(a, b) {
    const rij = (k) => (k.invloed === "hoog" ? 0 : 1);
    const kolom = (k) => (k.belang === "hoog" ? 1 : 0);
    return rij(a) - rij(b) || kolom(a) - kolom(b);
  }

  function axis(naam, as) {
    const eerste = naam === "y" ? as.hoog : as.laag;
    const laatste = naam === "y" ? as.laag : as.hoog;
    return el(
      "div",
      { class: "axis axis--" + naam, "aria-hidden": "true" },
      el("span", { text: eerste }),
      el("span", { class: "axis__naam", text: as.naam }),
      el("span", { text: laatste })
    );
  }

  function renderMap() {
    const plot = el("div", { class: "plot" });
    let nodeIndex = 0;

    [...data.kwadranten].sort(quadrantOrder).forEach((kwadrant, index) => {
      const nodes = el("ul", { class: "nodes" });
      for (const stakeholder of data.stakeholders.filter((s) => s.kwadrant === kwadrant.id)) {
        const button = el(
          "button",
          {
            class: "node",
            type: "button",
            "aria-haspopup": "dialog",
            "aria-expanded": "false",
            "aria-controls": "detail",
            dataset: { id: stakeholder.id },
            style: "--n:" + nodeIndex++
          },
          mark(kwadrant),
          el(
            "span",
            { class: "node__text" },
            el("span", { class: "node__naam", text: stakeholder.naam }),
            stakeholder.toelichting && el("span", { class: "node__sub", text: stakeholder.toelichting })
          ),
          el("span", { class: "node__docs", hidden: true })
        );
        button.addEventListener("click", () => toggleDetail(stakeholder.id, button));
        nodes.append(el("li", null, button));
      }

      plot.append(
        el(
          "section",
          {
            class: "quad",
            "aria-labelledby": "kwadrant-" + kwadrant.id,
            dataset: { invloed: kwadrant.invloed, belang: kwadrant.belang },
            style: "--i:" + index
          },
          el(
            "header",
            { class: "quad__head" },
            el("h2", { id: "kwadrant-" + kwadrant.id, text: kwadrant.naam }),
            levels(kwadrant),
            el("p", { class: "quad__aanpak", text: kwadrant.aanpak })
          ),
          nodes
        )
      );
    });

    plot.append(
      svg(
        '<svg class="plot__cross" viewBox="0 0 36 36" aria-hidden="true" focusable="false">' +
          '<circle cx="18" cy="18" r="6" fill="#070d1c" stroke="currentColor" stroke-width="1"/>' +
          '<path d="M18 0v9M18 27v9M0 18h9M27 18h9" stroke="currentColor" stroke-width="1"/>' +
          '<circle cx="18" cy="18" r="1.5" fill="currentColor"/>' +
          "</svg>"
      ),
      el("div", { class: "plot__sweep", "aria-hidden": "true" })
    );

    map.append(axis("y", data.assen.invloed), plot, axis("x", data.assen.belang));

    map.classList.add("is-booting");
    window.setTimeout(() => map.classList.remove("is-booting"), 2400);
  }

  /* ---------- Documenten ---------- */

  const docsFor = (stakeholderId) => documenten.filter((d) => d.stakeholder === stakeholderId);
  const docsForMoon = (key) => documenten.filter((d) => d.maan === key);
  const moonKey = (planeet, maan) => planeet + "/" + maan;

  function countLabel(aantal) {
    return aantal === 1 ? T.aantal.een : fill(T.aantal.meer, { aantal });
  }

  function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return match ? match[3] + "-" + match[2] + "-" + match[1] : "";
  }

  function docHref(doc) {
    if (doc.soort === "link") return /^https?:\/\//i.test(doc.url || "") ? doc.url : null;
    return doc.pad || null;
  }

  function docKind(doc) {
    if (doc.soort === "link") return T.link;
    const ext = /\.([a-z0-9]{1,5})$/i.exec(doc.pad || "");
    return ext ? ext[1].toUpperCase() : T.bestand;
  }

  function docLink(doc, compact) {
    const href = docHref(doc);
    const datum = formatDate(doc.toegevoegd);
    const meta = [docKind(doc), !compact && datum && fill(T.toegevoegd, { datum })].filter(Boolean).join(", ");
    return el(
      href ? "a" : "span",
      { class: "doc__link", href, target: href && "_blank", rel: href && "noopener" },
      icon(doc.soort === "link" ? "link" : "document"),
      el(
        "span",
        { class: "doc__text" },
        el("span", { class: "doc__titel", text: doc.titel }),
        el("span", { class: "doc__meta", text: meta })
      )
    );
  }

  /* Het aantal documenten op de node, zodat je op de kaart ziet waar iets bij hoort. */
  function renderNodeBadges() {
    for (const node of map.querySelectorAll(".node")) {
      const aantal = docsFor(node.dataset.id).length;
      const badge = node.querySelector(".node__docs");
      badge.hidden = aantal === 0;
      badge.replaceChildren();
      if (aantal) {
        badge.append(icon("document"), el("span", { "aria-hidden": "true", text: String(aantal) }));
        badge.append(el("span", { class: "visually-hidden", text: ", " + countLabel(aantal) }));
      }
    }
  }

  /* De bediening van een lijst met documenten: dezelfde voor een stakeholder en voor een maan. */
  const STAKE_ACTS = { open: "open-form", close: "close-form", ask: "ask-delete", cancel: "cancel-delete", del: "delete" };
  const MOON_ACTS = {
    open: "maandoc-open-form",
    close: "maandoc-close-form",
    ask: "maandoc-ask-delete",
    cancel: "maandoc-cancel-delete",
    del: "maandoc-delete"
  };

  function docListEl(lijst, confirm, acts) {
    return el(
      "ul",
      { class: "docs" },
      lijst.map((doc) => {
        const item = el("li", { class: "doc" }, docLink(doc));
        if (team && confirm === doc.id) {
          item.append(
            el(
              "div",
              { class: "doc__confirm" },
              el("span", { text: T.zeker }),
              el("button", { class: "btn btn--danger", type: "button", dataset: { act: acts.del, id: doc.id }, text: T.ja }),
              el("button", { class: "btn", type: "button", dataset: { act: acts.cancel }, text: T.annuleren })
            )
          );
        } else if (team) {
          item.append(
            el(
              "button",
              {
                class: "iconbtn iconbtn--small",
                type: "button",
                "aria-label": fill(T.verwijder, { titel: doc.titel }),
                dataset: { act: acts.ask, id: doc.id }
              },
              icon("trash")
            )
          );
        }
        return item;
      })
    );
  }

  function renderDetailDocs(focusTarget) {
    if (!currentId) return;
    const lijst = docsFor(currentId);
    const delen = [];

    if (lijst.length) delen.push(docListEl(lijst, confirmId, STAKE_ACTS));
    else delen.push(el("p", { class: "docs__leeg", text: T.leeg }));

    if (docStatus) delen.push(el("p", { class: "docs__status", role: "status", text: docStatus }));

    if (team && docFormOpen) delen.push(docForm("doc", STAKE_ACTS));
    else if (team) {
      delen.push(
        el("button", { class: "btn", type: "button", dataset: { act: STAKE_ACTS.open } }, icon("plus"), el("span", { text: T.toevoegen }))
      );
    }

    detailDocs.replaceChildren(...delen);

    if (focusTarget) {
      const target = detailDocs.querySelector(focusTarget);
      if (target) target.focus({ preventScroll: false });
    }
  }

  function docForm(prefix, acts) {
    const soort = (value, label, checked) =>
      el(
        "label",
        { class: "seg__item" },
        el("input", { type: "radio", name: "doc-soort", value, checked }),
        el("span", { text: label })
      );

    return el(
      "form",
      { class: "docform", id: prefix + "form", novalidate: true },
      el(
        "div",
        { class: "field" },
        el("label", { for: prefix + "-titel", text: T.veldTitel }),
        el("input", { id: prefix + "-titel", name: "titel", type: "text", maxlength: "80", autocomplete: "off", required: true })
      ),
      el("div", { class: "seg", role: "radiogroup", "aria-label": T.veldSoort }, soort("bestand", T.bestand, true), soort("link", T.link, false)),
      el(
        "div",
        { class: "field", dataset: { soort: "bestand" } },
        el("label", { for: prefix + "-bestand", text: T.veldBestand }),
        el("input", { id: prefix + "-bestand", name: "bestand", type: "file", "aria-describedby": prefix + "-bestand-hulp" }),
        el("p", { class: "hint", id: prefix + "-bestand-hulp", text: T.maximum })
      ),
      el(
        "div",
        { class: "field", dataset: { soort: "link" }, hidden: true },
        el("label", { for: prefix + "-url", text: T.veldLink }),
        el("input", { id: prefix + "-url", name: "url", type: "url", inputmode: "url", placeholder: "https://", autocomplete: "off" })
      ),
      el("p", { class: "formerror", id: prefix + "form-fout", role: "alert", hidden: true }),
      el(
        "div",
        { class: "actions" },
        el("button", { class: "btn btn--primary", type: "submit", text: T.opslaan }),
        el("button", { class: "btn", type: "button", dataset: { act: acts.close }, text: T.annuleren })
      )
    );
  }

  function setBusy(container, busy, label) {
    for (const control of container.querySelectorAll("button, input")) control.disabled = busy;
    const submit = container.querySelector('button[type="submit"], .btn--danger');
    if (submit) {
      if (busy) {
        submit.dataset.label = submit.textContent;
        submit.textContent = label;
      } else if (submit.dataset.label) {
        submit.textContent = submit.dataset.label;
      }
    }
  }

  function showFormError(form, message) {
    const box = form && form.querySelector(".formerror");
    if (!box) return;
    box.textContent = message;
    box.hidden = !message;
  }

  function fieldError(form, field, message) {
    showFormError(form, message);
    field.focus();
  }

  /* Een document toevoegen bij een stakeholder ({ stakeholder }) of bij een maan ({ maan }). */
  async function submitDocForm(form, doel, klaar) {
    const titel = form.elements.titel.value.trim();
    const soort = form.elements["doc-soort"].value;
    const file = form.elements.bestand.files[0];
    const url = form.elements.url.value.trim();

    if (!titel) return fieldError(form, form.elements.titel, T.foutTitel);
    if (soort === "bestand" && !file) return fieldError(form, form.elements.bestand, T.foutBestand);
    if (soort === "bestand" && file.size > MAX_BYTES) return fieldError(form, form.elements.bestand, T.foutGroot);
    if (soort === "link" && !/^https?:\/\/\S+\.\S+/i.test(url)) return fieldError(form, form.elements.url, T.foutLink);

    showFormError(form, "");
    setBusy(form, true, T.bezig);
    try {
      await addDocument({ doel, titel, soort, file, url });
      klaar(soort);
    } catch (error) {
      setBusy(form, false);
      showFormError(form, errorMessage(error));
    }
  }

  function bindDetailDocs() {
    byId("detail-docs-titel").textContent = T.titel;

    detailDocs.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-act]");
      if (!button) return;
      const act = button.dataset.act;

      if (act === STAKE_ACTS.open) {
        docFormOpen = true;
        docStatus = "";
        confirmId = null;
        renderDetailDocs("#doc-titel");
      } else if (act === STAKE_ACTS.close) {
        docFormOpen = false;
        renderDetailDocs('[data-act="open-form"]');
      } else if (act === STAKE_ACTS.ask) {
        confirmId = button.dataset.id;
        docStatus = "";
        renderDetailDocs(".doc__confirm .btn--danger");
      } else if (act === STAKE_ACTS.cancel) {
        const id = confirmId;
        confirmId = null;
        renderDetailDocs('[data-act="ask-delete"][data-id="' + id + '"]');
      } else if (act === STAKE_ACTS.del) {
        const box = button.closest(".doc__confirm");
        setBusy(box, true, T.bezigVerwijderen);
        try {
          await removeDocument(button.dataset.id);
          confirmId = null;
          docStatus = T.verwijderd;
          renderDocuments(team ? '[data-act="open-form"]' : null);
        } catch (error) {
          confirmId = null;
          docStatus = errorMessage(error);
          renderDetailDocs();
        }
      }
    });

    detailDocs.addEventListener("change", (event) => {
      if (event.target.name !== "doc-soort") return;
      for (const field of detailDocs.querySelectorAll(".field[data-soort]")) {
        field.hidden = field.dataset.soort !== event.target.value;
      }
      showFormError(event.target.form, "");
    });

    detailDocs.addEventListener("submit", (event) => {
      event.preventDefault();
      submitDocForm(event.target, { stakeholder: currentId }, (soort) => {
        docFormOpen = false;
        docStatus = soort === "bestand" ? T.klaarBestand : T.klaarLink;
        renderDocuments('[data-act="open-form"]');
      });
    });
  }

  /* Alles wat documenten toont opnieuw opbouwen: nodes, paneel en tabel. */
  function renderDocuments(focusTarget) {
    renderNodeBadges();
    renderPlanDocs();
    renderDetailDocs(focusTarget);
  }

  /* ---------- Detailpaneel ---------- */

  function fillDetail(stakeholder) {
    const kwadrant = kwadrantById.get(stakeholder.kwadrant);
    const rij = planById.get(stakeholder.plan);

    detailNaam.textContent = stakeholder.naam;
    detailSub.textContent = stakeholder.toelichting || "";
    detailSub.hidden = !stakeholder.toelichting;

    const portret = holoPortrait(stakeholder.hologram);
    const positie = [
      el(
        "div",
        { class: "detail__positie-tekst" },
        el("p", { class: "detail__kwadrant" }, mark(kwadrant), el("span", { text: kwadrant.naam })),
        levels(kwadrant),
        el("p", { class: "detail__aanpak", text: kwadrant.aanpak })
      )
    ];
    if (portret) positie.push(portret);
    detailPositie.replaceChildren(...positie);

    if (!rij || rij.open) {
      detailPlan.replaceChildren(
        el(
          "div",
          { class: "openstate" },
          el("strong", { text: teksten.open }),
          el("p", { text: teksten.openUitleg })
        )
      );
      return;
    }

    const delen = [];
    if (rij.stakeholder !== stakeholder.naam) {
      delen.push(
        el("p", { class: "detail__onder" }, teksten.staatOnder + " ", el("strong", { text: rij.stakeholder }), ".")
      );
    }
    delen.push(
      el(
        "dl",
        { class: "plan-dl" },
        data.plan.kolommen.map((kolom) =>
          el("div", null, el("dt", { text: kolom.vraag }), el("dd", { text: rij[kolom.id] || teksten.open }))
        )
      )
    );
    detailPlan.replaceChildren(...delen);
  }

  /* Het hologram van een stakeholder: blauwe figuren boven een straler, zoals een holo-oproep. */
  const FIGUREN = { persoon: [0], duo: [-0.5, 0.5], trio: [-1, 0, 1], groep: [-2, -1, 0, 1, 2] };

  function holoPortrait(soort) {
    let beeld = null;
    if (soort === "logo" && data.beelden && data.beelden.logoHologram) {
      beeld = el("img", { class: "holoportret__logo", src: data.beelden.logoHologram.bestand, alt: "", decoding: "async" });
    } else if (FIGUREN[soort]) {
      const plekken = FIGUREN[soort];
      const stap = soort === "groep" ? 15 : 26;
      const breedte = 40 + (plekken.length - 1) * stap;
      const midden = (plekken.length - 1) / 2;
      /* Buitenste figuren eerst, zodat de middelste vooraan staat. */
      const figuren = plekken
        .map((plek, i) => ({ i, afstand: Math.abs(plek) }))
        .sort((a, b) => b.afstand - a.afstand)
        .map(({ i, afstand }) => {
          const schaal = 1 - afstand * 0.07;
          const x = i * stap + 20 * (1 - schaal);
          const y = 88 * (1 - schaal);
          return (
            '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + schaal.toFixed(2) + ')">' +
            '<circle cx="20" cy="13" r="9"/><path d="M5 38c0-9 7-13 15-13s15 4 15 13l-3 48H8z"/>' +
            "</g>"
          );
        })
        .join("");
      beeld = svg(
        '<svg class="holoportret__figuren" viewBox="0 0 ' + breedte + ' 88" focusable="false" data-aantal="' + plekken.length + '" data-midden="' + midden + '">' +
          figuren +
          "</svg>"
      );
    }
    if (!beeld) return null;
    return el(
      "span",
      { class: "holoportret", "aria-hidden": "true", dataset: { soort } },
      el("span", { class: "holoportret__beeld" }, beeld),
      el("span", { class: "holoportret__voet" })
    );
  }

  function setExpanded(id) {
    for (const node of map.querySelectorAll(".node")) {
      node.setAttribute("aria-expanded", String(node.dataset.id === id));
    }
  }

  function cancelClosing() {
    if (!closeTimer) return;
    window.clearTimeout(closeTimer);
    closeTimer = 0;
    dialog.classList.remove("is-closing");
  }

  function openDetail(id, trigger) {
    const stakeholder = stakeholderById.get(id);
    if (!stakeholder) return;

    cancelClosing();
    currentId = id;
    lastTrigger = trigger;
    docFormOpen = false;
    docStatus = "";
    confirmId = null;
    fillDetail(stakeholder);
    renderDetailDocs();
    setExpanded(id);

    const sheet = sheetQuery.matches;
    if (!dialog.open) {
      dialog.classList.toggle("detail--sheet", sheet);
      if (sheet) {
        dialog.showModal();
        root.classList.add("has-sheet");
      } else {
        dialog.show();
      }
    }
    if (!sheet) stage.classList.add("is-docked");
    fitDetail();
    dialog.scrollTop = 0;
    detailNaam.focus({ preventScroll: true });
  }

  /* Naast de kaart is het paneel nooit hoger dan de kaart zelf, zodat het ook bovenaan de pagina in beeld past. */
  function fitDetail() {
    if (!dialog.open || dialog.classList.contains("detail--sheet")) {
      dialog.style.removeProperty("--detail-max");
      return;
    }
    const plot = map.querySelector(".plot");
    const hoogte = Math.max(360, Math.min(plot ? plot.offsetHeight : map.offsetHeight, window.innerHeight - 48));
    dialog.style.setProperty("--detail-max", hoogte + "px");
  }

  function closeDetail(options) {
    const instant = options && options.instant;
    const restoreFocus = !options || options.restoreFocus !== false;
    if (!dialog.open) return;
    if (closeTimer && !instant) return;
    cancelClosing();

    const trigger = lastTrigger;
    currentId = null;
    setExpanded(null);
    stage.classList.remove("is-docked");

    const finish = () => {
      closeTimer = 0;
      dialog.classList.remove("is-closing");
      dialog.close();
      root.classList.remove("has-sheet");
      if (restoreFocus && trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    };

    if (instant || reduceMotion.matches) {
      finish();
      return;
    }
    dialog.classList.add("is-closing");
    closeTimer = window.setTimeout(finish, CLOSE_MS);
  }

  function toggleDetail(id, trigger) {
    if (currentId === id && dialog.open && !closeTimer) closeDetail();
    else openDetail(id, trigger);
  }

  /* Escape sluit eerst het formulier, dan pas het paneel. */
  function escapeDetail() {
    if (docFormOpen) {
      docFormOpen = false;
      renderDetailDocs('[data-act="open-form"]');
    } else if (confirmId) {
      confirmId = null;
      renderDetailDocs();
    } else {
      closeDetail();
    }
  }

  function bindDetail() {
    dialog.setAttribute("aria-label", teksten.details);
    byId("detail-plan-titel").textContent = data.plan.titel;

    const sluiten = byId("detail-sluiten");
    sluiten.setAttribute("aria-label", teksten.sluiten);
    sluiten.addEventListener("click", () => closeDetail());

    /* Escape in de bottom sheet: zelf afhandelen, zodat de animatie en de focus kloppen. */
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      escapeDetail();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !dialog.open || (teamDialog && teamDialog.open)) return;
      if (dialog.matches(":modal")) return;
      escapeDetail();
    });

    /* Sluit de browser het paneel zelf, bijvoorbeeld na twee keer Escape, dan loopt de rest van de pagina mee. */
    dialog.addEventListener("close", () => {
      /* Staat het paneel alweer open, dan hoort deze melding bij een eerdere sluiting. */
      if (dialog.open || !currentId) return;
      const trigger = lastTrigger;
      cancelClosing();
      currentId = null;
      setExpanded(null);
      stage.classList.remove("is-docked");
      root.classList.remove("has-sheet");
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    });

    /* Een klik naast de bottom sheet sluit het paneel. */
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog || !dialog.classList.contains("detail--sheet")) return;
      const box = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) closeDetail();
    });

    window.addEventListener("resize", fitDetail);
    if ("ResizeObserver" in window) new ResizeObserver(fitDetail).observe(map);

    /* Bij het wisselen tussen smal en breed scherm opent het paneel opnieuw in de passende vorm. */
    sheetQuery.addEventListener("change", () => {
      if (!dialog.open) return;
      const id = currentId;
      const trigger = lastTrigger;
      closeDetail({ instant: true, restoreFocus: false });
      if (id) openDetail(id, trigger);
    });
  }

  /* ---------- Plan van aanpak ---------- */

  function renderPlan() {
    const kolommen = data.plan.kolommen;

    const head = el(
      "tr",
      { role: "row" },
      el("th", { scope: "col", role: "columnheader", text: data.plan.kolomStakeholder }),
      kolommen.map((kolom) => el("th", { scope: "col", role: "columnheader", text: kolom.vraag }))
    );

    const body = data.plan.rijen.map((rij) => {
      const kwadranten = [
        ...new Set(data.stakeholders.filter((s) => s.plan === rij.id).map((s) => s.kwadrant))
      ]
        .map((id) => kwadrantById.get(id))
        .filter(Boolean);

      const naam = el(
        "th",
        { scope: "row", role: "rowheader" },
        el("span", { class: "plan__naam", text: rij.stakeholder }),
        kwadranten.map((kwadrant) =>
          el("span", { class: "plan__pos" }, mark(kwadrant), el("span", { text: kwadrant.naam }))
        ),
        el("ul", { class: "plan__docs", dataset: { plan: rij.id }, hidden: true })
      );

      if (rij.open) {
        return el(
          "tr",
          { role: "row", class: "is-open" },
          naam,
          el(
            "td",
            { role: "cell", class: "plan__opencel", colspan: String(kolommen.length) },
            el("span", { class: "plan__open", text: teksten.open })
          )
        );
      }

      return el(
        "tr",
        { role: "row" },
        naam,
        kolommen.map((kolom) =>
          el("td", { role: "cell", dataset: { label: kolom.vraag }, text: rij[kolom.id] || teksten.open })
        )
      );
    });

    byId("weergave-plan").append(
      el(
        "div",
        { class: "planwrap" },
        el(
          "table",
          { class: "plan", role: "table" },
          el("caption", { class: "visually-hidden", text: data.plan.titel }),
          el("thead", { role: "rowgroup" }, head),
          el("tbody", { role: "rowgroup" }, body)
        )
      )
    );
  }

  /* In de tabel staan de documenten onder de naam van de rij waar hun stakeholder bij hoort. */
  function renderPlanDocs() {
    for (const lijst of document.querySelectorAll(".plan__docs")) {
      const ids = data.stakeholders.filter((s) => s.plan === lijst.dataset.plan).map((s) => s.id);
      const docs = documenten.filter((d) => ids.includes(d.stakeholder));
      lijst.hidden = docs.length === 0;
      lijst.replaceChildren(...docs.map((doc) => el("li", null, docLink(doc, true))));
    }
  }

  /* ---------- Voortgang: sterrenkaart met planeten ---------- */

  const PLANET_HUES = [205, 188, 222, 198, 212, 180];
  const PLANET_SIZES = [144, 128, 152, 136, 140, 124];

  /* De manen van een planeet zijn de onderdelen ervan; een afgeronde maan telt mee voor de voortgang. */
  function planetProgress(id) {
    const item = voortgang[id] || {};
    const manen = (item.manen || item.stappen || []).filter((maan) => maan && maan.id && maan.titel);
    return { manen, klaar: manen.filter((maan) => maan.klaar).length, totaal: manen.length };
  }

  function statusLabel(p) {
    if (!p.totaal) return V.geenManen;
    if (!p.klaar) return V.nietGestart;
    return p.klaar === p.totaal ? V.afgerond : V.bezig;
  }

  const PLANET_DIR = "beeld/planeten/";
  const mislukteBeelden = new Set();

  /* Een planeet: het plaatje uit beeld/planeten als dat is opgegeven, anders een getekende draadbol.
     De ring eromheen toont de voortgang. */
  function planetSvg(index, p, onderdeel) {
    const deel = p.totaal ? (p.klaar / p.totaal) * 100 : 0;
    const ring =
      '<circle class="planet__track" cx="70" cy="70" r="64"/>' +
      (deel
        ? '<circle class="planet__ring" cx="70" cy="70" r="64" pathLength="100" stroke-dasharray="' + deel.toFixed(1) + ' 100" transform="rotate(-90 70 70)"/>'
        : "");
    const naam = onderdeel && onderdeel.planeet;
    if (!naam || mislukteBeelden.has(naam)) return wirePlanet(index, ring);

    const id = "planeet-" + svgCount++;
    const node = svg(
      '<svg class="planet__svg planet__svg--beeld" viewBox="0 0 140 140" aria-hidden="true" focusable="false">' +
        "<defs>" +
        '<clipPath id="' + id + '-rond"><circle cx="70" cy="70" r="46"/></clipPath>' +
        '<pattern id="' + id + '-scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="rgba(214,236,255,0.16)"/></pattern>' +
        "</defs>" +
        ring +
        '<circle cx="70" cy="70" r="46" fill="#060c18"/>' +
        '<image x="24" y="24" width="92" height="92" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + id + '-rond)"/>' +
        '<circle cx="70" cy="70" r="46" fill="url(#' + id + '-scan)"/>' +
        '<circle class="planet__rim" cx="70" cy="70" r="46"/>' +
        "</svg>"
    );
    const image = node.querySelector("image");
    image.setAttribute("href", PLANET_DIR + encodeURIComponent(naam) + ".png");
    /* Ontbreekt het plaatje, dan valt de planeet terug op de draadbol. */
    image.addEventListener("error", () => {
      if (mislukteBeelden.has(naam)) return;
      mislukteBeelden.add(naam);
      renderVoortgang();
    });
    return node;
  }

  /* De getekende planeet: een draadbol met een eigen kenmerk. */
  function wirePlanet(index, ring) {
    const hue = PLANET_HUES[index % PLANET_HUES.length];
    const line = "hsl(" + hue + " 95% 78%)";
    const id = "planeet-licht-" + svgCount++;
    const kenmerk = index % 4;
    let achter = "";
    let voor = "";

    if (kenmerk === 1) {
      achter =
        '<ellipse cx="70" cy="70" rx="55" ry="12" transform="rotate(-18 70 70)" fill="none" stroke="' + line + '" stroke-opacity=".5" stroke-width="1.25"/>';
      voor =
        '<path d="M15 70A55 12 0 0 0 125 70" transform="rotate(-18 70 70)" fill="none" stroke="' + line + '" stroke-width="1.5"/>';
    } else if (kenmerk === 2) {
      voor =
        '<circle cx="105" cy="34" r="5.5" fill="hsl(' + hue + ' 70% 30% / .7)" stroke="' + line + '" stroke-width="1.25"/>';
    } else if (kenmerk === 3) {
      voor =
        '<circle cx="56" cy="56" r="7" fill="none" stroke="' + line + '" stroke-opacity=".55" stroke-width="1"/>' +
        '<circle cx="86" cy="84" r="4.5" fill="none" stroke="' + line + '" stroke-opacity=".55" stroke-width="1"/>';
    } else {
      voor =
        '<ellipse cx="70" cy="50" rx="37" ry="6" fill="none" stroke="' + line + '" stroke-opacity=".5" stroke-width="1"/>' +
        '<ellipse cx="70" cy="90" rx="37" ry="6" fill="none" stroke="' + line + '" stroke-opacity=".5" stroke-width="1"/>';
    }

    return svg(
      '<svg class="planet__svg" viewBox="0 0 140 140" aria-hidden="true" focusable="false">' +
        '<defs><radialGradient id="' + id + '" cx="34%" cy="30%" r="78%">' +
        '<stop offset="0" stop-color="hsl(' + hue + ' 90% 72% / .6)"/>' +
        '<stop offset=".55" stop-color="hsl(' + hue + ' 75% 42% / .3)"/>' +
        '<stop offset="1" stop-color="hsl(' + hue + ' 70% 18% / .18)"/>' +
        "</radialGradient></defs>" +
        ring +
        achter +
        '<circle cx="70" cy="70" r="42" fill="#060c18"/>' +
        '<circle cx="70" cy="70" r="42" fill="url(#' + id + ')" stroke="' + line + '" stroke-width="1.5"/>' +
        '<g fill="none" stroke="' + line + '" stroke-opacity=".42" stroke-width="1">' +
        '<ellipse cx="70" cy="70" rx="42" ry="13"/><ellipse cx="70" cy="70" rx="15" ry="42"/><ellipse cx="70" cy="70" rx="31" ry="42"/>' +
        "</g>" +
        voor +
        "</svg>"
    );
  }

  /* De route loopt in een vloeiende lijn langs alle planeten en loopt aan beide kanten door tot de rand. */
  function routePath(points, wide) {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const all = [wide ? [0, first[1] + 8] : [first[0] + 8, 0]].concat(points, [wide ? [100, last[1] - 8] : [last[0] - 8, 100]]);
    const at = (i) => all[Math.max(0, Math.min(all.length - 1, i))];
    const f = (value) => value.toFixed(2);
    let d = "M" + f(all[0][0]) + " " + f(all[0][1]);
    for (let i = 0; i < all.length - 1; i++) {
      const p0 = at(i - 1);
      const p1 = at(i);
      const p2 = at(i + 1);
      const p3 = at(i + 2);
      d +=
        "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) +
        " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) +
        " " + f(p2[0]) + " " + f(p2[1]);
    }
    return d;
  }

  function renderGalaxy() {
    const aantal = onderdelen.length;
    const wide = onderdelen.map((o, i) => [((i + 0.5) / aantal) * 100, i % 2 ? 62 : 32]);
    /* De verticale route heeft per planeet een vaste ruimte van 196px, zodat de naam van de laatste planeet nooit wordt afgekapt. */
    const tall = onderdelen.map((o, i) => [i % 2 ? 68 : 32, ((i * 196 + 72) / (aantal * 196 + 56)) * 100]);

    galaxy.style.setProperty("--n", String(aantal));
    galaxy.setAttribute("role", "group");
    galaxy.setAttribute("aria-label", V.kaart);

    const chart = svg(
      '<svg class="galaxy__chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        '<ellipse class="galaxy__orbit" cx="50" cy="50" rx="47" ry="40"/>' +
        '<ellipse class="galaxy__orbit" cx="50" cy="50" rx="30" ry="23"/>' +
        '<path class="galaxy__route galaxy__route--wide" d="' + routePath(wide, true) + '"/>' +
        '<path class="galaxy__route galaxy__route--tall" d="' + routePath(tall, false) + '"/>' +
        "</svg>"
    );

    const planets = onderdelen.map((onderdeel, i) => {
      const p = planetProgress(onderdeel.id);
      const status = p.totaal ? statusLabel(p) + ", " + fill(V.kort, { klaar: p.klaar, totaal: p.totaal }) : statusLabel(p);
      return el(
        "button",
        {
          class: "planet",
          type: "button",
          dataset: { id: onderdeel.id },
          style:
            "--xw:" + wide[i][0].toFixed(2) + "%;--yw:" + wide[i][1] + "%;--xt:" + tall[i][0] + "%;--yt:" + (i * 196 + 72) +
            "px;--size:" + PLANET_SIZES[i % PLANET_SIZES.length] + "px;--i:" + i
        },
        planetSvg(i, p, onderdeel),
        el(
          "span",
          { class: "planet__label" },
          el("span", { class: "planet__naam", text: onderdeel.naam }),
          el("span", { class: "planet__status", text: status })
        )
      );
    });

    galaxy.classList.toggle("is-leeg", aantal === 0);
    const leeg = aantal ? [] : [el("p", { class: "galaxy__leeg", text: team ? V.geenPlanetenEditor : V.geenPlaneten })];
    galaxy.replaceChildren(chart, ...planets, ...leeg);
    fitGalaxy();
  }

  /* ---------- Planeten toevoegen en aanpassen: alleen in de editor ---------- */

  const beeldNaam = (naam) => {
    const tekst = naam.replace(/-/g, " ");
    return tekst.charAt(0).toUpperCase() + tekst.slice(1);
  };

  /* Een id voor een nieuwe planeet: de naam in kleine letters en met streepjes. */
  function slugId(naam) {
    return naam
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const manenLabel = (aantal) => (aantal === 1 ? V.maanEen : fill(V.maanMeer, { aantal }));
  const docsOfPlanet = (id) => documenten.filter((d) => d.maan && d.maan.startsWith(id + "/"));

  /* Wat er mee verdwijnt als de planeet of de maan weggaat: de manen en de documenten die eraan hangen. */
  function verliesTekst(manen, docs) {
    const delen = [manen ? manenLabel(manen) : "", docs ? countLabel(docs) : ""].filter(Boolean);
    return delen.length ? " " + fill(V.verliest, { delen: delen.join(" en ") }) : "";
  }

  /* Het formulier voor een nieuwe planeet (zonder onderdeel) of om een bestaande aan te passen. */
  function planetFormEl(onderdeel) {
    const nieuw = !onderdeel;
    const bezet = new Set(
      onderdelen.filter((o) => nieuw || o.id !== onderdeel.id).map((o) => o.planeet).filter(Boolean)
    );
    const vrij = (data.planeetbeelden || []).filter((naam) => !bezet.has(naam));
    const huidig = nieuw ? vrij[0] || "" : onderdeel.planeet || "";
    const gekozen = huidig === "" || vrij.includes(huidig) ? huidig : "";
    const gekoppeld = new Set(nieuw ? [] : onderdeel.stakeholders || []);

    const keuze = (waarde, label, plaatje) =>
      el(
        "label",
        { class: "pick" },
        el("input", { type: "radio", name: "beeld", value: waarde, checked: waarde === gekozen }),
        plaatje,
        el("span", { class: "pick__naam", text: label })
      );
    const beelden = vrij.map((naam) =>
      keuze(
        naam,
        beeldNaam(naam),
        el("img", {
          class: "pick__beeld",
          src: PLANET_DIR + encodeURIComponent(naam) + ".png",
          alt: "",
          width: "44",
          height: "44",
          loading: "lazy",
          decoding: "async"
        })
      )
    );
    beelden.push(keuze("", V.beeldGeen, el("span", { class: "pick__beeld pick__beeld--draad", "aria-hidden": "true" })));

    return el(
      "form",
      { class: "planeetform", id: "planeetform", novalidate: true, dataset: { modus: nieuw ? "nieuw" : "aanpassen" } },
      el(
        "div",
        { class: "field" },
        el("label", { for: "planeet-veld-naam", text: V.veldPlaneetNaam }),
        el("input", {
          id: "planeet-veld-naam",
          name: "naam",
          type: "text",
          maxlength: "40",
          autocomplete: "off",
          required: true,
          value: nieuw ? null : onderdeel.naam
        })
      ),
      el("fieldset", { class: "picker" }, el("legend", { text: V.veldBeeld }), el("div", { class: "picker__rij" }, beelden)),
      el(
        "fieldset",
        { class: "picker", "aria-describedby": "planeet-veld-stake-hulp" },
        el("legend", { text: V.veldStakeholders }),
        el("p", { class: "hint", id: "planeet-veld-stake-hulp", text: V.stakeholdersHulp }),
        el(
          "div",
          { class: "picker__checks" },
          data.stakeholders.map((s) =>
            el(
              "label",
              { class: "check" },
              el("input", { type: "checkbox", name: "stakeholders", value: s.id, checked: gekoppeld.has(s.id) }),
              el("span", { class: "check__box", "aria-hidden": "true" }),
              el("span", { text: s.naam })
            )
          )
        )
      ),
      el("p", { class: "formerror", id: "planeetform-fout", role: "alert", hidden: true }),
      el(
        "div",
        { class: "actions" },
        el("button", { class: "btn btn--primary", type: "submit", text: nieuw ? V.planeetToevoegen : V.planeetOpslaan }),
        el("button", { class: "btn", type: "button", dataset: { act: "planeet-annuleer" }, text: T.annuleren })
      )
    );
  }

  /* De plek onder de sterrenkaart waar het team een planeet toevoegt. */
  function renderGalaxyTools() {
    if (!galaxyTools) return;
    galaxyTools.hidden = !team || galaxy.hidden;
    if (galaxyTools.hidden) return;
    const delen = [];
    if (galaxyStatus) delen.push(el("p", { class: "docs__status", role: "status", text: galaxyStatus }));
    if (galaxyForm) {
      delen.push(el("h3", { id: "planeet-nieuw-titel", text: V.planeetToevoegen }), planetFormEl(null));
    } else {
      delen.push(
        el("button", { class: "btn", type: "button", dataset: { act: "planeet-nieuw" } }, icon("plus"), el("span", { text: V.planeetToevoegen }))
      );
    }
    galaxyTools.replaceChildren(...delen);
  }

  /* Voegt een planeet toe of past hem aan, naar het formulier. De manen en documenten blijven bij het id van de planeet. */
  async function savePlanet(form) {
    const nieuw = form.dataset.modus === "nieuw";
    const naam = form.elements.naam.value.trim().replace(/\s+/g, " ");
    const planeet = form.elements.beeld.value;
    const stakeholders = Array.from(form.querySelectorAll('input[name="stakeholders"]:checked')).map((veld) => veld.value);
    const eigen = nieuw ? null : currentPlanet;
    const slug = nieuw ? slugId(naam) : eigen;

    if (!naam) return fieldError(form, form.elements.naam, V.foutPlaneetNaam);
    if (!slug) return fieldError(form, form.elements.naam, V.foutPlaneetLetters);
    const bestaat = (lijst) =>
      lijst.some((o) => o.id !== eigen && (o.id === slugId(naam) || o.naam.toLowerCase() === naam.toLowerCase()));
    if (bestaat(onderdelen)) return fieldError(form, form.elements.naam, V.foutPlaneetBestaat);

    showFormError(form, "");
    setBusy(form, true, V.bezigOpslaan);
    try {
      const lijst = await updateFile(
        FILES.planeten,
        (huidige) => {
          if (bestaat(huidige)) throw coded("foutPlaneetBestaat");
          if (nieuw) {
            const entry = { id: slug, naam };
            if (planeet) entry.planeet = planeet;
            entry.stakeholders = stakeholders;
            return huidige.concat(entry);
          }
          if (!huidige.some((o) => o.id === slug)) throw coded("foutPlaneetWeg");
          return huidige.map((o) => {
            if (o.id !== slug) return o;
            const volgende = Object.assign({}, o, { naam, stakeholders });
            if (planeet) volgende.planeet = planeet;
            else delete volgende.planeet;
            return volgende;
          });
        },
        nieuw ? "Planeet toegevoegd: " + naam : "Planeet aangepast: " + naam
      );
      setPlaneten(lijst);
    } catch (error) {
      setBusy(form, false);
      showFormError(form, errorMessage(error));
      return;
    }

    if (nieuw) {
      galaxyForm = false;
      galaxyStatus = fill(V.planeetToegevoegd, { naam });
      renderVoortgang();
      const knop = galaxy.querySelector('.planet[data-id="' + slug + '"]');
      if (knop) knop.focus();
    } else {
      planetEdit = false;
      planetStatus = V.planeetOpgeslagen;
      renderVoortgang();
      byId("planeet-naam").focus({ preventScroll: true });
    }
  }

  /* De route van links naar rechts als elke planeet minstens 190px breed krijgt, anders van boven naar beneden. */
  function fitGalaxy() {
    if (galaxy.hidden) return;
    galaxy.classList.toggle("is-wide", onderdelen.length > 0 && galaxy.clientWidth >= onderdelen.length * 190);
  }

  /* De sprong: sterren trekken uit tot strepen vanaf de gekozen planeet. Tijdgestuurd, dus hij eindigt altijd op tijd. */
  function hyperspace(x, y) {
    if (reduceMotion.matches) return Promise.resolve();
    return new Promise((resolve) => {
      const canvas = byId("hyperspace");
      const context = canvas.getContext("2d");
      if (!context) {
        resolve();
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.classList.remove("is-out");
      canvas.hidden = false;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const random = mulberry32(1977);
      const reach = Math.max(width, height);
      const stars = [];
      for (let i = 0; i < 280; i++) {
        stars.push({
          angle: random() * Math.PI * 2,
          radius: 16 + random() * reach * 0.6,
          weight: 0.6 + random() * 1.4,
          tint: random() < 0.75 ? "214,236,255" : "150,205,255"
        });
      }

      const DURATION = 950;
      const start = performance.now();
      let frame = 0;
      let done = false;

      const draw = (now) => {
        if (done) return;
        const t = Math.min((now - start) / DURATION, 1);
        const pull = t * t * t;
        context.clearRect(0, 0, width, height);
        context.fillStyle = "rgba(3,6,14," + (0.5 + 0.45 * t).toFixed(3) + ")";
        context.fillRect(0, 0, width, height);
        context.lineCap = "round";
        for (const star of stars) {
          const from = star.radius * (1 + pull * 3.2);
          const to = from + 2 + pull * (140 + star.radius * 1.5);
          context.strokeStyle = "rgba(" + star.tint + "," + (0.35 + 0.65 * t).toFixed(3) + ")";
          context.lineWidth = star.weight * (1 + t);
          context.beginPath();
          context.moveTo(x + Math.cos(star.angle) * from, y + Math.sin(star.angle) * from);
          context.lineTo(x + Math.cos(star.angle) * to, y + Math.sin(star.angle) * to);
          context.stroke();
        }
        if (t > 0.84) {
          context.fillStyle = "rgba(214,236,255," + (((t - 0.84) / 0.16) * 0.9).toFixed(3) + ")";
          context.fillRect(0, 0, width, height);
        }
        if (t < 1) frame = window.requestAnimationFrame(draw);
      };

      const finish = () => {
        if (done) return;
        done = true;
        window.cancelAnimationFrame(frame);
        context.clearRect(0, 0, width, height);
        context.fillStyle = "rgba(214,236,255,0.9)";
        context.fillRect(0, 0, width, height);
        canvas.classList.add("is-out");
        window.setTimeout(() => {
          canvas.hidden = true;
          canvas.classList.remove("is-out");
        }, 360);
        resolve();
      };

      frame = window.requestAnimationFrame(draw);
      window.setTimeout(finish, DURATION);
    });
  }

  async function jumpTo(id, button) {
    if (jumping || !onderdeelById.has(id)) return;
    jumping = true;
    const box = button.querySelector(".planet__svg").getBoundingClientRect();
    await hyperspace(box.left + box.width / 2, box.top + box.height / 2);
    jumping = false;
    if (currentView === "voortgang") showPlanet(id, { arrive: true });
  }

  async function jumpToMoon(id, button) {
    if (jumping || !currentPlanet || !findMoon(currentPlanet, id)) return;
    jumping = true;
    const box = button.querySelector(".moon__svg").getBoundingClientRect();
    await hyperspace(box.left + box.width / 2, box.top + box.height / 2);
    jumping = false;
    if (currentView === "voortgang" && currentPlanet) showMoon(currentPlanet, id, { arrive: true });
  }

  /* ---------- Een planeet van dichtbij: het stelsel met een maan per onderdeel ---------- */

  /* De plaatjes voor manen: alle planeetbeelden die niet al een planeet op de sterrenkaart zijn. */
  function moonPool() {
    const bezet = new Set(onderdelen.map((onderdeel) => onderdeel.planeet).filter(Boolean));
    return (data.planeetbeelden || []).filter((naam) => !bezet.has(naam));
  }

  function moonImage(maan, index) {
    if (maan.beeld && (data.planeetbeelden || []).includes(maan.beeld)) return maan.beeld;
    const pool = moonPool();
    return pool.length ? pool[index % pool.length] : null;
  }

  /* Een nieuwe maan krijgt een plaatje dat bij deze planeet nog niet gebruikt is. */
  function nextMoonImage(manen) {
    const pool = moonPool();
    if (!pool.length) return undefined;
    const bezet = new Set(manen.map((maan) => maan.beeld));
    return pool.find((naam) => !bezet.has(naam)) || pool[manen.length % pool.length];
  }

  /* Een maan: een kleine planeet die gedimd is zolang het onderdeel niet af is, en oplicht met een vinkje als het af is. */
  function moonSvg(maan, index) {
    const beeld = moonImage(maan, index);
    const id = "maan-" + svgCount++;
    const node = svg(
      '<svg class="moon__svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
        "<defs>" +
        '<clipPath id="' + id + '-rond"><circle cx="32" cy="32" r="23"/></clipPath>' +
        '<pattern id="' + id + '-scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="rgba(214,236,255,0.16)"/></pattern>' +
        "</defs>" +
        '<circle class="moon__ring" cx="32" cy="32" r="29.5"/>' +
        '<circle cx="32" cy="32" r="23" fill="#0b1830"/>' +
        (beeld
          ? '<image class="moon__image" x="9" y="9" width="46" height="46" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + id + '-rond)"/>'
          : '<g class="moon__image moon__wire"><ellipse cx="32" cy="32" rx="23" ry="7"/><ellipse cx="32" cy="32" rx="8" ry="23"/></g>') +
        '<circle cx="32" cy="32" r="23" fill="url(#' + id + '-scan)"/>' +
        '<circle class="moon__rim" cx="32" cy="32" r="23"/>' +
        (maan.klaar ? '<g class="moon__check"><circle cx="50" cy="50" r="9"/><path d="m45.6 50.2 3 3 5.2-6"/></g>' : "") +
        "</svg>"
    );
    if (beeld) node.querySelector("image").setAttribute("href", PLANET_DIR + encodeURIComponent(beeld) + ".png");
    return node;
  }

  /* Een naam met een lang woord staat in de smalle snede, zodat het woord heel blijft. */
  function langWoord(titel) {
    return String(titel).split(/[\s-]+/).some((woord) => woord.length >= 13);
  }

  /* De hoeken waarop de manen staan, gelijk verdeeld en met de klok mee vanaf links.
     Recht boven de planeet staat nooit een maan, zodat de baan rustig leest. */
  function moonAngles(aantal) {
    if (aantal === 1) return [(315 * Math.PI) / 180];
    const start = aantal % 2 ? 90 : 90 + 180 / aantal;
    return Array.from({ length: aantal }, (unused, i) => (start + (i * 360) / aantal) % 360)
      .sort((a, b) => ((a + 180) % 360) - ((b + 180) % 360))
      .map((graden) => (graden * Math.PI) / 180);
  }

  /* Op een baan passen zes manen op een smal scherm en acht op een breed scherm; daarboven staan ze in rijen. */
  function moonCapacity() {
    return wideQuery.matches ? 8 : 6;
  }

  function systemStage(onderdeel, index, p) {
    const aantal = p.manen.length;
    const hoeken = moonAngles(aantal);
    const manen = p.manen.map((maan, i) => {
      const cx = Math.cos(hoeken[i]);
      const cy = Math.sin(hoeken[i]);
      return el(
        "li",
        {
          class: "moon" + (cy < -0.01 ? " is-up" : "") + (maan.id === newMoonId ? " is-new" : ""),
          dataset: { id: maan.id, klaar: String(Boolean(maan.klaar)) },
          style: "--cx:" + cx.toFixed(4) + ";--cy:" + cy.toFixed(4) + ";--ax:" + Math.abs(cx).toFixed(4) + ";--i:" + i
        },
        el(
          "button",
          {
            class: "moon__btn",
            type: "button",
            dataset: { act: "moon", id: maan.id }
          },
          el("span", { class: "moon__beeld" }, moonSvg(maan, i)),
          el("span", { class: "moon__naam" + (langWoord(maan.titel) ? " is-lang" : ""), text: maan.titel }),
          el("span", { class: "visually-hidden", text: ", " + (maan.klaar ? V.klaar : V.open) })
        )
      );
    });

    const klassen = ["system"];
    if (aantal > moonCapacity()) klassen.push("is-grid");
    else if (aantal > 6) klassen.push("is-compact");
    else if (aantal > 4) klassen.push("is-mid");

    return el(
      "div",
      { class: klassen.join(" "), role: "group", "aria-label": fill(V.stelsel, { naam: onderdeel.naam }) },
      el(
        "div",
        { class: "system__ruimte" },
        el("div", { class: "system__kegel", "aria-hidden": "true" }),
        el("div", { class: "system__baan", "aria-hidden": "true" }),
        el("div", { class: "system__planet", "aria-hidden": "true" }, planetSvg(index, p, onderdeel)),
        el("ul", { class: "moons" }, manen)
      ),
      el("div", { class: "system__voet", "aria-hidden": "true" })
    );
  }

  /* Dezelfde manen als lijst: voor wie leest zonder de kaart, en de plek waar het team afvinkt en verwijdert. */
  function moonRow(maan) {
    const attrs = {
      class: "moonrow",
      dataset: { id: maan.id, klaar: String(Boolean(maan.klaar)) }
    };
    if (!team) {
      return el(
        "li",
        attrs,
        icon(maan.klaar ? "check" : "todo"),
        el("span", { class: "moonrow__titel", text: maan.titel }),
        el("span", { class: "moonrow__status", text: maan.klaar ? V.klaar : V.open })
      );
    }
    if (moonRemoveId === maan.id) {
      return el("li", attrs, moonConfirmBox(maan));
    }
    return el(
      "li",
      attrs,
      el(
        "label",
        { class: "check" },
        el("input", { type: "checkbox", checked: Boolean(maan.klaar), dataset: { act: "toggle-moon", id: maan.id } }),
        el("span", { class: "check__box", "aria-hidden": "true" }),
        el("span", { class: "moonrow__titel", text: maan.titel }),
        el("span", { class: "visually-hidden", text: ", " + V.klaar })
      ),
      el(
        "button",
        {
          class: "iconbtn iconbtn--small",
          type: "button",
          "aria-label": fill(V.verwijder, { titel: maan.titel }),
          dataset: { act: "remove-moon", id: maan.id }
        },
        icon("trash")
      )
    );
  }

  /* Eerst vragen: een maan verwijderen haalt ook de documenten weg die eraan hangen. */
  function moonConfirmBox(maan) {
    const docs = docsForMoon(moonKey(currentPlanet, maan.id)).length;
    return el(
      "div",
      { class: "doc__confirm" },
      el("span", { text: fill(V.maanZeker, { titel: maan.titel }) + verliesTekst(0, docs) }),
      el("button", { class: "btn btn--danger", type: "button", dataset: { act: "remove-moon-yes", id: maan.id }, text: T.ja }),
      el("button", { class: "btn", type: "button", dataset: { act: "remove-moon-no", id: maan.id }, text: T.annuleren })
    );
  }

  /* Onderaan de planeet: aanpassen of verwijderen, alleen voor het team. */
  function planetAdmin(onderdeel, p) {
    const delen = [el("h3", { id: "planeet-beheer", text: V.beheerPlaneet })];
    if (planetEdit) {
      delen.push(planetFormEl(onderdeel));
    } else if (planetConfirm) {
      delen.push(
        el(
          "div",
          { class: "doc__confirm" },
          el("span", { text: fill(V.planeetZeker, { naam: onderdeel.naam }) + verliesTekst(p.totaal, docsOfPlanet(onderdeel.id).length) }),
          el("button", { class: "btn btn--danger", type: "button", dataset: { act: "planeet-verwijder-ja" }, text: T.ja }),
          el("button", { class: "btn", type: "button", dataset: { act: "planeet-verwijder-nee" }, text: T.annuleren })
        )
      );
    } else {
      delen.push(
        el(
          "div",
          { class: "actions" },
          el("button", { class: "btn", type: "button", dataset: { act: "planeet-aanpassen" } }, el("span", { text: V.planeetAanpassen })),
          el("button", { class: "btn", type: "button", dataset: { act: "planeet-verwijderen" } }, icon("trash"), el("span", { text: V.planeetVerwijderen }))
        )
      );
    }
    return el("section", { class: "planetview__beheer", "aria-labelledby": "planeet-beheer" }, delen);
  }

  /* Onderaan de maan: verwijderen, alleen voor het team. */
  function moonAdmin(maan) {
    const delen = [el("h3", { id: "maan-beheer", text: V.beheerMaan })];
    if (moonRemoveId === maan.id) {
      delen.push(moonConfirmBox(maan));
    } else {
      delen.push(
        el(
          "div",
          { class: "actions" },
          el("button", { class: "btn", type: "button", dataset: { act: "maan-verwijderen" } }, icon("trash"), el("span", { text: V.maanVerwijderen }))
        )
      );
    }
    return el("section", { class: "planetview__beheer", "aria-labelledby": "maan-beheer" }, delen);
  }

  function stakeholderLink(stakeholder) {
    const kwadrant = kwadrantById.get(stakeholder.kwadrant);
    return el(
      "li",
      null,
      el(
        "button",
        {
          class: "stakelink",
          type: "button",
          "aria-label": fill(V.toonOpKaart, { naam: stakeholder.naam }),
          dataset: { act: "stakeholder", id: stakeholder.id }
        },
        mark(kwadrant),
        el(
          "span",
          { class: "node__text" },
          el("span", { class: "node__naam", text: stakeholder.naam }),
          el("span", { class: "node__sub", text: kwadrant.naam })
        )
      )
    );
  }

  /* Video's bij een planeet of een maan: pas bij afspelen wordt het bestand opgehaald. */
  function clipsSection(items, id) {
    const media = (items || []).filter((item) => item && item.bestand);
    if (!media.length) return null;
    return el(
      "section",
      { class: "planetview__section", "aria-labelledby": id },
      el("h3", { id, text: V.media }),
      el(
        "div",
        { class: "clips" },
        media.map((item) =>
          el(
            "figure",
            { class: "clip" },
            el("video", {
              controls: true,
              preload: "none",
              playsinline: true,
              poster: item.poster,
              src: item.bestand,
              "aria-label": item.titel
            }),
            el(
              "figcaption",
              null,
              el("span", { class: "clip__titel", text: item.titel }),
              item.duur && el("span", { class: "clip__duur", text: item.duur })
            )
          )
        )
      )
    );
  }

  function renderPlanetView() {
    const onderdeel = onderdeelById.get(currentPlanet);
    if (!onderdeel) return;
    /* Opnieuw tekenen, bijvoorbeeld bij het openen van een formulier, laat de manen niet opnieuw aankomen.
       De aankomst na een sprong zet showPlanet er daarna weer op. */
    planetview.classList.remove("is-arriving");
    const index = onderdelen.indexOf(onderdeel);
    const p = planetProgress(onderdeel.id);
    const gekoppeld = (onderdeel.stakeholders || []).map((id) => stakeholderById.get(id)).filter(Boolean);
    const telling = fill(V.telling, { klaar: p.klaar, totaal: p.totaal });
    if (currentView === "voortgang") intro.textContent = p.totaal ? V.introPlaneet : V.introPlaneetLeeg;

    const kop = [
      el("h2", { id: "planeet-naam", tabindex: "-1", text: onderdeel.naam }),
      el("p", { class: "planetview__status", text: statusLabel(p) })
    ];
    if (planetStatus) kop.push(el("p", { class: "docs__status", role: "status", text: planetStatus }));
    if (planetError) kop.push(el("p", { class: "formerror", role: "alert", text: planetError }));
    if (p.totaal) {
      kop.push(
        el(
          "div",
          {
            class: "progress",
            role: "progressbar",
            "aria-labelledby": "planeet-naam",
            "aria-valuemin": "0",
            "aria-valuemax": String(p.totaal),
            "aria-valuenow": String(p.klaar),
            "aria-valuetext": telling
          },
          el("span", { class: "progress__fill", style: "width:" + ((p.klaar / p.totaal) * 100).toFixed(1) + "%" })
        ),
        el("p", { class: "progress__text", text: telling })
      );
    }

    const manenDelen = [el("h3", { id: "planeet-manen", text: V.titel })];
    if (p.totaal) manenDelen.push(el("ul", { class: "moonlist" }, p.manen.map(moonRow)));
    else manenDelen.push(el("p", { class: "docs__leeg", text: V.leeg }));
    if (stepError) manenDelen.push(el("p", { class: "formerror", role: "alert", text: stepError }));
    if (team) {
      manenDelen.push(
        el(
          "form",
          { class: "moonform", id: "moonform", novalidate: true },
          el(
            "div",
            { class: "field" },
            el("label", { for: "maan-titel", text: V.veldMaan }),
            el("input", { id: "maan-titel", name: "titel", type: "text", maxlength: "60", autocomplete: "off" })
          ),
          el("button", { class: "btn", type: "submit" }, icon("plus"), el("span", { text: V.maanToevoegen }))
        )
      );
    }

    const mediaSectie = clipsSection(onderdeel.media, "planeet-media");

    planetview.replaceChildren(
      el("button", { class: "btn btn--back", type: "button", dataset: { act: "back" } }, icon("back"), el("span", { text: V.terug })),
      el(
        "div",
        { class: "planetview__grid" },
        el("header", { class: "planetview__head" }, kop),
        systemStage(onderdeel, index, p),
        el(
          "div",
          { class: "planetview__body" },
          el("section", { class: "planetview__section", "aria-labelledby": "planeet-manen" }, manenDelen)
        )
      ),
      el(
        "div",
        { class: "planetview__extra" },
        mediaSectie,
        el(
          "section",
          { class: "planetview__section", "aria-labelledby": "planeet-invloed" },
          el("h3", { id: "planeet-invloed", text: V.invloed }),
          gekoppeld.length
            ? el("ul", { class: "nodes nodes--links" }, gekoppeld.map(stakeholderLink))
            : el("p", { class: "docs__leeg", text: V.geenInvloed })
        )
      ),
      ...(team ? [planetAdmin(onderdeel, p)] : [])
    );
  }

  /* ---------- Een maan van dichtbij: wat bij dit onderdeel hoort ---------- */

  function findMoon(planeetId, maanId) {
    return planetProgress(planeetId).manen.find((maan) => maan.id === maanId) || null;
  }

  /* De documenten van de maan die open staat; de rest van de weergave blijft staan, ook een video die speelt. */
  function fillMoonDocs() {
    const vak = byId("maan-docs-vak");
    if (!vak || !currentPlanet || !currentMoon) return;
    const lijst = docsForMoon(moonKey(currentPlanet, currentMoon));
    const delen = [];

    if (lijst.length) delen.push(docListEl(lijst, moonConfirmId, MOON_ACTS));
    else delen.push(el("p", { class: "docs__leeg", text: T.leeg }));

    if (moonDocStatus) delen.push(el("p", { class: "docs__status", role: "status", text: moonDocStatus }));

    if (team && moonDocFormOpen) delen.push(docForm("maandoc", MOON_ACTS));
    else if (team) {
      delen.push(
        el("button", { class: "btn", type: "button", dataset: { act: MOON_ACTS.open } }, icon("plus"), el("span", { text: T.toevoegen }))
      );
    }

    vak.replaceChildren(...delen);
  }

  function renderMoonView() {
    const onderdeel = onderdeelById.get(currentPlanet);
    const p = planetProgress(currentPlanet);
    const index = p.manen.findIndex((maan) => maan.id === currentMoon);
    const maan = p.manen[index];
    if (!onderdeel || !maan) return;
    planetview.classList.remove("is-arriving");

    const kop = [
      el("h2", { id: "maan-naam", tabindex: "-1", text: maan.titel }),
      el("p", { class: "planetview__status", text: maan.klaar ? V.klaar : V.open }),
      el("p", { class: "progress__text", text: fill(V.maanVan, { planeet: onderdeel.naam }) })
    ];
    if (team) {
      kop.push(
        el(
          "div",
          { class: "moonview__afvinken" },
          el(
            "label",
            { class: "check" },
            el("input", { type: "checkbox", checked: Boolean(maan.klaar), dataset: { act: "toggle-moon", id: maan.id } }),
            el("span", { class: "check__box", "aria-hidden": "true" }),
            el("span", { text: V.afvinken })
          )
        )
      );
    }
    if (stepError) kop.push(el("p", { class: "formerror", role: "alert", text: stepError }));

    const stage = el(
      "div",
      { class: "system system--maan", role: "group", "aria-label": fill(V.maanStelsel, { titel: maan.titel, planeet: onderdeel.naam }) },
      el(
        "div",
        { class: "system__ruimte" },
        el("div", { class: "system__kegel", "aria-hidden": "true" }),
        el("div", { class: "system__planet", "aria-hidden": "true" }, moonSvg(maan, index))
      ),
      el("div", { class: "system__voet", "aria-hidden": "true" })
    );

    const docs = el(
      "section",
      { class: "planetview__section", "aria-labelledby": "maan-docs" },
      el("h3", { id: "maan-docs", text: T.titel }),
      el("div", { id: "maan-docs-vak" })
    );

    const delen = [
      el(
        "button",
        { class: "btn btn--back", type: "button", dataset: { act: "back-planet" } },
        icon("back"),
        el("span", { text: fill(V.terugNaarPlaneet, { planeet: onderdeel.naam }) })
      ),
      el(
        "div",
        { class: "planetview__grid" },
        el("header", { class: "planetview__head" }, kop),
        stage,
        el("div", { class: "planetview__body" }, docs)
      )
    ];
    const clips = clipsSection(maan.media, "maan-media");
    if (clips) delen.push(el("div", { class: "planetview__extra" }, clips));
    if (team) delen.push(moonAdmin(maan));

    planetview.replaceChildren(...delen);
    fillMoonDocs();
  }

  function showMoon(planetId, moonId, options) {
    if (!onderdeelById.has(planetId)) return;
    if (!findMoon(planetId, moonId)) {
      showPlanet(planetId, options);
      return;
    }
    currentPlanet = planetId;
    currentMoon = moonId;
    moonDocFormOpen = false;
    moonDocStatus = "";
    moonConfirmId = null;
    moonRemoveId = null;
    planetEdit = false;
    planetConfirm = false;
    planetStatus = "";
    planetError = "";
    galaxyStatus = "";
    stepError = "";
    renderMoonView();
    galaxy.hidden = true;
    renderGalaxyTools();
    planetview.hidden = false;
    planetview.classList.toggle("is-arriving", Boolean(options && options.arrive));
    window.clearTimeout(arriveTimer);
    if (options && options.arrive) {
      arriveTimer = window.setTimeout(() => planetview.classList.remove("is-arriving"), 2400);
    }
    intro.textContent = V.introMaan;
    if (!options || options.updateHash !== false) setHash("voortgang/" + moonKey(planetId, moonId));
    if (!options || options.focus !== false) {
      const top = planetview.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) planetview.scrollIntoView({ block: "start" });
      byId("maan-naam").focus({ preventScroll: true });
    }
    scheduleSky();
  }

  /* Terug naar de planeet: de manen schieten weer naar hun baan en de focus staat op de maan waar je vandaan komt. */
  function leaveMoon() {
    const vorige = currentMoon;
    if (!currentPlanet) return;
    showPlanet(currentPlanet, { arrive: true });
    const knop = planetview.querySelector('.moon__btn[data-id="' + vorige + '"]');
    if (knop) knop.focus({ preventScroll: true });
  }

  function showPlanet(id, options) {
    if (!onderdeelById.has(id)) return;
    currentPlanet = id;
    currentMoon = null;
    moonDocFormOpen = false;
    moonDocStatus = "";
    moonConfirmId = null;
    moonRemoveId = null;
    planetEdit = false;
    planetConfirm = false;
    planetStatus = "";
    planetError = "";
    galaxyStatus = "";
    stepError = "";
    renderPlanetView();
    galaxy.hidden = true;
    renderGalaxyTools();
    planetview.hidden = false;
    planetview.classList.toggle("is-arriving", Boolean(options && options.arrive));
    /* Na de aankomst gaat de klasse eraf, zodat opnieuw tekenen de aankomst niet herhaalt. */
    window.clearTimeout(arriveTimer);
    if (options && options.arrive) {
      arriveTimer = window.setTimeout(() => planetview.classList.remove("is-arriving"), 2400);
    }
    if (!options || options.updateHash !== false) setHash("voortgang/" + id);
    if (!options || options.focus !== false) {
      const top = planetview.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) planetview.scrollIntoView({ block: "start" });
      byId("planeet-naam").focus({ preventScroll: true });
    }
    scheduleSky();
  }

  function showGalaxy(options) {
    window.requestAnimationFrame(fitGalaxy);
    const vorige = currentPlanet;
    currentPlanet = null;
    currentMoon = null;
    moonRemoveId = null;
    planetEdit = false;
    planetConfirm = false;
    planetStatus = "";
    planetError = "";
    planetview.hidden = true;
    planetview.classList.remove("is-arriving");
    planetview.replaceChildren();
    galaxy.hidden = false;
    renderGalaxyTools();
    if (currentView === "voortgang") intro.textContent = data.weergaven.find((w) => w.id === "voortgang").intro;
    if (!options || options.updateHash !== false) setHash("voortgang");
    if (vorige && (!options || options.focus !== false)) {
      const button = galaxy.querySelector('.planet[data-id="' + vorige + '"]');
      if (button) button.focus();
    }
    scheduleSky();
  }

  function renderVoortgang() {
    /* Is de planeet weg, bijvoorbeeld door een teamgenoot, dan staat de bezoeker weer bij de sterrenkaart. */
    if (currentPlanet && !onderdeelById.has(currentPlanet)) showGalaxy({ focus: false });
    renderGalaxy();
    renderGalaxyTools();
    if (!currentPlanet) return;
    /* Is de maan weg, dan staat de bezoeker weer bij de planeet. */
    if (currentMoon && !findMoon(currentPlanet, currentMoon)) {
      currentMoon = null;
      moonRemoveId = null;
      setHash("voortgang/" + currentPlanet);
    }
    if (currentMoon) renderMoonView();
    else renderPlanetView();
  }

  /* Een teamlid werkt de manen bij; de wijziging gaat direct naar voortgang.js in de repository.
     Met opties: "voor" loopt eerst (documenten van een verwijderde maan opruimen), "klaar" loopt na het slagen. */
  async function changeMoons(change, message, focusSelector, opties) {
    const id = currentPlanet;
    const extra = opties || {};
    setBusy(planetview, true, V.bezigOpslaan);
    try {
      if (extra.voor) await extra.voor();
      voortgang = await updateFile(
        FILES.voortgang,
        (current) => {
          const next = Object.assign({}, current);
          const item = Object.assign({}, next[id]);
          const huidige = Array.isArray(item.manen) ? item.manen : Array.isArray(item.stappen) ? item.stappen : [];
          item.manen = change(huidige.slice());
          delete item.stappen;
          next[id] = item;
          return next;
        },
        message
      );
      stepError = "";
      if (extra.klaar) extra.klaar();
    } catch (error) {
      stepError = errorMessage(error);
      newMoonId = null;
    }
    /* De aankomst is voorbij: alleen een nieuwe maan beweegt nog. */
    planetview.classList.remove("is-arriving");
    renderVoortgang();
    newMoonId = null;
    const target = focusSelector && planetview.querySelector(focusSelector);
    if (target) target.focus();
  }

  /* Een maan weghalen neemt de documenten mee die eraan hangen, ook de bestanden in de repository. */
  async function removeMoon(maanId) {
    const onderdeel = onderdeelById.get(currentPlanet);
    const maan = findMoon(currentPlanet, maanId);
    if (!onderdeel || !maan) return;
    const sleutel = moonKey(currentPlanet, maanId);
    const vanuitMaan = currentMoon === maanId;
    moonRemoveId = null;
    planetStatus = "";
    await changeMoons(
      (manen) => manen.filter((m) => m.id !== maanId),
      "Voortgang bijgewerkt: maan verwijderd bij " + onderdeel.naam,
      vanuitMaan ? "#planeet-naam" : "#maan-titel",
      {
        voor: () => removeDocumentsWhere((d) => d.maan === sleutel, "Documenten van maan " + maan.titel + " verwijderd"),
        klaar: () => {
          planetStatus = fill(V.maanVerwijderd, { titel: maan.titel });
        }
      }
    );
  }

  /* Een planeet weghalen neemt zijn manen en alle documenten van die manen mee. */
  async function deletePlanet(knop) {
    const onderdeel = onderdeelById.get(currentPlanet);
    if (!onderdeel) return;
    setBusy(knop.closest(".doc__confirm"), true, T.bezigVerwijderen);
    try {
      await removePlanetData(onderdeel);
    } catch (error) {
      planetConfirm = false;
      planetError = errorMessage(error);
      renderPlanetView();
      focusPlanetName();
      return;
    }
    planetConfirm = false;
    showGalaxy({ focus: false });
    galaxyStatus = fill(V.planeetVerwijderd, { naam: onderdeel.naam });
    renderGalaxy();
    renderGalaxyTools();
    const doel = galaxyTools && galaxyTools.querySelector('[data-act="planeet-nieuw"]');
    if (doel) doel.focus();
  }

  const focusPlanetName = () => {
    const kop = byId("planeet-naam");
    if (kop) kop.focus({ preventScroll: true });
  };

  function bindVoortgang() {
    const focusIn = (selector) => {
      const doel = selector && planetview.querySelector(selector);
      if (doel) doel.focus();
    };
    const openKnop = '[data-act="' + MOON_ACTS.open + '"]';
    const redrawView = () => (currentMoon ? renderMoonView() : renderPlanetView());

    galaxy.addEventListener("click", (event) => {
      const button = event.target.closest(".planet");
      if (button) jumpTo(button.dataset.id, button);
    });

    if (galaxyTools) {
      const focusTools = (selector) => {
        const doel = galaxyTools.querySelector(selector);
        if (doel) doel.focus();
      };
      galaxyTools.addEventListener("click", (event) => {
        const target = event.target.closest("[data-act]");
        if (!target) return;
        if (target.dataset.act === "planeet-nieuw") {
          galaxyForm = true;
          galaxyStatus = "";
          renderGalaxyTools();
          focusTools("#planeet-veld-naam");
        } else if (target.dataset.act === "planeet-annuleer") {
          galaxyForm = false;
          renderGalaxyTools();
          focusTools('[data-act="planeet-nieuw"]');
        }
      });
      galaxyTools.addEventListener("submit", (event) => {
        event.preventDefault();
        savePlanet(event.target);
      });
    }

    planetview.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-act]");
      if (!target) return;
      const act = target.dataset.act;

      if (act === "back") {
        showGalaxy();
      } else if (act === "back-planet") {
        leaveMoon();
      } else if (act === "moon") {
        jumpToMoon(target.dataset.id, target);
      } else if (act === "stakeholder") {
        const id = target.dataset.id;
        selectView("kaart");
        const node = map.querySelector('.node[data-id="' + id + '"]');
        if (node) {
          node.scrollIntoView({ block: "center" });
          openDetail(id, node);
        }
      } else if (act === "remove-moon" || act === "maan-verwijderen") {
        moonRemoveId = act === "maan-verwijderen" ? currentMoon : target.dataset.id;
        redrawView();
        focusIn(".doc__confirm .btn--danger");
      } else if (act === "remove-moon-no") {
        const id = moonRemoveId;
        moonRemoveId = null;
        redrawView();
        focusIn(currentMoon ? '[data-act="maan-verwijderen"]' : '[data-act="remove-moon"][data-id="' + id + '"]');
      } else if (act === "remove-moon-yes") {
        removeMoon(target.dataset.id);
      } else if (act === "planeet-aanpassen") {
        planetEdit = true;
        planetConfirm = false;
        planetStatus = "";
        planetError = "";
        renderPlanetView();
        focusIn("#planeet-veld-naam");
      } else if (act === "planeet-annuleer") {
        planetEdit = false;
        renderPlanetView();
        focusIn('[data-act="planeet-aanpassen"]');
      } else if (act === "planeet-verwijderen") {
        planetConfirm = true;
        planetEdit = false;
        planetStatus = "";
        planetError = "";
        renderPlanetView();
        focusIn(".planetview__beheer .btn--danger");
      } else if (act === "planeet-verwijder-nee") {
        planetConfirm = false;
        renderPlanetView();
        focusIn('[data-act="planeet-verwijderen"]');
      } else if (act === "planeet-verwijder-ja") {
        deletePlanet(target);
      } else if (act === MOON_ACTS.open) {
        moonDocFormOpen = true;
        moonDocStatus = "";
        moonConfirmId = null;
        fillMoonDocs();
        focusIn("#maandoc-titel");
      } else if (act === MOON_ACTS.close) {
        moonDocFormOpen = false;
        fillMoonDocs();
        focusIn(openKnop);
      } else if (act === MOON_ACTS.ask) {
        moonConfirmId = target.dataset.id;
        moonDocStatus = "";
        fillMoonDocs();
        focusIn(".doc__confirm .btn--danger");
      } else if (act === MOON_ACTS.cancel) {
        const id = moonConfirmId;
        moonConfirmId = null;
        fillMoonDocs();
        focusIn('[data-act="' + MOON_ACTS.ask + '"][data-id="' + id + '"]');
      } else if (act === MOON_ACTS.del) {
        const box = target.closest(".doc__confirm");
        setBusy(box, true, T.bezigVerwijderen);
        try {
          await removeDocument(target.dataset.id);
          moonDocStatus = T.verwijderd;
        } catch (error) {
          moonDocStatus = errorMessage(error);
        }
        moonConfirmId = null;
        fillMoonDocs();
        focusIn(team ? openKnop : null);
      }
    });

    planetview.addEventListener("change", (event) => {
      if (event.target.name === "doc-soort") {
        for (const field of event.target.form.querySelectorAll(".field[data-soort]")) {
          field.hidden = field.dataset.soort !== event.target.value;
        }
        showFormError(event.target.form, "");
        return;
      }
      if (event.target.dataset.act !== "toggle-moon") return;
      const naam = onderdeelById.get(currentPlanet).naam;
      const maanId = event.target.dataset.id;
      const klaar = event.target.checked;
      changeMoons(
        (manen) => manen.map((maan) => (maan.id === maanId ? Object.assign({}, maan, { klaar }) : maan)),
        "Voortgang bijgewerkt: maan " + (klaar ? "afgerond" : "heropend") + " bij " + naam,
        '[data-act="toggle-moon"][data-id="' + maanId + '"]'
      );
    });

    planetview.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target;

      if (form.id === "maandocform") {
        submitDocForm(form, { maan: moonKey(currentPlanet, currentMoon) }, (soort) => {
          moonDocFormOpen = false;
          moonDocStatus = soort === "bestand" ? T.klaarBestand : T.klaarLink;
          fillMoonDocs();
          focusIn(openKnop);
        });
        return;
      }

      if (form.id === "planeetform") {
        savePlanet(form);
        return;
      }

      const titel = form.elements.titel.value.trim();
      if (!titel) {
        stepError = V.foutMaan;
        renderPlanetView();
        byId("maan-titel").focus();
        return;
      }
      const naam = onderdeelById.get(currentPlanet).naam;
      const id = uid();
      newMoonId = id;
      changeMoons(
        (manen) => manen.concat({ id, titel, klaar: false, beeld: nextMoonImage(manen) }),
        "Voortgang bijgewerkt: maan toegevoegd bij " + naam,
        "#maan-titel"
      );
    });

    /* Past het aantal manen na het draaien of verkleinen van het scherm niet meer op de baan, dan teken opnieuw. */
    wideQuery.addEventListener("change", () => {
      if (currentPlanet && !currentMoon) renderPlanetView();
    });
    if ("ResizeObserver" in window) new ResizeObserver(fitGalaxy).observe(galaxy);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || currentView !== "voortgang" || jumping || (teamDialog && teamDialog.open)) return;
      if (!currentPlanet) {
        if (galaxyForm) {
          galaxyForm = false;
          renderGalaxyTools();
          const knop = galaxyTools && galaxyTools.querySelector('[data-act="planeet-nieuw"]');
          if (knop) knop.focus();
        }
        return;
      }
      if (planetEdit || planetConfirm || moonRemoveId) {
        const terug = planetEdit ? "planeet-aanpassen" : planetConfirm ? "planeet-verwijderen" : currentMoon ? "maan-verwijderen" : null;
        planetEdit = false;
        planetConfirm = false;
        moonRemoveId = null;
        redrawView();
        if (terug) focusIn('[data-act="' + terug + '"]');
      } else if (!currentMoon) {
        showGalaxy();
      } else if (moonDocFormOpen) {
        moonDocFormOpen = false;
        fillMoonDocs();
        focusIn(openKnop);
      } else if (moonConfirmId) {
        moonConfirmId = null;
        fillMoonDocs();
      } else {
        leaveMoon();
      }
    });
  }

  /* ---------- Teamtoegang en opslag in GitHub ---------- */

  function detectRepo() {
    const cfg = data.github || {};
    let eigenaar = cfg.eigenaar || "";
    let repository = cfg.repository || "";
    const host = window.location.hostname;
    if ((!eigenaar || !repository) && host.endsWith(".github.io")) {
      const first = window.location.pathname.split("/").filter(Boolean)[0];
      eigenaar = eigenaar || host.slice(0, -".github.io".length);
      repository = repository || (first && !first.includes(".") ? first : host);
    }
    if (!eigenaar || !repository) return null;
    return { eigenaar, repository, branch: cfg.branch || "", map: cfg.map || "" };
  }

  function apiError(status) {
    const error = new Error("GitHub " + status);
    error.status = status;
    return error;
  }

  async function github(path, options, token) {
    const opts = options || {};
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    const key = token || (team && team.token);
    if (key) headers.Authorization = "Bearer " + key;
    if (opts.body) headers["Content-Type"] = "application/json";
    /* GitHub laat een gelezen bestand 60 seconden in de browsercache staan. Zonder no-store gebruikt een tweede
       wijziging binnen een minuut een verouderde versie (sha) en mislukt ze. */
    const response = await fetch(GITHUB + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store"
    });
    if (!response.ok) throw apiError(response.status);
    return response.status === 204 ? null : response.json();
  }

  const encodePath = (pad) => pad.split("/").filter(Boolean).map(encodeURIComponent).join("/");

  function contentsPath(repo, pad) {
    return "/repos/" + encodeURIComponent(repo.eigenaar) + "/" + encodeURIComponent(repo.repository) + "/contents/" + encodePath([repo.map, pad].filter(Boolean).join("/"));
  }

  function errorMessage(error) {
    if (error && error.code && (TT[error.code] || V[error.code])) return TT[error.code] || V[error.code];
    const status = error && error.status;
    if (status === 401) return TT.foutSleutel;
    if (status === 403) return TT.foutRechten;
    if (status === 404) return TT.foutRepository;
    if (status === 409 || status === 422) return TT.foutBezet;
    return TT.foutNetwerk;
  }

  function coded(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }

  async function connect(token) {
    const repo = detectRepo();
    if (!repo) throw coded("geenRepository");

    const info = await github("/repos/" + encodeURIComponent(repo.eigenaar) + "/" + encodeURIComponent(repo.repository), null, token);
    /* Meldt GitHub de rechten niet, dan blijkt het bij het eerste schrijven. */
    if (info.permissions && info.permissions.push === false) throw coded("foutRechten");
    const branch = repo.branch || info.default_branch;

    /* Zoek de map in de repository waar de site staat. */
    let map = null;
    for (const kandidaat of repo.map ? [repo.map] : ["", "site", "docs"]) {
      try {
        await github(contentsPath({ ...repo, map: kandidaat }, "data.js") + "?ref=" + encodeURIComponent(branch), null, token);
        map = kandidaat;
        break;
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
    if (map === null) throw coded("foutSite");

    let login = "";
    try {
      login = (await github("/user", null, token)).login || "";
    } catch (error) {
      /* De naam is alleen voor de weergave; zonder naam werkt alles ook. */
    }

    team = { token, login, eigenaar: repo.eigenaar, repository: repo.repository, branch, map };
    try {
      window.localStorage.setItem(TEAM_KEY, JSON.stringify(team));
    } catch (error) {
      /* Zonder opslag blijft de verbinding alleen tot de pagina sluit. */
    }
  }

  function disconnect() {
    team = null;
    docFormOpen = false;
    confirmId = null;
    try {
      window.localStorage.removeItem(TEAM_KEY);
    } catch (error) {
      /* Niets te wissen. */
    }
  }

  function restoreTeam() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(TEAM_KEY) || "null");
      if (saved && saved.token && saved.eigenaar && saved.repository) team = saved;
    } catch (error) {
      team = null;
    }
  }

  /* De drie gegevensbestanden die de pagina in de repository bijhoudt. */
  const FILE_NOTE =
    "  De pagina werkt dit bestand zelf bij wanneer een teamlid in de editor iets\n" +
    "  wijzigt. Met de hand aanpassen kan ook; houd dan de dubbele aanhalingstekens\n" +
    "  aan en zet geen komma na het laatste item.\n";

  const FILES = {
    planeten: {
      naam: "planeten.js",
      variabele: "STAKEHOLDERMAP_PLANETEN",
      /* Bestaat het bestand nog niet in de repository, begin dan met de planeten die nu op de pagina staan. */
      leeg: () => onderdelen.map((o) => Object.assign({}, o)),
      geldig: (value) => Array.isArray(value),
      kop:
        "/*\n  De planeten op de sterrenkaart: elk onderdeel van het project, in de volgorde van de route.\n\n" +
        FILE_NOTE +
        '\n  Bij "planeet" staat het plaatje uit de map beeld/planeten; zonder tekent de pagina\n' +
        '  een draadbol. Bij "stakeholders" staan de id\'s uit data.js. Een planeet kan ook\n' +
        '  "media" hebben (video\'s), met per video een titel, de duur, het bestand en een poster.\n*/\n'
    },
    documenten: {
      naam: "documenten.js",
      variabele: "STAKEHOLDERMAP_DOCUMENTEN",
      leeg: () => [],
      geldig: (value) => Array.isArray(value),
      kop: "/*\n  Documenten per stakeholder.\n\n" + FILE_NOTE + "*/\n"
    },
    voortgang: {
      naam: "voortgang.js",
      variabele: "STAKEHOLDERMAP_VOORTGANG",
      leeg: () => ({}),
      geldig: (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
      kop: "/*\n  Manen per planeet: de onderdelen van elk deel van het project.\n\n" + FILE_NOTE + "*/\n"
    }
  };

  function serializeFile(file, value) {
    return file.kop + "window." + file.variabele + " = " + JSON.stringify(value, null, 2) + ";\n";
  }

  function parseFile(file, text) {
    const match = new RegExp(file.variabele + "\\s*=\\s*([\\[{][\\s\\S]*[\\]}])\\s*;?\\s*$").exec(text);
    if (!match) throw coded("foutLezen");
    let value;
    try {
      value = JSON.parse(match[1]);
    } catch (error) {
      throw coded("foutLezen");
    }
    if (!file.geldig(value)) throw coded("foutLezen");
    return value;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    }
    return window.btoa(binary);
  }

  const textToBase64 = (text) => bytesToBase64(new TextEncoder().encode(text));

  function base64ToText(base64) {
    const binary = window.atob(base64.replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function slugFile(name) {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot + 1) : "";
    const clean = (value) =>
      value
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return (clean(base) || "document") + (clean(ext) ? "." + clean(ext) : "");
  }

  function withSuffix(pad, suffix) {
    const dot = pad.lastIndexOf(".");
    const slash = pad.lastIndexOf("/");
    return dot > slash ? pad.slice(0, dot) + "-" + suffix + pad.slice(dot) : pad + "-" + suffix;
  }

  const today = () => {
    const now = new Date();
    const two = (value) => String(value).padStart(2, "0");
    return now.getFullYear() + "-" + two(now.getMonth() + 1) + "-" + two(now.getDate());
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* Haalt de nieuwste versie op uit de repository. Bestaat het bestand nog niet, dan is het leeg. */
  async function fetchFile(file) {
    try {
      const current = await github(contentsPath(team, file.naam) + "?ref=" + encodeURIComponent(team.branch));
      return { sha: current.sha, value: parseFile(file, base64ToText(current.content || "")) };
    } catch (error) {
      if (error.status === 404) return { sha: null, value: file.leeg() };
      throw error;
    }
  }

  /* Leest het bestand vlak voor het schrijven opnieuw, zodat een wijziging van een teamgenoot niet verloren gaat. */
  async function updateFile(file, change, message, attempt) {
    const current = await fetchFile(file);
    const next = change(current.value);
    const body = { message, content: textToBase64(serializeFile(file, next)), branch: team.branch };
    if (current.sha) body.sha = current.sha;
    try {
      await github(contentsPath(team, file.naam), { method: "PUT", body });
    } catch (error) {
      if (error.status === 409 && !attempt) return updateFile(file, change, message, 1);
      throw error;
    }
    return next;
  }

  async function addDocument(input) {
    const doel = input.doel;
    const entry = Object.assign(
      { id: uid() },
      doel.maan ? { maan: doel.maan } : { stakeholder: doel.stakeholder },
      { titel: input.titel, soort: input.soort, toegevoegd: today(), door: team.login || "" }
    );

    if (input.soort === "bestand") {
      let pad = "documenten/" + (doel.maan || doel.stakeholder) + "/" + slugFile(input.file.name);
      if (documenten.some((d) => d.pad === pad)) pad = withSuffix(pad, uid());
      const content = await fileToBase64(input.file);
      const message = "Document toegevoegd: " + input.titel;
      try {
        await github(contentsPath(team, pad), { method: "PUT", body: { message, content, branch: team.branch } });
      } catch (error) {
        if (error.status !== 422) throw error;
        pad = withSuffix(pad, uid());
        await github(contentsPath(team, pad), { method: "PUT", body: { message, content, branch: team.branch } });
      }
      entry.pad = pad;
    } else {
      entry.url = input.url;
    }

    try {
      documenten = await updateFile(FILES.documenten, (list) => list.concat(entry), "Documentenlijst bijgewerkt: " + input.titel);
    } catch (error) {
      /* Lukt het bijwerken van de lijst niet, dan blijft het geüploade bestand niet als wees achter. */
      if (entry.pad) await deleteRepoFile(entry).catch(() => {});
      throw error;
    }
  }

  /* Haalt het bestand van een document uit de repository. Is het er al niet meer, dan is dat prima. */
  async function deleteRepoFile(doc) {
    if (doc.soort !== "bestand" || !doc.pad) return;
    try {
      const current = await github(contentsPath(team, doc.pad) + "?ref=" + encodeURIComponent(team.branch));
      await github(contentsPath(team, doc.pad), {
        method: "DELETE",
        body: { message: "Document verwijderd: " + doc.titel, sha: current.sha, branch: team.branch }
      });
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }

  async function removeDocument(id) {
    const doc = documenten.find((d) => d.id === id);
    if (!doc) return;
    await deleteRepoFile(doc);
    documenten = await updateFile(
      FILES.documenten,
      (list) => list.filter((d) => d.id !== id),
      "Documentenlijst bijgewerkt: " + doc.titel + " verwijderd"
    );
  }

  /* Alle documenten die aan de test voldoen weghalen, met hun bestanden. Leest eerst de nieuwste lijst,
     zodat ook wat een teamgenoot net toevoegde meegaat. */
  async function removeDocumentsWhere(test, message) {
    const weg = (await fetchFile(FILES.documenten)).value.filter(test);
    if (!weg.length) return;
    for (const doc of weg) await deleteRepoFile(doc);
    documenten = await updateFile(FILES.documenten, (list) => list.filter((d) => !test(d)), message);
  }

  /* Een planeet verwijderen: eerst de documenten van zijn manen, dan zijn manen, als laatste de planeet zelf.
     Gaat er halverwege iets mis, dan staat de planeet er nog en kan het team het opnieuw proberen. */
  async function removePlanetData(onderdeel) {
    const id = onderdeel.id;
    await removeDocumentsWhere(
      (d) => Boolean(d.maan) && d.maan.startsWith(id + "/"),
      "Documenten van planeet " + onderdeel.naam + " verwijderd"
    );
    voortgang = await updateFile(
      FILES.voortgang,
      (current) => {
        const next = Object.assign({}, current);
        delete next[id];
        return next;
      },
      "Voortgang bijgewerkt: planeet " + onderdeel.naam + " verwijderd"
    );
    setPlaneten(
      await updateFile(FILES.planeten, (lijst) => lijst.filter((o) => o.id !== id), "Planeet verwijderd: " + onderdeel.naam)
    );
  }

  /* Een teamlid ziet direct de nieuwste gegevens, ook als de site zelf nog niet is bijgewerkt. */
  async function refreshFromRepo() {
    if (!team) return;
    try {
      const [docs, stappen, planeten] = await Promise.all([
        fetchFile(FILES.documenten),
        fetchFile(FILES.voortgang),
        fetchFile(FILES.planeten)
      ]);
      documenten = docs.value;
      voortgang = stappen.value;
      setPlaneten(planeten.value);
      renderDocuments();
      renderVoortgang();
      /* Wijst de link naar een planeet of maan die alleen in de repository staat, dan opent hij nu. */
      const route = routeFromHash();
      const nogNiet = (r) =>
        !currentPlanet || (currentPlanet === r.planet && !currentMoon && r.moon && findMoon(r.planet, r.moon));
      if (route && route.planet && currentView === "voortgang" && nogNiet(route)) applyRoute(route);
    } catch (error) {
      if (error.status === 401) {
        disconnect();
        renderTeamState();
      }
    }
  }

  /* De balk bovenaan de editor, het venster om te verbinden en de plek voor een nieuwe planeet.
     Op de bezoekerspagina bestaat dit niet. */
  function buildEditorShell() {
    editorTekst = el("p", { class: "editorbalk__tekst", id: "editorbalk-tekst" });
    teamKnop = el("button", { class: "btn btn--primary", id: "team-open", type: "button" });
    const balk = el(
      "div",
      { class: "editorbalk", id: "editorbalk", role: "region", "aria-label": TT.editorNaam },
      editorTekst,
      el(
        "div",
        { class: "editorbalk__acties" },
        teamKnop,
        el("a", { class: "linkbtn", href: "index.html", text: TT.bezoekerLink })
      )
    );
    byId("masthead").before(balk);

    teamInhoud = el("div", { class: "modal__inner", id: "team-inhoud" });
    teamDialog = el("dialog", { class: "modal", id: "team", "aria-labelledby": "team-titel" }, teamInhoud);
    document.body.append(teamDialog);

    galaxyTools = el("div", { class: "galaxytools", id: "galaxytools", hidden: true });
    galaxy.after(galaxyTools);
  }

  function renderTeamState() {
    root.classList.toggle("is-team", Boolean(team));
    if (EDITOR) {
      const naam = team ? team.login || TT.teamlid : "";
      teamKnop.className = team ? "btn" : "btn btn--primary";
      teamKnop.textContent = team ? fill(TT.knopVerbonden, { naam }) : TT.knop;
      editorTekst.textContent = team ? fill(TT.balkAan, { naam }) : TT.balkUit;
    }
    renderDocuments();
    renderVoortgang();
  }

  function renderTeamDialog(message) {
    const repo = team || detectRepo();
    const repoNaam = repo ? repo.eigenaar + "/" + repo.repository : "";
    const delen = [el("h2", { id: "team-titel", tabindex: "-1", text: TT.titel })];

    if (team) {
      delen.push(
        el("p", { text: fill(TT.verbonden, { naam: team.login || TT.teamlid, repository: repoNaam }) }),
        el("p", { class: "modal__sub", text: TT.verbondenUitleg }),
        el(
          "div",
          { class: "actions" },
          el("button", { class: "btn btn--primary", type: "button", dataset: { act: "close" }, text: TT.sluiten }),
          el("button", { class: "btn", type: "button", dataset: { act: "disconnect" }, text: TT.verbreken })
        )
      );
    } else if (!repo) {
      delen.push(
        el("p", { text: TT.geenRepository }),
        el("div", { class: "actions" }, el("button", { class: "btn btn--primary", type: "button", dataset: { act: "close" }, text: TT.sluiten }))
      );
    } else {
      delen.push(
        el("p", { text: fill(TT.uitleg, { repository: repoNaam }) }),
        el(
          "form",
          { class: "teamform", id: "teamform", novalidate: true },
          el(
            "div",
            { class: "field" },
            el("label", { for: "team-sleutel", text: TT.veldSleutel }),
            el("input", {
              id: "team-sleutel",
              name: "sleutel",
              type: "password",
              autocomplete: "off",
              spellcheck: "false",
              "aria-describedby": "team-hulp"
            }),
            el(
              "p",
              { class: "hint", id: "team-hulp" },
              TT.hulp + " ",
              el("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener", text: TT.hulpLink })
            )
          ),
          el("p", { class: "formerror", id: "team-fout", role: "alert", hidden: !message, text: message || "" }),
          el(
            "div",
            { class: "actions" },
            el("button", { class: "btn btn--primary", type: "submit", text: TT.verbinden }),
            el("button", { class: "btn", type: "button", dataset: { act: "close" }, text: TT.sluiten })
          )
        )
      );
    }
    teamInhoud.replaceChildren(...delen);
  }

  function bindTeam() {
    teamKnop.addEventListener("click", () => {
      renderTeamDialog();
      teamDialog.showModal();
      const veld = byId("team-sleutel");
      (veld || byId("team-titel")).focus();
    });

    teamDialog.addEventListener("click", (event) => {
      if (event.target === teamDialog) {
        const box = teamDialog.getBoundingClientRect();
        const inside =
          event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) teamDialog.close();
        return;
      }
      const button = event.target.closest("[data-act]");
      if (!button) return;
      if (button.dataset.act === "close") teamDialog.close();
      if (button.dataset.act === "disconnect") {
        disconnect();
        renderTeamState();
        renderTeamDialog();
        byId("team-titel").focus();
      }
    });

    teamDialog.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.target;
      const token = form.elements.sleutel.value.trim();
      const fout = byId("team-fout");
      if (!token) {
        fout.textContent = TT.foutLeeg;
        fout.hidden = false;
        form.elements.sleutel.focus();
        return;
      }
      fout.hidden = true;
      setBusy(form, true, TT.bezig);
      try {
        await connect(token);
        renderTeamState();
        renderTeamDialog();
        byId("team-titel").focus();
        refreshFromRepo();
      } catch (error) {
        renderTeamDialog(errorMessage(error));
        byId("team-sleutel").focus();
      }
    });

    teamDialog.addEventListener("close", () => teamKnop.focus());
  }

  /* ---------- Sterrenveld ---------- */

  function mulberry32(seed) {
    let a = seed;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Achter lopende tekst, de beelden, de kaart en de tabel staan geen sterren: die moeten leesbaar blijven. */
  const SKY_TEXT = "h1, .masthead__sub, .titleblock dt, .titleblock dd, .switchbar__hint, .axis span, .colophon p";
  const SKY_SURFACE = ".plot, .planwrap, .galaxy, .planetview, .galaxytools, .editorbalk, .tab, .crop, .linkbtn";

  function skyZones(pad) {
    const origin = document.body.getBoundingClientRect();
    const zones = [];
    const push = (rect, extra) => {
      if (rect.width <= 0 || rect.height <= 0) return;
      zones.push({
        left: rect.left - origin.left - extra,
        right: rect.right - origin.left + extra,
        top: rect.top - origin.top - extra,
        bottom: rect.bottom - origin.top + extra
      });
    };
    const range = document.createRange();
    for (const node of document.querySelectorAll(SKY_TEXT)) {
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) push(rect, pad);
    }
    for (const node of document.querySelectorAll(SKY_SURFACE)) push(node.getBoundingClientRect(), 2);
    return zones;
  }

  function inZone(zones, x, y) {
    return zones.some((z) => x >= z.left && x <= z.right && y >= z.top && y <= z.bottom);
  }

  function drawSky() {
    const canvas = byId("sky");
    const context = canvas.getContext("2d");
    if (!context) return;

    /* Het veld beslaat de hele pagina; de maat komt uit de CSS, hier alleen de resolutie. */
    const box = document.body.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(box.width);
    const height = Math.round(box.height);
    if (!width || !height) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const random = mulberry32(7102026);
    const count = Math.round((width * height) / 5200);
    const tints = ["234,244,255", "234,244,255", "234,244,255", "150,205,255", "255,214,150"];
    const near = skyZones(8);
    const wide = skyZones(18);

    for (let i = 0; i < count; i++) {
      const x = random() * width;
      const y = random() * height;
      const size = 0.35 + Math.pow(random(), 3) * 1.25;
      const alpha = 0.25 + random() * 0.6;
      const tint = tints[Math.floor(random() * tints.length)];

      if (inZone(size > 1.2 ? wide : near, x, y)) continue;

      if (size > 1.2) {
        const glow = context.createRadialGradient(x, y, 0, x, y, size * 5);
        glow.addColorStop(0, "rgba(" + tint + ",0.35)");
        glow.addColorStop(1, "rgba(" + tint + ",0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, size * 5, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = "rgba(" + tint + "," + alpha.toFixed(2) + ")";
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }

    /* Een handvol sterren fonkelt; die staan altijd ruim buiten de tekst. */
    const lightRandom = mulberry32(1138);
    const lights = [];
    for (let i = 0; i < 16; i++) {
      const x = lightRandom() * width;
      const y = lightRandom() * height;
      const delay = lightRandom() * 6;
      if (inZone(wide, x, y)) continue;
      lights.push(
        el("span", { style: "left:" + x.toFixed(1) + "px;top:" + y.toFixed(1) + "px;--d:-" + delay.toFixed(2) + "s" })
      );
    }
    byId("sky-lights").replaceChildren(...lights);
  }

  function scheduleSky() {
    window.clearTimeout(skyTimer);
    skyTimer = window.setTimeout(drawSky, 120);
  }

  /* Opnieuw tekenen als de tekst verschuift: na het laden van het lettertype, bij een andere
     schermmaat en bij het wisselen van weergave. */
  function renderSky() {
    drawSky();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleSky);
    if ("ResizeObserver" in window) new ResizeObserver(scheduleSky).observe(document.body);
  }

  /* ---------- Start ---------- */

  /* De hash is de weergave, bij Voortgang eventueel gevolgd door een planeet: #voortgang/prototype. */
  function routeFromHash() {
    const delen = window.location.hash.slice(1).split("/");
    if (!data.weergaven.some((w) => w.id === delen[0])) return null;
    const planet = delen[0] === "voortgang" && onderdeelById.has(delen[1]) ? delen[1] : null;
    return { view: delen[0], planet, moon: planet && delen[2] ? delen[2] : null };
  }

  function applyRoute(route) {
    selectView(route.view, { updateHash: false });
    if (route.view !== "voortgang") return;
    if (route.planet && route.moon) showMoon(route.planet, route.moon, { updateHash: false, focus: false });
    else if (route.planet) showPlanet(route.planet, { updateHash: false, focus: false });
    else if (currentPlanet) showGalaxy({ updateHash: false, focus: false });
  }

  if (EDITOR) {
    buildEditorShell();
    restoreTeam();
  }
  renderMasthead();
  if (!EDITOR) buildEditorLink();
  renderTabs();
  renderMap();
  renderPlan();
  renderGalaxy();
  bindDetail();
  bindDetailDocs();
  bindVoortgang();
  if (EDITOR) bindTeam();
  renderTeamState();
  renderSky();
  applyRoute(routeFromHash() || { view: data.weergaven[0].id, planet: null });
  refreshFromRepo();

  /* Alleen wisselen als de hash een weergave is; andere ankers, zoals #inhoud, laten de weergave met rust. */
  window.addEventListener("hashchange", () => {
    syncEditorLink();
    const route = routeFromHash();
    if (route) applyRoute(route);
  });
})();
