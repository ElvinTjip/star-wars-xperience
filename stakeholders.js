/*
  Stakeholders, plan van aanpak en acties van de stakeholdermap.

  De pagina werkt dit bestand zelf bij wanneer een teamlid in de editor iets
  wijzigt. Met de hand aanpassen kan ook; houd dan de dubbele aanhalingstekens
  aan en zet geen komma na het laatste item.

  Bij elke stakeholder staat "invloed" en "belang" (laag, gemiddeld of hoog), de plek op de kaart
  ("kwadrant", een id uit data.js) en de "status": "nu" (nu actief) of "later" (later, nog niet benaderd).
  Het veld "plan" verwijst naar een rij bij "rijen". Een actie heeft een tekst, een eigenaar en een datum.
*/
window.STAKEHOLDERMAP_STAKEHOLDERS = {
  "stakeholders": [
    {
      "id": "docenten-coach",
      "naam": "Docenten en coach",
      "toelichting": "",
      "kwadrant": "tevreden-houden",
      "plan": "docenten-coach",
      "hologram": "groep",
      "invloed": "hoog",
      "belang": "laag",
      "status": "nu",
      "informatiebehoefte": "Of we de opdracht en de deliverables goed uitvoeren.",
      "afstemmen": "Via de les, bij de briefings en de feedbackmomenten."
    },
    {
      "id": "licentiehouder",
      "naam": "Licentiehouder Star Wars",
      "toelichting": "",
      "kwadrant": "tevreden-houden",
      "plan": "licentiehouder",
      "hologram": "logo",
      "invloed": "hoog",
      "belang": "laag",
      "status": "later",
      "informatiebehoefte": "Het volledige concept, pas als alles af is.",
      "afstemmen": "Via Mark en Vernon, na een pitch van de opdrachtgevers."
    },
    {
      "id": "mark-vernon",
      "naam": "Mark en Vernon",
      "toelichting": "Opdrachtgevers",
      "kwadrant": "nauw-betrekken",
      "plan": "mark-vernon",
      "hologram": "duo",
      "invloed": "hoog",
      "belang": "hoog",
      "status": "nu",
      "informatiebehoefte": "Voortgang, keuzes in het concept en de uitkomsten van onderzoek en test.",
      "afstemmen": "Feedback na de pitches en per mail."
    },
    {
      "id": "projectgroep",
      "naam": "De projectgroep",
      "toelichting": "Stan, Coen en Elvin",
      "kwadrant": "nauw-betrekken",
      "plan": "team",
      "hologram": "trio",
      "invloed": "hoog",
      "belang": "hoog",
      "status": "nu",
      "informatiebehoefte": "Wie wat doet en hoe ver elk onderdeel is.",
      "afstemmen": "Via deze stakeholdermap en de lessen, en dagelijks via WhatsApp."
    },
    {
      "id": "technisch-expert",
      "naam": "Technisch expert Jaap Evenhuis",
      "toelichting": "HvA-docent, technisch expert immersive",
      "kwadrant": "monitoren",
      "plan": "technisch-expert",
      "hologram": "persoon",
      "invloed": "laag",
      "belang": "laag",
      "status": "nu",
      "informatiebehoefte": "Wat het immersive prototype technisch vraagt en of het uitvoerbaar is.",
      "afstemmen": "Korte check na elke iteratie, via de les en per mail."
    },
    {
      "id": "sterfans",
      "naam": "Star Wars-fans",
      "toelichting": "Bezoekers en doelgroep",
      "kwadrant": "op-de-hoogte-houden",
      "plan": "sterfans",
      "hologram": "groep",
      "invloed": "laag",
      "belang": "hoog",
      "status": "nu",
      "informatiebehoefte": "Hoe de ervaring aansluit op wat zij van Star Wars verwachten.",
      "afstemmen": "Via enquête en focusgroepen."
    },
    {
      "id": "uitjesgroepen",
      "naam": "Groepen die een uitje boeken",
      "toelichting": "Vriendengroepen, gezinnen en bedrijven",
      "kwadrant": "op-de-hoogte-houden",
      "plan": "uitjesgroepen",
      "hologram": "groep",
      "invloed": "laag",
      "belang": "hoog",
      "status": "nu",
      "informatiebehoefte": "Wat de ervaring is, voor wie hij bedoeld is en hoe je hem boekt.",
      "afstemmen": "Via enquête en testsessies."
    },
    {
      "id": "gamemasters",
      "naam": "Medewerkers en gamemasters",
      "toelichting": "Lasergame",
      "kwadrant": "nauw-betrekken",
      "plan": "gamemasters",
      "hologram": "groep",
      "invloed": "hoog",
      "belang": "hoog",
      "status": "later",
      "informatiebehoefte": "Wat de immersive versie in de praktijk van hen vraagt.",
      "afstemmen": "Via Mark en Vernon, zodra het concept en de locatie vaststaan."
    },
    {
      "id": "locatie-veiligheid",
      "naam": "Locatiebeheer en veiligheid",
      "toelichting": "",
      "kwadrant": "tevreden-houden",
      "plan": "locatie-veiligheid",
      "hologram": "duo",
      "invloed": "hoog",
      "belang": "laag",
      "status": "later",
      "informatiebehoefte": "Wat er in de ruimte komt en of het veilig en toegankelijk is.",
      "afstemmen": "Via Mark en Vernon, zodra de locatie vaststaat."
    },
    {
      "id": "geluid-av",
      "naam": "Geluid en AV-techniek",
      "toelichting": "",
      "kwadrant": "monitoren",
      "plan": "geluid-av",
      "hologram": "duo",
      "invloed": "gemiddeld",
      "belang": "gemiddeld",
      "status": "later",
      "informatiebehoefte": "Wat er geprojecteerd en afgespeeld wordt.",
      "afstemmen": "Via Mark en Vernon, zodra het concept vaststaat."
    },
    {
      "id": "marketing-verkoop",
      "naam": "Marketing en verkoop",
      "toelichting": "Star Wars Experience",
      "kwadrant": "monitoren",
      "plan": "marketing-verkoop",
      "hologram": "duo",
      "invloed": "gemiddeld",
      "belang": "gemiddeld",
      "status": "later",
      "informatiebehoefte": "Wat de ervaring is en voor wie.",
      "afstemmen": "Via Mark en Vernon, zodra het concept vaststaat."
    }
  ],
  "rijen": [
    {
      "id": "mark-vernon",
      "stakeholder": "Mark en Vernon",
      "fase": "Kick-off, tussenpresentatie, eindpitch",
      "producten": "Creative brief, prototype, pitch",
      "samenwerken": "Feedback na pitches en per mail",
      "contact": "Via mail en de pitches"
    },
    {
      "id": "team",
      "stakeholder": "Team",
      "fase": "In alle fases",
      "producten": "Samenwerkingsovereenkomst, 360-graden feedback",
      "samenwerken": "Via deze stakeholdermap en de lessen",
      "contact": "WhatsApp"
    },
    {
      "id": "docenten-coach",
      "stakeholder": "Docenten en coach",
      "fase": "Bij de briefings en feedbackmomenten",
      "producten": "Deliverables met feedback",
      "samenwerken": "Via de les",
      "contact": "Via de les"
    },
    {
      "id": "sterfans",
      "stakeholder": "Star Wars-fans",
      "fase": "Fieldresearch en test van het prototype",
      "producten": "Prototype",
      "samenwerken": "Via enquête en focusgroepen",
      "contact": "Bij het prototype en het interview"
    },
    {
      "id": "uitjesgroepen",
      "stakeholder": "Groepen die een uitje boeken",
      "fase": "Fieldresearch en test van het prototype",
      "producten": "Prototype",
      "samenwerken": "Via enquête en testsessies",
      "contact": "Bij het prototype en het interview"
    },
    {
      "id": "licentiehouder",
      "stakeholder": "Licentiehouder",
      "fase": "Aan het einde, als alles af is",
      "producten": "Het volledige concept",
      "samenwerken": "Na een pitch van de opdrachtgevers",
      "contact": "Via Mark en Vernon"
    },
    {
      "id": "technisch-expert",
      "stakeholder": "Technisch expert Jaap Evenhuis",
      "fase": "Bij het uitwerken en testen van het immersive prototype",
      "producten": "Prototype en technische uitwerking",
      "samenwerken": "Korte check na elke iteratie",
      "contact": "Via de les en per mail"
    },
    {
      "id": "gamemasters",
      "stakeholder": "Medewerkers en gamemasters",
      "fase": "Zodra het concept en de locatie vaststaan",
      "contact": "Via Mark en Vernon"
    },
    {
      "id": "locatie-veiligheid",
      "stakeholder": "Locatiebeheer en veiligheid",
      "contact": "Via Mark en Vernon"
    },
    {
      "id": "geluid-av",
      "stakeholder": "Geluid en AV-techniek",
      "contact": "Via Mark en Vernon"
    },
    {
      "id": "marketing-verkoop",
      "stakeholder": "Marketing en verkoop",
      "contact": "Via Mark en Vernon"
    }
  ],
  "acties": [
    {
      "id": "locatie-beslisser",
      "tekst": "Vraag aan Mark en Vernon wie bij de locatie beslist en wie de lasergame draait",
      "eigenaar": "Elvin",
      "datum": "2026-10-20",
      "klaar": false
    }
  ]
};
