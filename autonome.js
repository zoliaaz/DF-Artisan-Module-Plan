/* Plans électriques — version autonome du module de plans de DF artisan.
 * Pas de serveur : les appels api(…) de base.js / plan.js sont servis ici, et les plans sont gardés dans le
 * navigateur (IndexedDB), avec enregistrement / ouverture en fichier. Le reste du code est celui de DF artisan,
 * recopié tel quel par outils/fabriquer_plans_web.py : chaque amélioration du module profite aux deux. */
"use strict";

const STOCKAGE = (() => {
  const ouvrir = () =>
    new Promise((ok, ko) => {
      const r = indexedDB.open("plans-electriques", 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("plans", { keyPath: "id" });
        r.result.createObjectStore("divers");
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  let base = null,
    sansIdb = false;
  const db = async () => base || (base = await ouvrir());
  const op = async (magasin, mode, f) => {
    const t = (await db()).transaction(magasin, mode),
      s = t.objectStore(magasin);
    return new Promise((ok, ko) => {
      const r = f(s);
      t.oncomplete = () => ok(r && r.result);
      t.onerror = () => ko(t.error);
      t.onabort = () => ko(t.error || new Error("Enregistrement impossible (stockage du navigateur plein ?)"));
    });
  };
  // repli : page ouverte par un double-clic (file://) dans un navigateur qui y refuse IndexedDB → stockage local
  // (plus petit : environ 5 Mo, un fond de plan en photo peut ne pas tenir)
  const LS = {
    lireTout: cle => {
      try {
        return JSON.parse(localStorage.getItem("plans-electriques-" + cle) || "{}");
      } catch (e) {
        return {};
      }
    },
    ecrireTout: (cle, v) => {
      try {
        localStorage.setItem("plans-electriques-" + cle, JSON.stringify(v));
      } catch (e) {
        throw new Error(
          "Plus de place pour enregistrer dans ce navigateur : enregistrez vos plans en fichier, ou ouvrez la page en ligne."
        );
      }
    },
  };
  const repli = {
    tous: async () => Object.values(LS.lireTout("plans")),
    lire: async id => LS.lireTout("plans")[id],
    ecrire: async p => {
      const t = LS.lireTout("plans");
      t[p.id] = p;
      LS.ecrireTout("plans", t);
    },
    effacer: async id => {
      const t = LS.lireTout("plans");
      delete t[id];
      LS.ecrireTout("plans", t);
    },
    lireDivers: async cle => LS.lireTout("divers")[cle],
    ecrireDivers: async (cle, v) => {
      const t = LS.lireTout("divers");
      t[cle] = v;
      LS.ecrireTout("divers", t);
    },
  };
  const idb = {
    tous: () => op("plans", "readonly", s => s.getAll()),
    lire: id => op("plans", "readonly", s => s.get(id)),
    ecrire: p => op("plans", "readwrite", s => s.put(p)),
    effacer: id => op("plans", "readwrite", s => s.delete(id)),
    lireDivers: cle => op("divers", "readonly", s => s.get(cle)),
    ecrireDivers: (cle, v) => op("divers", "readwrite", s => s.put(v, cle)),
  };
  const choisir = async () => {
    if (sansIdb) return repli;
    try {
      if (!window.indexedDB) throw new Error();
      await db();
      return idb;
    } catch (e) {
      sansIdb = true;
      return repli;
    }
  };
  const via =
    nom =>
    async (...a) =>
      (await choisir())[nom](...a);
  return {
    tous: via("tous"),
    lire: via("lire"),
    ecrire: via("ecrire"),
    effacer: via("effacer"),
    lireDivers: via("lireDivers"),
    ecrireDivers: via("ecrireDivers"),
  };
})();

const maintenantISO = () => {
  const d = new Date(),
    z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
}; // (heure locale)
const PARAMS_DEFAUT = {
  general: { module_electricien: true, raccourcis_boutons: true },
  entreprise: {},
  plans: {},
  catalogue: {},
  devis: {},
  factures: {},
};
const fusion = (a, b) => {
  // comme le serveur : les objets se complètent, le reste remplace
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) fusion(a[k], v);
    else if (v === null) delete a[k];
    else a[k] = v;
  }
  return a;
};
async function lireParams() {
  return fusion(JSON.parse(JSON.stringify(PARAMS_DEFAUT)), (await STOCKAGE.lireDivers("parametres")) || {});
}
const enLigne = p => {
  const l = { ...p };
  delete l.donnees;
  return l;
};
const nouvelId = async () => {
  const n = ((await STOCKAGE.lireDivers("dernier_id")) || 0) + 1;
  await STOCKAGE.ecrireDivers("dernier_id", n);
  return n;
};

/** les appels au serveur de DF artisan, servis dans le navigateur */
api = async function (methode, url, corps) {
  // eslint-disable-line no-global-assign
  const u = new URL(url, location.href),
    chemin = u.pathname.replace(/^.*?(\/api\/)/, "/api/"),
    q = Object.fromEntries(u.searchParams);
  let m;
  if (chemin === "/api/parametres") {
    if (methode === "GET") return lireParams();
    const p = fusion((await STOCKAGE.lireDivers("parametres")) || {}, corps || {});
    await STOCKAGE.ecrireDivers("parametres", p);
    return lireParams();
  }
  if (chemin === "/api/plans" && methode === "GET") {
    let l = (await STOCKAGE.tous()).filter(p => !q.genre || (p.genre || "plan") === q.genre);
    if (q.client_id || q.document_id) l = [];
    return l.sort((a, b) => (b.modifie_le || "").localeCompare(a.modifie_le || "")).map(enLigne);
  }
  if (chemin === "/api/plans" && methode === "POST") {
    const p = {
      id: await nouvelId(),
      nom: (corps && corps.nom) || "Plan",
      genre: (corps && corps.genre) || "plan",
      adresse: (corps && corps.adresse) || "",
      client_id: null,
      document_id: null,
      client_nom: "",
      document_numero: "",
      document_objet: "",
      donnees: (corps && corps.donnees) || {},
      cree_le: maintenantISO(),
      modifie_le: maintenantISO(),
    };
    await STOCKAGE.ecrire(p);
    return p;
  }
  if ((m = chemin.match(/^\/api\/plans\/(\d+)$/))) {
    const id = Number(m[1]),
      p = await STOCKAGE.lire(id);
    if (!p) throw new Error("Plan introuvable.");
    if (methode === "GET") return p;
    if (methode === "DELETE") {
      await STOCKAGE.effacer(id);
      return { ok: true };
    }
    for (const k of ["nom", "adresse", "genre", "donnees"]) if (corps && k in corps) p[k] = corps[k];
    p.modifie_le = maintenantISO();
    await STOCKAGE.ecrire(p);
    return p;
  }
  if ((m = chemin.match(/^\/api\/plans\/(\d+)\/dupliquer$/))) {
    const p = await STOCKAGE.lire(Number(m[1]));
    const n = {
      ...JSON.parse(JSON.stringify(p)),
      id: await nouvelId(),
      nom: p.nom + " (copie)",
      dfa_id: undefined, // (la copie n'est plus le plan exporté par DF artisan : au retour, elle arrive en nouveau plan)
      dfa_exporte_le: undefined,
      cree_le: maintenantISO(),
      modifie_le: maintenantISO(),
    };
    await STOCKAGE.ecrire(n);
    return n;
  }
  // pas de clients ni de devis dans la version autonome
  if (/^\/api\/(clients|documents)(\/|$)/.test(chemin)) return methode === "GET" && !/\/\d+$/.test(chemin) ? [] : {};
  if (chemin === "/api/sante") return { ok: true };
  throw new Error("Pas disponible dans la version autonome des plans.");
};

/* ---------- enregistrer / ouvrir des fichiers de plans ---------- */
async function exporterPlans() {
  const plans = await STOCKAGE.tous();
  if (!plans.length) {
    toast("Aucun plan à enregistrer.");
    return;
  }
  const contenu = JSON.stringify(
    {
      format: "plans-electriques",
      version: 1,
      enregistre_le: maintenantISO(),
      parametres: (await STOCKAGE.lireDivers("parametres")) || {},
      plans,
    },
    null,
    1
  );
  const a = h("a", {
    href: URL.createObjectURL(new Blob([contenu], { type: "application/json" })),
    download: "mes-plans-" + maintenantISO().slice(0, 10) + ".plans.json",
  });
  document.body.append(a);
  a.click();
  a.remove();
  toast(plans.length + " plan(s) enregistré(s) dans le fichier.");
  rappelSauvegarde.enregistre();
}
/* rappel d'enregistrement : les plans restent dans le navigateur ; s'ils ont changé depuis leur dernier
 * enregistrement en fichier, depuis plus que le délai choisi (15 min par défaut ; 10, 30, 60 min ou jamais), un ⚠
 * apparaît à côté de « + Nouveau plan » et de 💾 */
const rappelSauvegarde = (() => {
  const lire = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : v;
    } catch {
      return d;
    }
  };
  const ecrire = (k, v) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, String(v));
    } catch {
      /* (stockage indisponible) */
    }
  };
  const minutes = () => Number(lire("pw_rappel_min", 15));
  const maj = () => {
    const depuis = Number(lire("pw_non_sauve_depuis", 0)),
      m = minutes();
    document.body.classList.toggle("a-sauver", !!depuis && m > 0 && Date.now() - depuis > m * 60000);
  };
  // (toute écriture d'un plan : « modifié depuis » — la première depuis le dernier enregistrement en fichier)
  for (const f of ["ecrire", "effacer"]) {
    const orig = STOCKAGE[f];
    if (typeof orig !== "function") continue;
    STOCKAGE[f] = async (...a) => {
      const r = await orig.apply(STOCKAGE, a);
      if (!Number(lire("pw_non_sauve_depuis", 0))) ecrire("pw_non_sauve_depuis", Date.now());
      maj();
      return r;
    };
  }
  setInterval(maj, 30000);
  setTimeout(maj, 1000);
  return {
    maj,
    minutes,
    enregistre: () => (ecrire("pw_non_sauve_depuis", null), maj()),
    plusTard: () => (ecrire("pw_non_sauve_depuis", Date.now()), maj()),
    regler: m => (ecrire("pw_rappel_min", m), maj()),
    depuis: () => Number(lire("pw_non_sauve_depuis", 0)),
  };
})();
window.alerteSauvegarde = () => {
  const d = rappelSauvegarde.depuis(),
    min = d ? Math.round((Date.now() - d) / 60000) : 0;
  const choix = h(
    "select",
    {},
    [
      [10, "10 minutes"],
      [15, "15 minutes"],
      [30, "30 minutes"],
      [60, "1 heure"],
      [0, "jamais (rappel désactivé)"],
    ].map(([v, l]) => h("option", { value: v }, l))
  );
  choix.value = String(rappelSauvegarde.minutes());
  choix.addEventListener("change", () => rappelSauvegarde.regler(Number(choix.value)));
  ouvrirModale(
    "Plans à enregistrer",
    h(
      "div",
      { class: "pile" },
      h(
        "p",
        { style: "margin:0" },
        "Vos plans ont changé " +
          (min ? "depuis " + (min >= 60 ? Math.floor(min / 60) + " h " + (min % 60) + " min" : min + " min") + " " : "") +
          "sans être enregistrés en fichier. Ils restent dans ce navigateur, mais un fichier les garde si le navigateur est vidé, ou pour les ouvrir sur un autre appareil."
      ),
      h("label", { class: "champ" }, h("span", {}, "Me le rappeler après"), choix)
    ),
    [
      h("button", { class: "btn", onclick: () => (rappelSauvegarde.plusTard(), fermerModale()) }, "Plus tard"),
      h("button", { class: "btn principal", onclick: () => (fermerModale(), exporterPlans().catch(erreur)) }, "💾 Enregistrer mes plans"),
    ]
  );
};
// installer comme une application (Android, Chrome, Edge : la demande du navigateur ; sinon, la marche à suivre)
let demandeInstallation = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  demandeInstallation = e;
});
(() => {
  const b = document.getElementById("installer-appli");
  if (!b) return;
  const installee = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (installee()) b.style.display = "none";
  window.addEventListener("appinstalled", () => (b.style.display = "none"));
  b.addEventListener("click", async () => {
    if (demandeInstallation) {
      demandeInstallation.prompt();
      try {
        await demandeInstallation.userChoice;
      } catch {
        /* */
      }
      demandeInstallation = null;
      return;
    }
    ouvrirModale(
      "Installer l'application",
      h(
        "div",
        { class: "pile" },
        h(
          "p",
          { style: "margin:0" },
          "Les plans s'installent comme une application : une icône sur l'écran d'accueil, en plein écran, utilisable hors connexion. Vos plans restent les mêmes."
        ),
        h(
          "ul",
          { style: "margin:0;padding-left:20px;line-height:1.6" },
          h(
            "li",
            {},
            h("b", {}, "Android (Chrome) : "),
            "menu ⋮ en haut à droite, puis « Installer l'application » (ou « Ajouter à l'écran d'accueil »)."
          ),
          h("li", {}, h("b", {}, "iPhone, iPad (Safari) : "), "bouton Partager (carré avec une flèche), puis « Sur l'écran d'accueil »."),
          h(
            "li",
            {},
            h("b", {}, "Ordinateur (Chrome, Edge) : "),
            "l'icône d'installation à droite de la barre d'adresse, ou menu ⋮ > « Installer… »."
          )
        ),
        h(
          "p",
          { class: "sous", style: "margin:0" },
          "Firefox sur ordinateur ne sait pas installer d'application : utilisez Chrome ou Edge pour cela."
        )
      ),
      [h("button", { class: "btn principal", onclick: fermerModale }, "Fermer")]
    );
  });
})();
function importerPlans() {
  const f = h("input", { type: "file", accept: ".json,application/json" });
  f.addEventListener("change", async () => {
    try {
      const x = JSON.parse(await f.files[0].text());
      if (x.format !== "plans-electriques" || !Array.isArray(x.plans)) throw new Error("Ce fichier n'est pas un fichier de plans.");
      const deja = await STOCKAGE.tous();
      let n = 0;
      for (const p of x.plans) {
        // (le même plan : même numéro dans DF artisan, ou même nom et même date de création)
        const meme = deja.find(d => (p.dfa_id && d.dfa_id === p.dfa_id) || (d.nom === p.nom && d.cree_le === p.cree_le));
        await STOCKAGE.ecrire({ ...p, id: meme ? meme.id : await nouvelId() }); // (déjà là : remplacé par celui du fichier)
        n++;
      }
      const ici = await STOCKAGE.lireDivers("parametres");
      if (x.parametres && !ici) await STOCKAGE.ecrireDivers("parametres", x.parametres);
      else if (x.parametres && x.parametres.plans) {
        // (fichier exporté par DF artisan : ses symboles importés et ensembles manquants sont ajoutés, rien n'est remplacé)
        const pf = x.parametres.plans,
          pl = (ici.plans = ici.plans || {});
        for (const [cle, id] of [
          ["symboles_perso", "type"],
          ["ensembles", "id"],
        ])
          for (const v of pf[cle] || []) if (v && !(pl[cle] || []).some(w => w[id] === v[id])) (pl[cle] = pl[cle] || []).push(v);
        await STOCKAGE.ecrireDivers("parametres", ici);
      }
      toast(n + " plan(s) ouvert(s) depuis le fichier.");
      await chargerParams();
      aller("plans");
    } catch (e) {
      erreur(e);
    }
  });
  f.click();
}

