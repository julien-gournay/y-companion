const API_BASE_URL = "http://localhost:8080";

const Auth = (() => {
  const KEY = "cc_backoffice_auth_v1";

  function isDev() {
    return Boolean(window.campusCompanion?.isDev);
  }

  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }

  function set(session) {
    localStorage.setItem(KEY, JSON.stringify(session));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function isAuthed() {
    const s = get();
    return Boolean(s && s.token && s.user);
  }

  async function login(email, password) {
    try {
      const res = await fetch(API_BASE_URL + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let msg = "Erreur de connexion.";
        try {
          const body = await res.json();
          msg = body?.error || body?.message || msg;
        } catch {
          // ignore parsing
        }
        return { ok: false, message: msg };
      }

      const data = await res.json();
      const user = {
        id: data.userId,
        email: data.email,
        role: data.role,
        name: String(data.email || "Admin").split("@")[0],
      };
      set({ token: data.token, user });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: `Erreur réseau: ${e?.message || String(e)}` };
    }
  }

  async function register(email, password, role) {
    try {
      const res = await fetch(API_BASE_URL + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        let msg = "Erreur d'inscription.";
        try {
          const body = await res.json();
          msg = body?.error || body?.message || msg;
        } catch {
          // ignore parsing
        }
        return { ok: false, message: msg };
      }

      const userDto = await res.json();
      return { ok: true, user: userDto };
    } catch (e) {
      return { ok: false, message: `Erreur réseau: ${e?.message || String(e)}` };
    }
  }

  return { isDev, get, set, clear, isAuthed, login, register };
})();

const Ollama = (() => {
  // Début backoffice Ollama: données mock + actions stub (à brancher sur HTTP API d'Ollama).
  // Ref API (à implémenter plus tard): GET http://localhost:11434/api/tags
  function mockModels() {
    return [
      { name: "llama3.2:latest", size: "4.7 GB", modified: "2026-03-28" },
      { name: "mistral:latest", size: "4.1 GB", modified: "2026-03-20" },
      { name: "nomic-embed-text:latest", size: "274 MB", modified: "2026-03-10" },
    ];
  }

  function listModels() {
    return mockModels();
  }

  return { listModels };
})();

async function apiFetchJson(path, options = {}) {
  const token = Auth.get()?.token;
  const headers = { ...(options.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE_URL + path, {
    ...options,
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) {
      Auth.clear();
      location.hash = "#/login";
      render();
    }
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      bodyText = "";
    }
    throw new Error(`HTTP ${res.status} ${bodyText || res.statusText}`);
  }
  return await res.json();
}

async function apiPatchJson(path, body) {
  return apiFetchJson(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, String(v));
  }
  for (const c of children) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return node;
}

function mount(view) {
  const root = document.getElementById("app");
  root.innerHTML = "";
  root.appendChild(view);
}

function renderLogin() {
  const toast = el("div", { class: "toast", style: "display:none" });
  const email = el("input", { type: "email", placeholder: "alice.martin@ynov.com", autocomplete: "username" });
  const password = el("input", { type: "password", placeholder: "password123", autocomplete: "current-password" });
  const role = el(
    "select",
    {
      style: "width:100%; border-radius:12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.2); color: var(--text); padding: 10px 10px; outline: none;",
    },
    []
  );
  role.appendChild(el("option", { value: "ADMIN", text: "ADMIN" }));
  role.appendChild(el("option", { value: "PEDAGOGUE", text: "PEDAGOGUE" }));

  const submit = async () => {
    toast.style.display = "none";
    const res = await Auth.login(email.value.trim(), password.value);
    if (!res.ok) {
      toast.textContent = res.message || "Erreur de connexion.";
      toast.style.display = "block";
      return;
    }
    location.hash = "#/dashboard";
    render();
  };

  const register = async () => {
    toast.style.display = "none";
    const res = await Auth.register(email.value.trim(), password.value, role.value);
    if (!res.ok) {
      toast.textContent = res.message || "Erreur d'inscription.";
      toast.style.display = "block";
      return;
    }

    toast.textContent = "Compte créé. Connexion automatique…";
    toast.style.display = "block";

    const loginRes = await Auth.login(email.value.trim(), password.value);
    if (!loginRes.ok) {
      toast.textContent = loginRes.message || "Compte créé, mais connexion impossible.";
      toast.style.display = "block";
      return;
    }

    location.hash = "#/dashboard";
    render();
  };

  const card = el("div", { class: "loginCard" }, [
    el("h1", { text: "Backoffice — Modèles Ollama" }),
    el("p", { text: "Connecte-toi pour accéder au panel (JWT via ycompagnon-api)." }),
    el("div", { class: "form" }, [
      el("div", { class: "field" }, [el("label", { text: "Email" }), email]),
      el("div", { class: "field" }, [el("label", { text: "Mot de passe" }), password]),
      el("div", { class: "field" }, [el("label", { text: "Rôle" }), role]),
      el("div", { class: "helpRow" }, [
        el("div", { class: "hint", text: "ADMIN/PEDAGOGUE: alice.martin@ynov.com / password123" }),
        el("button", { class: "btn primary", onClick: submit, type: "button" }, ["Se connecter"]),
      ]),
      el("div", { class: "helpRow" }, [
        el("div", { class: "hint", text: "Pas de compte ? Crée-le en 30s." }),
        el("button", { class: "btn", onClick: register, type: "button" }, ["Register"]),
      ]),
      toast,
    ]),
  ]);

  const wrap = el("div", { class: "loginWrap" }, [card]);
  mount(wrap);
}

function icon(kind) {
  const map = {
    board: "▦",
    reports: "?",
    docs: "▤",
    tickets: "◎",
    faq: "?",
    settings: "⚙",
  };
  return map[kind] || "•";
}

function renderShell(active = "board", pageNode) {
  const user = Auth.get()?.user || { name: "Admin", email: "admin@local" };
  const topActions = el("div", { class: "topActions" }, [
    el("button", {
      class: "linkBtn",
      type: "button",
      onClick: () => {
        Auth.clear();
        location.hash = "#/login";
        render();
      },
      text: "Déconnexion",
    }),
  ]);

  const shell = el("div", { class: "shell" }, [
    el("aside", { class: "sidebar" }, [
      el("div", { class: "sideLogo", text: "CC" }),
      el("div", { class: "nav" }, [
        navBtn("board", "Board", active === "board", "#/dashboard"),
        navBtn("tickets", "Remontées", active === "tickets", "#/tickets"),
        navBtn("docs", "Docs", active === "docs", "#/documents"),
        navBtn("faq", "Q/R", active === "faq", "#/faq"),
        navBtn("settings", "Config", active === "settings", "#/settings"),
      ]),
    ]),
    el("section", { class: "content" }, [
      el("div", { class: "topbar" }, [
        el("div", { class: "titleBlock" }, [
          el("h1", { text: activeTitle(active) }),
          el("p", { text: "Campus Companion — backoffice (prototype)" }),
        ]),
        el("div", { class: "userChip" }, [
          el("div", { class: "avatar", text: (user.name || "A").slice(0, 1).toUpperCase() }),
          el("div", { class: "chipText", text: user.name || "Admin" }),
          topActions,
        ]),
      ]),
      pageNode,
    ]),
  ]);
  mount(shell);
}

