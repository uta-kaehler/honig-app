"use strict";

// ---------------------------------------------------------------- Speicher (nur auf diesem Handy)

const SPEICHER = "honig.v1";
const ZEITZONE = "Africa/Casablanca";
const LEER = () => ({ reise: null, besucht: {}, geoeffnet: {}, eigene: [], logbuch: [], entwurf: "", korrigiert: {},
  notizen: [], auto: null, kurs: null, wetter: {} });

// Demo-Modus (…/#demo): Beispielreise, fester „heute“, es wird nichts gespeichert.
const DEMO = /(^#|&)demo\b/.test(location.hash);
const DEMO_HEUTE = "2027-04-08";
// Frei erfundene Beispielreise, nicht die echte.
const DEMO_REISE = [{ von: "2027-04-03", bis: "2027-04-07" }, { von: "2027-04-07", bis: "2027-04-10" },
  { von: "2027-04-10", bis: "2027-04-12" }, { von: "2027-04-12", bis: "2027-04-14" }];

let zustand = DEMO ? Object.assign(LEER(), { reise: DEMO_REISE }) : laden();

function laden() {
  try {
    return Object.assign(LEER(), JSON.parse(localStorage.getItem(SPEICHER) || "{}"));
  } catch (e) {
    return LEER();
  }
}

function sichern() {
  if (DEMO) return;
  try {
    localStorage.setItem(SPEICHER, JSON.stringify(zustand));
  } catch (e) {
    melden("Konnte nicht speichern – ist der Speicher des Handys voll?");
  }
}

// Bittet den Browser, die Daten nicht von selbst aufzuräumen.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------------------------------------------------------------- Reisedaten

// Der persönliche Link enthält die Daten einmalig: …/#reise=2027-04-03_2027-04-07,2027-04-07_2027-04-10,…
function reiseAusLink() {
  const treffer = location.hash.match(/reise=([0-9_,-]+)/);
  if (!treffer) return;
  const teile = treffer[1].split(",").map((t) => t.split("_"));
  if (teile.length === STATIONEN.length && teile.every((t) => t.length === 2)) {
    zustand.reise = teile.map(([von, bis]) => ({ von, bis }));
    sichern();
    melden("Reisedaten sind gespeichert. Gute Reise!");
  }
  history.replaceState(null, "", location.pathname);
}

function heuteISO(datum) {
  if (!datum) {
    if (DEMO) return DEMO_HEUTE;
    datum = new Date();
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZEITZONE }).format(datum);
}

