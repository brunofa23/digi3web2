import Database from '@ioc:Adonis/Lucid/Database'

export default class SalesStagesSeeder {
  public async run () {
    const stages = [
      { name: 'Novo contato', position: 1, color: '#607D8B', is_final: false, final_result: null },
      { name: 'Em contato', position: 2, color: '#2196F3', is_final: false, final_result: null },
      { name: 'Demonstração', position: 3, color: '#673AB7', is_final: false, final_result: null },
      { name: 'Proposta enviada', position: 4, color: '#FF9800', is_final: false, final_result: null },
      { name: 'Negociação', position: 5, color: '#F57C00', is_final: false, final_result: null },
      { name: 'Fechado', position: 6, color: '#4CAF50', is_final: true, final_result: 'won' },
      { name: 'Perdido', position: 7, color: '#F44336', is_final: true, final_result: 'lost' },
    ]

    for (const stage of stages) {
      await Database.from('sales_stages').where('name', stage.name).update(stage)
      const exists = await Database.from('sales_stages').where('name', stage.name).first()
      if (!exists) await Database.table('sales_stages').insert({ ...stage, active: true })
    }
  }
}