function activeTitle(active) {
  if (active === "tickets") return "Questions remontées";
  if (active === "docs") return "Documents";
  if (active === "faq") return "Q/R apprises";
  if (active === "settings") return "Configuration";
  return "Dashboard";
}

function navBtn(kind, label, current, href) {
  return el(
    "button",
    {
      class: "navBtn",
      type: "button",
      "aria-current": current ? "page" : "false",
      title: label,
      onClick: () => {
        location.hash = href;
        render();
      },
    },
    [el("span", { text: icon(kind), style: "font-size:16px; line-height:1" })]
  );
}

function renderDashboard() {
  const kpis = el("div", { class: "cards" }, [
    kpiCard("…", "Conversations", "var(--brand)", "conversations"),
    kpiCard("…", "Remontées", "var(--warn)", "tickets"),
    kpiCard("…", "Résolution", "var(--ok)", "resolution"),
    kpiCard("…", "Feedback positif", "var(--ok)", "feedback"),
  ]);

  const filtersWrap = el("div", { class: "seg" });

  const filters = [
    { label: "Toutes", status: null },
    { label: "Nouvelles", status: "OPEN" },
    { label: "En cours", status: "IN_PROGRESS" },
  ];
  let currentStatus = null;
  const filterButtons = [];
  for (const f of filters) {
    const btn = segBtn(f.label, f.status === null, () => setFilter(f.status));
    filterButtons.push(btn);
    filtersWrap.appendChild(btn);
  }

  let selectedTicketId = null;
  let addToKnowledgeBase = true;
  let isSending = false;

  const toast = el("div", { class: "toast", style: "display:none" });

  const table = el("table", { class: "table" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { text: "" }),
        el("th", { text: "Question" }),
        el("th", { text: "Étudiant" }),
        el("th", { text: "Classe" }),
        el("th", { text: "Statut" }),
      ]),
    ]),
    el("tbody", { id: "tickets-tbody" }, []),
  ]);

  const tbody = table.querySelector("#tickets-tbody");

  function ticketToneAndLabel(status) {
    if (status === "OPEN") return { label: "Nouveau", tone: "warn" };
    if (status === "IN_PROGRESS") return { label: "En cours", tone: "brand" };
    if (status === "RESOLVED") return { label: "Traité", tone: "ok" };
    return { label: status || "-", tone: "brand" };
  }

  function formatStudent(ticket) {
    const name = ticket.studentName || "";
    const first = ticket.studentFirstname || "";
    const full = `${first} ${name}`.trim();
    return full || "-";
  }

  function setToast(message, show = true) {
    toast.textContent = message;
    toast.style.display = show ? "block" : "none";
  }

  function setFilter(status) {
    currentStatus = status;
    // Rebuild plus robuste que le matching textContent: on remet aria-pressed par index.
    for (let i = 0; i < filters.length; i++) {
      const pressed = filters[i].status === status;
      filterButtons[i].setAttribute("aria-pressed", pressed ? "true" : "false");
    }
    loadTickets();
  }

  async function resolveAdminId() {
    // Backend attend `adminId`, mais accepte ADMIN ET PEDAGOGUE.
    // On peut donc réutiliser l'id du user connecté.
    return Auth.get()?.user?.id || null;
  }

  function renderTicketRows(tickets) {
    tbody.innerHTML = "";

    if (!tickets.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="color: rgba(229,231,235,0.7); padding: 14px 12px;">Aucun ticket.</td></tr>`;
      selectedTicketId = null;
      if (composerPillLabel) composerPillLabel.textContent = "Répondre — -";
      if (sendBtn) sendBtn.disabled = true;
      return;
    }

    for (const t of tickets) {
      const { label, tone } = ticketToneAndLabel(t.status);
      const isSelected = selectedTicketId === t.id;
      let tr;

      if (t.status === "RESOLVED") {
        // Tickets déjà traités : non sélectionnables, style atténué, pas de radio.
        tr = el("tr", {
          style: "background:transparent; opacity:0.6; cursor:default;",
        }, [
          el("td", {}, []),
          el("td", { text: t.question || "-" }),
          el("td", { text: formatStudent(t) }),
          el("td", { text: t.studentClass || "-" }),
          el("td", {}, [statusPill(label, tone)]),
        ]);

        // Si un ticket résolu était précédemment sélectionné, on nettoie la sélection.
        if (isSelected) {
          selectedTicketId = null;
          if (composerPillLabel) composerPillLabel.textContent = "Répondre — -";
          if (sendBtn) sendBtn.disabled = true;
        }
      } else {
        const selectRadio = el("input", {
          type: "radio",
          name: "ticket-select",
          checked: isSelected ? "checked" : null,
          onChange: () => {
            selectedTicketId = t.id;
            composerPillLabel.textContent = `Répondre — ${formatStudent(t)}`;
            answer.value = "";
            sendBtn.disabled = false;
            // Met à jour le style des lignes après changement
            Array.from(tbody.children).forEach((row) => {
              row.style.background = "transparent";
            });
            tr.style.background = "rgba(96,165,250,0.16)";
          },
        });

        tr = el("tr", {
          style: `cursor:pointer; background:${isSelected ? "rgba(96,165,250,0.16)" : "transparent"}`,
          onClick: (e) => {
            // Évite de déclencher deux fois quand on clique sur le radio
            if (e.target && e.target.tagName === "INPUT") return;
            selectRadio.click();
          },
        }, [
          el("td", {}, [selectRadio]),
          el("td", { text: t.question || "-" }),
          el("td", { text: formatStudent(t) }),
          el("td", { text: t.studentClass || "-" }),
          el("td", {}, [statusPill(label, tone)]),
        ]);
      }

      tbody.appendChild(tr);
    }

    // Auto-sélection seulement sur un ticket non résolu.
    const firstOpen = tickets.find((t) => t.status !== "RESOLVED");
    if (!firstOpen) {
      selectedTicketId = null;
      if (composerPillLabel) composerPillLabel.textContent = "Répondre — -";
      if (sendBtn) sendBtn.disabled = true;
      return;
    }
    if (selectedTicketId == null || tickets.every((t) => t.id !== selectedTicketId || t.status === "RESOLVED")) {
      selectedTicketId = firstOpen.id;
      composerPillLabel.textContent = `Répondre — ${formatStudent(firstOpen)}`;
      sendBtn.disabled = false;
      // Met en surbrillance la première ligne ouverte correspondante.
      Array.from(tbody.children).forEach((row) => {
        row.style.background = "transparent";
      });
      const idx = tickets.indexOf(firstOpen);
      const row = tbody.children[idx];
      if (row) row.style.background = "rgba(96,165,250,0.16)";
    }
  }

  async function loadTickets() {
    try {
      setToast("Chargement des tickets...", true);
      const statusParam = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : "";
      const tickets = await apiFetchJson(`/api/tickets${statusParam}`);
      renderTicketRows(tickets);
      setToast("", false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur chargement tickets: ${e.message || String(e)}`, true);
    }
  }

  async function submitResolve() {
    if (isSending) return;
    if (!selectedTicketId) {
      setToast("Sélectionne un ticket avant d'envoyer.", true);
      return;
    }
    const answerText = String(answer.value || "").trim();
    if (!answerText) {
      setToast("La réponse ne peut pas être vide.", true);
      return;
    }

    isSending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "Envoi...";

    try {
      const adminId = await resolveAdminId();
      if (!adminId) throw new Error("adminId introuvable côté API (aucun ADMIN/PEDAGOGUE).");

      await apiPatchJson(`/api/tickets/${selectedTicketId}/resolve`, {
        answer: answerText,
        adminId,
        addToKnowledgeBase,
      });

      setToast("Ticket résolu et réponse envoyée.", true);
      // Recharge pour refléter RESOLVED.
      await loadTickets();
      answer.value = "";
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur envoi: ${e.message || String(e)}`, true);
    } finally {
      isSending = false;
      sendBtn.disabled = !selectedTicketId;
      sendBtn.textContent = "Envoyer";
    }
  }

  const left = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Questions remontées" }), filtersWrap]),
    table,
    toast,
    el("div", { class: "composer" }, [
      (function () {
        // Pill label "Répondre — ..."
        const lbl = el("span", { text: "Répondre — -" });
        composerPillLabel = lbl;
        return el("div", { class: "pill" }, [el("span", { class: "dot brand" }), lbl]);
      })(),
      (function () {
        answer = el("textarea", { class: "textarea", placeholder: "Votre réponse…" });
        return answer;
      })(),
      el("div", { class: "actionsRow" }, [
        (function () {
          addToRagBtn = el("button", { class: "btn primary", type: "button", text: "Ajouter au RAG" });
          addToRagBtn.addEventListener("click", () => {
            addToKnowledgeBase = !addToKnowledgeBase;
            addToRagBtn.className = addToKnowledgeBase ? "btn primary" : "btn";
            addToRagBtn.textContent = addToKnowledgeBase ? "Ajouter au RAG" : "N'ajouter au RAG";
          });
          return addToRagBtn;
        })(),
        (function () {
          sendBtn = el("button", { class: "btn primary", type: "button", text: "Envoyer" });
          sendBtn.disabled = true;
          sendBtn.addEventListener("click", submitResolve);
          return sendBtn;
        })(),
      ]),
    ]),
  ]);

  const docsToast = el("div", { class: "toast", style: "display:none" });
  const docsList = el("div", { class: "list" }, []);

  function setDocsToast(message, show = true) {
    docsToast.textContent = message;
    docsToast.style.display = show ? "block" : "none";
  }

function renderDownloadableDocs(docs) {
    docsList.innerHTML = "";
    if (!docs.length) {
      docsList.appendChild(
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: "Aucun document téléchargeable." }),
          ]),
        ])
      );
      return;
    }
    for (const d of docs) {
      // Sur le dashboard, on affiche seulement l'état (pas les actions d'édition)
      docsList.appendChild(docItemFromDto(d, { withActions: false }));
    }
  }

  async function loadDownloadableDocs() {
    try {
      setDocsToast("Chargement des documents…", true);
      const docs = await apiFetchJson("/api/documents");
      renderDownloadableDocs(docs);
      setDocsToast("", false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setDocsToast(`Erreur chargement documents: ${e.message || String(e)}`, true);
    }
  }

  const right = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [
      el("h2", { text: "Documents indexés" }),
      el("button", {
        class: "btn",
        type: "button",
        text: "Ouvrir l'onglet Documents",
        onClick: () => {
          location.hash = "#/documents";
          render();
        },
      }),
    ]),
    docsToast,
    docsList,
  ]);

  const page = el("div", { class: "page" }, [kpis, el("div", { class: "grid2" }, [left, right])]);
  renderShell("board", page);

  // Variables initialisées via closures ci-dessus (évite de réécrire toute la structure DOM).
  // eslint-disable-next-line no-use-before-define
  var composerPillLabel;
  // eslint-disable-next-line no-use-before-define
  var answer;
  // eslint-disable-next-line no-use-before-define
  var addToRagBtn;
  // eslint-disable-next-line no-use-before-define
  var sendBtn;

  async function loadKpis() {
    try {
      const [tickets, interactions] = await Promise.all([
        apiFetchJson("/api/tickets"),
        apiFetchJson("/api/interactions"),
      ]);

      const cards = document.querySelectorAll('[data-kpi]');
      const metrics = {
        conversations: interactions.length,
        tickets: tickets.length,
        resolution: (() => {
          if (!tickets.length) return "—";
          const resolved = tickets.filter((t) => t.status === "RESOLVED").length;
          const rate = Math.round((resolved * 100) / tickets.length);
          return `${rate}%`;
        })(),
        feedback: (() => {
          if (!interactions.length) return "—";
          const up = interactions.filter((i) => i.feedback === "UP").length;
          const rate = Math.round((up * 100) / interactions.length);
          return `${rate}%`;
        })(),
      };

      cards.forEach((card) => {
        const key = card.getAttribute("data-kpi");
        const value = metrics[key];
        if (value == null) return;
        const valueNode = card.querySelector(".kpi");
        if (valueNode) valueNode.textContent = String(value);
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  // Chargement initial (et sélection auto du premier ticket + docs téléchargeables + KPIs dynamiques).
  loadTickets();
  loadDownloadableDocs();
  loadKpis();
}

function renderOllama() {
  let currentStatus = null;
  let selectedTicketId = null;
  let addToKnowledgeBase = true;
  let isSending = false;

  const toast = el("div", { class: "toast", style: "display:none" });

  const filtersWrap = el("div", { class: "seg" });
  const filters = [
    { label: "Toutes", status: null },
    { label: "Nouvelles", status: "OPEN" },
    { label: "En cours", status: "IN_PROGRESS" },
    { label: "Traitées", status: "RESOLVED" },
  ];
  const filterButtons = [];

  function ticketToneAndLabel(status) {
    if (status === "OPEN") return { label: "Nouveau", tone: "warn" };
    if (status === "IN_PROGRESS") return { label: "En cours", tone: "brand" };
    if (status === "RESOLVED") return { label: "Traité", tone: "ok" };
    return { label: status || "-", tone: "brand" };
  }

  function formatStudent(ticket) {
    const name = ticket.studentName || "";
    const first = ticket.studentFirstname || "";
    const full = `${first} ${name}`.trim();
    return full || "-";
  }

  function setToast(message, show = true) {
    toast.textContent = message;
    toast.style.display = show ? "block" : "none";
  }

  async function resolveAdminId() {
    return Auth.get()?.user?.id || null;
  }

  const table = el("table", { class: "table" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { text: "" }),
        el("th", { text: "Question" }),
        el("th", { text: "Étudiant" }),
        el("th", { text: "Classe" }),
        el("th", { text: "Statut" }),
      ]),
    ]),
    el("tbody", { id: "tickets-tbody" }, []),
  ]);

  const tbody = table.querySelector("#tickets-tbody");

  let composerPillLabel;
  let answer;
  let addToRagBtn;
  let sendBtn;

  function renderTicketRows(tickets) {
    tbody.innerHTML = "";

    if (!tickets.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: rgba(229,231,235,0.7); padding: 14px 12px;">Aucun ticket.</td></tr>`;
      selectedTicketId = null;
      if (composerPillLabel) composerPillLabel.textContent = "Répondre — -";
      if (sendBtn) sendBtn.disabled = true;
      return;
    }

    for (const t of tickets) {
      const { label, tone } = ticketToneAndLabel(t.status);
      const isSelected = selectedTicketId === t.id;
      let tr;

      if (t.status === "RESOLVED") {
        // Tickets déjà traités : non sélectionnables, style atténué, pas de radio.
        tr = el("tr", {
          style: "background:transparent; opacity:0.6; cursor:default;",
        }, [
          el("td", {}, []),
          el("td", { text: t.question || "-" }),
          el("td", { text: formatStudent(t) }),
          el("td", { text: t.studentClass || "-" }),
          el("td", {}, [statusPill(label, tone)]),
        ]);

        // Si un ticket résolu était précédemment sélectionné, on nettoie la sélection.
        if (isSelected) {
          selectedTicketId = null;
          if (composerPillLabel) composerPillLabel.textContent = "Répondre — -";
          if (sendBtn) sendBtn.disabled = true;
        }
      } else {
        const selectRadio = el("input", {
          type: "radio",
          name: "ticket-select",
          checked: isSelected ? "checked" : null,
          onChange: () => {
            selectedTicketId = t.id;
            composerPillLabel.textContent = `Répondre — ${formatStudent(t)}`;
            answer.value = "";
            sendBtn.disabled = false;
            Array.from(tbody.children).forEach((row) => {
              row.style.background = "transparent";
            });
            tr.style.background = "rgba(96,165,250,0.16)";
          },
        });

        tr = el("tr", {
          style: `cursor:pointer; background:${isSelected ? "rgba(96,165,250,0.16)" : "transparent"}`,
          onClick: (e) => {
            if (e.target && e.target.tagName === "INPUT") return;
            selectRadio.click();
          },
        }, [
          el("td", {}, [selectRadio]),
          el("td", { text: t.question || "-" }),
          el("td", { text: formatStudent(t) }),
          el("td", { text: t.studentClass || "-" }),
          el("td", {}, [statusPill(label, tone)]),
        ]);
      }

      tbody.appendChild(tr);
    }

    // Auto-sélection seulement sur un ticket non résolu.
    const firstOpen = tickets.find((t) => t.status !== "RESOLVED");
    if (!firstOpen) {
      selectedTicketId = null;
      if (composerPillLabel) composerPillLabel.textContent = "Répondre — -";
      if (sendBtn) sendBtn.disabled = true;
      return;
    }
    if (selectedTicketId == null || tickets.every((t) => t.id !== selectedTicketId || t.status === "RESOLVED")) {
      selectedTicketId = firstOpen.id;
      composerPillLabel.textContent = `Répondre — ${formatStudent(firstOpen)}`;
      sendBtn.disabled = false;
      // Met en surbrillance la première ligne ouverte correspondante.
      Array.from(tbody.children).forEach((row) => {
        row.style.background = "transparent";
      });
      const idx = tickets.indexOf(firstOpen);
      const row = tbody.children[idx];
      if (row) row.style.background = "rgba(96,165,250,0.16)";
    }
  }

  async function loadTickets() {
    try {
      setToast("Chargement des tickets...", true);
      const statusParam = currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : "";
      const tickets = await apiFetchJson(`/api/tickets${statusParam}`);
      renderTicketRows(tickets);
      setToast("", false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur chargement tickets: ${e.message || String(e)}`, true);
    }
  }

  async function submitResolve() {
    if (isSending) return;
    if (!selectedTicketId) {
      setToast("Sélectionne un ticket avant d'envoyer.", true);
      return;
    }
    const answerText = String(answer.value || "").trim();
    if (!answerText) {
      setToast("La réponse ne peut pas être vide.", true);
      return;
    }

    isSending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "Envoi...";

    try {
      const adminId = await resolveAdminId();
      if (!adminId) throw new Error("adminId introuvable côté API (aucun ADMIN/PEDAGOGUE).");

      await apiPatchJson(`/api/tickets/${selectedTicketId}/resolve`, {
        answer: answerText,
        adminId,
        addToKnowledgeBase,
      });

      setToast("Ticket résolu et réponse envoyée.", true);
      await loadTickets();
      answer.value = "";
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur envoi: ${e.message || String(e)}`, true);
    } finally {
      isSending = false;
      sendBtn.disabled = !selectedTicketId;
      sendBtn.textContent = "Envoyer";
    }
  }

  function setFilter(status) {
    currentStatus = status;
    for (let i = 0; i < filters.length; i++) {
      const pressed = filters[i].status === status;
      filterButtons[i].setAttribute("aria-pressed", pressed ? "true" : "false");
    }
    loadTickets();
  }

  for (const f of filters) {
    const btn = segBtn(f.label, f.status === null, () => setFilter(f.status));
    filterButtons.push(btn);
    filtersWrap.appendChild(btn);
  }

  const composer = el("div", { class: "composer" }, [
    (function () {
      const lbl = el("span", { text: "Répondre — -" });
      composerPillLabel = lbl;
      return el("div", { class: "pill" }, [el("span", { class: "dot brand" }), lbl]);
    })(),
    (function () {
      answer = el("textarea", { class: "textarea", placeholder: "Votre réponse…" });
      return answer;
    })(),
    el("div", { class: "actionsRow" }, [
      (function () {
        addToRagBtn = el("button", { class: "btn primary", type: "button", text: "Ajouter au RAG" });
        addToRagBtn.addEventListener("click", () => {
          addToKnowledgeBase = !addToKnowledgeBase;
          addToRagBtn.className = addToKnowledgeBase ? "btn primary" : "btn";
          addToRagBtn.textContent = addToKnowledgeBase ? "Ajouter au RAG" : "Ne pas ajouter au RAG";
        });
        return addToRagBtn;
      })(),
      (function () {
        sendBtn = el("button", { class: "btn primary", type: "button", text: "Envoyer" });
        sendBtn.disabled = true;
        sendBtn.addEventListener("click", submitResolve);
        return sendBtn;
      })(),
    ]),
  ]);

  const panel = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Questions remontées" }), filtersWrap]),
    table,
    toast,
    composer,
  ]);

  const page = el("div", { class: "page" }, [panel]);
  renderShell("tickets", page);
  loadTickets();
}