function tageZwischen(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

// Wo seid ihr heute? { phase: "vorher" | "unterwegs" | "danach" | "unbekannt", station, tag, tage }
function reiseStand() {
  const r = zustand.reise;
  if (!r) return { phase: "unbekannt" };
  const heute = heuteISO();
  const start = r[0].von;
  const ende = r[r.length - 1].bis;
  const tage = tageZwischen(start, ende) + 1;
  if (heute < start) return { phase: "vorher", nochTage: tageZwischen(heute, start), tage };
  if (heute > ende) return { phase: "danach", tage };
  let index = r.findIndex((s) => heute >= s.von && heute < s.bis);
  if (index === -1) index = r.length - 1; // Abreisetag
  return { phase: "unterwegs", station: STATIONEN[index], tag: tageZwischen(start, heute) + 1, tage };
}

// ---------------------------------------------------------------- Orte

function alleOrte() {
  const orte = [];
  for (const s of STATIONEN) {
    const h = s.hotel;
    orte.push({ id: "hotel-" + s.id, art: "hotel", name: h.name, ort: h.ort, station: s.id,
      text: h.lage + ".", offen: h.anreise, aufwand: h.aufwand, achtung: h.achtung,
      radius: h.genau ? 80 : 0 }); // ungenaue Punkte nie automatisch golden machen
    s.parken.forEach((p, i) => orte.push({ id: `parken-${s.id}-${i}`, art: "parken", station: s.id, radius: 0, ...p }));
  }
  for (const o of ORTE) {
    const radius = o.info ? 0 : o.ortSicher === "hoch" ? 120 : o.ortSicher === "mittel" ? 80 : 0;
    orte.push({ radius, ...o });
  }
  for (const e of zustand.eigene) orte.push({ ...e, art: "eigen" });
  if (zustand.auto) orte.push({ id: "auto", art: "auto", name: "Unser Auto", ort: zustand.auto.ort, station: zustand.auto.station,
    text: "Geparkt um " + uhrzeit(zustand.auto.zeit) + ".", radius: 0 });
  // Vor Ort korrigierte Punkte: genaue Lage, also auch automatisch golden
  for (const o of orte) {
    const k = zustand.korrigiert[o.id];
    if (k) { o.ort = k; if (o.art !== "parken" && !o.info) o.radius = Math.max(o.radius || 0, 80); o.korrigiert = true; }
  }
  return orte;
}

const ARTEN = {
  hotel: { buchstabe: "H", name: "Unterkunft" },
  parken: { buchstabe: "P", name: "Parkplatz" },
  foto: { buchstabe: "F", name: "Fotospot" },
  sehen: { buchstabe: "S", name: "Sehenswert" },
  essen: { buchstabe: "E", name: "Essen" },
  strecke: { buchstabe: "U", name: "Unterwegs" },
  eigen: { buchstabe: "★", name: "Selbst gemerkt" },
  auto: { buchstabe: "A", name: "Mietwagen" }
};

function station(id) {
  return STATIONEN.find((s) => s.id === id);
}

function routeLink([lat, lon], zuFuss = false) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=${zuFuss ? "walking" : "driving"}`;
}

function entfernung([lat1, lon1], [lat2, lon2]) {
  const r = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function besucht(id) {
  return Boolean(zustand.besucht[id]);
}

function setzeBesucht(ort, ja) {
  if (ja) zustand.besucht[ort.id] = new Date().toISOString();
  else delete zustand.besucht[ort.id];
  sichern();
  markerAktualisieren(ort);
  heuteZeigen();
}

// ---------------------------------------------------------------- Navigation

const bildschirme = ["heute", "karte", "schreiben", "logbuch", "mehr"];

function gehe(ziel) {
  for (const id of bildschirme) document.getElementById(id).hidden = id !== ziel;
  document.querySelectorAll(".leiste button").forEach((b) => {
    if (b.dataset.gehe === ziel) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (ziel === "karte") karteZeigen();
  if (ziel === "heute") heuteZeigen();
  if (ziel === "logbuch") logbuchZeigen();
  if (ziel === "schreiben") schreibenZeigen();
  window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const knopf = e.target.closest("[data-gehe]");
  if (knopf) gehe(knopf.dataset.gehe);
});

// ---------------------------------------------------------------- Meldungen

let meldungTimer;
function melden(text, { bleibt = false, beiKlick = null } = {}) {
  const m = document.getElementById("meldung");
  m.textContent = text;
  m.hidden = false;
  m.onclick = () => {
    m.hidden = true;
    if (beiKlick) beiKlick();
  };
  clearTimeout(meldungTimer);
  if (!bleibt) meldungTimer = setTimeout(() => (m.hidden = true), 4500);
}

// ---------------------------------------------------------------- Blatt (Detailansicht)

function blattOeffnen(inhalt, art) {
  const b = document.getElementById("blatt");
  const i = document.getElementById("blatt-inhalt");
  i.replaceChildren(...inhalt);
  b.classList.toggle("taxi", art === "taxi");
  b.hidden = false;
  document.getElementById("blatt-zu").focus();
}

function blattSchliessen() {
  document.getElementById("blatt").hidden = true;
}

document.getElementById("blatt-zu").addEventListener("click", blattSchliessen);
document.getElementById("blatt").addEventListener("click", (e) => {
  if (e.target.id === "blatt") blattSchliessen();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") blattSchliessen();
});

function el(tag, attrs = {}, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
  }
  for (const k of kinder.flat()) if (k !== null && k !== undefined && k !== false) e.append(k);
  return e;
}

function ortZeigen(ort) {
  const s = station(ort.station);
  const art = ARTEN[ort.art];
  const inhalt = [
    el("p", { class: "label" }, (ort.highlight ? "★ " : "") + (ort.info ? "Fahrt" : art.name) + (s ? " · " + s.stadt : "")),
    el("h2", { id: "blatt-titel" }, ort.name)
  ];
  if (ort.text) inhalt.push(el("p", {}, ort.text));

  const pruef = [];
  if (ort.licht) pruef.push(el("li", { class: "licht-hinweis" }, el("b", {}, "Bestes Licht"), ort.licht));
  if (ort.offen) pruef.push(el("li", {}, el("b", {}, "Offen?"), ort.offen));
  if (ort.aufwand) pruef.push(el("li", {}, el("b", {}, "Hinkommen"), ort.aufwand));
  if (ort.achtung) pruef.push(el("li", { class: "achtung" }, el("b", {}, "Achtung"), ort.achtung));
  if (pruef.length) inhalt.push(el("ul", { class: "pruefliste" }, pruef));

  inhalt.push(el("a", { class: "knopf gross", href: routeLink(ort.ort, ort.art === "sehen" || ort.art === "essen"),
    target: "_blank", rel: "noopener" }, "Route in Google Maps"));

  if (ort.art === "hotel" && s && s.parken.length) {
    inhalt.push(el("a", { class: "knopf gross leise", href: routeLink(s.parken[0].ort), target: "_blank", rel: "noopener" },
      "Route zum Parkplatz"));
  }

  if (ort.art !== "parken" && ort.art !== "auto") {
    const ist = besucht(ort.id);
    inhalt.push(el("button", {
      class: "knopf gross " + (ist ? "leise" : "honig"), type: "button",
      onclick: () => { setzeBesucht(ort, !ist); ortZeigen(ort); }
    }, ist ? "Doch nicht besucht" : "Hier war ich"));
  }

  for (const p of postFuerOrt(ort.id)) {
    if (!besucht(ort.id)) break;
    inhalt.push(el("button", { class: "knopf gross leise", type: "button", onclick: () => postOeffnen(p) },
      (zustand.geoeffnet[p.id] ? "Noch mal lesen: " : "✉ Öffnen: ") + FORMEN[p.form].name + (p.von ? " von " + p.von : "")));
  }

  if (ort.art !== "eigen" && ort.art !== "auto" && !ort.info) {
    const hier = el("button", { class: "knopf leise", type: "button" },
      ort.korrigiert ? "Punkt noch mal auf meinen Standort setzen" : "Der Punkt liegt falsch – ich stehe genau hier");
    hier.addEventListener("click", () => {
      gpsStarten(false);
      if (!letztePosition) {
        melden("Noch kein Standort. Kurz warten und noch mal tippen.");
        return;
      }
      zustand.korrigiert[ort.id] = letztePosition;
      sichern();
      const neu = alleOrte().find((o) => o.id === ort.id);
      markerEntfernen(ort.id);
      markerSetzen(neu);
      blattSchliessen();
      melden("Danke! Der Punkt sitzt jetzt da, wo du stehst.");
    });
    inhalt.push(hier);
  }

  if (ort.art === "eigen") {
    const loeschen = el("button", { class: "knopf leise", type: "button" }, "Diesen Ort löschen");
    loeschen.addEventListener("click", () => {
      if (loeschen.dataset.sicher) {
        zustand.eigene = zustand.eigene.filter((e) => e.id !== ort.id);
        delete zustand.besucht[ort.id];
        sichern();
        markerEntfernen(ort.id);
        blattSchliessen();
        melden("Gelöscht.");
      } else {
        loeschen.dataset.sicher = "1";
        loeschen.textContent = "Wirklich löschen? Noch mal tippen";
      }
    });
    inhalt.push(loeschen);
  }
  blattOeffnen(inhalt);
}

// ---------------------------------------------------------------- Post (verschlüsselt)

// Überraschungen der Instanzen. Sie liegen verschlüsselt in geheim.json und werden nur mit dem
// Schlüssel aus Utas persönlichem Link lesbar. Wer die öffentliche Datei öffnet, sieht Zeichensalat.
// Eintrag: { id, form, von, titel, text, antwort, link, bild, ausloeser: { ort | station | reisetag | fennek | sofort } }
let POST = Object.entries(UMSCHLAEGE).map(([ort, text]) => ({ id: "umschlag-" + ort, form: "brief", text, ausloeser: { ort } }));

const FORMEN = {
  brief: { name: "Brief", zeichen: "✉" },
  postkarte: { name: "Postkarte", zeichen: "▭" },
  zettel: { name: "Zettel", zeichen: "✎" },
  gedicht: { name: "Gedicht", zeichen: "❦" },
  lied: { name: "Lied", zeichen: "♪" },
  raetsel: { name: "Rätsel", zeichen: "?" },
  bild: { name: "Bild", zeichen: "◐" }
};

function formVon(p) {
  return FORMEN[p.form] ? p.form : "brief";
}

function postVerfuegbar(p) {
  const a = p.ausloeser || { sofort: true };
  if (a.sofort) return true;
  if (a.ort) return besucht(a.ort);
  const stand = reiseStand();
  if (stand.phase === "danach") return !a.fennek;
  if (stand.phase !== "unterwegs") return false;
  if (a.station) return STATIONEN.findIndex((s) => s.id === stand.station.id) >= STATIONEN.findIndex((s) => s.id === a.station);
  if (a.reisetag) return stand.tag >= a.reisetag;
  return false;
}

function postFuerOrt(ortId) {
  return POST.filter((p) => p.ausloeser && p.ausloeser.ort === ortId);
}

function wartendePost() {
  return POST.filter((p) => !(p.ausloeser && p.ausloeser.fennek) && postVerfuegbar(p) && !zustand.geoeffnet[p.id]);
}

function postOeffnen(p) {
  const form = formVon(p);
  if (!zustand.geoeffnet[p.id]) {
    zustand.geoeffnet[p.id] = new Date().toISOString();
    const stand = reiseStand();
    const ort = p.ausloeser && p.ausloeser.ort ? alleOrte().find((o) => o.id === p.ausloeser.ort) : null;
    zustand.logbuch.push({ id: "p-" + Date.now(), art: "post", form, von: p.von || "", titel: p.titel || "",
      text: p.text || "", antwort: p.antwort || "", datum: new Date().toISOString(),
      station: ort ? ort.station : stand.station?.id || null, ortName: ort ? ort.name : "" });
    sichern();
  }
  blattOeffnen(postDarstellen(p));
  if (p.ausloeser && p.ausloeser.ort) {
    const ort = alleOrte().find((o) => o.id === p.ausloeser.ort);
    if (ort) markerAktualisieren(ort);
  }
  heuteZeigen();
}

// Jede Form hat ihren eigenen kleinen Auftritt.
function postDarstellen(p) {
  const form = formVon(p);
  const von = p.von ? el("p", { class: "post-von" }, "– " + p.von) : null;
  const titel = el("h2", { id: "blatt-titel", class: "post-titel" }, p.titel || FORMEN[form].name + " für dich");
  const kopf = el("p", { class: "label" }, FORMEN[form].name + (p.von ? " · von " + p.von : ""));
  const text = el("p", { class: "post-text" }, p.text || "");

  if (form === "brief") {
    const umschlag = el("button", { class: "umschlag-bild", type: "button", "aria-label": "Umschlag öffnen" },
      el("span", { class: "klappe" }), el("span", { class: "siegel" }, "✦"));
    const brief = el("div", { class: "brief-papier", hidden: true }, titel, text, von);
    const tipp = el("p", { class: "muted klein-text mitte" }, "Antippen zum Öffnen");
    umschlag.addEventListener("click", () => {
      umschlag.classList.add("offen");
      tipp.hidden = true;
      setTimeout(() => { umschlag.hidden = true; brief.hidden = false; }, 450);
    });
    return [kopf, umschlag, tipp, brief];
  }
  if (form === "postkarte") {
    const karte = el("button", { class: "postkarte", type: "button", "aria-label": "Postkarte umdrehen" },
      el("span", { class: "vorne" }, el("span", { class: "marke" }, "MAROC"), el("span", { class: "gruss" }, p.titel || "Grüße")),
      el("span", { class: "hinten" }, el("span", { class: "post-text" }, p.text || ""), von));
    karte.addEventListener("click", () => karte.classList.toggle("umgedreht"));
    return [kopf, karte, el("p", { class: "muted klein-text mitte" }, "Antippen zum Umdrehen")];
  }
  if (form === "zettel") {
    const zettel = el("button", { class: "zettel", type: "button", "aria-label": "Zettel auffalten" }, "Ein gefalteter Zettel");
    const inhalt = el("div", { class: "zettel-offen", hidden: true }, text, von);
    zettel.addEventListener("click", () => { zettel.hidden = true; inhalt.hidden = false; });
    return [kopf, zettel, inhalt];
  }
  if (form === "raetsel") {
    const aufloesung = el("div", { class: "aufloesung", hidden: true }, el("p", { class: "label" }, "Auflösung"),
      el("p", { class: "post-text" }, p.antwort || "Das bleibt ein Geheimnis."));
    const knopf = el("button", { class: "knopf gross leise", type: "button", onclick: () => { aufloesung.hidden = false; knopf.hidden = true; } }, "Auflösung zeigen");
    return [kopf, titel, text, knopf, aufloesung, von];
  }
  if (form === "bild") {
    return [kopf, titel, p.bild ? el("img", { class: "post-bild", src: p.bild, alt: p.titel || "Bild" }) : null, text, von];
  }
  // gedicht, lied
  const teile = [kopf, titel, el("p", { class: "post-text vers" }, p.text || ""), von];
  if (p.link) teile.push(el("a", { class: "knopf gross leise", href: p.link, target: "_blank", rel: "noopener" }, form === "lied" ? "♪ Anhören" : "Öffnen"));
  return teile;
}

// ---- Verschlüsselte Post und Reisedaten laden

function base64url(text) {
  const b = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

function schluesselAusLink() {
  const treffer = location.hash.match(/[#&]k=([A-Za-z0-9_-]{40,})/);
  if (!treffer) return;
  try { localStorage.setItem("honig.schluessel", treffer[1]); } catch (e) {}
  history.replaceState(null, "", location.pathname);
}

async function geheimLaden() {
  let k = null;
  try { k = localStorage.getItem("honig.schluessel"); } catch (e) {}
  if (!k || !window.crypto || !crypto.subtle) return;
  try {
    const antwort = await fetch("geheim.json", { cache: "no-cache" });
    if (!antwort.ok) return;
    const { iv, daten } = await antwort.json();
    const schluessel = await crypto.subtle.importKey("raw", base64url(k), "AES-GCM", false, ["decrypt"]);
    const klar = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64url(iv) }, schluessel, base64url(daten));
    const inhalt = JSON.parse(new TextDecoder().decode(klar));
    if (inhalt.reise && !zustand.reiseSelbst) {
      zustand.reise = inhalt.reise;
      sichern();
      reiseFormZeigen();
    }
    if (Array.isArray(inhalt.post)) POST = POST.concat(inhalt.post);
    heuteZeigen();
    if (karte) for (const { ort } of marker.values()) markerAktualisieren(ort);
  } catch (e) {
    melden("Die Post ließ sich nicht öffnen. Stimmt der Link?");
  }
}

// ---------------------------------------------------------------- Heute

function zeit(datum) {
  if (!datum || isNaN(datum)) return "–";
  return new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, hour: "2-digit", minute: "2-digit" }).format(datum);
}

// Die App färbt sich nach der Station, in der ihr gerade seid.
function farbeSetzen(stand) {
  const f = stand.phase === "unterwegs" ? stand.station.farbe : STATIONEN[2].farbe;
  document.documentElement.style.setProperty("--blau", f.hell);
  document.documentElement.style.setProperty("--blau-tief", f.tief);
  document.getElementById("farbreise").replaceChildren(...STATIONEN.map((s) =>
    el("div", { class: stand.station && stand.station.id === s.id ? "jetzt" : "" },
      el("span", { style: `background:${s.farbe.hell}` }), s.farbe.name)));
}

function heuteZeigen() {
  const stand = reiseStand();
  farbeSetzen(stand);
  autoZeigen();
  eigeneFarbenZeigen();
  const offen = zustand.notizen.filter((n) => !n.eingepackt);
  document.getElementById("nyota-stand").textContent = offen.length ?
    `${offen.length} ${offen.length === 1 ? "Notiz wartet" : "Notizen warten"} darauf, eingepackt zu werden.` : "";
  const tag = document.getElementById("heute-tag");
  const titel = document.getElementById("heute-titel");
  const sub = document.getElementById("heute-sub");
  document.getElementById("reise-fehlt").hidden = stand.phase !== "unbekannt";
  const hotelBlock = document.getElementById("heute-hotel");
  let lichtStation = STATIONEN[0];

  if (stand.phase === "unterwegs") {
    const s = stand.station;
    lichtStation = s;
    tag.textContent = `Tag ${stand.tag} von ${stand.tage} · ${s.farbe.beiname}`;
    titel.textContent = s.stadt;
    const sichtbar = alleOrte().filter((o) => o.station === s.id && o.art !== "parken" && o.art !== "hotel");
    const gesehen = sichtbar.filter((o) => besucht(o.id)).length;
    sub.textContent = sichtbar.length ? `${gesehen} von ${sichtbar.length} Orten gesehen` : "";
    hotelBlock.hidden = false;
    document.getElementById("hotel-name").textContent = s.hotel.name;
    document.getElementById("hotel-ort").textContent = s.hotel.lage + (s.hotel.anreise ? " · " + s.hotel.anreise : "");
    document.getElementById("hotel-route").href = routeLink(s.hotel.ort, true);
    const p = document.getElementById("hotel-route-parken");
    if (s.parken.length) {
      p.hidden = false;
      p.href = routeLink(s.parken[0].ort);
    } else p.hidden = true;
  } else {
    hotelBlock.hidden = true;
    if (stand.phase === "vorher") {
      tag.textContent = stand.nochTage === 1 ? "Morgen geht es los" : `Noch ${stand.nochTage} Tage`;
      titel.textContent = "Marokko";
      sub.textContent = "Marrakesch · Fès · Chefchaouen · Tanger";
    } else if (stand.phase === "danach") {
      tag.textContent = "Wieder zu Hause";
      titel.textContent = "Marokko";
      const n = Object.keys(zustand.besucht).length;
      sub.textContent = `${n} Orte besucht, ${zustand.logbuch.length === 1 ? "ein Eintrag" : zustand.logbuch.length + " Einträge"} im Tagebuch.`;
    } else {
      tag.textContent = "";
      titel.textContent = "Marokko";
      sub.textContent = "Marrakesch · Fès · Chefchaouen · Tanger";
    }
  }

  // Licht
  document.getElementById("licht-ort").textContent = lichtStation.stadt;
  const [lat, lon] = lichtStation.zentrum;
  const t = SunCalc.getTimes(new Date(), lat, lon);
  const jetzt = new Date();
  const zeilen = [
    ["Sonnenaufgang", t.sunrise],
    ["Morgengold bis", t.goldenHourEnd],
    ["Abendgold ab", t.goldenHour, true],
    ["Sonnenuntergang", t.sunset, true],
    ["Blaue Stunde bis", t.dusk]
  ];
  wetterZeigen(lichtStation);
  const abends = jetzt > t.sunset;
  document.getElementById("nyota-titel").textContent = abends ? "Ein Satz zum Tag?" : "Nyota · kurz reinsprechen";
  notizFeld.placeholder = abends ? "Was war heute schön? Einfach aufs Mikrofon der Tastatur tippen …" :
    "Mikrofon auf der Tastatur antippen und einfach erzählen …";
  document.getElementById("licht").replaceChildren(...zeilen.map(([name, d, gold]) =>
    el("li", { class: d < jetzt ? "vorbei" : gold ? "gold" : "" }, el("span", {}, name), el("span", {}, zeit(d)))));

  // Umschläge
  const hinweis = document.getElementById("umschlag-hinweis");
  const wartend = wartendePost();
  if (wartend.length) {
    const erste = wartend[0];
    hinweis.hidden = false;
    hinweis.replaceChildren(
      el("p", { class: "label" }, wartend.length === 1 ? "Post für dich" : `${wartend.length} Mal Post für dich`),
      el("h2", {}, FORMEN[formVon(erste)].zeichen + " " + FORMEN[formVon(erste)].name + (erste.von ? " von " + erste.von : "")),
      el("button", { class: "knopf gross", type: "button", onclick: () => postOeffnen(erste) }, "Öffnen")
    );
  } else hinweis.hidden = true;
}

document.getElementById("fennek-knopf").addEventListener("click", () => {
  const fennekPost = POST.find((p) => p.ausloeser && p.ausloeser.fennek && !zustand.geoeffnet[p.id]);
  if (fennekPost && Math.random() < 0.5) {
    postOeffnen(fennekPost);
    return;
  }
  const alt = document.getElementById("spruch-text").textContent;
  let neu;
  do neu = SPRUECHE[Math.floor(Math.random() * SPRUECHE.length)];
  while (neu === alt && SPRUECHE.length > 1);
  document.getElementById("spruch-text").textContent = neu;
  document.getElementById("spruch").hidden = false;
});
document.getElementById("spruch-zu").addEventListener("click", () => (document.getElementById("spruch").hidden = true));

// ---------------------------------------------------------------- Karte

let karte = null;
const marker = new Map();
let ichMarker = null;
let letztePosition = null;
let beobachtung = null;

// Unbesuchte Orte tragen die Farbe ihrer Stadt, unterwegs grün, besuchte Honig-Gold.
function pinFarbe(ort) {
  if (ort.art === "strecke") return FARBE_UNTERWEGS.hell;
  const s = station(ort.station);
  return s ? s.farbe.hell : null;
}

function pinIcon(ort) {
  const klassen = ["pin", ort.art];
  if (ort.highlight) klassen.push("highlight");
  const farbig = ["foto", "sehen", "essen", "strecke"].includes(ort.art) && !besucht(ort.id);
  const stil = farbig && pinFarbe(ort) ? ` style="background:${pinFarbe(ort)}"` : "";
  const zeichen = ort.info ? "i" : ARTEN[ort.art].buchstabe;
  if (besucht(ort.id)) klassen.push("besucht");
  if (besucht(ort.id) && postFuerOrt(ort.id).some((p) => !zustand.geoeffnet[p.id])) klassen.push("umschlag");
  return L.divIcon({ className: "", html: `<div class="${klassen.join(" ")}"${stil}>${zeichen}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17] });
}

