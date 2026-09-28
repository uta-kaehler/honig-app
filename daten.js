// Honig-App · alle Inhalte an einer Stelle.
// Reisedaten stehen bewusst NICHT hier (die Datei ist öffentlich), sondern nur auf dem Handy.

const STATIONEN = [
  {
    id: "marrakesch",
    farbe: { name: "Rot", beiname: "die rote Stadt", hell: "#d0694b", tief: "#8f3624" },
    stadt: "Marrakesch",
    zentrum: [31.6258, -7.9891],
    zoom: 15,
    hotel: {
      name: "Unterkunft in Marrakesch",
      adresseFr: "(Adresse der Unterkunft)\nMarrakesch",
      lage: "In der Medina. Name und Adresse sind in der öffentlichen Fassung weggelassen.",
      anreise: "",
      ort: [31.6258, -7.9891],
      genau: false,
      aufwand: "Kein Auto bis zur Tür: Die Gassen der Medina sind zu eng.",
      achtung: ""
    },
    parken: [
      {
        name: "Parkplatz Riad Zitoun Jdid",
        ort: [31.62210, -7.98496],
        text: "Bewachter Parkplatz an der Rue Riad Zitoun el Jdid.",
        aufwand: "Etwa 6–8 Minuten zu Fuß bis zum Riad.",
        offen: "Mit Wächter. Preis vor Ort erfragen, üblich sind etwa 20–30 DH am Tag."
      },
      {
        name: "Parkplatz Place des Ferblantiers",
        ort: [31.61907, -7.98421],
        text: "Großer bewachter Platz an der Bab Mellah, falls der erste voll ist.",
        aufwand: "Etwa 10–12 Minuten zu Fuß bis zum Riad."
      }
    ]
  },
  {
    id: "fes",
    farbe: { name: "Braun", beiname: "Leder, Lehm und Kupfer", hell: "#b58550", tief: "#6f4e2a" },
    stadt: "Fès",
    zentrum: [34.0612, -4.9780],
    zoom: 15,
    hotel: {
      name: "Unterkunft in Fès",
      adresseFr: "(Adresse der Unterkunft)\nFès",
      lage: "In der Medina. Name und Adresse sind in der öffentlichen Fassung weggelassen.",
      anreise: "",
      ort: [34.0612, -4.9780],
      genau: false,
      aufwand: "Kein Auto bis zur Tür: Die Gassen der Medina sind zu eng.",
      achtung: ""
    },
    parken: [
      {
        name: "Parkplatz Batha",
        ort: [34.05940, -4.97909],
        text: "Bewachter Parkplatz an der Place Batha beim Museum Dar Batha.",
        aufwand: "2–3 Minuten zu Fuß bis zum Riad.",
        offen: "Rund um die Uhr bewacht und beleuchtet, etwa 20 DH für 24 Stunden.",
        achtung: "Einfahrt nur ungefähr eingezeichnet. Vor Ort nach „Parking Batha“ fragen."
      }
    ]
  },
  {
    id: "chefchaouen",
    farbe: { name: "Blau", beiname: "die blaue Stadt im Rif", hell: "#5b8ad0", tief: "#2f5a98" },
    stadt: "Chefchaouen",
    zentrum: [35.1695, -5.2600],
    zoom: 16,
    hotel: {
      name: "Unterkunft in Chefchaouen",
      adresseFr: "(Adresse der Unterkunft)\nChefchaouen",
      lage: "In der Medina. Name und Adresse sind in der öffentlichen Fassung weggelassen.",
      anreise: "",
      ort: [35.1695, -5.2600],
      genau: false,
      aufwand: "Kein Auto bis zur Tür: Die Gassen der Medina sind zu eng.",
      achtung: ""
    },
    parken: [
      {
        name: "Parkplatz Ras El Ma",
        ort: [35.17104, -5.25642],
        text: "Neuer Parkplatz an der Quelle Ras El Ma, mit Kameras, am nächsten zum Haus.",
        aufwand: "Etwa 3–5 Minuten bis zum Tor Bab El Onsar.",
        offen: "Um 20 DH.",
        achtung: "War nach den Unwettern Anfang 2026 zeitweise gesperrt. Vorher beim Gastgeber nachfragen."
      },
      {
        name: "Parkplatz Plaza el-Makhzen",
        ort: [35.1689, -5.2609],
        text: "Parken mit Wächtern an der Avenue Hassan II, beim Hotel Parador. Ausweichplatz.",
        offen: "Etwa 10–20 DH am Tag, bezahlt wird beim Wegfahren."
      }
    ]
  },
  {
    id: "tanger",
    farbe: { name: "Weiß und Meer", beiname: "weiße Häuser über der Meerenge", hell: "#4fa7ad", tief: "#286a70" },
    stadt: "Tanger",
    zentrum: [35.7862, -5.8105],
    zoom: 16,
    hotel: {
      name: "Unterkunft in Tanger",
      adresseFr: "(Adresse der Unterkunft)\nTanger",
      lage: "In der Medina. Name und Adresse sind in der öffentlichen Fassung weggelassen.",
      anreise: "",
      ort: [35.7862, -5.8105],
      genau: false,
      aufwand: "Kein Auto bis zur Tür: Die Gassen der Medina sind zu eng.",
      achtung: ""
    },
    parken: [
      {
        name: "Parkplatz Bab El Marsa",
        ort: [35.78531, -5.80884],
        text: "Großer bewachter Parkplatz an der Rue du Portugal, von der Stadt betrieben.",
        aufwand: "Etwa 5–8 Minuten bergauf bis zum Riad.",
        offen: "Etwa 40 DH pro Nacht.",
        achtung: "Das offizielle Ticket im Büro nehmen. Es gibt Berichte von falschen Kassierern."
      }
    ]
  }
];

