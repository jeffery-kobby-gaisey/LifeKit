import { useEffect, useState } from 'react'
import { db } from '../db/database'
import type { Contact } from '../db/database'
import { useToast } from '../context/ToastContext'
import { validateContact } from '../utils/validation'

const ROLE_EXAMPLES = ['Doctor', 'Landlord', 'Mechanic', 'Teacher', 'Boss', 'Friend']

export default function ContactsPage() {
  const { error: showError, undo } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const allContacts = await db.contacts.toArray()
      setContacts(allContacts.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  const resetForm = () => {
    setName('')
    setRole('')
    setPhone('')
    setNotes('')
    setEditingId(null)
  }

  const handleSubmit = async () => {
    const validation = validateContact(name, phone)
    if (!validation.valid) {
      showError(validation.error || 'Invalid contact')
      return
    }

    setLoading(true)
    try {
      const contact: Contact = {
        name: name.trim(),
        role: role.trim() || undefined,
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        createdAt: new Date()
      }

      if (editingId) {
        await db.contacts.update(editingId, contact)
      } else {
        // Check for duplicates
        const existing = await db.contacts.where('phone').equals(phone.trim()).toArray()
        if (existing.length > 0) {
          showError('Contact with this phone number already exists')
          return
        }
        await db.contacts.add(contact)
      }

      resetForm()
      setShowAddForm(false)
      await loadContacts()
    } catch (error) {
      console.error('Failed to save contact:', error)
      showError('Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number | undefined) => {
    if (!id) return

    try {
      const contactToDelete = contacts.find((c) => c.id === id)
      if (!contactToDelete) return

      // Delete immediately
      await db.contacts.delete(id)
      
      // Show undo toast
      undo('Contact deleted', async () => {
        try {
          await db.contacts.add({ ...contactToDelete, id })
          await loadContacts()
        } catch (err) {
          console.error('Failed to undo delete:', err)
          showError('Failed to restore contact')
        }
      }, 7000)
      
      await loadContacts()
    } catch (error) {
      console.error('Failed to delete contact:', error)
      showError('Failed to delete contact')
    }
  }

  const handleEdit = (contact: Contact) => {
    setName(contact.name)
    setRole(contact.role || '')
    setPhone(contact.phone)
    setNotes(contact.notes || '')
    setEditingId(contact.id ?? null)
    setShowAddForm(true)
  }

  // Filter contacts by search
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="pb-24 bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
        <h1 className="text-3xl font-bold mb-4">Contacts</h1>

        {/* Add Button */}
        <button
          onClick={() => {
            resetForm()
            setShowAddForm(!showAddForm)
          }}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm mb-3"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Contact'}
        </button>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or role..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="space-y-3">
            {/* Name (required) */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name *"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Role */}
            <div>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role (e.g. Doctor, Landlord)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {ROLE_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    onClick={() => setRole(example)}
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (e.g. +234803 or 0803)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!name || loading}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
            >
              {loading ? '...' : editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="p-4 space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-4 font-medium">No contacts yet</p>
            <p className="text-sm mb-6">Add important people in your life:</p>
            <div className="inline-block text-left space-y-1">
              <p className="text-xs">💼 Your mechanic</p>
              <p className="text-xs">🏠 Your landlord</p>
              <p className="text-xs">👨‍⚕️ Your doctor</p>
              <p className="text-xs">👔 Your boss</p>
              <p className="text-xs">❤️ Someone you care about</p>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No matches for "{searchQuery}"</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (id: number | undefined) => void
}

function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const formatPhone = (phone: string) => {
    // Format Nigerian numbers for WhatsApp
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('234')) return cleaned
    if (cleaned.startsWith('0')) return '234' + cleaned.slice(1)
    return '234' + cleaned
  }

  const whatsappLink = contact.phone
    ? `https://wa.me/${formatPhone(contact.phone)}`
    : null
  const callLink = contact.phone ? `tel:${contact.phone}` : null

  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 bg-white space-y-3">
      {/* Name and Role */}
      <div>
        <p className="font-bold text-gray-800">{contact.name}</p>
        {contact.role && (
          <p className="text-xs bg-blue-100 text-blue-700 inline-block px-2 py-1 rounded mt-1">
            {contact.role}
          </p>
        )}
      </div>

      {/* Phone */}
      {contact.phone && (
        <p className="text-sm text-gray-600">📱 {contact.phone}</p>
      )}

      {/* Notes */}
      {contact.notes && (
        <p className="text-xs text-gray-500 italic">{contact.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {/* Call */}
        {callLink && (
          <a
            href={callLink}
            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm text-center"
          >
            ☎️ Call
          </a>
        )}

        {/* WhatsApp */}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm text-center"
          >
            💬 WhatsApp
          </a>
        )}

        {/* Edit */}
        <button
          onClick={() => onEdit(contact)}
          className="px-3 py-2 text-gray-400 hover:text-blue-600 text-sm"
        >
          ✎
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(contact.id)}
          className="px-3 py-2 text-gray-400 hover:text-red-600 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

