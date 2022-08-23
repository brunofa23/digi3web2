import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Indeximage from 'App/Models/Indeximage'

export default class extends BaseSeeder {
  public async run() {
    await Indeximage.createMany([
      {
        bookrecords_id: 3,
        typebooks_id: 8,
        seq: 0,
        ext: 'jgp',
        file_name: 'teste',
        previous_file_name: 'teste anterior',
        created_at: null,
        updated_at: null,
      },
      {
        bookrecords_id: 4,
        typebooks_id: 8,
        seq: 0,
        ext: 'jgp',
        file_name: 'teste 1',
        previous_file_name: 'teste anterior',
        created_at: null,
        updated_at: null,
      },
      {
        bookrecords_id: 5,
        typebooks_id: 6,
        seq: 0,
        ext: 'jgp',
        file_name: 'teste 2',
        previous_file_name: 'teste anterior',
        created_at: null,
        updated_at: null,
      },
      {
        bookrecords_id: 5,
        typebooks_id: 6,
        seq: 1,
        ext: 'jgp',
        file_name: 'teste 2',
        previous_file_name: 'teste anterior',
        created_at: null,
        updated_at: null,
      },
      {
        bookrecords_id: 6,
        typebooks_id: 6,
        seq: 0,
        ext: 'jgp',
        file_name: 'teste 2',
        previous_file_name: 'teste anterior',
        created_at: null,
        updated_at: null,
      },
      {
        bookrecords_id: 6,
        typebooks_id: 6,
        seq: 1,
        ext: 'jgp',
        file_name: 'teste 2',
        previous_file_name: 'teste anterior',
        created_at: null,
        updated_at: null,
      },
    ])
  }
}
