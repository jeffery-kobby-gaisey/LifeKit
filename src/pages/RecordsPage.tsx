'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '../db/database'
import type { Record } from '../db/database'
import { useToast } from '../context/ToastContext'
import { validateRecord } from '../utils/validation'

export default function RecordsPage() {
  const { error: showError, undo } = useToast()
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<Record | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load records on mount
  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const allRecords = await db.records.toArray()
      setRecords(allRecords.sort((a, b) => ((b.createdAt as any) - (a.createdAt as any))))
    } catch (error) {
      console.error('Failed to load records:', error)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateRecord(file.name, file)
    if (!validation.valid) {
      showError(validation.error || 'Invalid file')
      return
    }

    setLoading(true)
    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type })

      const record: Record = {
        title: file.name,
        encryptedFileData: blob,
        mimeType: file.type,
        createdAt: new Date()
      }

      await db.records.add(record)
      await loadRecords()

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to save record:', error)
      showError('Failed to save record')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRecord = async (record: Record) => {
    setLoading(true)
    try {
      setViewingRecord(record)
    } catch (error) {
      console.error('Failed to open record:', error)
      showError('Failed to open record')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseViewer = () => {
    setViewingRecord(null)
  }

  const handleDeleteRecord = async (id: number | undefined) => {
    if (!id) return

    try {
      const recordToDelete = records.find((r) => r.id === id)
      if (!recordToDelete) return

      // Delete immediately
      await db.records.delete(id)
      
      // Show undo toast
      undo('Record deleted', async () => {
        try {
          await db.records.add({ ...recordToDelete, id })
          await loadRecords()
        } catch (err) {
          console.error('Failed to undo delete:', err)
          showError('Failed to restore record')
        }
      }, 7000)
      
      await loadRecords()
    } catch (error) {
      console.error('Failed to delete record:', error)
      showError('Failed to delete record')
    }
  }

  const formatDate = (date: Date) => {
    if (!(date instanceof Date)) {
      date = new Date(date)
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️'
    }
    if (mimeType === 'application/pdf') {
      return '📄'
    }
    return '📎'
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Records</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : '+'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Records List or Empty State */}
      <div className="p-4">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No records yet.</p>
            <p className="text-sm">Add your first document.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOpenRecord(record)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{getFileIcon(record.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{record.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(record.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteRecord(record.id)
                  }}
                  className="ml-2 text-red-600 hover:text-red-700 font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Viewer Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex flex-col">
          {/* Header */}
          <div className="bg-white p-4 flex justify-between items-center border-b">
            <p className="font-bold truncate">{viewingRecord.title}</p>
            <button
              onClick={handleCloseViewer}
              className="text-gray-600 hover:text-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {viewingRecord.mimeType.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(viewingRecord.encryptedFileData)}
                alt={viewingRecord.title}
                className="w-full h-full object-contain"
              />
            ) : viewingRecord.mimeType === 'application/pdf' ? (
              <iframe
                src={URL.createObjectURL(viewingRecord.encryptedFileData)}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <p>Cannot preview this file type</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
