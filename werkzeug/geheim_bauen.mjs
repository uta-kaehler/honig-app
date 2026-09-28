// Verschlüsselt Reisedaten und die Post für die öffentliche App.
//
//   node werkzeug/geheim_bauen.mjs <klartext.json> <schluesseldatei>
//
// klartext.json:  { "reise": [{ "von": "2027-04-03", "bis": "2027-04-07" }, …], "post": [ … ] }
// Die Schlüsseldatei wird beim ersten Mal angelegt und muss AUSSERHALB der App liegen
// (sie gehört nie ins öffentliche Repository). Ergebnis: geheim.json neben index.html
// und der persönliche Link, der den Schlüssel enthält.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { webcrypto, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const [klartextPfad, schluesselPfad] = process.argv.slice(2);
if (!klartextPfad || !schluesselPfad) {
  console.error("Aufruf: node werkzeug/geheim_bauen.mjs <klartext.json> <schluesseldatei>");
  process.exit(1);
}
const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (resolve(schluesselPfad).startsWith(app)) {
  console.error("Die Schlüsseldatei darf nicht im App-Ordner liegen – der wird veröffentlicht.");
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
if (!existsSync(schluesselPfad)) writeFileSync(schluesselPfad, b64url(randomBytes(32)) + "\n");
const schluesselText = readFileSync(schluesselPfad, "utf8").trim();

const klartext = JSON.parse(readFileSync(klartextPfad, "utf8"));
const iv = randomBytes(12);
const schluessel = await webcrypto.subtle.importKey("raw", Buffer.from(schluesselText, "base64url"), "AES-GCM", false, ["encrypt"]);
const daten = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, schluessel, new TextEncoder().encode(JSON.stringify(klartext)));
writeFileSync(join(app, "geheim.json"), JSON.stringify({ v: 1, iv: b64url(iv), daten: b64url(daten) }) + "\n");

console.log(`geheim.json geschrieben: ${klartext.reise ? "Reisedaten, " : ""}${(klartext.post || []).length} Mal Post.`);
console.log("Persönlicher Link: <App-Adresse>/#k=" + schluesselText);