// Unterwegs (Rif, Mittlerer Atlas) ist grün.
const FARBE_UNTERWEGS = { name: "Grün", hell: "#6f9a57", tief: "#44683a" };

// Die Orte selbst (Fotospots, Sehenswertes, Essen, Strecke) stehen in orte.js.

// Umschläge: erscheinen, wenn man an einem Ort ankommt, und bleiben, bis man sie öffnet.
// Schlüssel = Ort-id (auch Hotels: "hotel-fes" usw.). Wird später aus dem geheimen Ordner befüllt.
const UMSCHLAEGE = {};

const SPRUECHE = [
  "Wüstenlicht ist ehrlich – es zeigt nur, was da ist.",
  "Manchmal muss man sich verlaufen, um etwas zu finden.",
  "Die Gassen von Fès merken sich jeden Schritt, den wir dort gehen.",
  "Blau ist die Farbe, die am längsten bleibt, wenn man die Augen schließt.",
  "Reisen heißt, dem Zufall ein bisschen mehr zuzutrauen.",
  "Jeder Ort hat eine Uhrzeit, zu der er am ehrlichsten ist.",
  "Manche Erinnerungen brauchen keinen Beweis – nur einen Moment.",
  "Die Wüste kennt keine Eile. Wir dürfen sie uns abschauen.",
  "Ein Minarett im Abendlicht sagt mehr als jede Postkarte.",
  "Wir müssen nicht alles sehen. Nur das, was bleibt.",
  "Manchmal ist der Weg dahin schon die Geschichte, die man später erzählt.",
  "Der Fennek hört nachts am besten zu.",
  "Nicht jeder Ort will fotografiert werden. Manche wollen nur gespürt werden.",
  "Was wir heute sehen, gehört morgen zu uns.",
  "Kleine Wege sind oft die, an die man sich am längsten erinnert.",
  "Ich hab an etwas gedacht. Du auch?",
  "Links und rechts sind eindeutig überbewertet. Man kommt auch so an.",
  "Verpasste Abzweigung? Macht nichts. Hier ist auch gut.",
  "Lost in Buttons. Lost in Gassen. Zusammen vollständig."
];

