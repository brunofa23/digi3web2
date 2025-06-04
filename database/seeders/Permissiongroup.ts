import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Permissiongroup from 'App/Models/Permissiongroup'

export default class extends BaseSeeder {
  public async run() {
    //await Permissiongroup.query().delete()
    await Permissiongroup.createMany(
      [
        // {
        //   id: 1,
        //   name: "Menu Pesquisa Rápida",
        //   desc: "Menu -> Pesquisa Rápida"
        // },
        // {
        //   id: 2,
        //   name: "Menu Cadastros - Tarefas",
        //   desc: "Menu -> Cadastros -> Tarefas"
        // },
        // {
        //   id: 3,
        //   name: "Menu Cadastros - Empresas",
        //   desc: "Menu -> Cadastros -> Empresas"
        // },
        // {
        //   id: 4,
        //   name: "Menu Cadastros - Tipos de Livros",
        //   desc: "Menu -> Cadastros -> Tipos de Livros"
        // },
        // {
        //   id: 5,
        //   name: "Menu Cadastros - Usuários",
        //   desc: "Menu -> Cadastros -> Usuários"
        // },
        // {
        //   id: 6,
        //   name: "Menu Cadastros - Liberar Acesso de Imagens no Computador",
        //   desc: "Menu -> Cadastros -> Liberar Acesso de Imagens no Computador"
        // },
        // {
        //   id: 7,
        //   name: "Menu Cadastros - Financeiro - Cadastros - Empresas",
        //   desc: "Menu -> Cadastros -> Financeiro - Cadastros - Empresas"
        // },
        // {
        //   id: 8,
        //   name: "Menu Financeiro - Liberar Acesso de Imagens no Computador",
        //   desc: "Menu Financeiro"
        // },
        // {
        //   id: 9,
        //   name: "Menu Financeiro - Cadastros",
        //   desc: "Menu Financeiro - Cadastros"
        // },
        // {
        //   id: 10,
        //   name: "Menu Financeiro - Cadastros - Empresas",
        //   desc: "Menu -> Financeiro -> Cadastros -> Empresas"
        // },
        // {
        //   id: 11,
        //   name: "Menu Financeiro - Cadastros - Classes",
        //   desc: "Menu -> Financeiro -> Cadastros -> Classes"
        // },
        // {
        //   id: 12,
        //   name: "Menu Financeiro - Cadastros - Tipos de Pagamentos",
        //   desc: "Menu -> Financeiro -> Cadastros -> Tipos de Pagamentos"
        // },
        // {
        //   id: 13,
        //   name: "Menu Financeiro - Lançamentos",
        //   desc: "Menu -> Financeiro -> Lançamentos"
        // },
        // {
        //   id: 14,
        //   name: "Menu Informações - Imagens Atualizadas",
        //   desc: "Menu -> Informações -> Imagens Atualizadas"
        // },
        // {
        //   id: 15,
        //   name: "Tela Inicial - Atualização de Livros - Para PC",
        //   desc: "Tela Inicial -> Botão Atualização de Livros - Para PC"
        // },
        // {
        //   id: 16,
        //   name: "Tela Inicial - Atualização de Documentos - Para PC",
        //   desc: "Tela Inicial -> Botão Atualização de Documentos - Para PC"
        // },
        // {
        //   id: 17,
        //   name: "Tela Inicial - Atualização de Livros - Para Celulares",
        //   desc: "Tela Inicial -> Botão Atualização de Livros - Para Celulares"
        // },
        // {
        //   id: 18,
        //   name: "Tela Inicial - Atualização de Documentos - Para Celulares",
        //   desc: "Tela Inicial -> Botão Atualização de Documentos - Para Celulares"
        // },
        // {
        //   id: 19,
        //   name: "Tela de Livros - Outras Opções - Upload",
        //   desc: "Tela de Livros -> Botão de Outras Opções -> Botão de Upload"
        // },
        // {
        //   id: 20,
        //   name: "Tela de Livros - Outras Opções - Exclusão em Lotes",
        //   desc: "Tela de Livros -> Botão de Outras Opções -> Exclusão em Lotes"
        // },
        // {
        //   id: 21,
        //   name: "Tela de Livros - Gerar/Alterar Livros",
        //   desc: "Tela de Livros -> Botão Gerar/Alterar Livros"
        // },
        // {
        //   id: 22,
        //   name: "Tela de Livros - Novo Registro",
        //   desc: "Tela de Livros -> Botão de Novo Registro"
        // },
        // {
        //   id: 23,
        //   name: "Tela de Livros - Capturar Imagens",
        //   desc: "Tela de Livros -> Coluna Ações do Grid -> Capturar Imagens"
        // },
        // {
        //   id: 24,
        //   name: "Tela de Livros - Editar Registro",
        //   desc: "Tela de Livros -> Coluna Ações do Grid -> Editar Registro"
        // },
        // {
        //   id: 25,
        //   name: "Tela de Livros - Excluir um Registro",
        //   desc: "Tela de Livros -> Coluna Ações do Grid -> Excluir um Registro"
        // },
        // {
        //   id: 26,
        //   name: "Tela de Livros - Anexar Arquivos por Item",
        //   desc: "Tela de Livros -> Coluna Ações do Grid -> Anexar Arquivos por Item"
        // },
        // {
        //   id: 27,
        //   name: "Menu Cadastros",
        //   desc: "Menu Cadastros"
        // },
        // {
        //   id: 28,
        //   name: "Menu Financeiro",
        //   desc: "Menu Financeiro"
        // },
        // {
        //   id: 29,
        //   name: "Menu Cadastros - Grupos de Usuários",
        //   desc: "Menu -> Cadastros -> Grupos de Usuários"
        // },
        // {
        //   id: 30,
        //   name: "Tela de Livros - Desbloqueio para Visualizar Imagens",
        //   desc: "Tela de Livros -> (Cadeado)Desbloqueio para Visualizar Imagens"
        // },
        {
          id: 31,
          name: "Sem Restrição de Horário (07:00 às 19:00)",
          desc: "Sem Restrição de Horário (07:00 às 19:00)"
        },

      ]
    )
    // Write your database queries inside the run method
  }
}
