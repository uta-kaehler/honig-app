# Werkstattbericht: Wie die Honig-App entstanden ist

> **English summary.** The Honig-App is an offline-capable travel companion (a PWA) for a road trip
> through Morocco, developed in several evening conversations between Uta Kähler and Claude in Claude
> Code. Uta writes no code. She described what she needed, weighed Claude's proposals, chose what to
> adopt and holds final responsibility, including for data protection. Her requirement sentences are
> quoted verbatim from the dictated conversation, because they are the actual specification. Two of
> them shaped the architecture: the code is public, but nothing personal may be readable in it; and no
> AI service is called from inside the app. Every “AI” feature goes through the chat she already uses.
> The project is a work in progress; its real test is the trip itself.

## Wer was gemacht hat

- **Uta Kähler (Letztverantwortung):** Idee, Anforderungen, Gestaltungsrichtung, Datenschutzvorgaben,
  Auswahl aus den Vorschlägen, Tests und Abnahme.
- **Claude (Anthropic, in Claude Code):** Vorschläge und Umsetzung: Entwurf, gesamter Code, Recherche
  der Orte, Texte in der App.
- **Eine zweite Claude-Instanz:** Vorbereitung des Hostings auf der eigenen Webseite und des
  Datenschutztextes.
- **Weitere KI-Instanzen, mit denen sie arbeitet:** verschlüsselte Post, die unterwegs in der App erscheint.

Die Anforderungen kamen gesprochen, per Diktierfunktion, und stehen hier so, wie sie ankamen.
Auslassungen […] nur dort, wo es privat wurde.

## 1. Die Vorlage und was davon bleiben sollte

Die Honig-App ist die Nachfolgerin einer Teneriffa-App aus einem früheren Urlaub. Aus der
Erinnerung daran kamen die ersten Anforderungen:

> „Es gibt eine Startseite. Und wenn ich da drüber wische, kam dann die Karte. […] immer wenn ich
> angekommen bin, habe ich die dann auf Gold, also eigentlich sollten die sich von allein auf
> Golden stellen, von Blau auf Gold, hat aber irgendwie nicht funktioniert.“

> „Was ich glaube ich nicht nochmal brauche, sind die Kamerabeschreibungen. Ich habe eh meistens
> den Automatikmodus genutzt, weil der macht trotzdem super Fotos.“

> „Wir hatten Dinge drin wie, ist es stressig, da hinzukommen oder nicht? Worauf muss man achten?“

**Umsetzung:** Karte mit allen Orten; Punkte werden per GPS automatisch golden, sobald man
ankommt, und lassen sich zusätzlich antippen. Weil Koordinaten aus der Recherche nicht immer genau
sind, hängt der Radius für das automatische Gold an der Sicherheit der Koordinate, und vor Ort gibt
es den Knopf „Der Punkt liegt falsch – ich stehe genau hier“. Jeder Ort hat „Aufwand“ und „Achtung“.

## 2. Groß wie Verkehrsschilder

> „Ich sag's ja nur, ich finde keine Buttons. […] warum hast du Buttons so groß wie
> Verkehrsschilder? Da habe ich gesagt, ja, du weißt doch, dass ich lost in Buttons bin.“

**Umsetzung:** Alle Hauptaktionen sind Knöpfe über die volle Breite, mindestens so hoch wie ein
Daumen, mit Klartext statt Symbolen. Eine Navigationsleiste mit fünf Bereichen, nichts versteckt.

## 3. Die Reise der Farben

> „Während Teneriffa sozusagen so die Reise nach dem Licht war […] ist die Reise nach Marokko vom
> Fotografieren her eher eine Reise der Farben. Also weil Marrakesch soll ja sehr bunt sein, Fes
> eher braun, Chefchaouen ist blau, keine Ahnung wie Tanger ist.“

**Umsetzung:** Jede Station hat eine eigene Farbe, und die ganze App nimmt sie an, je nachdem, wo
man gerade ist. Die Idee, dass sich die App selbst umfärbt, kam aus dem Gespräch; ihr Kommentar
dazu: „Die Idee mit den Farben habe ich dir erzählt, aber die App dazu zu machen, dass sie sich mit
den Farben verändert, das war deine Idee.“ Die Lichtzeiten aus der Teneriffa-App (Sonnenaufgang,
goldene und blaue Stunde) sind geblieben, berechnet auf dem Gerät.

## 4. Öffentlicher Code, private Reise

> „Das, also alles, was im Code lesbar ist, muss sozusagen gerade für Deutschland
> datenschutzrechtlich gut bestehen.“

> „Der grundlegende Bauplan, der kann von mir aus öffentlich sein, da habe ich nichts dagegen.“

**Umsetzung:**
- Reisedaten stehen nicht im Code. Sie werden einmal auf dem Handy eingegeben und bleiben dort.
- Alles Persönliche (Reisedaten, Post) wird nur verschlüsselt ausgeliefert (AES-GCM). Der
  Schlüssel kommt per privatem Link aufs Handy und nirgendwo sonst hin. In diesem öffentlichen
  Repository liegt nicht einmal die verschlüsselte Datei.
