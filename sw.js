/* Plans électriques : fonctionne hors connexion (fichiers gardés par le navigateur).
 * À chaque nouvelle version, outils/fabriquer_plans_web.py change VERSION : les fichiers sont repris. */
const VERSION = "plans-0.68.35";
const FICHIERS = ["./", "auteur.json", "autonome.js", "icone-192.png", "icone-512.png", "icone.png", "index.html", "js/base.js", "js/devis.js", "js/etude_clavier.js", "js/listes.js", "js/plan.js", "js/plan_photo.js", "manifest.webmanifest", "mot-auteur.md", "nouveautes.md", "riche.js", "sans-serveur.js", "style.css", "vendor/pdfjs/pdf.mjs", "vendor/pdfjs/pdf.worker.mjs", "version.json", "videos.md", "sw.js"];
self.addEventListener("install", e => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then(c => c.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches
      .keys()
      .then(l => Promise.all(l.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // réseau d'abord (nouvelle version tout de suite), le cache si hors connexion
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const c = r.clone();
        caches
          .open(VERSION)
          .then(k => k.put(e.request, c))
          .catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
