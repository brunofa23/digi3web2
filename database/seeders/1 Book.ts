import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Book from 'App/Models/Book'

export default class extends BaseSeeder {
  public async run () {
    await Book.createMany(
      [
        {
          "id" : 1,
          "name" : "BANCO DE ARQUIVOS",
          "status" : 0
        },
        {
          "id" : 2,
          "name" : "CASAMENTO (LIVRO B)",
          "status" : 1
        },
        {
          "id" : 3,
          "name" : "NASCIMENTO (LIVRO A)",
          "status" : 1
        },
        {
          "id" : 4,
          "name" : "OBITO (LIVRO C)",
          "status" : 1
        },
        {
          "id" : 5,
          "name" : "LIVRO D (EDITAL)",
          "status" : 1
        },
        {
          "id" : 6,
          "name" : "LIVRO E",
          "status" : 1
        },
        {
          "id" : 7,
          "name" : "INDICES",
          "status" : 1
        },
        {
          "id" : 8,
          "name" : "PROTOCOLO",
          "status" : 0
        },
        {
          "id" : 9,
          "name" : "FOLHA DE SEGURANÇA",
          "status" : 0
        },
        {
          "id" : 10,
          "name" : "RESPOSTA OFICIOS",
          "status" : 0
        },
        {
          "id" : 11,
          "name" : "PROCESSO HABILITACAO",
          "status" : 1
        },
        {
          "id" : 12,
          "name" : "LIVROS",
          "status" : 0
        },
        {
          "id" : 13,
          "name" : "DOCUMENTOS",
          "status" : 0
        },
        {
          "id" : 14,
          "name" : "AUTENTICAÇÃO",
          "status" : 0
        },
        {
          "id" : 15,
          "name" : "RECONHECIMENTO FIRMA",
          "status" : 0
        },
        {
          "id" : 16,
          "name" : "NOTAS",
          "status" : 1
        },
        {
          "id" : 17,
          "name" : "IDPESSOAL",
          "status" : 0
        },
        {
          "id" : 18,
          "name" : "TRANSCRIÇÕES",
          "status" : 1
        },
        {
          "id" : 19,
          "name" : "2VIA",
          "status" : 1
        },
        {
          "id" : 20,
          "name" : "ANEXO",
          "status" : 1
        },
        {
          "id" : 21,
          "name" : "PREATD",
          "status" : 1
        },
        {
          "id" : 22,
          "name" : "CARTOSOFT",
          "status" : 1
        },
        {
          "id" : 23,
          "name" : "MANDADOS",
          "status" : 1
        }
      ]





    )
  }
}
