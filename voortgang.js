/*
  Manen per planeet: de onderdelen van elk deel van het project.

  De pagina werkt dit bestand zelf bij wanneer een teamlid in de editor een
  maan toevoegt, afvinkt of verwijdert. Verwijdert het team een planeet, dan
  verdwijnt ook de regel van die planeet hier. Met de hand aanpassen kan ook; houd dan
  de dubbele aanhalingstekens aan en zet geen komma na het laatste item.

  De namen voor de dubbele punt ("deskresearch") zijn de id's van de planeten
  uit data.js. Bij "klaar" staat true als het onderdeel af is. Bij "beeld" staat
  het plaatje van de maan, uit de map beeld/planeten.

  Een maan kan ook video's hebben, met een titel, de duur, het bestand en een
  stilstaand beeld: "media": [ { "titel": "...", "duur": "0:30",
  "bestand": "video/naam.mp4", "poster": "video/naam.jpg" } ]
*/
window.STAKEHOLDERMAP_VOORTGANG = {
  "deskresearch": {
    "manen": [
      { "id": "concurrentieanalyse", "titel": "Concurrentieanalyse", "klaar": false, "beeld": "corellia" },
      { "id": "doelgroep", "titel": "Doelgroep", "klaar": false, "beeld": "dagobah" },
      { "id": "persona", "titel": "Persona", "klaar": false, "beeld": "lothal" },
      { "id": "best-practice", "titel": "Best practice", "klaar": false, "beeld": "bespin" }
    ]
  },
  "prototype": {
    "manen": [
      {
        "id": "lasergame",
        "titel": "Lasergame",
        "klaar": false,
        "beeld": "dathomir",
        "media": [
          {
            "titel": "Prototype lasergame",
            "duur": "0:30",
            "bestand": "video/lasergame-prototype.mp4",
            "poster": "video/lasergame-prototype.jpg"
          },
          {
            "titel": "Opname voor het groene scherm",
            "duur": "2:27",
            "bestand": "video/lasergame-opname.mp4",
            "poster": "video/lasergame-opname.jpg"
          }
        ]
      }
    ]
  }
};