const SAETZE = [
  { darija: "Salam", deutsch: "Hallo (kurz)" },
  { darija: "Salam alaykum", deutsch: "Guten Tag (höflich)" },
  { darija: "Shukran", deutsch: "Danke" },
  { darija: "La, shukran", deutsch: "Nein, danke – der wichtigste Satz im Souk" },
  { darija: "Afak", deutsch: "Bitte (wenn man um etwas bittet)" },
  { darija: "Bshal?", deutsch: "Wie viel kostet das?" },
  { darija: "Ghali bzaf", deutsch: "Zu teuer" },
  { darija: "Wakha", deutsch: "Okay, einverstanden" },
  { darija: "Smahli", deutsch: "Entschuldigung" },
  { darija: "Bslama", deutsch: "Tschüss" },
  { darija: "C'est combien ?", deutsch: "Französisch: Wie viel kostet das?" },
  { darija: "L'addition, s'il vous plaît", deutsch: "Französisch: Die Rechnung, bitte" }
];

// Infotexte für „Mehr“. Richtwerte, keine Gewähr – vor Ort gilt, was vor Ort gilt.
const INFOS = [
  {
    titel: "Geld und Trinkgeld",
    absaetze: [
      "Der Dirham (MAD) ist eine geschlossene Währung: Ihr bekommt ihn erst in Marokko, am Flughafen oder am Geldautomaten. Am besten gleich nach der Ankunft etwas Bargeld holen.",
      "In Hotels und größeren Restaurants geht oft Karte, in der Medina, im Souk und beim Parken fast nur Bargeld. Kleine Scheine und Münzen fürs Trinkgeld sammeln."
    ],
    liste: [
      "Café: ein paar Dirham liegen lassen",
      "Restaurant: etwa 10 %",
      "Gepäckträger: um 10–20 DH",
      "Parkwächter: um 10 DH tagsüber, nachts etwas mehr",
      "Guide oder Fahrer: Preis vorher ausmachen"
    ],
    hinweis: "Häufig genannte Richtwerte, keine Regel."
  },
  {
    titel: "Autofahren",
    absaetze: [
      "Tempo: Autobahn 120 km/h, Landstraße 100 km/h, in Orten meist 60 km/h, oft auch weniger ausgeschildert. Es wird viel geblitzt, auch mobil.",
      "Polizeikontrollen am Ortseingang sind normal: langsam ranfahren, freundlich bleiben, Papiere griffbereit.",
      "In die Medinas kommt man mit dem Auto nicht hinein. Parken am Rand, am besten auf bewachten Plätzen. Die Wächter tragen oft eine Weste.",
      "Kreisverkehre: Häufig hat Vorfahrt, wer hineinfährt. Einfach vorsichtig und mit Blickkontakt fahren."
    ],
    hinweis: "Stand der Recherche: September 2026."
  },
  {
    titel: "Freitag und Moscheen",
    absaetze: [
      "Freitagmittag ist Gebetszeit. Viele Läden in der Medina machen dann für ein paar Stunden zu.",
      "Die meisten Moscheen sind für Nicht-Muslime nicht zugänglich. Von außen schauen und fotografieren ist in Ordnung, am Eingang bitte nicht hineinfotografieren."
    ]
  },
  {
    titel: "Notfall",
    liste: [
      "Polizei (in Städten): 19",
      "Gendarmerie (außerhalb der Städte): 177",
      "Rettungsdienst und Feuerwehr: 15"
    ],
    hinweis: "Die Deutsche Botschaft ist in Rabat. Kontakt über auswaertiges-amt.de."
  }
];

