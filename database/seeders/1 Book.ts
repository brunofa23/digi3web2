import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Book from 'App/Models/Book'

export default class extends BaseSeeder {
  public async run () {
    await Book.createMany(
      [
        {
          "id" : 1,
          "name" : "BANCO DE ARQUIVOS",
          "namefolder":"BANCO_DE_ARQUIVOS",
          "status" : 0
        },
        {
          "id" : 2,
          "name" : "CASAMENTO (LIVRO B)",
          "namefolder": "CASAMENTO",
          "status" : 1
        },
        {
          "id" : 3,
          "name" : "NASCIMENTO (LIVRO A)",
          "namefolder":"NASCIMENTO",
          "status" : 1
        },
        {
          "id" : 4,
          "name" : "OBITO (LIVRO C)",
          "namefolder":"OBITO",
          "status" : 1
        },
        {
          "id" : 5,
          "name" : "LIVRO D (EDITAL)",
          "namefolder":"LIVROD",
          "status" : 1
        },
        {
          "id" : 6,
          "name" : "LIVRO E",
          "namefolder":"LIVROE",
          "status" : 1
        },
        {
          "id" : 7,
          "name" : "INDICES",
          "namefolder":"INDICES",
          "status" : 1
        },
        {
          "id" : 8,
          "name" : "PROTOCOLO",
          "namefolder":"PROTOCOLO",
          "status" : 0
        },
        {
          "id" : 9,
          "name" : "FOLHA DE SEGURANÇA",
          "namefolder":"FOLHA_DE_SEGURANÇA",
          "status" : 0
        },
        {
          "id" : 10,
          "name" : "RESPOSTA OFICIOS",
          "namefolder":"RESPOSTA_OFICIOS",
          "status" : 0
        },
        {
          "id" : 11,
          "name" : "PROCESSO HABILITACAO",
          "namefolder":"PROCESSO_HABILITACAO",
          "status" : 1
        },
        {
          "id" : 12,
          "name" : "LIVROS",
          "namefolder":"LIVROS",
          "status" : 0
        },
        {
          "id" : 13,
          "name" : "DOCUMENTOS",
          "namefolder":"DOCUMENTOS",
          "status" : 0
        },
        {
          "id" : 14,
          "name" : "AUTENTICAÇÃO",
          "namefolder":"AUTENTICACAO",
          "status" : 0
        },
        {
          "id" : 15,
          "name" : "RECONHECIMENTO FIRMA",
          "namefolder":"RECONHECIMENTO_FIRMA",
          "status" : 0
        },
        {
          "id" : 16,
          "name" : "NOTAS",
          "namefolder":"NOTAS",
          "status" : 1
        },
        {
          "id" : 17,
          "name" : "IDPESSOAL",
          "namefolder":"IDPESSOAL",
          "status" : 0
        },
        {
          "id" : 18,
          "name" : "TRANSCRIÇÕES",
          "namefolder":"TRANSCRICOES",
          "status" : 1
        },
        {
          "id" : 19,
          "name" : "2VIA",
          "namefolder":"2VIA",
          "status" : 1
        },
        {
          "id" : 20,
          "name" : "ANEXO",
          "namefolder":"ANEXO",
          "status" : 1
        },
        {
          "id" : 21,
          "name" : "PREATD",
          "namefolder":"PREATD",
          "status" : 1
        },
        {
          "id" : 22,
          "name" : "CARTOSOFT",
          "namefolder":"CARTOSOFT",
          "status" : 1
        },
        {
          "id" : 23,
          "name" : "MANDADOS",
          "namefolder":"MANDADOS",
          "status" : 1
        }
      ]





    )
  }
}
