import Dexie, { Table } from 'dexie'

export interface Task {
  id?: number
  title: string
  completed: boolean
  dueDate: Date
  createdAt: Date
}

export interface Transaction {
  id?: number
  type: 'income' | 'expense'
  amount: number
  category: string
  date: Date
  notes?: string
  createdAt: Date
}

export interface Contact {
  id?: number
  name: string
  phone: string
  role?: string
  notes?: string
  createdAt: Date
}

export interface Record {
  id?: number
  title: string
  encryptedFileData: Blob
  mimeType: string
  createdAt: Date
}

export class LifeOSDB extends Dexie {
  tasks!: Table<Task>
  transactions!: Table<Transaction>
  contacts!: Table<Contact>
  records!: Table<Record>

  constructor() {
    super('LifeOSDB')
    this.version(1).stores({
      tasks: '++id, dueDate',
      transactions: '++id, date, type',
      contacts: '++id, name',
      records: '++id, createdAt'
    })
    this.version(2).stores({
      tasks: '++id, dueDate',
      transactions: '++id, date, type',
      contacts: '++id, name, phone',
      records: '++id, createdAt'
    })
  }
}

export const db = new LifeOSDB()