function markerSetzen(ort) {
  if (!karte) return;
  const m = L.marker(ort.ort, { icon: pinIcon(ort), title: ort.name, zIndexOffset: ort.art === "hotel" ? 500 : 0 })
    .addTo(karte)
    .on("click", () => ortZeigen(ort));
  marker.set(ort.id, { m, ort });
}

function markerAktualisieren(ort) {
  const eintrag = marker.get(ort.id);
  if (eintrag) eintrag.m.setIcon(pinIcon(ort));
}

function markerEntfernen(id) {
  const eintrag = marker.get(id);
  if (eintrag) {
    eintrag.m.remove();
    marker.delete(id);
  }
}

function karteZeigen() {
  if (!karte) {
    karte = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(karte);
    for (const ort of alleOrte()) markerSetzen(ort);
    staedteKnoepfe();
    const stand = reiseStand();
    if (stand.phase === "unterwegs") stadtZeigen(stand.station.id);
    else stadtZeigen("route");
    if (letztePosition) ichZeigen(letztePosition);
  }
  setTimeout(() => karte.invalidateSize(), 50);
}

function staedteKnoepfe() {
  const box = document.getElementById("staedte");
  const knoepfe = [["route", "Ganze Route"], ...STATIONEN.map((s) => [s.id, s.stadt])];
  box.replaceChildren(...knoepfe.map(([id, name]) =>
    el("button", { type: "button", "data-stadt": id, "aria-pressed": "false", onclick: () => stadtZeigen(id) }, name)));
}

