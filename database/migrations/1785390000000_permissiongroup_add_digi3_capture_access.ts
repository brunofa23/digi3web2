import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'permissiongroups'
  protected permissionId = 41

  public async up() {
    const hasInactive = await this.schema.hasColumn(this.tableName, 'inactive')
    const statusColumn = hasInactive ? 'inactive' : 'status'
    const statusValue = hasInactive ? 'false' : 'true'

    await this.schema.raw(`
      INSERT INTO ${this.tableName} (id, name, \`desc\`, ${statusColumn}, created_at, updated_at)
      VALUES (${this.permissionId}, 'Acesso app android', 'Permite acesso ao app Android digi3Capture.', ${statusValue}, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        \`desc\` = VALUES(\`desc\`),
        ${statusColumn} = VALUES(${statusColumn}),
        updated_at = NOW()
    `)
  }

  public async down() {
    await this.schema.raw(`DELETE FROM ${this.tableName} WHERE id = ${this.permissionId}`)
  }
}
