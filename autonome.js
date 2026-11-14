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
}
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
// retours (bugs, idées) : la page « issues » du dépôt GitHub qui publie le module ; ailleurs, le lien est caché
(() => {
  const l = document.getElementById("lien-retours"),
    url = lienRetours();
  if (!l) return;
  if (url) l.href = url;
  else l.style.display = "none";
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