function renderDocuments() {
  const docsToast = el("div", { class: "toast", style: "display:none" });
  const list = el("div", { class: "list" }, []);

  function setToast(message, show = true) {
    docsToast.textContent = message;
    docsToast.style.display = show ? "block" : "none";
  }

  function renderDocs(docs) {
    list.innerHTML = "";
    if (!docs.length) {
      list.appendChild(
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: "Aucun document pour le moment." }),
          ]),
        ])
      );
      return;
    }
    for (const d of docs) {
      list.appendChild(docItemFromDto(d, { withActions: true, onChanged: loadAllDocs }));
    }
  }

  async function loadAllDocs() {
    try {
      setToast("Chargement des documents…", true);
      const docs = await apiFetchJson("/api/documents");
      renderDocs(docs);
      setToast("", false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur chargement documents: ${e.message || String(e)}`, true);
    }
  }

  async function handleUpload(file, title, tags, description, downloadable) {
    if (!file) return;
    try {
      setToast("Upload en cours…", true);
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      if (tags) form.append("tags", tags);
      if (description) form.append("description", description);
      form.append("downloadable", downloadable ? "true" : "false");

      const token = Auth.get()?.token;
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(API_BASE_URL + "/api/documents/upload", {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch {
          bodyText = "";
        }
        throw new Error(bodyText || `HTTP ${res.status}`);
      }

      await res.json();
      setToast("Document uploadé avec succès.", true);
      await loadAllDocs();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur upload: ${e.message || String(e)}`, true);
    }
  }

  const fileInput = el("input", { type: "file", style: "display:none" });
  const titleInput = el("input", {
    type: "text",
    placeholder: "Titre (optionnel)",
    style: "width:100%; margin-top:8px;",
  });
  const tagsInput = el("input", {
    type: "text",
    placeholder: "Tags (virgules, optionnel)",
    style: "width:100%; margin-top:8px;",
  });
  const descInput = el("textarea", {
    class: "textarea",
    placeholder: "Description (utilisée pour le RAG)…",
    style: "margin-top:8px; min-height:60px;",
  });
  const downloadableCheckbox = el("input", { type: "checkbox" });

  let pendingFile = null;
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    pendingFile = f;
    setToast(`Fichier sélectionné: ${f.name}`, true);
  });

  const uploadBtn = el("button", {
    class: "btn primary",
    type: "button",
    text: "Choisir un fichier…",
    onClick: () => fileInput.click(),
  });

  const submitBtn = el("button", {
    class: "btn",
    type: "button",
    text: "Uploader",
  });
  submitBtn.addEventListener("click", () => {
    if (!pendingFile) {
      setToast("Choisis un fichier avant d’uploader.", true);
      return;
    }
    handleUpload(
      pendingFile,
      titleInput.value.trim(),
      tagsInput.value.trim(),
      descInput.value.trim(),
      downloadableCheckbox.checked
    );
  });

  const uploadPanel = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Uploader un document" })]),
    fileInput,
    el("div", { class: "form" }, [
      el("div", { class: "field" }, [uploadBtn]),
      el("div", { class: "field" }, [el("label", { text: "Titre" }), titleInput]),
      el("div", { class: "field" }, [el("label", { text: "Tags" }), tagsInput]),
      el("div", { class: "field" }, [el("label", { text: "Description" }), descInput]),
      el("div", { class: "field" }, [
        el("label", {}, [
          downloadableCheckbox,
          document.createTextNode(" Proposer en téléchargement aux étudiants"),
        ]),
      ]),
      el("div", { class: "actionsRow" }, [submitBtn]),
    ]),
    docsToast,
  ]);

  const listPanel = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Tous les documents" })]),
    list,
  ]);

  const page = el("div", { class: "page" }, [
    el("div", { class: "grid2" }, [uploadPanel, listPanel]),
  ]);

  renderShell("docs", page);
  loadAllDocs();
}

