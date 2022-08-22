import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Bookrecord from 'App/Models/Bookrecord'

export default class extends BaseSeeder {
  public async run() {
    await Bookrecord.createMany(
      [
        {
            "typebooks_id": 8,
            "books_id": 2,
            "cod": 1,
            "book": 1,
            "sheet": 1,
            "side": "F",
            "approximate_term": null,
            "index": 0,
            "obs": null,
            "letter": null,
            "year": null,
            "model": null
        },
        {
            "typebooks_id": 8,
            "books_id": 2,
            "cod": 2,
            "book": 1,
            "sheet": 2,
            "side": "F",
            "approximate_term": null,
            "index": 0,
            "obs": null,
            "letter": null,
            "year": null,
            "model": null
        },
        {
            "typebooks_id": 8,
            "books_id": 2,
            "cod": 3,
            "book": 1,
            "sheet": 3,
            "side": "F",
            "approximate_term": null,
            "index": 0,
            "obs": null,
            "letter": null,
            "year": null,
            "model": null
        },
        {
            "typebooks_id": 8,
            "books_id": 2,
            "cod": 4,
            "book": 1,
            "sheet": 4,
            "side": "F",
            "approximate_term": null,
            "index": 0,
            "obs": null,
            "letter": null,
            "year": null,
            "model": null
        },
        {
          "typebooks_id": 6,
          "books_id": 3,
          "cod": 3,
          "book": 1,
          "sheet": 3,
          "side": "F",
          "approximate_term": null,
          "index": 0,
          "obs": null,
          "letter": null,
          "year": null,
          "model": null
      },
      {
          "typebooks_id": 6,
          "books_id": 3,
          "cod": 4,
          "book": 1,
          "sheet": 4,
          "side": "F",
          "approximate_term": null,
          "index": 0,
          "obs": null,
          "letter": null,
          "year": null,
          "model": null
      }
    ]
    )
  }
}
