import { useEffect, useState } from 'react'
import { db } from '../db/database'
import type { Transaction } from '../db/database'
import { getCurrency, CURRENCIES, setCurrency } from '../utils/currency'
import type { Currency } from '../utils/currency'
import { useToast } from '../context/ToastContext'
import { validateTransaction } from '../utils/validation'

const CATEGORIES = ['Food', 'Transport', 'Rent', 'Data', 'Utilities', 'Other']
const PAYMENT_METHODS = ['Cash', 'MoMo']

export default function MoneyPage() {
  const { error: showError, undo } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currency, setCurrencyState] = useState<Currency>(getCurrency())

  // Form state
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)

  // Load transactions on mount
  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const allTx = await db.transactions.toArray()
      // Sort by date descending (newest first)
      setTransactions(allTx.sort((a, b) => ((b.date as any) - (a.date as any))))
    } catch (error) {
      console.error('Failed to load transactions:', error)
    }
  }

  const resetForm = () => {
    setType('expense')
    setAmount('')
    setCategory(CATEGORIES[0])
    setMethod(PAYMENT_METHODS[0])
    setNotes('')
    setEditingId(null)
  }

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount)
    const validation = validateTransaction(amountNum, category)
    if (!validation.valid) {
      showError(validation.error || 'Invalid transaction')
      return
    }

    setLoading(true)
    try {
      const tx: Transaction = {
        type,
        amount: amountNum,
        category,
        date: new Date(),
        notes: notes || undefined,
        createdAt: new Date()
      }

      if (editingId) {
        await db.transactions.update(editingId, tx)
      } else {
        await db.transactions.add(tx)
      }

      resetForm()
      setShowAddForm(false)
      await loadTransactions()
    } catch (error) {
      console.error('Failed to save transaction:', error)
      showError('Failed to save transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number | undefined) => {
    if (!id) return

    try {
      const txToDelete = transactions.find((t) => t.id === id)
      if (!txToDelete) return

      // Delete immediately
      await db.transactions.delete(id)
      
      // Show undo toast
      undo('Transaction deleted', async () => {
        try {
          await db.transactions.add({ ...txToDelete, id })
          await loadTransactions()
        } catch (err) {
          console.error('Failed to undo delete:', err)
          showError('Failed to restore transaction')
        }
      }, 7000)
      
      await loadTransactions()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      showError('Failed to delete transaction')
    }
  }

  const handleEdit = (tx: Transaction) => {
    setType(tx.type)
    setAmount(tx.amount.toString())
    setCategory(tx.category)
    setNotes(tx.notes || '')
    setEditingId(tx.id ?? null)
    setShowAddForm(true)
  }

  // Calculate totals
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayTxs = transactions.filter((t) => {
    const tDate = new Date(t.date)
    tDate.setHours(0, 0, 0, 0)
    return tDate.getTime() === today.getTime()
  })

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekTxs = transactions.filter((t) => {
    const tDate = new Date(t.date)
    tDate.setHours(0, 0, 0, 0)
    return tDate >= weekStart
  })

  const calculateTotal = (txs: Transaction[], txType: 'income' | 'expense') => {
    return txs
      .filter((t) => t.type === txType)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const todayIncome = calculateTotal(todayTxs, 'income')
  const todayExpense = calculateTotal(todayTxs, 'expense')
  const weekIncome = calculateTotal(weekTxs, 'income')
  const weekExpense = calculateTotal(weekTxs, 'expense')

  return (
    <div className="pb-24 bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Money</h1>
          <select
            value={currency.code}
            onChange={(e) => {
              const newCurrency = CURRENCIES.find((c) => c.code === e.target.value)
              if (newCurrency) {
                setCurrency(e.target.value)
                setCurrencyState(newCurrency)
              }
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.symbol}
              </option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-bold mb-1">TODAY IN</p>
            <p className="text-lg font-bold text-green-700">{currency.symbol}{todayIncome.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-bold mb-1">TODAY OUT</p>
            <p className="text-lg font-bold text-red-700">{currency.symbol}{todayExpense.toLocaleString()}</p>
          </div>
          <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-bold mb-1">THIS WEEK</p>
            <p className="text-sm text-blue-700">
              In: {currency.symbol}{weekIncome.toLocaleString()} | Out: {currency.symbol}{weekExpense.toLocaleString()} | Net: {currency.symbol}
              {(weekIncome - weekExpense).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => {
            resetForm()
            setShowAddForm(!showAddForm)
          }}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="space-y-3">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setType('expense')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors
                  ${
                    type === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }
                `}
              >
                💸 Expense
              </button>
              <button
                onClick={() => setType('income')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors
                  ${
                    type === 'income'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }
                `}
              >
                💰 Income
              </button>
            </div>

            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Amount Input */}
            <NumberInput
              value={amount}
              onChange={setAmount}
              placeholder="Amount"
            />

            {/* Payment Method */}
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((method_name) => (
                <button
                  key={method_name}
                  onClick={() => setMethod(method_name)}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors
                    ${
                      method === method_name
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }
                  `}
                >
                  {method_name}
                </button>
              ))}
            </div>

            {/* Notes */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!amount || loading}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
            >
              {loading ? '...' : editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="p-4 space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No transactions yet</p>
            <p className="text-sm">Add your first transaction to track spending</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              tx={tx}
              currency={currency}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface TransactionItemProps {
  tx: Transaction
  currency: Currency
  onEdit: (tx: Transaction) => void
  onDelete: (id: number | undefined) => void
}

function TransactionItem({ tx, currency, onEdit, onDelete }: TransactionItemProps) {
  const isIncome = tx.type === 'income'

  return (
    <div className={`p-3 rounded-lg border flex items-center gap-3 ${
      isIncome
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      {/* Icon */}
      <div className={`text-xl flex-shrink-0 ${isIncome ? '' : ''}`}>
        {isIncome ? '📥' : '📤'}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800">{tx.category}</p>
        <p className="text-xs text-gray-500">{tx.notes || tx.type}</p>
        <p className="text-xs text-gray-500">
          {new Date(tx.date).toLocaleDateString()}
        </p>
      </div>

      {/* Amount */}
      <div className={`text-sm font-bold flex-shrink-0 ${
        isIncome ? 'text-green-600' : 'text-red-600'
      }`}>
        {isIncome ? '+' : '-'}{currency.symbol}{tx.amount.toLocaleString()}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(tx)}
          className="text-gray-400 hover:text-blue-600 text-sm"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(tx.id)}
          className="text-gray-400 hover:text-red-600 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function NumberInput({ value, onChange, placeholder }: NumberInputProps) {
  const handleKeyPress = (digit: string) => {
    onChange(value + digit)
  }

  const handleBackspace = () => {
    onChange(value.slice(0, -1))
  }

  const handleDecimal = () => {
    if (!value.includes('.')) {
      onChange(value + '.')
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        readOnly
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white text-right font-mono text-lg"
      />

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleDecimal}
          className="py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
        >
          .
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm font-bold"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}