function renderFaq() {
  const toast = el("div", { class: "toast", style: "display:none" });
  const searchInput = el("input", {
    type: "search",
    placeholder: "Rechercher dans les Q/R…",
    class: "searchInput",
  });
  const list = el("div", { class: "list" }, []);

  let allItems = [];

  function setToast(message, show = true) {
    toast.textContent = message;
    toast.style.display = show ? "block" : "none";
  }

  function matchesSearch(item, q) {
    if (!q) return true;
    const haystack = [
      item.title || "",
      item.tags || "",
      item.message || "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q.toLowerCase());
  }

  function renderItems(items) {
    list.innerHTML = "";
    if (!items.length) {
      list.appendChild(
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: "Aucune Q/R apprise pour le moment." }),
          ]),
        ])
      );
      return;
    }

    for (const it of items) {
      const title = it.title || `Entrée #${it.documentId}`;
      const subtitleParts = [];
      if (it.tags) subtitleParts.push(it.tags);
      if (it.contentLength != null) subtitleParts.push(`${it.contentLength} caractères`);
      const subtitle = subtitleParts.join(" • ");

      const deleteBtn = el(
        "button",
        {
          class: "btn",
          type: "button",
          style: "margin-left:8px; background:transparent; border:1px solid rgba(248,113,113,0.5); color:#fecaca;",
          text: "Supprimer",
          onClick: async () => {
            if (!confirm(`Supprimer définitivement la Q/R "${title}" ?`)) return;
            try {
              setToast("Suppression…", true);
              await apiFetchJson(`/api/knowledge/${it.documentId}`, { method: "DELETE" });
              await loadAll();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
              setToast(`Erreur suppression: ${e.message || String(e)}`, true);
            }
          },
        },
        []
      );

      list.appendChild(
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: title }),
            el("div", { class: "fileSub", text: subtitle }),
          ]),
          el("div", {}, [deleteBtn]),
        ])
      );
    }
  }

  async function loadAll() {
    try {
      setToast("Chargement des Q/R…", true);
      const data = await apiFetchJson("/api/knowledge");
      allItems = Array.isArray(data) ? data : [];
      const q = searchInput.value || "";
      renderItems(allItems.filter((it) => matchesSearch(it, q)));
      setToast("", false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setToast(`Erreur chargement Q/R: ${e.message || String(e)}`, true);
    }
  }

  searchInput.addEventListener("input", () => {
    const q = searchInput.value || "";
    renderItems(allItems.filter((it) => matchesSearch(it, q)));
  });

  function openCreateDialog() {
    const overlay = el("div", {
      style:
        "position:fixed; inset:0; background:rgba(15,23,42,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;",
    });

    const qInput = el("input", {
      type: "text",
      placeholder: "Question (titre de la Q/R)…",
      style:
        "width:100%; margin-top:8px; border-radius:8px; border:1px solid rgba(148,163,184,0.6); background:#020617; color:white; padding:8px 10px;",
    });
    const tagsInput = el("input", {
      type: "text",
      placeholder: "Tags (séparés par des virgules, optionnel)…",
      style:
        "width:100%; margin-top:8px; border-radius:8px; border:1px solid rgba(148,163,184,0.6); background:#020617; color:white; padding:8px 10px;",
    });
    const answerInput = el("textarea", {
      class: "textarea",
      style:
        "width:100%; margin-top:8px; min-height:140px; border-radius:8px; border:1px solid rgba(148,163,184,0.6); background:#020617; color:white; padding:8px 10px;",
      placeholder:
        "Réponse fournie à l'étudiant. Ce texte sera injecté dans la base de connaissances et utilisé par l'IA.",
    });
    const err = el("div", {
      class: "toast",
      style: "display:none; margin-top:8px;",
    });

    const onClose = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const createBtn = el(
      "button",
      {
        class: "btn primary",
        type: "button",
        onClick: async () => {
          const title = String(qInput.value || "").trim();
          const answer = String(answerInput.value || "").trim();
          const tags = String(tagsInput.value || "").trim();
          if (!title || !answer) {
            err.textContent = "Question et réponse sont obligatoires.";
            err.style.display = "block";
            return;
          }
          try {
            err.style.display = "none";
            await apiFetchJson("/api/knowledge/ingest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                type: "TEXT",
                tags,
                content: answer,
                sourceUrl: "kb://backoffice/faq",
              }),
            });
            onClose();
            await loadAll();
          } catch (e) {
            err.textContent = `Erreur: ${e.message || String(e)}`;
            err.style.display = "block";
          }
        },
      },
      ["Enregistrer la Q/R"]
    );

    const cancelBtn = el(
      "button",
      {
        class: "btn",
        type: "button",
        onClick: onClose,
      },
      ["Annuler"]
    );

    const card = el(
      "div",
      {
        style:
          "background:#020617; padding:16px 20px; border-radius:12px; width:520px; max-width:90vw; box-shadow:0 20px 40px rgba(15,23,42,0.6);",
      },
      [
        el("h3", { text: "Ajouter une Q/R apprise" }),
        qInput,
        tagsInput,
        answerInput,
        err,
        el("div", { class: "actionsRow", style: "margin-top:12px; justify-content:flex-end; gap:8px;" }, [
          cancelBtn,
          createBtn,
        ]),
      ]
    );

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  const headerRow = el("div", { class: "panelHeader" }, [
    el("h2", { text: "Q/R apprises" }),
    el(
      "button",
      {
        class: "btn primary",
        type: "button",
        text: "+ Ajouter une Q/R",
        onClick: openCreateDialog,
      },
      []
    ),
  ]);

  const panel = el("div", { class: "panel" }, [headerRow, searchInput, toast, list]);
  const page = el("div", { class: "page" }, [panel]);

  renderShell("faq", page);
  loadAll();
}