function stadtZeigen(id) {
  document.querySelectorAll("#staedte button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.stadt === id)));
  if (id === "route") {
    karte.fitBounds(L.latLngBounds(STATIONEN.map((s) => s.zentrum)).pad(0.15));
  } else {
    const s = station(id);
    karte.setView(s.zentrum, s.zoom);
  }
}

function ichZeigen(pos) {
  if (!karte) return;
  if (!ichMarker) {
    ichMarker = L.marker(pos, { icon: L.divIcon({ className: "", html: '<div class="ich"></div>', iconSize: [20, 20],
      iconAnchor: [10, 10] }), zIndexOffset: 1000, interactive: false }).addTo(karte);
  } else ichMarker.setLatLng(pos);
}

function gpsStarten(zentrieren = false) {
  if (!("geolocation" in navigator)) {
    melden("Dieses Handy gibt keinen Standort heraus.");
    return;
  }
  if (beobachtung === null) {
    beobachtung = navigator.geolocation.watchPosition(positionNeu, gpsFehler,
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 30000 });
  }
  if (zentrieren) {
    if (letztePosition) karte.setView(letztePosition, Math.max(karte.getZoom(), 16));
    else melden("Suche deinen Standort …");
    zentrierenBeimNaechsten = zentrieren;
  }
}

let zentrierenBeimNaechsten = false;

function positionNeu(p) {
  letztePosition = [p.coords.latitude, p.coords.longitude];
  ichZeigen(letztePosition);
  if (zentrierenBeimNaechsten && karte) {
    karte.setView(letztePosition, Math.max(karte.getZoom(), 16));
    zentrierenBeimNaechsten = false;
  }
  if (p.coords.accuracy > 100) return; // zu ungenau, z. B. in engen Gassen
  for (const ort of alleOrte()) {
    if (!ort.radius || besucht(ort.id)) continue;
    if (entfernung(letztePosition, ort.ort) <= ort.radius) angekommen(ort);
  }
}

function gpsFehler(fehler) {
  if (fehler.code === 1) {
    melden("Standort ist für diese Seite nicht erlaubt. In den Browser-Einstellungen freigeben.", { bleibt: true });
    navigator.geolocation.clearWatch(beobachtung);
    beobachtung = null;
  }
}

function angekommen(ort) {
  setzeBesucht(ort, true);
  const post = postFuerOrt(ort.id).find((p) => !zustand.geoeffnet[p.id]);
  if (post) {
    melden(`Angekommen: ${ort.name}. Hier wartet Post für dich – antippen.`, { bleibt: true, beiKlick: () => postOeffnen(post) });
  } else {
    melden(`Angekommen: ${ort.name}. Der Punkt ist jetzt golden.`, { bleibt: true });
  }
}

document.getElementById("wo-bin-ich").addEventListener("click", () => gpsStarten(true));

document.getElementById("hier-merken").addEventListener("click", () => {
  gpsStarten(false);
  const eingabe = el("input", { type: "text", id: "merken-name", value: "Ort vom " +
    new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, day: "numeric", month: "long" }).format(new Date()) });
  const speichern = el("button", { class: "knopf gross honig", type: "button" }, "Merken");
  speichern.addEventListener("click", () => {
    if (!letztePosition) {
      melden("Noch kein Standort. Kurz warten und noch mal tippen.");
      return;
    }
    const ort = { id: "eigen-" + Date.now(), name: eingabe.value.trim() || "Mein Ort", ort: letztePosition,
      station: reiseStand().station?.id || null, text: "Selbst gemerkt am " + new Date().toLocaleDateString("de-DE") };
    zustand.eigene.push(ort);
    zustand.besucht[ort.id] = new Date().toISOString();
    sichern();
    markerSetzen({ ...ort, art: "eigen" });
    blattSchliessen();
    melden("Gemerkt. Der Stern bleibt auf der Karte.");
  });
  blattOeffnen([
    el("p", { class: "label" }, "Hier merken"),
    el("h2", { id: "blatt-titel" }, "Wie soll der Ort heißen?"),
    el("label", { class: "label", for: "merken-name" }, "Name"),
    eingabe,
    speichern
  ]);
});

// GPS von selbst starten, wenn es schon erlaubt ist (sonst erst auf Knopfdruck).
if (navigator.permissions && navigator.permissions.query) {
  navigator.permissions.query({ name: "geolocation" }).then((p) => {
    if (p.state === "granted") gpsStarten(false);
  }).catch(() => {});
}

// ---------------------------------------------------------------- Schreiben

let gewaehltesFoto = null;
const fotoInput = document.getElementById("foto");
const textFeld = document.getElementById("text");

fotoInput.addEventListener("change", () => {
  gewaehltesFoto = fotoInput.files[0] || null;
  const vorschau = document.getElementById("foto-vorschau");
  if (gewaehltesFoto) {
    vorschau.src = URL.createObjectURL(gewaehltesFoto);
    vorschau.hidden = false;
  } else vorschau.hidden = true;
});

textFeld.addEventListener("input", () => {
  zustand.entwurf = textFeld.value;
  sichern();
});

function schreibenZeigen() {
  if (!textFeld.value && zustand.entwurf) textFeld.value = zustand.entwurf;
  const stand = reiseStand();
  document.getElementById("schreiben-ort").textContent = stand.phase === "unterwegs" ? "Ort: " + stand.station.stadt : "";
}

// ---- Fotos fürs Tagebuch: eine kleine Kopie, nur auf diesem Handy (IndexedDB)