// Richtwerte zum Handeln (Recherche September 2026, siehe quellen/preise.json)
const PREISE = {
 "stand": "September 2026",
 "handeln": [
  "Handeln gehört dazu und ist ein Gespräch, kein Kampf: Lächeln, Zeit nehmen, gern auch ein angebotenes Glas Tee annehmen.",
  "Frag erst nach dem Preis, wenn du ernsthaft interessiert bist. Nenne dann ein Gegenangebot bei etwa 40–50 % des ersten Preises und tastet euch langsam aufeinander zu.",
  "Ein freundliches „La, shukran“ (Nein, danke) und ruhiges Weitergehen ist erlaubt. Oft kommt dann der bessere Preis.",
  "Hat der Händler deinem Preis zugestimmt, gilt das Geschäft. Ein Rückzieher danach ist unhöflich.",
  "Mehrere Teile beim selben Händler bringen Rabatt. Kleine Scheine und Münzen in Dirham machen das Bezahlen leichter.",
  "Feste Preise gibt es bei Obst, Wasser, Taxameter und staatlichen Kooperativen (z. B. Ensemble Artisanal). Dort vorher schauen hilft als Preis-Kompass."
 ],
 "preise": [
  {
   "was": "Minztee im Café",
   "spanne": "10–15 DH",
   "hinweis": "In einfachen Cafés, z. B. in Chefchaouen oder Fès. An touristischen Plätzen und auf Dachterrassen in Marrakesch auch 20–30 DH."
  },
  {
   "was": "Frischer Orangensaft am Jemaa el-Fna",
   "spanne": "4–15 DH",
   "hinweis": "Die Quellen sind uneinig: früher einheitlich 4 DH, neuere Berichte nennen 5–15 DH. Ein Bericht von 2026 nennt sogar 40 DH plus Aufpreis für den To-go-Becher. Preis vorher fragen, auf „100 % Orange“ ohne Wasser achten."
  },
  {
   "was": "Einfaches Tajine-Essen",
   "spanne": "30–150 DH",
   "hinweis": "In Imbissen oder einfachen Lokalen ab ca. 30 DH, in normalen Restaurants 60–150 DH. Touristenlagen verlangen deutlich mehr. An den Garküchen am Jemaa el-Fna gibt es Gerichte für 30–50 DH."
  },
  {
   "was": "Flasche Wasser (1,5 l)",
   "spanne": "5–10 DH",
   "hinweis": "Im Laden oder Supermarkt meist 6 DH. Im Hotel oder im Touristen-Café 20–40 DH."
  },
  {
   "was": "Babouches (Lederpantoffeln)",
   "spanne": "80–150 DH",
   "hinweis": "Schlichtes Leder. Bestickte oder aufwendige Paare 200–350 DH, Premium bis 500 DH. Auf echtes Leder und genähte, nicht geklebte Sohle achten."
  },
  {
   "was": "Ledertasche (klein)",
   "spanne": "200–400 DH",
   "hinweis": "Große Taschen 400–800 DH. Gute Auswahl im Souk Cherratine in Marrakesch. Nähte und Innenfutter prüfen, echtes Leder riecht nach Leder, nicht nach Chemie."
  },
  {
   "was": "Leder-Pouf",
   "spanne": "400–800 DH",
   "hinweis": "Preis für die ungefüllte Hülle. Sie reist flach im Koffer mit und wird zu Hause gestopft."
  },
  {
   "was": "Arganöl (100 ml)",
   "spanne": "80–140 DH",
   "hinweis": "Speiseöl ca. 80–120 DH: aus gerösteten Kernen, dunkler, nussiger Duft. Kosmetiköl ca. 100–140 DH: hell, fast geruchlos. Oft wird gestrecktes Öl verkauft, eine Quelle hält sehr billiges Öl grundsätzlich für verdächtig (Richtwert dort: nicht unter 150 DH für 30 ml). Besser bei Frauenkooperativen kaufen, mit Zertifikat. Ranzig oder muffig riechendes Öl meiden."
  },
  {
   "was": "Gewürze (pro 100 g)",
   "spanne": "5–20 DH",
   "hinweis": "Kreuzkümmel, Paprika, Kurkuma usw. Die Mischung Ras el-Hanout kostet 30–60 DH pro 100 g. Im Touristen-Souk ist es oft teurer."
  },
  {
   "was": "Safran (pro Gramm)",
   "spanne": "15–70 DH",
   "hinweis": "Die Quellen sind uneinig: 15–40 DH, an Touristenständen 40–70 DH. Echter Safran färbt Wasser langsam goldgelb, die Fäden bleiben dabei rot. Sehr billiger „Safran“ ist oft gefälscht."
  },
  {
   "was": "Keramik: Schale oder Tajine (Fès/Safi)",
   "spanne": "20–200 DH",
   "hinweis": "Kleine Schalen ab 20 DH (in Werkstätten), Tajine-Töpfe ab ca. 80 DH, große Platten ab 200 DH. Meisterstücke aus Fès kosten bis 2.000 DH und mehr. Zum Kochen eine unglasierte oder lebensmittelechte Tajine nehmen, bemalte sind meist nur Deko."
  },
  {
   "was": "Teppich (klein, sehr grob)",
   "spanne": "300–1.000 DH",
   "hinweis": "Sehr grobe Schätzung, die Quellen gehen weit auseinander: ein kleiner Kelim ab ca. 300 DH, ein kleiner Knüpfteppich eher 750–1.000 DH. Mittlere Größen kosten 3.500–6.000 DH, alte Stücke deutlich mehr. Nicht unter Druck kaufen, auch wenn Tee serviert wird."
  },
  {
   "was": "Laterne/Lampe (Metall)",
   "spanne": "100–600 DH",
   "hinweis": "Mittelgroße Laternen aus gelochtem Messing. Kleine Hängelampen ab ca. 30 DH, große Stücke ab 800 DH. Messing ist schwerer und wertiger als lackiertes Blech."
  },
  {
   "was": "Schal/Tuch",
   "spanne": "40–100 DH",
   "hinweis": "Baumwolle. Einfache Berber-Tücher gibt es schon ab 10–40 DH, Seide ca. 70 DH und mehr. „Kaktusseide“ ist oft falsch deklariert, viele Tücher kommen aus Indien. Als Ziel etwa 40 % des ersten Preises ansetzen."
  },
  {
   "was": "Petit Taxi in der Stadt (Taxameter)",
   "spanne": "7–30 DH",
   "hinweis": "Mindestpreis 7 DH am Tag und 10 DH nachts. Normale Stadtfahrten kosten 20–30 DH. Nach 20 Uhr gilt meist ein Aufschlag von 50 % (eine Quelle sagt, in Marrakesch gebe es keinen). Auf „Compteur, s'il vous plaît“ bestehen."
  },
  {
   "was": "Hammam (einheimisch)",
   "spanne": "10–80 DH",
   "hinweis": "Die Quellen sind uneinig: Eintritt 10–40 DH, anderswo 40–80 DH. Peeling und Einseifen kosten je ca. 20 DH extra. Seife, Handschuh und Handtuch selbst mitbringen."
  },
  {
   "was": "Hammam (Spa/Riad)",
   "spanne": "150–990 DH",
   "hinweis": "Einfachere Touristen-Hammams ab ca. 150–200 DH, Pakete in Riads der Mittelklasse 290–990 DH. Palast-Spas wie La Mamounia kosten 1.300 DH und mehr."
  },
  {
   "was": "Offizieller Guide (halber Tag)",
   "spanne": "150–400 DH",
   "hinweis": "Pro Gruppe, nicht pro Person. In Fès meist 200–300 DH. Lizenzierte Guides tragen einen Ausweis. Über das Riad oder das Touristenbüro buchen und Shopping-Stopps vorher ausschließen."
  },
  {
   "was": "Parkwächter (Gardien)",
   "spanne": "2–10 DH",
   "hinweis": "In normalen Straßen am Tag ca. 2 DH, über Nacht ca. 3 DH, in Touristenlagen 5–10 DH. Wird beim Wegfahren gezahlt, immer in Dirham. Offizielle Parkplätze haben oft feste Tarife."
  }
 ]
};
const KURS_STANDARD = 10.9;
