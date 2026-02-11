import { db } from '../db/database'
import type { Task, Transaction, Contact, Record } from '../db/database'

interface BackupData {
  version: string
  exportedAt: string
  tasks: Task[]
  transactions: Transaction[]
  contacts: Contact[]
  records: (Record & { fileDataBase64: string })[]
}

// Export all data to JSON file
export async function exportData() {
  try {
    const [tasks, transactions, contacts, records] = await Promise.all([
      db.tasks.toArray(),
      db.transactions.toArray(),
      db.contacts.toArray(),
      db.records.toArray()
    ])

    // Convert blob data to base64 for JSON compatibility
    const recordsWithBase64 = await Promise.all(
      records.map(async (record) => {
        try {
          const buffer = await record.encryptedFileData.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          
          // For large files, use different approach to avoid stack overflow
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.slice(i, i + chunkSize)) as any)
          }
          
          const base64 = btoa(binary)

          return {
            ...record,
            fileDataBase64: base64
          }
        } catch (error) {
          console.warn(`Failed to export file "${record.title}", skipping:`, error)
          return {
            ...record,
            fileDataBase64: '' // Skip large files
          }
        }
      })
    )

    const backup: BackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      transactions,
      contacts,
      records: recordsWithBase64.filter((r) => r.fileDataBase64 !== '')
    }

    // Download as JSON file
    const fileName = `life-os-backup-${new Date().toISOString().split('T')[0]}.json`
    const dataStr = JSON.stringify(backup, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('[Backup] Exported successfully to', fileName, `(Tasks: ${tasks.length}, Transactions: ${transactions.length}, Contacts: ${contacts.length}, Files: ${recordsWithBase64.filter((r) => r.fileDataBase64).length})`)
    return true
  } catch (error) {
    console.error('[Backup] Export failed:', error)
    throw error
  }
}

// Import data from JSON file
export async function importData(file: File): Promise<{ success: boolean; message: string; importedCount?: number }> {
  try {
    const text = await file.text()
    let backup: BackupData
    
    try {
      backup = JSON.parse(text)
    } catch (error) {
      return { success: false, message: 'Invalid JSON file format' }
    }

    // Validate structure
    if (!backup.version) {
      return { success: false, message: 'Invalid backup file: missing version' }
    }
    
    if (!Array.isArray(backup.tasks) && !Array.isArray(backup.transactions) && 
        !Array.isArray(backup.contacts) && !Array.isArray(backup.records)) {
      return { success: false, message: 'Invalid backup file format' }
    }

    // Clear existing data with confirmation
    const confirmed = window.confirm(
      'This will replace all existing data. Continue?'
    )
    if (!confirmed) return { success: false, message: 'Import cancelled' }

    let totalImported = 0

    // Clear all tables
    await Promise.all([
      db.tasks.clear(),
      db.transactions.clear(),
      db.contacts.clear(),
      db.records.clear()
    ])

    // Restore tasks
    if (backup.tasks && backup.tasks.length > 0) {
      await db.tasks.bulkAdd(backup.tasks)
      totalImported += backup.tasks.length
    }

    // Restore transactions
    if (backup.transactions && backup.transactions.length > 0) {
      await db.transactions.bulkAdd(backup.transactions)
      totalImported += backup.transactions.length
    }

    // Restore contacts
    if (backup.contacts && backup.contacts.length > 0) {
      await db.contacts.bulkAdd(backup.contacts)
      totalImported += backup.contacts.length
    }

    // Restore records with blob conversion
    if (backup.records && backup.records.length > 0) {
      const recordsToRestore = await Promise.all(
        backup.records.map(async (record) => ({
          ...record,
          encryptedFileData: await base64ToBlob(
            record.fileDataBase64,
            record.mimeType
          )
        }))
      )
      await db.records.bulkAdd(recordsToRestore)
      totalImported += recordsToRestore.length
    }

    console.log('[Backup] Imported successfully:', totalImported, 'items')
    return { success: true, message: `✅ Imported ${totalImported} items successfully!`, importedCount: totalImported }
  } catch (error) {
    console.error('[Backup] Import failed:', error)
    return { success: false, message: (error as Error).message }
  }
}

// Helper function: base64 to blob
async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

// Get file size info
export async function getBackupSize(): Promise<{
  taskCount: number
  transactionCount: number
  contactCount: number
  recordCount: number
}> {
  try {
    const [tasks, transactions, contacts, records] = await Promise.all([
      db.tasks.toArray(),
      db.transactions.toArray(),
      db.contacts.toArray(),
      db.records.toArray()
    ])

    return {
      taskCount: tasks.length,
      transactionCount: transactions.length,
      contactCount: contacts.length,
      recordCount: records.length
    }
  } catch (error) {
    console.error('[Backup] Failed to get size:', error)
    return {
      taskCount: 0,
      transactionCount: 0,
      contactCount: 0,
      recordCount: 0
    }
  }
}
