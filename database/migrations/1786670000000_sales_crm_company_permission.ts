import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSchema {
  private permissiongroupId = 47

  public async up () {
    this.schema.alterTable('sales_opportunities', (table) => {
      table.integer('companies_id').unsigned().nullable().references('id').inTable('companies').onUpdate('RESTRICT').onDelete('SET NULL')
      table.index(['companies_id', 'sales_stage_id'], 'sales_opportunities_company_stage_idx')
    })

    const permission = await Database.from('permissiongroups').where('id', this.permissiongroupId).first()
    if (!permission) {
      await Database.table('permissiongroups').insert({
        id: this.permissiongroupId,
        name: 'Acesso ao CRM',
        desc: 'Permite acessar e operar o CRM da empresa.',
        inactive: false,
      })
    }
  }

  public async down () {
    await Database.from('groupxpermissions').where('permissiongroup_id', this.permissiongroupId).delete()
    await Database.from('permissiongroups').where('id', this.permissiongroupId).delete()
    this.schema.alterTable('sales_opportunities', (table) => {
      table.dropIndex(['companies_id', 'sales_stage_id'], 'sales_opportunities_company_stage_idx')
      table.dropColumn('companies_id')
    })
  }
}
