"""Baut orte.js aus den Recherche-Dateien in quellen/*.json.

Aufruf (im Ordner honig-app):  python3 werkzeug/orte_bauen.py

Die Koordinaten stammen aus Recherche ohne Kartenzugriff. Deshalb wird
"hoch" hier auf "mittel" gedeckelt; genau wird ein Punkt erst, wenn er vor
Ort in der App korrigiert wurde.
"""
import json
from pathlib import Path

HIER = Path(__file__).resolve().parent.parent
FELDER = ["id", "art", "station", "name", "ort", "ortSicher", "text", "licht", "offen",
          "aufwand", "achtung", "highlight", "info", "quelle"]
STATIONEN = {"marrakesch", "fes", "chefchaouen", "tanger"}
ARTEN = {"foto", "sehen", "essen", "strecke"}

orte, ids = [], set()
for datei in sorted(d for d in (HIER / "quellen").glob("*.json") if d.name != "preise.json"):
    for o in json.loads(datei.read_text(encoding="utf-8")):
        fehler = []
        if o.get("id") in ids:
            fehler.append("doppelte id")
        if o.get("art") not in ARTEN:
            fehler.append(f"art {o.get('art')!r}")
        if o.get("station") not in STATIONEN:
            fehler.append(f"station {o.get('station')!r}")
        lat, lon = (o.get("ort") or [None, None])[:2]
        if not (isinstance(lat, (int, float)) and 27 < lat < 36.5 and -13.5 < lon < -1):
            fehler.append(f"ort {o.get('ort')!r} liegt nicht in Marokko")
        if fehler:
            raise SystemExit(f"{datei.name}: {o.get('id')}: " + ", ".join(fehler))
        ids.add(o["id"])
        if o.get("ortSicher") == "hoch":
            o["ortSicher"] = "mittel"
        if isinstance(o.get("quelle"), str):
            o["quelle"] = [o["quelle"]]
        orte.append({k: o[k] for k in FELDER if o.get(k) not in (None, "", False, [])})

kopf = ("// Automatisch erzeugt aus quellen/*.json mit werkzeug/orte_bauen.py – bitte dort ändern.\n"
        "// Felder: id, art, station, name, ort, ortSicher, text, licht, offen, aufwand, achtung, highlight, info, quelle\n")
(HIER / "orte.js").write_text(kopf + "const ORTE = " + json.dumps(orte, ensure_ascii=False, indent=1) + ";\n",
                              encoding="utf-8")
zaehlung = {}
for o in orte:
    zaehlung[o["station"]] = zaehlung.get(o["station"], 0) + 1
print(f"{len(orte)} Orte geschrieben:", zaehlung)
