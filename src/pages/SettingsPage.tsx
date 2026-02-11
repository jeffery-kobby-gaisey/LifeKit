import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { exportData, importData, getBackupSize } from '../utils/backup'
import { getCurrency, CURRENCIES, setCurrency } from '../utils/currency'
import type { Currency } from '../utils/currency'
import { useToast } from '../context/ToastContext'

interface BackupInfo {
  taskCount: number
  transactionCount: number
  contactCount: number
  recordCount: number
}

export default function SettingsPage() {
  const { error: showError, success: showSuccess } = useToast()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [currency, setCurrencyState] = useState<Currency>(getCurrency())
  const [importMessage, setImportMessage] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadBackupInfo()
  }, [])

  const loadBackupInfo = async () => {
    try {
      const info = await getBackupSize()
      setBackupInfo(info)
    } catch (error) {
      console.error('Failed to load backup info:', error)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      await exportData()
      showSuccess('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      showError('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setImportMessage('')
    try {
      const result = await importData(file)
      if (result.success) {
        setImportMessage(result.message)
        setTimeout(() => {
          alert('Data imported successfully! The app will reload.')
          window.location.reload()
        }, 1500)
      } else {
        setImportMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setImportMessage(`❌ Failed to import data: ${(error as Error).message}`)
    } finally {
      setLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClearAllData = async () => {
    try {
      setLoading(true)
      // Clear IndexedDB
      const dbs = await window.indexedDB.databases()
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name)
        }
      }
      showSuccess('All data cleared. The app will reload.')
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Clear failed:', error)
      showError('Failed to clear data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-24 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Data Summary */}
        {backupInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h3 className="font-bold text-sm mb-2">Data Summary</h3>
            <div className="text-xs text-gray-700 space-y-1">
              <p>📋 Tasks: {backupInfo.taskCount}</p>
              <p>💰 Transactions: {backupInfo.transactionCount}</p>
              <p>👥 Contacts: {backupInfo.contactCount}</p>
              <p>📁 Files: {backupInfo.recordCount}</p>
            </div>
          </div>
        )}

        {/* Import Message */}
        {importMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            importMessage.startsWith('✅')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {importMessage}
          </div>
        )}

        {/* Currency Section */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="font-bold text-lg mb-3">Preferences</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency for Money Module
              </label>
              <select
                value={currency.code}
                onChange={(e) => {
                  const newCurrency = CURRENCIES.find((c) => c.code === e.target.value)
                  if (newCurrency) {
                    setCurrency(e.target.value)
                    setCurrencyState(newCurrency)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} - {c.name} ({c.country})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Current: {currency.symbol} {currency.code}
              </p>
            </div>
          </div>
        </div>

        {/* Backup Section */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="font-bold text-lg mb-3">Backup</h2>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {loading ? '...' : '💾 Export All Data'}
            </button>
            <p className="text-xs text-gray-500">Download backup JSON file to your device</p>
          </div>

          <div className="space-y-2 mt-4">
            <button
              onClick={handleImportClick}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {loading ? '...' : '📥 Import Backup'}
            </button>
            <p className="text-xs text-gray-500">Restore from a previously exported JSON file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="border-b border-gray-200 pb-4">
          <Link
            to="/about"
            className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium text-sm block text-center"
          >
            ℹ️ About LifeKit
          </Link>
        </div>

        {/* Danger Zone Section */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="font-bold text-lg mb-3">Danger Zone</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={loading}
              className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              🗑️ Clear All Data
            </button>
          </div>
        </div>

        {/* App Section */}
        <div className="pb-4">
          <h2 className="font-bold text-lg mb-3">App</h2>
          <p className="text-xs text-gray-500">LifeKit v0.0.1</p>
          <p className="text-xs text-gray-500">Offline-first PWA</p>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="font-bold text-lg mb-2">Clear All Data?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will delete all tasks, money records, contacts, and files. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {loading ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