function renderSettings() {
  const STORAGE_KEY = "cc_backoffice_settings_v1";

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          notificationsEmail: "",
          notificationsEnabled: true,
          fallbackMessage:
            "Je n'ai pas trouvé de réponse fiable à votre question. Remplissez le formulaire ci-dessous pour contacter l'équipe pédagogique.",
          confidenceThreshold: 0.72,
        };
      }
      const parsed = JSON.parse(raw);
      return {
        notificationsEmail: parsed.notificationsEmail || "",
        notificationsEnabled:
          typeof parsed.notificationsEnabled === "boolean" ? parsed.notificationsEnabled : true,
        fallbackMessage:
          parsed.fallbackMessage ||
          "Je n'ai pas trouvé de réponse fiable à votre question. Remplissez le formulaire ci-dessous pour contacter l'équipe pédagogique.",
        confidenceThreshold:
          typeof parsed.confidenceThreshold === "number" ? parsed.confidenceThreshold : 0.72,
      };
    } catch {
      return {
        notificationsEmail: "",
        notificationsEnabled: true,
        fallbackMessage:
          "Je n'ai pas trouvé de réponse fiable à votre question. Remplissez le formulaire ci-dessous pour contacter l'équipe pédagogique.",
        confidenceThreshold: 0.72,
      };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  const toast = el("div", { class: "toast", style: "display:none" });
  function setToast(message, show = true) {
    toast.textContent = message;
    toast.style.display = show ? "block" : "none";
  }

  const initial = loadSettings();

  const emailInput = el("input", {
    type: "email",
    placeholder: "pedagogie@ynov-lille.fr",
    value: initial.notificationsEmail,
  });

  const notifToggle = el("button", {
    class: initial.notificationsEnabled ? "toggle on" : "toggle",
    type: "button",
    text: initial.notificationsEnabled ? "Activé" : "Désactivé",
  });

  let notificationsEnabled = initial.notificationsEnabled;
  notifToggle.addEventListener("click", () => {
    notificationsEnabled = !notificationsEnabled;
    notifToggle.className = notificationsEnabled ? "toggle on" : "toggle";
    notifToggle.textContent = notificationsEnabled ? "Activé" : "Désactivé";
  });

  const fallbackTextarea = el("textarea", {
    class: "textarea",
    style: "min-height:80px;",
  });
  fallbackTextarea.value = initial.fallbackMessage;

  const thresholdValue = el("span", {
    style: "margin-left:12px; font-variant-numeric: tabular-nums;",
    text: initial.confidenceThreshold.toFixed(2),
  });
  const thresholdInput = el("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.01",
    value: String(initial.confidenceThreshold),
    style: "width:100%;",
  });
  thresholdInput.addEventListener("input", () => {
    const v = parseFloat(thresholdInput.value || "0");
    thresholdValue.textContent = v.toFixed(2);
  });

  const usersList = el("div", { class: "list" }, []);
  const usersToast = el("div", { class: "toast", style: "display:none" });

  function setUsersToast(message, show = true) {
    usersToast.textContent = message;
    usersToast.style.display = show ? "block" : "none";
  }

  function roleBadge(role) {
    const tone = role === "ADMIN" ? "ok" : "brand";
    return statusPill(role === "ADMIN" ? "Admin" : "Lecteur", tone);
  }

  function renderUsers(users) {
    usersList.innerHTML = "";
    if (!users.length) {
      usersList.appendChild(
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: "Aucun compte administrateur." }),
          ]),
        ])
      );
      return;
    }

    for (const u of users) {
      const name =
        u.firstname && u.lastname
          ? `${u.firstname} ${u.lastname}`
          : u.email || `Utilisateur #${u.id}`;

      usersList.appendChild(
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: name }),
            el("div", {
              class: "fileSub",
              text: u.email || "",
            }),
          ]),
          roleBadge(u.role || "PEDAGOGUE"),
        ])
      );
    }
  }

  async function loadUsers() {
    try {
      setUsersToast("Chargement des comptes administrateurs…", true);
      const users = await apiFetchJson("/api/users");
      renderUsers(users || []);
      setUsersToast("", false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setUsersToast(`Erreur chargement utilisateurs: ${e.message || String(e)}`, true);
    }
  }

  const saveBtn = el("button", {
    class: "btn primary",
    type: "button",
    text: "Enregistrer les paramètres",
  });
  saveBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const threshold = parseFloat(thresholdInput.value || "0");
    const settings = {
      notificationsEmail: email,
      notificationsEnabled,
      fallbackMessage: String(fallbackTextarea.value || "").trim(),
      confidenceThreshold: Number.isFinite(threshold) ? threshold : 0.72,
    };
    saveSettings(settings);
    setToast("Paramètres enregistrés localement pour ce poste.", true);
    setTimeout(() => setToast("", false), 3000);
  });

  const notificationCard = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Notifications email" })]),
    el("div", { class: "form" }, [
      el("div", { class: "field" }, [
        el("label", { text: "Email de destination des remontées" }),
        emailInput,
      ]),
      el("div", { class: "field" }, [
        el("label", { text: "Notification automatique" }),
        notifToggle,
      ]),
    ]),
  ]);

  const fallbackCard = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Message de fallback" })]),
    el("div", { class: "form" }, [
      el("div", { class: "field" }, [fallbackTextarea]),
      el("p", {
        class: "hint",
        text: "Ce message est utilisé quand l'IA n'a pas de réponse fiable et redirige l'étudiant vers le formulaire.",
      }),
    ]),
  ]);

  const thresholdCard = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Seuil de confiance" })]),
    el("div", { class: "form" }, [
      el("div", { class: "field" }, [thresholdInput, thresholdValue]),
      el("p", {
        class: "hint",
        text: "Plus le seuil est élevé, plus l'IA bascule souvent vers le fallback quand elle est incertaine.",
      }),
    ]),
  ]);

  const usersCard = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [
      el("h2", { text: "Comptes administrateurs" }),
      el("button", {
        class: "btn",
        type: "button",
        text: "+ Inviter",
        onClick: () => {
          alert(
            "L'invitation d'un nouvel administrateur se fait pour l'instant via la route /api/auth/register (voir API_DOCUMENTATION.md)."
          );
        },
      }),
    ]),
    usersToast,
    usersList,
  ]);

  const page = el("div", { class: "page" }, [
    el("div", { class: "grid2" }, [notificationCard, fallbackCard]),
    el("div", { class: "grid2", style: "margin-top:16px;" }, [thresholdCard, usersCard]),
    el("div", { class: "actionsRow", style: "margin-top:16px; justify-content:flex-end;" }, [
      saveBtn,
    ]),
    toast,
  ]);

  renderShell("settings", page);
  loadUsers();
}

