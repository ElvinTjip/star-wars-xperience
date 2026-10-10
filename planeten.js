/*
  De planeten op de sterrenkaart: elk onderdeel van het project is een planeet,
  in deze volgorde langs de route.

  In de editor voeg je planeten toe, pas je ze aan en verwijder je ze; de pagina
  werkt dit bestand dan zelf bij. Met de hand aanpassen kan ook; houd dan de
  dubbele aanhalingstekens aan en zet geen komma na het laatste item.

  Bij "planeet" staat het plaatje uit de map beeld/planeten. Zonder "planeet"
  tekent de pagina zelf een draadbol. Bij "stakeholders" staan de id's van de
  stakeholders op wie dit onderdeel invloed heeft (zie data.js).

  Een planeet kan ook video's hebben, met een titel, de duur, het bestand en
  een stilstaand beeld: "media": [ { "titel": "...", "duur": "0:30",
  "bestand": "video/naam.mp4", "poster": "video/naam.jpg" } ]

  De manen van een planeet staan in voortgang.js onder het id van de planeet.
*/
window.STAKEHOLDERMAP_PLANETEN = [
  { "id": "deskresearch", "naam": "Deskresearch", "planeet": "coruscant", "stakeholders": [] },
  { "id": "fieldresearch", "naam": "Fieldresearch", "planeet": "tatooine", "stakeholders": ["bezoekers", "doelgroep"] },
  { "id": "concepten", "naam": "Concepten", "planeet": "naboo", "stakeholders": ["licentiehouder"] },
  { "id": "prototype", "naam": "Prototype", "planeet": "kamino", "stakeholders": ["mark-vernon", "bezoekers", "doelgroep", "testpubliek"] }
];