/* ---------- enregistrer / restaurer les options (⚙ Options des plans, symboles importés, ensembles) ---------- */
async function exporterOptions() {
  const parametres = (await STOCKAGE.lireDivers("parametres")) || {};
  // (et les réglages d'affichage gardés par le navigateur : mode tablette, droitier / gaucher, colonnes, panneau…)
  const affichage = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (/^dfa_plan_/.test(k) && k !== "dfa_plan_note") affichage[k] = localStorage.getItem(k);
    }
  } catch (e) {
    /* (stockage local indisponible) */
  }
  const contenu = JSON.stringify(
    { format: "plans-electriques-options", version: 1, enregistre_le: maintenantISO(), parametres, affichage },
    null,
    1
  );
  const a = h("a", {
    href: URL.createObjectURL(new Blob([contenu], { type: "application/json" })),
    download: "mes-options-plans-" + maintenantISO().slice(0, 10) + ".options.json",
  });
  document.body.append(a);
  a.click();
  a.remove();
  toast("Options enregistrées dans le fichier.");
}
function importerOptions() {
  const f = h("input", { type: "file", accept: ".json,application/json" });
  f.addEventListener("change", async () => {
    try {
      const x = JSON.parse(await f.files[0].text());
      if (!["plans-electriques-options", "plans-electriques"].includes(x.format) || !x.parametres || typeof x.parametres !== "object")
        throw new Error("Ce fichier ne contient pas d'options de plans.");
      if (!(await demanderOui("Remplacer vos options actuelles par celles du fichier ? Vos plans ne changent pas."))) return;
      await STOCKAGE.ecrireDivers("parametres", x.parametres);
      try {
        for (const [k, v] of Object.entries(x.affichage || {})) if (/^dfa_plan_/.test(k)) localStorage.setItem(k, v);
      } catch (e) {
        /* (stockage local indisponible) */
      }
      await chargerParams();
      toast("Options restaurées.");
      aller("plans");
    } catch (e) {
      erreur(e);
    }
  });
  f.click();
}