function renderStub(active) {
  const page = el("div", { class: "page" }, [
    el("div", { class: "panel" }, [
      el("div", { class: "panelHeader" }, [el("h2", { text: "À venir" })]),
      el("div", { class: "list" }, [
        el("div", { class: "listItem" }, [
          el("div", { class: "fileMeta" }, [
            el("div", { class: "fileName", text: "Cette section sera implémentée ensuite." }),
          ]),
        ]),
      ]),
    ]),
  ]);
  renderShell(active, page);
}

function kpiCard(value, label, accent, key) {
  const attrs = { class: "card" };
  if (key) attrs["data-kpi"] = key;
  return el("div", attrs, [
    el("div", { class: "kpi", text: value, style: `color:${accent}` }),
    el("div", { class: "label", text: label }),
  ]);
}

function segBtn(label, pressed, onClick) {
  const attrs = { type: "button", "aria-pressed": pressed ? "true" : "false", text: label };
  if (typeof onClick === "function") attrs.onClick = onClick;
  return el("button", attrs);
}

function statusPill(text, tone) {
  const cls = tone === "ok" ? "ok" : tone === "warn" ? "warn" : tone === "bad" ? "bad" : "brand";
  return el("span", { class: "pill" }, [el("span", { class: `dot ${cls}` }), el("span", { text })]);
}

