import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

const RETENTION_DAYS = 120
const CLEANUP_BATCH_LIMIT = 5000
let lastCleanupDate: string | null = null

function getUploadJobRetentionStart() {
  return DateTime.local().minus({ days: RETENTION_DAYS }).startOf('day')
}

async function cleanupOldImageUploadJobs() {
  const today = DateTime.local().toISODate()
  if (lastCleanupDate === today) return 0

  const cutoff = getUploadJobRetentionStart().toFormat('yyyy-MM-dd HH:mm:ss')
  let deletedTotal = 0

  try {
    while (true) {
      const result = await Database.rawQuery(
        `DELETE FROM image_upload_jobs WHERE created_at < ? LIMIT ${CLEANUP_BATCH_LIMIT}`,
        [cutoff]
      )
      const deleted = Number(result?.[0]?.affectedRows || result?.affectedRows || 0)
      deletedTotal += deleted

      if (deleted < CLEANUP_BATCH_LIMIT) break
    }

    lastCleanupDate = today
  } catch (error) {
    console.error('Erro ao limpar image_upload_jobs antigos:', error)
  }

  return deletedTotal
}

export { cleanupOldImageUploadJobs, getUploadJobRetentionStart, RETENTION_DAYS }
