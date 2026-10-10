/*
  Documenten per stakeholder.

  De pagina werkt dit bestand zelf bij wanneer een teamlid in de editor een
  document toevoegt of verwijdert. Met de hand aanpassen kan ook; houd dan de
  dubbele aanhalingstekens aan en zet geen komma na het laatste item.

  Voorbeeld van één document:
  {
    "id": "creative-brief",
    "stakeholder": "mark-vernon",
    "titel": "Creative brief",
    "soort": "bestand",
    "pad": "documenten/mark-vernon/creative-brief.pdf",
    "toegevoegd": "2026-10-07",
    "door": "elvin"
  }
  Bij "soort": "link" gebruik je "url" in plaats van "pad".

  Een document hoort bij een stakeholder ("stakeholder": "mark-vernon") of bij
  een maan ("maan": "deskresearch/persona", de planeet en de maan met een
  schuine streep ertussen).
*/
window.STAKEHOLDERMAP_DOCUMENTEN = [];