let bilderDB = null;
function bilderOeffnen() {
  if (!bilderDB) {
    bilderDB = new Promise((ok, nein) => {
      const r = indexedDB.open("honig", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("bilder");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => nein(r.error);
    });
  }
  return bilderDB;
}

async function bildAktion(modus, id, blob) {
  const db = await bilderOeffnen();
  return new Promise((ok, nein) => {
    const t = db.transaction("bilder", modus === "lesen" ? "readonly" : "readwrite");
    const store = t.objectStore("bilder");
    const r = modus === "lesen" ? store.get(id) : modus === "loeschen" ? store.delete(id) : store.put(blob, id);
    t.oncomplete = () => ok(r.result);
    t.onerror = () => nein(t.error);
  });
}

async function verkleinern(datei, max = 1100) {
  try {
    const bild = await createImageBitmap(datei, { imageOrientation: "from-image" });
    const f = Math.min(1, max / Math.max(bild.width, bild.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bild.width * f);
    c.height = Math.round(bild.height * f);
    c.getContext("2d").drawImage(bild, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.8));
  } catch (e) {
    return null; // z. B. ein Format, das der Browser nicht lesen kann
  }
}

async function insLogbuch(text, foto) {
  const stand = reiseStand();
  const eintrag = { id: "t-" + Date.now(), art: "text", datum: new Date().toISOString(), text,
    station: stand.station?.id || null, ort: letztePosition };
  if (foto) {
    const klein = await verkleinern(foto);
    if (klein) {
      try {
        await bildAktion("schreiben", eintrag.id, klein);
        eintrag.bild = true;
        eintrag.farbe = await hauptfarbe(klein);
      } catch (e) {
        melden("Das Foto passte nicht mehr ins Tagebuch – der Text ist gespeichert.");
      }
    }
  }
  zustand.logbuch.push(eintrag);
  zustand.entwurf = "";
  sichern();
}

function schreibenLeeren() {
  textFeld.value = "";
  fotoInput.value = "";
  gewaehltesFoto = null;
  document.getElementById("foto-vorschau").hidden = true;
}

document.getElementById("teilen").addEventListener("click", async () => {
  const text = textFeld.value.trim();
  if (!text && !gewaehltesFoto) {
    melden("Erst ein Foto wählen oder etwas schreiben.");
    return;
  }
  const foto = gewaehltesFoto;
  const daten = { text };
  if (foto && navigator.canShare && navigator.canShare({ files: [foto] })) daten.files = [foto];
  try {
    if (!navigator.share) throw new Error("kein-teilen");
    await navigator.share(daten);
    await insLogbuch(text, foto);
    schreibenLeeren();
    melden("Geteilt und im Tagebuch.");
  } catch (e) {
    if (e.name === "AbortError") return; // abgebrochen: alles bleibt stehen
    try {
      await navigator.clipboard.writeText(text);
      melden("Teilen geht hier nicht – der Text ist kopiert. In WhatsApp einfügen.");
    } catch (_) {
      melden("Teilen geht hier nicht. Text markieren und kopieren.");
    }
  }
});

document.getElementById("nur-logbuch").addEventListener("click", async () => {
  const text = textFeld.value.trim();
  if (!text && !gewaehltesFoto) {
    melden("Da steht noch nichts.");
    return;
  }
  await insLogbuch(text, gewaehltesFoto);
  schreibenLeeren();
  melden("Im Tagebuch.");
});

// ---------------------------------------------------------------- Logbuch

function datumLang(iso) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

async function textTeilen(text) {
  try {
    if (!navigator.share) throw new Error("kein-teilen");
    await navigator.share({ text });
  } catch (e) {
    if (e.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(text);
      melden("Kopiert.");
    } catch (_) {
      melden("Kopieren ging nicht. Text lange antippen und kopieren.");
    }
  }
}

function eintragKopf(e) {
  const s = station(e.station);
  let art = "";
  if (e.art === "post") art = " · " + (FORMEN[e.form] ? FORMEN[e.form].name : "Post") + (e.von ? " von " + e.von : "");
  if (e.art === "umschlag") art = " · Umschlag";
  return datumLang(e.datum) + (s ? " · " + s.stadt : "") + art;
}

function logbuchZeigen() {
  const box = document.getElementById("eintraege");
  const eintraege = [...zustand.logbuch].reverse();
  document.getElementById("logbuch-sub").textContent = eintraege.length ? (eintraege.length === 1 ? "1 Eintrag" : `${eintraege.length} Einträge`) :
    "Noch leer. Was du unter „Schreiben“ teilst, landet hier.";
  document.getElementById("alles-teilen").hidden = !eintraege.length;
  document.getElementById("tagebuch-speichern").hidden = !eintraege.length;
  if (!eintraege.length) {
    box.replaceChildren(el("p", { class: "leer" }, "Hier sammelt sich die Reise."));
    return;
  }
  box.replaceChildren(...eintraege.map((e) => {
    const loeschen = el("button", { class: "knopf leise", type: "button" }, "Löschen");
    loeschen.addEventListener("click", () => {
      if (loeschen.dataset.sicher) {
        zustand.logbuch = zustand.logbuch.filter((x) => x.id !== e.id);
        sichern();
        if (e.bild) bildAktion("loeschen", e.id).catch(() => {});
        logbuchZeigen();
      } else {
        loeschen.dataset.sicher = "1";
        loeschen.textContent = "Sicher?";
      }
    });
    const bild = e.bild ? el("img", { class: "eintrag-bild", alt: "Foto zum Eintrag", loading: "lazy" }) : null;
    if (bild) bildAktion("lesen", e.id).then((b) => { if (b) bild.src = URL.createObjectURL(b); }).catch(() => {});
    const post = e.art === "post" || e.art === "umschlag";
    if (e.art === "tag") {
      return el("article", { class: "eintrag tag-eintrag" },
        el("p", { class: "wann" }, tagTitel(e.tag)),
        el("p", { class: "was" }, e.text),
        el("div", { class: "knopfreihe" },
          el("button", { class: "knopf", type: "button", onclick: () => kopieren(tagesBericht(e.tag, e.text), "Kopiert – jetzt einfügen, wo du berichten willst.") }, "Bericht"),
          el("button", { class: "knopf", type: "button", onclick: () => berichtDatei(e.tag, e.text) }, "Als Datei"),
          loeschen));
    }
    return el("article", { class: "eintrag" + (post ? " umschlag-eintrag" : "") },
      el("p", { class: "wann" }, eintragKopf(e)),
      bild,
      e.titel ? el("h3", {}, e.titel) : null,
      e.text ? el("p", { class: "was" }, e.text) : null,
      e.antwort ? el("p", { class: "muted" }, "Auflösung: " + e.antwort) : null,
      el("div", { class: "knopfreihe" },
        e.text ? el("button", { class: "knopf", type: "button", onclick: () => textTeilen(e.text) }, "Teilen") : null,
        loeschen));
  }));
}

document.getElementById("alles-teilen").addEventListener("click", () => {
  const alles = zustand.logbuch.map((e) => `${eintragKopf(e)}\n${e.titel ? e.titel + "\n" : ""}${e.text}`).join("\n\n");
  textTeilen(alles);
});

// ---- Reisetagebuch: alles in eine Datei, zum Aufheben

function blobAlsDataURL(blob) {
  return new Promise((ok) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => ok(null);
    r.readAsDataURL(blob);
  });
}

function html(text) {
  return String(text || "").replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z]);
}