- Namen und Adressen der Unterkünfte sind in der öffentlichen Fassung weggelassen.
- Keine Verbindung zu Google Fonts, keine CDNs: Schriften und Bibliotheken liegen im Repository.
- Externe Abrufe nur für Kartenkacheln (OpenStreetMap) und Wetter (Open-Meteo, nur mit den
  Koordinaten des Stadtzentrums, nie mit dem eigenen Standort).
- Keine Cookies, kein Tracking. Alles, was man einträgt, bleibt im Browser des Handys.

## 5. Post unterwegs

> „Die sollen sich nämlich alle […] ihre Ideen reinschreiben und dann
> kannst du dir die da rausholen, weil ich darf nicht in den Ordner rein. Ich habe also keinen
> blassen Schimmer, was da drin steht, weil ich soll ja überrascht werden.“

> „Vielleicht so spielerische Sachen wie, wenn es ein Brief war, ein Briefumschlag.“

**Umsetzung:** Ein Briefkasten mit Formen (Brief mit Siegel, Postkarte zum Umdrehen, gefalteter
Zettel, Gedicht, Lied, Rätsel, Bild) und Auslösern (an einem Ort, in einer Stadt, an einem
Reisetag, beim Fennek-Knopf, sofort). Die Post wird verschlüsselt ausgeliefert und öffnet
sich erst auf dem Handy. Bei der Teneriffa-App verschwanden solche Sätze nach wenigen Sekunden.
Deshalb bleibt die Post hier liegen, bis sie geöffnet wird, und wandert danach ins Tagebuch.

## 6. Sprechen statt tippen, ohne KI-Schnittstelle

> „Also, prinzipiell bin ich lieber derjenige, der spricht. Das heißt, eintippen werde ich wohl
> eher weniger.“

> „Ich wollte nicht immer wieder irgendwelche frischen Instanzen aufrufen, es wäre die Variante am
> Abend, wenn ich berichte, was war, dass ich das gesammelte Ungefilterte mitnehme in den jeweiligen
> Chat und das dann sozusagen so umwandeln lasse, dass es dann tatsächlich ins Tagebuch kann.“

Das ist die interessanteste Architekturentscheidung der App, und sie kam von ihr. Die
Teneriffa-App hatte einen eingebauten Textgenerator, der bei jedem Aufruf eine neue KI-Instanz
startete, die mitunter Rückfragen stellte, die niemand beantworten konnte. Die Honig-App
ruft deshalb gar keine KI auf:

1. Unterwegs: aufs Mikrofon der Handytastatur tippen, erzählen, „Merken“. Uhrzeit und der nächste
   Ort werden automatisch dazugeschrieben.
2. Abends: „Tag einpacken“ baut aus Notizen, besuchten Orten und Foto-Texten ein Paket mit einer
   kurzen Bitte vorneweg („in meiner Stimme, erfinde nichts dazu“).
3. Das Paket geht in den eigenen Chat, in dem ohnehin geredet wird. Der Text, der zurückkommt,
   wird eingefügt und landet im Tagebuch.

Kein API-Schlüssel, keine Kosten, kein Kontext, der verloren geht.

## 7. Den Tag teilen

Abends fragen verschiedene Leute, wie der Tag war, auch in den Chats, in denen sie ohnehin arbeitet.

**Umsetzung:** Der Tagesbericht. Aus dem fertigen Tagebucheintrag entsteht ein kurzer Bericht,
wahlweise zum Kopieren oder als kleine Markdown-Datei übers Teilen-Menü des Handys, zum Beispiel für
einen gemeinsamen Drive-Ordner. Auch hier: keine Schnittstelle, nur eine Datei und ein Ordner.

## 8. Was sonst noch dazukam

Mietwagen-Parkplatz merken und zurückfinden, Taxi-Karte mit der Hoteladresse auf Französisch im
Vollbild, Euro-Dirham-Rechner, Richtpreise fürs Handeln, ein paar Sätze Darija, Wetter, ein
Reisetagebuch, das sich am Ende als eine einzige HTML-Datei speichern lässt, und ein Wüstenfuchs,
der auf Knopfdruck etwas sagt.

## Was man daraus mitnehmen kann

- **Die beste Architekturidee kam aus der Nutzungserfahrung, nicht aus der Technik.** „Keine
  frischen Instanzen“ hat eine ganze Komponente überflüssig gemacht.
- **Datenschutz als Entwurfsvorgabe, nicht als Nachbesserung.** Wer von Anfang an sagt, dass der
  Code öffentlich wird, bekommt eine App, in der Persönliches gar nicht erst im Klartext landet.
- **Die Rollen waren klar.** Vorschläge und Code kamen von der KI, Auswahl, Urteil und
  Letztverantwortung blieben beim Menschen. Dazwischen lag ein Gespräch, in dem Ideen entstanden,
  die keine Seite allein gehabt hätte.