/* ---------- démarrage ---------- */
const SECTIONS = { plans: (z, a) => sectionPlans(z, a) };
document.querySelectorAll("#nav button[data-section]").forEach(b =>
  b.addEventListener("click", () => {
    document.body.classList.remove("menu-ouvert");
    aller("plans");
  })
);
document.getElementById("nouveau-plan").addEventListener("click", async () => {
  try {
    const p = await api("POST", "/api/plans", { nom: "Nouveau plan", donnees: plNouvellesDonnees() });
    aller("plans", { id: p.id });
  } catch (e) {
    erreur(e);
  }
});
document.getElementById("exporter").addEventListener("click", () => exporterPlans().catch(erreur));
document.getElementById("importer").addEventListener("click", importerPlans);
document.getElementById("exporter-options").addEventListener("click", () => exporterOptions().catch(erreur));
document.getElementById("importer-options").addEventListener("click", importerOptions);
// retours (bugs, idées) : la page « issues » du dépôt GitHub qui publie le module ; ailleurs, le lien est caché
(() => {
  const l = document.getElementById("lien-retours"),
    url = lienRetours();
  if (!l) return;
  if (url) l.href = url;
  else l.style.display = "none";
})();
// mot de l'auteur et don : réglés dans auteur.json et mot-auteur.md (à côté de la page) ; absents ou vides : cachés
(async () => {
  const lire = async (f, json) => {
    try {
      const r = await fetch(f, { cache: "no-cache" });
      if (!r.ok) return null;
      return json ? await r.json() : await r.text();
    } catch {
      return null;
    }
  };
  const conf = (await lire("auteur.json", true)) || {};
  const mot = String((await lire("mot-auteur.md")) || "").trim();
  const bloc = document.getElementById("auteur-liens"),
    bMot = document.getElementById("mot-auteur"),
    don = document.getElementById("don"),
    cafe = document.getElementById("don-cafe"),
    bulle = document.getElementById("don-bulle");
  if (!bloc) return;
  const github = conf.github || lienRetours().replace(/\/issues$/, "");
  const urlDon = /^https:\/\//.test(conf.don || "") ? conf.don : "";
  if (urlDon && don) {
    // (1er clic sur le café : la bulle ; 2e clic, ou clic sur la bulle : Ko-fi ; clic ailleurs : la bulle se ferme)
    bulle.href = urlDon;
    bulle.textContent = conf.don_texte || "Faire un don ☕";
    don.style.display = "";
    cafe.addEventListener("click", e => {
      e.stopPropagation();
      if (don.classList.contains("ouvert")) {
        window.open(urlDon, "_blank", "noopener");
        don.classList.remove("ouvert");
      } else don.classList.add("ouvert");
    });
    bulle.addEventListener("click", () => don.classList.remove("ouvert"));
    document.addEventListener("click", e => {
      if (!don.contains(e.target)) don.classList.remove("ouvert");
    });
  }
  if (mot) {
    // (Markdown simple : titres, gras, italique, liens, listes, paragraphes)
    const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const enLigne = t =>
      esc(t)
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.+?)\*/g, "<i>$1</i>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const html = mot
      .split(/\n\s*\n/)
      .map(p => {
        const l = p.split("\n");
        if (/^###\s/.test(p)) return "<h3>" + enLigne(p.replace(/^###\s+/, "")) + "</h3>";
        if (/^##?\s/.test(p)) return "<h2>" + enLigne(p.replace(/^##?\s+/, "")) + "</h2>";
        if (l.every(x => /^\s*[-*]\s/.test(x)))
          return "<ul>" + l.map(x => "<li>" + enLigne(x.replace(/^\s*[-*]\s+/, "")) + "</li>").join("") + "</ul>";
        return "<p>" + l.map(enLigne).join("<br>") + "</p>";
      })
      .join("");
    bMot.style.display = "";
    bMot.addEventListener("click", () => {
      const corps = h("div", { class: "mot-auteur" });
      corps.innerHTML = html;
      ouvrirModale("Mot de l'auteur", corps, [
        github
          ? h("button", { class: "btn", onclick: () => window.open(github, "_blank", "noopener") }, "Voir le projet sur GitHub")
          : null,
        urlDon ? h("button", { class: "btn", onclick: () => window.open(urlDon, "_blank", "noopener") }, "☕ Faire un don") : null,
        h("button", { class: "btn principal", onclick: fermerModale }, "Fermer"),
      ]);
    });
  }
})();
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
(async () => {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); // (pour que le navigateur ne vide pas les plans)
    await chargerParams();
    await aller("plans");
  } catch (e) {
    erreur(e);
  }
})();