async function tagebuchBauen() {
  const tagOf = (iso) => heuteISO(new Date(iso));
  const tage = new Map();
  const sortiert = [...zustand.logbuch].sort((a, b) => (a.art === "tag" ? -1 : 0) - (b.art === "tag" ? -1 : 0) || a.datum.localeCompare(b.datum));
  for (const e of sortiert) {
    const t = e.tag || tagOf(e.datum);
    if (!tage.has(t)) tage.set(t, { eintraege: [], orte: [] });
    tage.get(t).eintraege.push(e);
  }
  const alle = alleOrte();
  for (const [id, wann] of Object.entries(zustand.besucht)) {
    const o = alle.find((x) => x.id === id);
    if (!o || o.art === "parken") continue;
    const t = tagOf(wann);
    if (!tage.has(t)) tage.set(t, { eintraege: [], orte: [] });
    tage.get(t).orte.push(o.name);
  }
  const start = zustand.reise ? zustand.reise[0].von : null;
  const teile = [];
  for (const t of [...tage.keys()].sort()) {
    const { eintraege, orte } = tage.get(t);
    const s = station(eintraege.find((e) => e.station)?.station) ||
      (zustand.reise ? STATIONEN[Math.max(0, zustand.reise.findIndex((r) => t >= r.von && t < r.bis))] : null);
    const farbe = s ? s.farbe.hell : "#e2ac3e";
    const datum = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(t + "T12:00:00"));
    const nummer = start && t >= start ? `Tag ${tageZwischen(start, t) + 1} · ` : "";
    const eigene = eintraege.filter((e) => e.farbe).map((e) => `<span style="background:${e.farbe}"></span>`).join("");
    let abschnitt = `<section><header style="border-color:${farbe}"><p class="k">${html(nummer + datum)}</p><h2>${html(s ? s.stadt : "")}</h2></header>` +
      (eigene ? `<div class="farben klein">${eigene}</div>` : "");
    for (const e of eintraege) {
      let bild = "";
      if (e.bild) {
        const b = await bildAktion("lesen", e.id).catch(() => null);
        const url = b ? await blobAlsDataURL(b) : null;
        if (url) bild = `<img src="${url}" alt="">`;
      }
      const post = e.art === "post" || e.art === "umschlag";
      if (e.art === "tag") {
        abschnitt += `<article class="tagtext"><p>${html(e.text).replace(/\n/g, "<br>")}</p></article>`;
        continue;
      }
      const kopf = post ? `<p class="k">${html((FORMEN[e.form]?.name || "Umschlag") + (e.von ? " von " + e.von : ""))}</p>` : "";
      abschnitt += `<article class="${post ? "post" : ""}">${kopf}${bild}${e.titel ? `<h3>${html(e.titel)}</h3>` : ""}` +
        `${e.text ? `<p>${html(e.text).replace(/\n/g, "<br>")}</p>` : ""}${e.antwort ? `<p class="k">Auflösung: ${html(e.antwort)}</p>` : ""}</article>`;
    }
    if (orte.length) abschnitt += `<p class="gesehen">Gesehen: ${orte.map(html).join(" · ")}</p>`;
    teile.push(abschnitt + "</section>");
  }
  const farben = STATIONEN.map((s) => `<span style="background:${s.farbe.hell}"></span>`).join("");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Marokko · Reisetagebuch</title><style>
