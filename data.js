/*
  Inhoud van de stakeholdermap van Star Wars Xperience.

  De pagina bouwt zichzelf op uit dit bestand. Pas hier teksten aan en
  ververs de pagina. Laat de aanhalingstekens en de komma's staan.

  Documenten staan in documenten.js, de planeten in planeten.js en de manen per
  planeet in voortgang.js. Die drie werkt de pagina zelf bij als het team in de
  editor (editor.html) iets toevoegt of verwijdert.

  Hoe het in elkaar zit:
  - Elke stakeholder staat in één kwadrant (het veld "kwadrant" verwijst
    naar een "id" uit de lijst kwadranten).
  - Elke stakeholder verwijst met "plan" naar een rij uit het plan van
    aanpak. Meerdere stakeholders mogen naar dezelfde rij verwijzen.
  - Een rij met "open: true" is nog niet ingevuld. Vul de vier velden in
    en haal "open: true" weg zodra de rij af is.
*/

window.STAKEHOLDERMAP = {
  project: {
    naam: "Star Wars Xperience",
    ondertitel: "Stakeholdermap, plan van aanpak en voortgang",
    /* Bij Datum toont "vandaag" steeds de datum van vandaag. Een vaste datum kan ook: "07-10-2026". */
    gegevens: [
      { label: "Namen", waarde: "Elvin Spooren, Stan Geldof en Coen Geldof" },
      { label: "Datum", waarde: "vandaag" },
      { label: "Opleiding", waarde: "Smart Media Production, HvA, blok 5 en 6" }
    ],
    voettekst: "Smart Media Production, Hogeschool van Amsterdam. Studiejaar 2026-2027."
  },

  /*
    Beelden. "uitsnede" is het deel van het plaatje dat getoond wordt:
    [links, boven, rechts, onder] in pixels. Laat "uitsnede" weg om het hele
    plaatje te tonen, of haal een regel weg om dat beeld niet te gebruiken.
    - logo: vervangt in de titel de woorden die bij "vervangt" staan.
    - kop en voet: hologrammen van schepen. Dit zijn uitgesneden plaatjes met
      een doorzichtige achtergrond, gemaakt van de beelden in de map
      Afbeeldingen. Een ander plaatje moet dus ook een doorzichtige achtergrond
      hebben.
  */
  beelden: {
    logo: { bestand: "beeld/star-wars-logo.webp", vervangt: "Star Wars", uitsnede: [41, 102, 918, 477] },
    kop: { bestand: "beeld/hologram-schepen.png" },
    voet: { bestand: "beeld/hologram-x-wing.png" },
    logoHologram: { bestand: "beeld/hologram-logo.png" }
  },

  /*
    Opslag van documenten. Staat de site op GitHub Pages, dan vindt de pagina
    de repository zelf en kun je dit leeg laten. Staat hij ergens anders, vul
    dan de eigenaar en de repository in. "map" is de map in de repository waar
    index.html staat; leeg betekent de hoofdmap.
  */
  github: { eigenaar: "", repository: "", branch: "", map: "" },

  weergaven: [
    {
      id: "kaart",
      tab: "Stakeholdermap",
      intro: "Kies een stakeholder om te zien hoe we die betrokken houden."
    },
    {
      id: "plan",
      tab: "Plan van aanpak",
      intro: "Hoe we elke stakeholder betrokken houden, en waarvoor we ze nodig hebben."
    },
    {
      id: "voortgang",
      tab: "Voortgang",
      intro: "Kies een planeet om de voortgang van dat onderdeel te volgen."
    }
  ],

  /*
    Voortgang: de planeten zelf (elk onderdeel van het project) staan in
    planeten.js, de manen eromheen in voortgang.js. Beide werkt de editor bij.

    De plaatjes voor planeten en manen staan in de map beeld/planeten. Beschikbaar:
    coruscant, alderaan, chandrila, corellia, naboo, bespin, cato-neimoidia,
    kamino, kashyyyk, dathomir, ryloth, dagobah, tatooine, geonosis, lothal.
    Manen krijgen een plaatje uit de planeten die niet al op de sterrenkaart staan.
  */
  planeetbeelden: [
    "coruscant", "alderaan", "chandrila", "corellia", "naboo",
    "bespin", "cato-neimoidia", "kamino", "kashyyyk", "dathomir",
    "ryloth", "dagobah", "tatooine", "geonosis", "lothal"
  ],

  assen: {
    invloed: { naam: "Invloed", laag: "laag", hoog: "hoog" },
    belang: { naam: "Belang", laag: "laag", hoog: "hoog" }
  },

  /* invloed en belang zijn elk "laag" of "hoog"; dat bepaalt de plek op de kaart. */
  kwadranten: [
    {
      id: "tevreden-houden",
      naam: "Tevreden houden",
      invloed: "hoog",
      belang: "laag",
      aanpak: "Hou tevreden, val niet te veel lastig."
    },
    {
      id: "nauw-betrekken",
      naam: "Nauw betrekken",
      invloed: "hoog",
      belang: "hoog",
      aanpak: "Werk hier goed mee samen."
    },
    {
      id: "monitoren",
      naam: "Monitoren",
      invloed: "laag",
      belang: "laag",
      aanpak: "Af en toe checken is genoeg."
    },
    {
      id: "op-de-hoogte-houden",
      naam: "Op de hoogte houden",
      invloed: "laag",
      belang: "hoog",
      aanpak: "Hou goed op de hoogte."
    }
  ],

  /*
    Bij "hologram" kies je wat het paneel als hologram projecteert:
    "persoon", "duo", "trio", "groep" of "logo" (het Star Wars-logo).
    Zonder "hologram" verschijnt er geen projectie.
  */
  stakeholders: [
    {
      id: "docenten-coach",
      naam: "Docenten en coach",
      toelichting: "",
      kwadrant: "tevreden-houden",
      plan: "docenten-coach",
      hologram: "groep"
    },
    {
      id: "licentiehouder",
      naam: "Licentiehouder Star Wars",
      toelichting: "",
      kwadrant: "tevreden-houden",
      plan: "licentiehouder",
      hologram: "logo"
    },
    {
      id: "mark-vernon",
      naam: "Mark en Vernon",
      toelichting: "Opdrachtgevers",
      kwadrant: "nauw-betrekken",
      plan: "mark-vernon",
      hologram: "duo"
    },
    {
      id: "projectgroep",
      naam: "De projectgroep",
      toelichting: "Stan, Coen en Elvin",
      kwadrant: "nauw-betrekken",
      plan: "team",
      hologram: "trio"
    },
    {
      id: "technisch-expert",
      naam: "Technisch expert Jaap Evenhuis",
      toelichting: "HvA-docent, expert in immersive",
      kwadrant: "monitoren",
      plan: "technisch-expert",
      hologram: "persoon"
    },
    {
      id: "bezoekers",
      naam: "De bezoekers",
      toelichting: "",
      kwadrant: "op-de-hoogte-houden",
      plan: "bezoekers-doelgroep",
      hologram: "groep"
    },
    {
      id: "doelgroep",
      naam: "De doelgroep",
      toelichting: "",
      kwadrant: "op-de-hoogte-houden",
      plan: "bezoekers-doelgroep",
      hologram: "groep"
    },
    {
      id: "testpubliek",
      naam: "Testpubliek",
      toelichting: "",
      kwadrant: "op-de-hoogte-houden",
      plan: "bezoekers-doelgroep",
      hologram: "groep"
    }
  ],

  plan: {
    titel: "Plan van aanpak",
    kolomStakeholder: "Stakeholder",
    kolommen: [
      { id: "fase", vraag: "In welke fase heb je ze nodig?" },
      { id: "producten", vraag: "Aan welke producten gekoppeld?" },
      { id: "samenwerken", vraag: "Hoe ga je samenwerken en feedback ophalen?" },
      { id: "contact", vraag: "Hoe hou je contact?" }
    ],
    rijen: [
      {
        id: "mark-vernon",
        stakeholder: "Mark en Vernon",
        fase: "Kick-off, tussenpresentatie, eindpitch",
        producten: "Creative brief, prototype, pitch",
        samenwerken: "Feedback na pitches en per mail",
        contact: "Via mail en de pitches"
      },
      {
        id: "team",
        stakeholder: "Team",
        fase: "In alle fases",
        producten: "Samenwerkingsovereenkomst, 360-graden feedback",
        samenwerken: "Trello en de lessen",
        contact: "WhatsApp"
      },
      {
        id: "docenten-coach",
        stakeholder: "Docenten en coach",
        fase: "Bij de briefings en feedbackmomenten",
        producten: "Deliverables met feedback",
        samenwerken: "Via de les",
        contact: "Via de les"
      },
      {
        id: "bezoekers-doelgroep",
        stakeholder: "Bezoekers en doelgroep",
        fase: "Fieldresearch en test van het prototype",
        producten: "Prototype",
        samenwerken: "Bij de test",
        contact: "Bij het prototype en het interview"
      },
      {
        id: "licentiehouder",
        stakeholder: "Licentiehouder",
        fase: "Aan het einde, als alles af is",
        producten: "Het volledige concept",
        samenwerken: "Na een pitch van de opdrachtgevers",
        contact: "Via Mark en Vernon"
      },
      {
        id: "technisch-expert",
        stakeholder: "Technisch expert Jaap Evenhuis",
        open: true
      }
    ]
  },

  /* Vaste teksten van de pagina zelf. */
  teksten: {
    niveaus: {
      invloed: { hoog: "Veel invloed", laag: "Weinig invloed" },
      belang: { hoog: "Veel belang", laag: "Weinig belang" }
    },
    sluiten: "Sluiten",
    weergave: "Weergave",
    details: "Details van de stakeholder",
    staatOnder: "Staat in het plan van aanpak onder",
    open: "Nog in te vullen",
    openUitleg: "Deze stakeholder staat op de kaart, maar nog niet in het plan van aanpak.",

    documenten: {
      titel: "Documenten",
      leeg: "Nog geen documenten.",
      aantal: { een: "1 document", meer: "{aantal} documenten" },
      toegevoegd: "toegevoegd op {datum}",
      link: "Link",
      bestand: "Bestand",
      toevoegen: "Document toevoegen",
      veldTitel: "Titel",
      veldSoort: "Soort document",
      veldBestand: "Bestand",
      veldLink: "Link",
      maximum: "Maximaal 25 MB. Is het bestand groter, zet het dan elders en voeg een link toe.",
      opslaan: "Toevoegen",
      annuleren: "Annuleren",
      bezig: "Bezig met toevoegen",
      klaarBestand: "Toegevoegd. Het bestand staat over ongeveer een minuut online voor iedereen.",
      klaarLink: "Toegevoegd. De link staat over ongeveer een minuut online voor iedereen.",
      verwijderen: "Verwijderen",
      verwijder: "Verwijder {titel}",
      zeker: "Dit document verwijderen?",
      ja: "Ja, verwijderen",
      bezigVerwijderen: "Bezig met verwijderen",
      verwijderd: "Verwijderd.",
      foutTitel: "Geef het document een titel.",
      foutBestand: "Kies een bestand.",
      foutGroot: "Dit bestand is groter dan 25 MB. Zet het elders en voeg een link toe.",
      foutLink: "Vul een link in die begint met https://."
    },

    voortgang: {
      kaart: "Sterrenkaart met de onderdelen van het project",
      terug: "Terug naar de sterrenkaart",
      titel: "Manen",
      stelsel: "{naam} met zijn manen",
      geenManen: "Nog geen manen",
      nietGestart: "Nog niet gestart",
      bezig: "Bezig",
      afgerond: "Afgerond",
      telling: "{klaar} van {totaal} manen afgerond",
      kort: "{klaar} van {totaal}",
      leeg: "Deze planeet heeft nog geen manen.",
      klaar: "Afgerond",
      open: "Nog te doen",
      media: "Video's",
      invloed: "Heeft invloed op",
      geenInvloed: "Voor dit onderdeel zijn nog geen stakeholders opgegeven.",
      introPlaneet: "Klik op een maan om dichterbij te komen. Een maan licht op zodra het onderdeel af is.",
      introPlaneetLeeg: "Deze planeet heeft nog geen manen. Het team voegt ze toe zodra er onderdelen zijn.",
      introMaan: "Alles wat bij dit onderdeel hoort.",
      maanVan: "Onderdeel van {planeet}",
      maanStelsel: "{titel}, onderdeel van {planeet}",
      terugNaarPlaneet: "Terug naar {planeet}",
      afvinken: "Dit onderdeel is af",
      toonOpKaart: "Toon {naam} op de stakeholdermap",
      veldMaan: "Nieuwe maan",
      maanToevoegen: "Maan toevoegen",
      verwijder: "Verwijder maan {titel}",
      foutMaan: "Geef de maan een naam.",
      bezigOpslaan: "Bezig met opslaan",

      geenPlaneten: "Er zijn nog geen planeten op de sterrenkaart.",
      geenPlanetenEditor: "Er zijn nog geen planeten op de sterrenkaart. Voeg de eerste toe.",
      planeetToevoegen: "Planeet toevoegen",
      planeetAanpassen: "Planeet aanpassen",
      planeetVerwijderen: "Planeet verwijderen",
      planeetOpslaan: "Opslaan",
      beheerPlaneet: "Planeet beheren",
      beheerMaan: "Maan beheren",
      maanVerwijderen: "Maan verwijderen",
      veldPlaneetNaam: "Naam van de planeet",
      veldBeeld: "Plaatje",
      beeldGeen: "Draadbol",
      veldStakeholders: "Heeft invloed op",
      stakeholdersHulp: "Vink de stakeholders aan op wie dit onderdeel invloed heeft. Je kunt ze ook leeg laten.",
      planeetZeker: "Planeet {naam} verwijderen?",
      maanZeker: "Maan {titel} verwijderen?",
      verliest: "Daarmee verdwijnen ook {delen}.",
      maanEen: "1 maan",
      maanMeer: "{aantal} manen",
      planeetToegevoegd: "Planeet {naam} is toegevoegd. Hij staat over ongeveer een minuut online voor iedereen.",
      planeetOpgeslagen: "Opgeslagen. De wijziging staat over ongeveer een minuut online voor iedereen.",
      planeetVerwijderd: "Planeet {naam} is verwijderd.",
      maanVerwijderd: "Maan {titel} is verwijderd.",
      foutPlaneetNaam: "Geef de planeet een naam.",
      foutPlaneetLetters: "Gebruik letters of cijfers in de naam.",
      foutPlaneetBestaat: "Er is al een planeet met deze naam.",
      foutPlaneetWeg: "Deze planeet bestaat niet meer. Misschien heeft een teamgenoot hem verwijderd."
    },

    team: {
      knop: "Verbinden met GitHub",
      knopVerbonden: "Verbonden als {naam}",
      titel: "Verbinden met GitHub",
      editorNaam: "Editor",
      balkUit: "Dit is de editor. Verbind met GitHub om planeten, manen en documenten toe te voegen of te verwijderen.",
      balkAan: "Je bewerkt als {naam}. Wat je wijzigt staat na ongeveer een minuut online voor bezoekers.",
      bezoekerLink: "Bezoekersweergave",
      editorLink: "Editor voor het team",
      uitleg: "Als teamlid kun je in de editor planeten, manen en documenten toevoegen en verwijderen. Alles wordt opgeslagen in de GitHub-repository {repository} en is daarna voor iedereen zichtbaar.",
      geenRepository: "Bewerken werkt zodra de site op GitHub staat. Staat hij ergens anders, vul dan in data.js bij github de eigenaar en de repository in.",
      veldSleutel: "GitHub-toegangssleutel",
      hulp: "Maak op GitHub een fine-grained token voor alleen deze repository, met bij Contents het recht Read and write. Ben je medewerker en geen eigenaar van de repository, maak dan een klassiek token met alleen het recht public_repo. De sleutel blijft in deze browser.",
      hulpLink: "Een sleutel maken op GitHub",
      verbinden: "Verbinden",
      bezig: "Bezig met verbinden",
      sluiten: "Sluiten",
      verbonden: "Verbonden als {naam} met {repository}.",
      verbondenUitleg: "Open een stakeholder om een document toe te voegen. Bij Voortgang voeg je planeten toe, en in een planeet voeg je manen toe, vink je ze af of verwijder je ze.",
      verbreken: "Verbinding verbreken",
      teamlid: "teamlid",
      foutLeeg: "Plak je toegangssleutel in het veld.",
      foutSleutel: "De sleutel is ongeldig of verlopen. Maak een nieuwe sleutel en verbind opnieuw.",
      foutRechten: "De sleutel mag hier niet schrijven. Geef hem bij Contents het recht Read and write (een klassiek token: public_repo).",
      foutRepository: "De repository is niet gevonden, of de sleutel heeft er geen toegang toe.",
      foutSite: "In de repository is data.js niet gevonden. Vul in data.js bij github de map in waar index.html staat.",
      foutBezet: "GitHub weigerde de wijziging. Probeer het opnieuw.",
      foutNetwerk: "Geen verbinding met GitHub. Controleer je internet en probeer het opnieuw.",
      foutLezen: "Een gegevensbestand in de repository kon niet gelezen worden. Controleer documenten.js, voortgang.js en planeten.js."
    }
  }
};
