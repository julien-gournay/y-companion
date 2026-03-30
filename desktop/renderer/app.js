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
    if (isDev()) return true;
    const s = get();
    return Boolean(s && s.token && s.user);
  }

  async function login(email, password) {
    // Placeholder: brancher plus tard sur l'API du backoffice.
    // Pour démarrer: admin@local / admin (en prod), et bypass en dev.
    if (isDev()) {
      set({ token: "dev", user: { name: "Dev", email } });
      return { ok: true };
    }

    const ok = email === "admin@local" && password === "admin";
    if (!ok) return { ok: false, message: "Identifiants invalides." };

    set({ token: "local", user: { name: "Admin", email } });
    return { ok: true };
  }

  return { isDev, get, set, clear, isAuthed, login };
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
  const email = el("input", { type: "email", placeholder: "admin@local", autocomplete: "username" });
  const password = el("input", { type: "password", placeholder: "admin", autocomplete: "current-password" });

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

  const card = el("div", { class: "loginCard" }, [
    el("h1", { text: "Backoffice — Modèles Ollama" }),
    el("p", { text: "Connecte-toi pour accéder au panel. En mode dev, l’accès est direct." }),
    el("div", { class: "form" }, [
      el("div", { class: "field" }, [el("label", { text: "Email" }), email]),
      el("div", { class: "field" }, [el("label", { text: "Mot de passe" }), password]),
      el("div", { class: "helpRow" }, [
        el("div", { class: "hint", text: Auth.isDev() ? "DEV: bypass activé" : "Hint: admin@local / admin" }),
        el("button", { class: "btn primary", onClick: submit, type: "button" }, ["Se connecter"]),
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
    ollama: "◎",
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
      text: Auth.isDev() ? "Reset session (dev)" : "Déconnexion",
    }),
  ]);

  const shell = el("div", { class: "shell" }, [
    el("aside", { class: "sidebar" }, [
      el("div", { class: "sideLogo", text: "CC" }),
      el("div", { class: "nav" }, [
        navBtn("board", "Board", active === "board", "#/dashboard"),
        navBtn("ollama", "Ollama", active === "ollama", "#/ollama"),
        navBtn("docs", "Docs", active === "docs", "#/documents"),
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
  if (active === "ollama") return "Modèles Ollama";
  if (active === "docs") return "Documents";
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
    kpiCard("247", "Conversations", "var(--brand)"),
    kpiCard("12", "Remontées", "var(--warn)"),
    kpiCard("94%", "Résolution", "var(--ok)"),
    kpiCard("+89%", "Feedback positif", "var(--ok)"),
  ]);

  const filters = el("div", { class: "seg" }, [
    segBtn("Toutes", true),
    segBtn("Nouvelles", false),
    segBtn("En cours", false),
  ]);

  const table = el("table", { class: "table" }, [
    el("thead", {}, [
      el("tr", {}, [
        el("th", { text: "Question" }),
        el("th", { text: "Étudiant" }),
        el("th", { text: "Classe" }),
        el("th", { text: "Statut" }),
      ]),
    ]),
    el("tbody", {}, [
      row("Comment valider mon stage ?", "L. Martin", "B2 Dev", statusPill("Nouveau", "warn")),
      row("Changer de filière en B2 ?", "S. Dupont", "B1 Info", statusPill("En cours", "brand")),
      row("Deadline mémoire ?", "A. Nguyen", "B3 Dev", statusPill("Traité", "ok")),
    ]),
  ]);

  const left = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [el("h2", { text: "Questions remontées" }), filters]),
    table,
    el("div", { class: "composer" }, [
      el("div", { class: "pill" }, [el("span", { class: "dot brand" }), el("span", { text: "Répondre — L. Martin" })]),
      el("textarea", { class: "textarea", placeholder: "Votre réponse…" }),
      el("div", { class: "actionsRow" }, [
        el("button", { class: "btn", type: "button", text: "Ajouter au RAG" }),
        el("button", { class: "btn primary", type: "button", text: "Envoyer" }),
      ]),
    ]),
  ]);

  const right = el("div", { class: "panel" }, [
    el("div", { class: "panelHeader" }, [
      el("h2", { text: "Documents indexés" }),
      el("button", { class: "btn", type: "button", text: "+ Upload" }),
    ]),
    el("div", { class: "list" }, [
      docItem("Règlement péda 2025.pdf", "2.4 MB"),
      docItem("Grille B2 Dev.xlsx", "845 KB"),
      docItem("Syllabus B1 Info.pdf", "1.1 MB"),
    ]),
  ]);

  const page = el("div", { class: "page" }, [kpis, el("div", { class: "grid2" }, [left, right])]);
  renderShell("board", page);
}

function renderOllama() {
  const models = Ollama.listModels();
  const table = el("table", { class: "table" }, [
    el("thead", {}, [
      el("tr", {}, [el("th", { text: "Modèle" }), el("th", { text: "Taille" }), el("th", { text: "Modifié" }), el("th", { text: "Actions" })]),
    ]),
    el(
      "tbody",
      {},
      models.map((m) =>
        el("tr", {}, [
          el("td", { text: m.name }),
          el("td", { text: m.size }),
          el("td", { text: m.modified }),
          el("td", {}, [
            el("button", { class: "btn", type: "button", text: "Pull" }),
            document.createTextNode(" "),
            el("button", { class: "btn", type: "button", text: "Supprimer" }),
          ]),
        ])
      )
    ),
  ]);

  const hint = el("div", { class: "toast" }, [
    el("div", { text: "Prochaine étape: brancher sur l’API Ollama (localhost:11434) pour lister/pull/supprimer les modèles." }),
  ]);

  const page = el("div", { class: "page" }, [
    el("div", { class: "panel" }, [el("div", { class: "panelHeader" }, [el("h2", { text: "Modèles disponibles (prototype)" })]), table]),
    hint,
  ]);
  renderShell("ollama", page);
}

function renderStub(active) {
  const page = el("div", { class: "page" }, [
    el("div", { class: "panel" }, [
      el("div", { class: "panelHeader" }, [el("h2", { text: "À venir" })]),
      el("div", { class: "list" }, [el("div", { class: "listItem" }, [el("div", { class: "fileMeta" }, [el("div", { class: "fileName", text: "Cette section sera implémentée ensuite." })])])]),
    ]),
  ]);
  renderShell(active, page);
}

function kpiCard(value, label, accent) {
  return el("div", { class: "card" }, [
    el("div", { class: "kpi", text: value, style: `color:${accent}` }),
    el("div", { class: "label", text: label }),
  ]);
}

function segBtn(label, pressed) {
  return el("button", { type: "button", "aria-pressed": pressed ? "true" : "false", text: label });
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
  if (route === "/ollama") return renderOllama();
  if (route === "/documents") return renderStub("docs");
  if (route === "/settings") return renderStub("settings");
  return renderDashboard();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  if (Auth.isDev() && !Auth.get()) {
    Auth.set({ token: "dev", user: { name: "Dev", email: "dev@local" } });
  }
  render();
});