body{margin:0;background:#14110f;color:#efe9df;font:18px/1.6 Georgia,serif}
main{max-width:680px;margin:0 auto;padding:40px 18px 80px}
h1{font-weight:400;font-size:46px;margin:0}h2{font-weight:400;font-size:30px;margin:4px 0 0}h3{font-weight:400;margin:0 0 6px}
.farben{display:flex;height:10px;margin:18px 0 40px}.farben span{flex:1}.farben.klein{height:8px;margin:0 0 20px;gap:3px}
.tagtext{font-size:20px}
.k{font:13px/1.4 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a89e91;margin:0}
section{margin:0 0 56px}header{border-left:6px solid;padding-left:14px;margin-bottom:22px}
article{margin:0 0 28px}article img{width:100%;display:block;margin:0 0 10px}
article.post{border-left:3px solid #e2ac3e;padding:4px 0 4px 16px;font-style:italic}
.gesehen{font:15px/1.5 system-ui,sans-serif;color:#a89e91}
</style></head><body><main><p class="k">Honig-App</p><h1>Marokko</h1><div class="farben">${farben}</div>${teile.join("")}</main></body></html>`;
}

document.getElementById("tagebuch-speichern").addEventListener("click", async () => {
  melden("Das Tagebuch wird gebunden …");
  const inhalt = await tagebuchBauen();
  const datei = new File([inhalt], "Marokko-Reisetagebuch.html", { type: "text/html" });
  await dateiTeilen(datei, "Marokko · Reisetagebuch", "Fertig. Am besten im Drive aufheben.",
    "Das Tagebuch liegt in deinen Downloads.");
});

// Datei übers Teilen-Menü des Handys weitergeben (z. B. in Drive), sonst herunterladen.
async function dateiTeilen(datei, titel, meldungGeteilt, meldungDownload) {
  try {
    if (navigator.canShare && navigator.canShare({ files: [datei] })) {
      await navigator.share({ files: [datei], title: titel });
      melden(meldungGeteilt);
      return;
    }
  } catch (e) {
    if (e.name === "AbortError") return;
  }
  const a = el("a", { href: URL.createObjectURL(datei), download: datei.name });
  document.body.append(a);
  a.click();
  a.remove();
  melden(meldungDownload);
}

// ---------------------------------------------------------------- Nyota: unterwegs reinsprechen, abends einpacken

function uhrzeit(iso) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: ZEITZONE, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function tagTitel(tag) {
  const datum = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(tag + "T12:00:00"));
  const r = zustand.reise;
  const nummer = r && tag >= r[0].von && tag <= r[r.length - 1].bis ? `Tag ${tageZwischen(r[0].von, tag) + 1} · ` : "";
  const s = stationAm(tag);
  return nummer + datum + (s ? " · " + s.stadt : "");
}

function stationAm(tag) {
  const r = zustand.reise;
  if (!r) return null;
  let i = r.findIndex((x) => tag >= x.von && tag < x.bis);
  if (i === -1 && tag === r[r.length - 1].bis) i = r.length - 1;
  return i === -1 ? null : STATIONEN[i];
}

// Der nächste bekannte Ort im Umkreis von 200 m, damit eine Notiz weiß, wo sie entstand.
function ortInDerNaehe(pos) {
  if (!pos) return null;
  let bester = null, abstand = 200;
  for (const o of alleOrte()) {
    if (o.art === "parken" || o.art === "auto" || o.info) continue;
    const d = entfernung(pos, o.ort);
    if (d < abstand) { abstand = d; bester = o; }
  }
  return bester;
}

const notizFeld = document.getElementById("notiz");

document.getElementById("notiz-merken").addEventListener("click", () => {
  const text = notizFeld.value.trim();
  if (!text) {
    melden("Erst etwas sagen oder schreiben.");
    notizFeld.focus();
    return;
  }
  const ort = ortInDerNaehe(letztePosition);
  zustand.notizen.push({ id: "n-" + Date.now(), zeit: new Date().toISOString(), tag: heuteISO(), text,
    pos: letztePosition, ortName: ort ? ort.name : "", eingepackt: false });
  sichern();
  notizFeld.value = "";
  melden(ort ? `Gemerkt – bei ${ort.name}.` : "Gemerkt.");
  heuteZeigen();
});

function offeneTage() {
  const tage = new Set(zustand.notizen.filter((n) => !n.eingepackt).map((n) => n.tag));
  const heute = heuteISO();
  if (!tage.size) tage.add(heute);
  return [...tage].sort();
}

function tagesPaket(tage) {
  const alle = alleOrte();
  const teile = ["Bitte mach daraus einen kurzen Eintrag für mein Reisetagebuch: in meiner Stimme (ich/wir), warm und schlicht, " +
    "höchstens acht Sätze pro Tag. Erfinde nichts dazu, nimm nur, was hier steht. Gib nur den fertigen Text zurück."];
  for (const tag of tage) {
    const zeilen = [`\n${tagTitel(tag)}`];
    const gesehen = Object.entries(zustand.besucht)
      .filter(([, wann]) => heuteISO(new Date(wann)) === tag)
      .map(([id, wann]) => ({ o: alle.find((x) => x.id === id), wann }))
      .filter((x) => x.o && x.o.art !== "parken" && x.o.art !== "auto")
      .sort((a, b) => a.wann.localeCompare(b.wann));
    if (gesehen.length) zeilen.push("Wo wir waren:", ...gesehen.map((x) => `- ${uhrzeit(x.wann)} ${x.o.name}`));
    const notizen = zustand.notizen.filter((n) => n.tag === tag && !n.eingepackt);
    if (notizen.length) zeilen.push("Was ich unterwegs gesagt habe:", ...notizen.map((n) => `- ${uhrzeit(n.zeit)}${n.ortName ? " (" + n.ortName + ")" : ""}: ${n.text}`));
    const texte = zustand.logbuch.filter((e) => e.art === "text" && e.text && heuteISO(new Date(e.datum)) === tag);
    if (texte.length) zeilen.push("Was ich zu Fotos geschrieben habe:", ...texte.map((e) => `- ${uhrzeit(e.datum)}: ${e.text}`));
    if (zeilen.length === 1) zeilen.push("(Noch nichts gesammelt.)");
    teile.push(zeilen.join("\n"));
  }
  return teile.join("\n");
}

function tagesBericht(tag, text) {
  const alle = alleOrte();
  const gesehen = Object.entries(zustand.besucht)
    .filter(([, wann]) => heuteISO(new Date(wann)) === tag)
    .map(([id]) => alle.find((x) => x.id === id))
    .filter((o) => o && o.art !== "parken" && o.art !== "auto")
    .map((o) => o.name);
  return `Hallo aus Marokko! 🍯\n${tagTitel(tag)}\n\n${text}` + (gesehen.length ? `\n\nGesehen: ${gesehen.join(" · ")}` : "") +
    "\n\n– gesendet aus der Honig-App";
}

// Der Tagesbericht als kleine Datei, z. B. für einen gemeinsamen Drive-Ordner,
// aus dem andere den Reisetag abholen können.
function berichtDatei(tag, text) {
  const nr = zustand.reise ? tageZwischen(zustand.reise[0].von, tag) + 1 : null;
  const name = `Tagesbericht-${tag}` + (nr ? `-Tag-${nr}` : "") + ".md";
  const inhalt = "# " + tagesBericht(tag, text).replace(/\n/, "\n\n## ") + "\n";
  return dateiTeilen(new File([inhalt], name, { type: "text/markdown" }), "Tagesbericht · " + tagTitel(tag),
    "Unterwegs. Am besten in den gemeinsamen Drive-Ordner.", "Die Datei liegt in deinen Downloads.");
}

async function kopieren(text, meldung) {
  try {
    await navigator.clipboard.writeText(text);
    melden(meldung);
  } catch (e) {
    melden("Kopieren ging nicht. Den Text lange antippen und kopieren.");
  }
}

document.getElementById("tag-einpacken").addEventListener("click", () => {
  const tage = offeneTage();
  const paket = tagesPaket(tage);
  const paketFeld = el("textarea", { class: "paket", id: "paket-text", rows: 8, readonly: true });
  paketFeld.value = paket;
  const zurueck = el("textarea", { id: "paket-zurueck", rows: 7, placeholder: "Hier einfügen, was der Chat daraus gemacht hat …" });
  const uebernehmen = el("button", { class: "knopf gross honig", type: "button" }, "Ins Tagebuch");
  const bericht = el("button", { class: "knopf gross leise", type: "button", hidden: true }, "Tagesbericht kopieren");
  const berichtAlsDatei = el("button", { class: "knopf gross leise", type: "button", hidden: true }, "Tagesbericht als Datei (Drive)");
  let gespeichert = null;
  uebernehmen.addEventListener("click", () => {
    const text = zurueck.value.trim();
    if (!text) {
      melden("Erst den Text aus dem Chat einfügen.");
      return;
    }
    const tag = tage[tage.length - 1];
    gespeichert = { id: "g-" + Date.now(), art: "tag", tag, datum: new Date().toISOString(), text, station: stationAm(tag)?.id || null };
    zustand.logbuch.push(gespeichert);
    for (const n of zustand.notizen) if (tage.includes(n.tag)) n.eingepackt = true;
    sichern();
    uebernehmen.hidden = true;
    bericht.hidden = false;
    berichtAlsDatei.hidden = false;
    melden("Im Tagebuch. Jetzt noch den Tagesbericht teilen?");
    heuteZeigen();
  });
  bericht.addEventListener("click", () => kopieren(tagesBericht(gespeichert.tag, gespeichert.text),
    "Kopiert. Jetzt in jeden Chat einfügen, den du heute Abend besuchst."));
  berichtAlsDatei.addEventListener("click", () => berichtDatei(gespeichert.tag, gespeichert.text));
  blattOeffnen([
    el("p", { class: "label" }, "Nyota · Tag einpacken"),
    el("h2", { id: "blatt-titel" }, "Dein Tag in Stichpunkten"),
    el("p", { class: "muted" }, "1. Kopieren und in deinen Claude-Chat einfügen. 2. Was zurückkommt, unten einfügen. 3. Ins Tagebuch."),
    paketFeld,
    el("button", { class: "knopf gross", type: "button", onclick: () => kopieren(paket, "Kopiert. Jetzt in deinen Chat einfügen.") }, "Kopieren"),
    el("label", { class: "label", for: "paket-zurueck" }, "Zurück aus dem Chat"),
    zurueck, uebernehmen, bericht, berichtAlsDatei
  ]);
});

// ---------------------------------------------------------------- Mietwagen

document.getElementById("auto-parken").addEventListener("click", () => {
  gpsStarten(false);
  if (!letztePosition) {
    melden("Noch kein Standort. Kurz warten und noch mal tippen.");
    return;
  }
  zustand.auto = { ort: letztePosition, zeit: new Date().toISOString(), station: reiseStand().station?.id || null };
  sichern();
  if (karte) {
    markerEntfernen("auto");
    markerSetzen(alleOrte().find((o) => o.id === "auto"));
  }
  melden("Gemerkt: Hier steht euer Auto.");
  heuteZeigen();
});

document.getElementById("auto-weg").addEventListener("click", () => {
  zustand.auto = null;
  sichern();
  markerEntfernen("auto");
  melden("Gute Fahrt!");
  heuteZeigen();
});

function autoZeigen() {
  const a = zustand.auto;
  document.getElementById("auto-weg").hidden = !a;
  const route = document.getElementById("auto-route");
  route.hidden = !a;
  if (!a) {
    document.getElementById("auto-stand").textContent = "Wenn ihr parkt: einmal tippen, dann findet ihr zurück.";
    return;
  }
  route.href = routeLink(a.ort, true);
  const weit = letztePosition ? ` · etwa ${Math.round(entfernung(letztePosition, a.ort) / 10) * 10} m von hier` : "";
  document.getElementById("auto-stand").textContent = `Geparkt um ${uhrzeit(a.zeit)}${weit}.`;
}

// ---------------------------------------------------------------- Wetter (Open-Meteo, ohne Konto)

const WETTER_TEXT = [[0, "klar"], [2, "heiter"], [3, "bewölkt"], [48, "neblig"], [57, "Niesel"], [67, "Regen"],
  [77, "Schnee"], [82, "Schauer"], [99, "Gewitter"]];

function wetterWort(code) {
  const treffer = WETTER_TEXT.find(([bis]) => code <= bis);
  return treffer ? treffer[1] : "";
}

async function wetterLaden(s) {
  const alt = zustand.wetter[s.id];
  if (alt && Date.now() - alt.geholt < 3600000) return alt;
  if (!navigator.onLine) return alt || null;
  const [lat, lon] = s.zentrum;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code` +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FCasablanca&forecast_days=3";
  try {
    const d = await (await fetch(url)).json();
    zustand.wetter[s.id] = { geholt: Date.now(), d };
    sichern();
    return zustand.wetter[s.id];
  } catch (e) {
    return alt || null;
  }
}

async function wetterZeigen(s) {
  const box = document.getElementById("wetter");
  const w = await wetterLaden(s);
  if (!w || !w.d || !w.d.daily) {
    box.hidden = true;
    return;
  }
  const { current, daily } = w.d;
  const tage = daily.time.map((t, i) => el("li", {},
    el("span", {}, i === 0 ? "Heute" : new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(new Date(t + "T12:00:00"))),
    el("span", {}, `${Math.round(daily.temperature_2m_min[i])}–${Math.round(daily.temperature_2m_max[i])}° · ${wetterWort(daily.weather_code[i])}` +
      (daily.precipitation_probability_max[i] >= 30 ? ` · Regen ${daily.precipitation_probability_max[i]} %` : ""))));
  box.hidden = false;
  box.replaceChildren(
    el("p", { class: "label" }, "Wetter · " + s.stadt),
    current ? el("p", { class: "wetter-jetzt" }, `${Math.round(current.temperature_2m)}° · ${wetterWort(current.weather_code)}`) : null,
    el("ul", { class: "licht" }, tage),
    el("p", { class: "muted klein-text" }, "Stand " + new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(w.geholt)) + " · Open-Meteo"));
}

// ---------------------------------------------------------------- Farbe des Tages

async function hauptfarbe(blob) {
  try {
    const bild = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = c.height = 48;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(bild, 0, 0, 48, 48);
    const px = g.getImageData(0, 0, 48, 48).data;
    const eimer = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, gr = px[i + 1] / 255, b = px[i + 2] / 255;
      const max = Math.max(r, gr, b), min = Math.min(r, gr, b), v = max, sat = max ? (max - min) / max : 0;
      if (v < 0.18 || sat < 0.22) continue; // Schatten und Grau zählen nicht
      let h = 0;
      if (max !== min) h = max === r ? ((gr - b) / (max - min)) % 6 : max === gr ? (b - r) / (max - min) + 2 : (r - gr) / (max - min) + 4;
      const k = Math.floor(((h * 60 + 360) % 360) / 15);
      const w = sat * v;
      Object.assign(eimer[k], { w: eimer[k].w + w, r: eimer[k].r + px[i] * w, g: eimer[k].g + px[i + 1] * w, b: eimer[k].b + px[i + 2] * w });
    }
    const best = eimer.reduce((a, b) => (b.w > a.w ? b : a));
    if (!best.w) return null;
    const hex = (x) => Math.round(x / best.w).toString(16).padStart(2, "0");
    return "#" + hex(best.r) + hex(best.g) + hex(best.b);
  } catch (e) {
    return null;
  }
}

