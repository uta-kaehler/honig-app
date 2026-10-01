// Offline-Vorrat: die App selbst und alle Kartenkacheln, die man schon einmal gesehen hat.
const VERSION = "honig-10";
const APP = ["./", "index.html", "style.css", "app.js", "daten.js", "orte.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "lib/leaflet.js", "lib/leaflet.css", "lib/suncalc.js",
  "fonts/geist-sans-latin-400-normal.woff2", "fonts/geist-sans-latin-500-normal.woff2", "fonts/geist-sans-latin-600-normal.woff2", "fonts/playfair-display-latin-400-italic.woff2", "fonts/playfair-display-latin-400-normal.woff2", "fonts/playfair-display-latin-500-italic.woff2", "fonts/playfair-display-latin-500-normal.woff2"];
const KACHELN = "honig-kacheln";
const MAX_KACHELN = 3000;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await c.addAll(APP);
  }));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== VERSION && k !== KACHELN).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Kartenkacheln: erst aus dem Vorrat, sonst holen und merken.
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    e.respondWith(caches.open(KACHELN).then(async (c) => {
      const da = await c.match(req);
      if (da) return da;
      const neu = await fetch(req);
      if (neu.ok) {
        c.put(req, neu.clone());
        c.keys().then((k) => { if (k.length > MAX_KACHELN) c.delete(k[0]); });
      }
      return neu;
    }));
    return;
  }

  // Alles andere: erst Netz (damit Updates ankommen), ohne Netz aus dem Vorrat.
  e.respondWith(fetch(req).then((r) => {
    if (r.ok && url.origin === location.origin) {
      const kopie = r.clone();
      caches.open(VERSION).then((c) => c.put(req, kopie));
    }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