function row(q, student, cls, statusNode) {
  return el("tr", {}, [el("td", { text: q }), el("td", { text: student }), el("td", { text: cls }), el("td", {}, [statusNode])]);
}

function docItem(name, size) {
  return el("div", { class: "listItem" }, [
    el("div", { class: "fileMeta" }, [el("div", { class: "fileName", text: name }), el("div", { class: "fileSub", text: size })]),
    el("span", { class: "tag", text: "Indexé" }),
  ]);
}

function docItemFromDto(doc, options = {}) {
  const sizeLabel = doc.fileSize != null ? `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB` : "";
  const title = doc.title || doc.originalFilename || `Document #${doc.id}`;
  const downloadable = Boolean(doc.downloadable);
  const withActions = Boolean(options.withActions);
  const onChanged = typeof options.onChanged === "function" ? options.onChanged : null;
  const tagsPreview = doc.tags ? String(doc.tags).split(",").slice(0, 2).join(", ").trim() : "";

  const actions = [];
  if (downloadable && doc.downloadUrl) {
    const downloadBtn = el(
      "button",
      {
        class: "linkBtn",
        type: "button",
        title: "Télécharger",
        style: "padding:0 4px;",
        onClick: () => {
          const url = doc.downloadUrl.startsWith("http")
            ? doc.downloadUrl
            : API_BASE_URL + doc.downloadUrl;
          window.open(url, "_blank", "noopener,noreferrer");
        },
      },
      ["⭳"]
    );
    actions.push(downloadBtn);
  }

  const mainRowChildren = actions.length ? [...actions] : [];

  let secondaryRow = null;

  if (withActions) {
    const editBtn = el(
      "button",
      {
        class: "linkBtn",
        type: "button",
        title: "Modifier le document",
        style: "padding:0 4px;",
      },
      ["✏"]
    );
    const deleteBtn = el(
      "button",
      {
        class: "linkBtn",
        type: "button",
        title: "Supprimer le document",
        style: "padding:0 4px; color:#f97373;",
      },
      ["🗑"]
    );
    const reindexBtn = el(
      "button",
      {
        class: "linkBtn",
        type: "button",
        title: "Réindexer pour le RAG",
        style: "padding:0 4px;",
      },
      ["⟳"]
    );

    editBtn.addEventListener("click", () => {
      const overlay = el("div", {
        style:
          "position:fixed; inset:0; background:rgba(15,23,42,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;",
      });

      const titleInput = el("input", {
        type: "text",
        value: title,
        style:
          "width:100%; margin-top:8px; border-radius:8px; border:1px solid rgba(148,163,184,0.6); background:#020617; color:white; padding:8px 10px;",
      });
      const tagsInput = el("input", {
        type: "text",
        value: doc.tags || "",
        style:
          "width:100%; margin-top:8px; border-radius:8px; border:1px solid rgba(148,163,184,0.6); background:#020617; color:white; padding:8px 10px;",
      });
      const err = el("div", {
        class: "toast",
        style: "display:none; margin-top:8px;",
      });

      const onClose = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      };

      const saveBtn = el(
        "button",
        {
          class: "btn primary",
          type: "button",
          onClick: async () => {
            const newTitle = titleInput.value.trim();
            const newTags = tagsInput.value.trim();
            if (!newTitle) {
              err.textContent = "Le titre ne peut pas être vide.";
              err.style.display = "block";
              return;
            }
            try {
              await apiFetchJson(`/api/documents/${doc.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: newTitle,
                  type: doc.type || "TEXT",
                  urlOrPath: doc.urlOrPath || "",
                  tags: newTags,
                }),
              });
              onClose();
              if (onChanged) onChanged();
            } catch (e) {
              err.textContent = `Erreur: ${e.message || String(e)}`;
              err.style.display = "block";
            }
          },
        },
        ["Enregistrer"]
      );

      const cancelBtn = el(
        "button",
        {
          class: "btn",
          type: "button",
          onClick: onClose,
        },
        ["Annuler"]
      );

      const card = el("div", {
        style:
          "background:#020617; padding:16px 20px; border-radius:12px; width:360px; max-width:90vw; box-shadow:0 20px 40px rgba(15,23,42,0.6);",
      }, [
        el("h3", { text: "Modifier le document" }),
        el("div", { style: "margin-top:8px; font-size:13px; opacity:0.8;" }, [
          document.createTextNode("Titre"),
        ]),
        titleInput,
        el("div", { style: "margin-top:8px; font-size:13px; opacity:0.8;" }, [
          document.createTextNode("Tags (séparés par des virgules)"),
        ]),
        tagsInput,
        err,
        el("div", { class: "actionsRow", style: "margin-top:12px; justify-content:flex-end; gap:8px;" }, [
          cancelBtn,
          saveBtn,
        ]),
      ]);

      overlay.appendChild(card);
      document.body.appendChild(overlay);
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Supprimer définitivement le document "${title}" ?`)) return;
      try {
        const token = Auth.get()?.token;
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(API_BASE_URL + `/api/documents/${doc.id}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        if (onChanged) onChanged();
      } catch (e) {
        alert(`Erreur lors de la suppression: ${e.message || String(e)}`);
      }
    });

    reindexBtn.addEventListener("click", () => {
      const overlay = el("div", {
        style:
          "position:fixed; inset:0; background:rgba(15,23,42,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;",
      });

      const textarea = el("textarea", {
        class: "textarea",
        style:
          "width:100%; margin-top:8px; min-height:120px; border-radius:8px; border:1px solid rgba(148,163,184,0.6); background:#020617; color:white; padding:8px 10px;",
        placeholder:
          "Colle ici le contenu textuel que l'IA doit utiliser pour ce document (base RAG)…",
      });
      const err = el("div", {
        class: "toast",
        style: "display:none; margin-top:8px;",
      });

      const onClose = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      };

      const saveBtn = el(
        "button",
        {
          class: "btn primary",
          type: "button",
          onClick: async () => {
            const content = String(textarea.value || "").trim();
            if (!content) {
              err.textContent = "Le contenu ne peut pas être vide.";
              err.style.display = "block";
              return;
            }
            try {
              await apiFetchJson(`/api/documents/${doc.id}/reindex`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
              });
              onClose();
              if (onChanged) onChanged();
            } catch (e) {
              err.textContent = `Erreur: ${e.message || String(e)}`;
              err.style.display = "block";
            }
          },
        },
        ["Réindexer"]
      );

      const cancelBtn = el(
        "button",
        {
          class: "btn",
          type: "button",
          onClick: onClose,
        },
        ["Annuler"]
      );

      const card = el("div", {
        style:
          "background:#020617; padding:16px 20px; border-radius:12px; width:420px; max-width:90vw; box-shadow:0 20px 40px rgba(15,23,42,0.6);",
      }, [
        el("h3", { text: "Réindexer le document pour le RAG" }),
        el("div", { style: "margin-top:8px; font-size:13px; opacity:0.8;" }, [
          document.createTextNode(
            "Le texte saisi sera utilisé comme base documentaire pour ce document dans le RAG."
          ),
        ]),
        textarea,
        err,
        el("div", { class: "actionsRow", style: "margin-top:12px; justify-content:flex-end; gap:8px;" }, [
          cancelBtn,
          saveBtn,
        ]),
      ]);

      overlay.appendChild(card);
      document.body.appendChild(overlay);
    });

    secondaryRow = el("div", { class: "docActionsRow" }, [editBtn, reindexBtn, deleteBtn]);
  }

  return el("div", { class: "listItem" }, [
    el("div", { class: "fileMeta" }, [
      el("div", { class: "fileName", text: title }),
      el("div", {
        class: "fileSub",
        text: [doc.type || "TEXT", sizeLabel, tagsPreview].filter(Boolean).join(" • "),
      }),
    ]),
    el("div", {}, [
      el("div", {}, mainRowChildren),
      ...(secondaryRow ? [secondaryRow] : []),
    ]),
  ]);
}

function render() {
  const route = (location.hash || "#/dashboard").replace("#", "");
  const wantsLogin = route === "/login";

  if (!Auth.isAuthed() && !wantsLogin) {
    location.hash = "#/login";
    renderLogin();
    return;
  }

  if (wantsLogin) {
    if (Auth.isAuthed()) {
      location.hash = "#/dashboard";
      renderDashboard();
      return;
    }
    renderLogin();
    return;
  }

  if (route === "/dashboard") return renderDashboard();
  if (route === "/tickets") return renderOllama();
  if (route === "/documents") return renderDocuments();
  if (route === "/faq") return renderFaq();
  if (route === "/settings") return renderSettings();
  return renderDashboard();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  render();
});