function eigeneFarbenZeigen() {
  const farben = zustand.logbuch.filter((e) => e.farbe).slice(-48);
  const box = document.getElementById("eigene-farben");
  box.hidden = !farben.length;
  box.replaceChildren(el("p", { class: "label" }, "Deine Farben"),
    el("div", { class: "farbstreifen" }, farben.map((e) => el("span", { style: `background:${e.farbe}`, title: uhrzeit(e.datum) }))));
}

// ---------------------------------------------------------------- Taxi-Karte und Rechner

function taxiKarte(s) {
  blattOeffnen([
    el("p", { class: "label" }, "Zum Zeigen · " + s.stadt),
    el("p", { class: "taxi-gruss" }, "Bonjour !"),
    el("p", { class: "taxi-adresse", id: "blatt-titel" }, s.hotel.adresseFr || s.hotel.name),
    el("p", { class: "taxi-gruss" }, "Pouvez-vous nous emmener ici, s'il vous plaît ? Merci beaucoup !"),
    el("p", { class: "muted" }, "Taxis fahren nicht in die Medina hinein. Sie halten am nächsten Tor, den Rest geht ihr zu Fuß.")
  ], "taxi");
}

function rechnerBauen() {
  const kurs = () => Number(zustand.kurs) || KURS_STANDARD;
  const eur = el("input", { type: "number", inputmode: "decimal", id: "rechner-eur", placeholder: "Euro" });
  const mad = el("input", { type: "number", inputmode: "decimal", id: "rechner-mad", placeholder: "Dirham" });
  const kursFeld = el("input", { type: "number", inputmode: "decimal", step: "0.01", id: "rechner-kurs", value: kurs() });
  eur.addEventListener("input", () => { mad.value = eur.value ? (eur.value * kurs()).toFixed(0) : ""; });
  mad.addEventListener("input", () => { eur.value = mad.value ? (mad.value / kurs()).toFixed(2) : ""; });
  kursFeld.addEventListener("change", () => {
    zustand.kurs = Number(kursFeld.value) || null;
    sichern();
    if (eur.value) mad.value = (eur.value * kurs()).toFixed(0);
  });
  return el("div", { class: "rechner" },
    el("label", {}, "Euro", eur), el("label", {}, "Dirham", mad),
    el("label", { class: "breit" }, "1 € = … DH (vor Ort anpassen)", kursFeld));
}

// ---------------------------------------------------------------- Mehr

function reiseFormZeigen() {
  const form = document.getElementById("reise-form");
  const r = zustand.reise || STATIONEN.map(() => ({ von: "", bis: "" }));
  form.replaceChildren(...STATIONEN.map((s, i) =>
    el("div", { class: "station-daten" },
      el("fieldset", {},
        el("legend", {}, s.stadt),
        el("label", {}, "Ankunft", el("input", { type: "date", id: `von-${s.id}`, value: r[i].von })),
        el("label", {}, "Abreise", el("input", { type: "date", id: `bis-${s.id}`, value: r[i].bis }))))));
  form.append(el("button", { class: "knopf gross", type: "submit" }, "Reisedaten speichern"));
}

document.getElementById("reise-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = STATIONEN.map((s) => ({ von: document.getElementById(`von-${s.id}`).value,
    bis: document.getElementById(`bis-${s.id}`).value }));
  if (r.some((x) => !x.von || !x.bis)) {
    melden("Bitte bei jeder Stadt Ankunft und Abreise eintragen.");
    return;
  }
  zustand.reise = r;
  zustand.reiseSelbst = true;
  sichern();
  melden("Gespeichert.");
  heuteZeigen();
});

function mehrZeigen() {
  const box = document.getElementById("mehr-inhalt");
  const bloecke = INFOS.map((info) => el("details", { class: "block" },
    el("summary", {}, info.titel),
    el("div", { class: "infotext" },
      (info.absaetze || []).map((a) => el("p", {}, a)),
      info.liste ? el("ul", {}, info.liste.map((l) => el("li", {}, l))) : null,
      info.hinweis ? el("p", { class: "muted klein-text" }, info.hinweis) : null)));
  bloecke.splice(1, 0, el("details", { class: "block" },
    el("summary", {}, "Ein paar Sätze Darija"),
    el("div", { class: "saetze" }, SAETZE.map((s) => el("div", { class: "satz" }, el("b", {}, s.darija), el("span", {}, s.deutsch))))));
  bloecke.unshift(
    el("details", { class: "block" }, el("summary", {}, "Taxi-Karte"),
      el("div", { class: "knopfreihe" }, STATIONEN.map((s) =>
        el("button", { class: "knopf gross leise", type: "button", onclick: () => taxiKarte(s) }, "Zeigen: " + s.hotel.name)))),
    el("details", { class: "block" }, el("summary", {}, "Euro ↔ Dirham"), rechnerBauen()));
  if (typeof PREISE !== "undefined") {
    bloecke.splice(3, 0, el("details", { class: "block" }, el("summary", {}, "Faire Preise"),
      el("div", { class: "infotext" },
        el("ul", {}, PREISE.handeln.map((h) => el("li", {}, h))),
        el("div", { class: "preise" }, PREISE.preise.map((p) =>
          el("div", { class: "satz" }, el("b", {}, p.was + " · " + p.spanne), p.hinweis ? el("span", {}, p.hinweis) : null))),
        el("p", { class: "muted klein-text" }, "Richtwerte, Stand " + PREISE.stand + ". Vor Ort gilt, was vor Ort gilt."))));
  }
  if (!DEMO) {
    bloecke.push(el("details", { class: "block" }, el("summary", {}, "Demo ansehen"),
      el("div", { class: "infotext" },
        el("p", {}, "Zeigt die App mit einer Beispielreise, als wäre heute ein Tag in Fès. Dabei wird nichts gespeichert und nichts von deinen Daten angezeigt."),
        el("a", { class: "knopf gross leise", href: "#demo", onclick: () => setTimeout(() => location.reload(), 50) }, "Demo öffnen"))));
  }
  bloecke.push(el("details", { class: "block" },
    el("summary", {}, "Über diese App"),
    el("div", { class: "infotext" },
      el("p", {}, "Die Honig-App speichert alles Persönliche nur auf diesem Handy: Tagebuch, Fotos, besuchte Orte, Reisedaten. Es gibt keine Konten, keine Cookies und kein Tracking."),
      el("p", {}, "Die Kartenbilder kommen von OpenStreetMap, das Wetter von Open-Meteo. Dabei wird, wie bei jedem Abruf aus dem Netz, die IP-Adresse übertragen. Google Maps öffnet sich nur, wenn du selbst auf „Route“ tippst."),
      el("p", {}, "Die Post ist verschlüsselt und nur mit deinem persönlichen Link lesbar."),
      el("a", { class: "knopf gross leise", href: "https://uta-kaehler.de/rechtliches.html", target: "_blank", rel: "noopener" }, "Impressum und Datenschutz"))));
  box.replaceChildren(...bloecke);
}

// ---------------------------------------------------------------- Start

if (DEMO) {
  document.body.classList.add("demo");
  melden("Demo: erfundene Beispielreise. Nichts wird gespeichert.", { bleibt: true });
} else {
  reiseAusLink();
  schluesselAusLink();
  geheimLaden();
}
reiseFormZeigen();
mehrZeigen();
if (zustand.reise) document.getElementById("reisedaten").removeAttribute("open");
gehe("heute");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
