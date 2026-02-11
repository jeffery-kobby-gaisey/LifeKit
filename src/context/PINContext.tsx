import React, { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../db/database'
import { hashPassword, verifyPassword } from '../utils/crypto'

interface PINContextType {
  isPINSet: boolean
  isUnlocked: boolean
  pin: string | null
  setPIN: (pin: string) => Promise<void>
  verifyPIN: (pin: string) => Promise<boolean>
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
  clearAllData: () => Promise<void>
}

const PINContext = createContext<PINContextType | undefined>(undefined)

const PIN_STORAGE_KEY = 'life-os-pin-hash'

export function PINProvider({ children }: { children: React.ReactNode }) {
  const [isPINSet, setIsPINSet] = useState<boolean | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pin, setPin] = useState<string | null>(null)

  // Load PIN status from localStorage on mount
  useEffect(() => {
    console.log('🔄 [PINProvider] Initializing...')
    const pinHash = localStorage.getItem(PIN_STORAGE_KEY)
    const hasPIN = !!pinHash
    console.log(`🔄 [PINProvider] localStorage check: pinHash exists = ${hasPIN}`)
    setIsPINSet(hasPIN)
    console.log(`✓ [PINProvider] Set isPINSet to ${hasPIN}`)
  }, [])

  const setPINHandler = async (newPIN: string) => {
    if (newPIN.length < 4) {
      throw new Error('PIN must be at least 4 digits')
    }
    try {
      console.log('🔐 [setPIN] Starting PIN setup for PIN length:', newPIN.length)
      const hash = await hashPassword(newPIN)
      console.log('✓ [setPIN] Hash generated, length:', hash.length)
      
      // Store in localStorage
      localStorage.setItem(PIN_STORAGE_KEY, hash)
      console.log('✓ [setPIN] Hash stored in localStorage')
      
      // Verify it was stored
      const verify = localStorage.getItem(PIN_STORAGE_KEY)
      console.log('✓ [setPIN] Verification - hash in storage:', !!verify)
      
      // Update state
      setIsPINSet(true)
      setPin(newPIN)
      setIsUnlocked(true)
      console.log('✓ [setPIN] State updated: isPINSet=true, isUnlocked=true')
    } catch (error) {
      console.error('❌ [setPIN] Failed:', error)
      throw error
    }
  }

  const verifyPINHandler = async (inputPIN: string): Promise<boolean> => {
    try {
      console.log('🔐 [verifyPIN] Starting verification for PIN length:', inputPIN.length)
      const pinHash = localStorage.getItem(PIN_STORAGE_KEY)
      console.log('📦 [verifyPIN] Hash from localStorage exists:', !!pinHash)
      
      if (!pinHash) {
        console.error('❌ [verifyPIN] No PIN hash in localStorage')
        return false
      }
      
      const isValid = await verifyPassword(inputPIN, pinHash)
      console.log('✓ [verifyPIN] Result:', isValid)
      return isValid
    } catch (error) {
      console.error('❌ [verifyPIN] Exception:', error)
      return false
    }
  }

  const unlockHandler = async (inputPIN: string): Promise<boolean> => {
    console.log('🔓 [unlock] Starting unlock attempt, PIN length:', inputPIN.length)
    const isValid = await verifyPINHandler(inputPIN)
    console.log('🔓 [unlock] Verification returned:', isValid)
    
    if (isValid) {
      console.log('✓ [unlock] PIN valid, updating state...')
      setPin(inputPIN)
      setIsUnlocked(true)
      console.log('✓ [unlock] State updated')
      return true
    } else {
      console.log('❌ [unlock] PIN invalid')
      return false
    }
  }

  const lock = () => {
    console.log('🔒 [lock] Locking app')
    setPin(null)
    setIsUnlocked(false)
  }

  const clearAllData = async () => {
    try {
      console.log('🗑️ [clearAllData] Starting...')
      await db.tasks.clear()
      await db.transactions.clear()
      await db.contacts.clear()
      await db.records.clear()
      localStorage.removeItem(PIN_STORAGE_KEY)
      setPin(null)
      setIsUnlocked(false)
      setIsPINSet(false)
      console.log('✓ [clearAllData] Complete')
    } catch (error) {
      console.error('❌ [clearAllData] Failed:', error)
      throw error
    }
  }

  // Don't render children until we know if PIN is set
  if (isPINSet === null) {
    console.log('⏳ [PINProvider] Waiting for PIN status check to complete...')
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  console.log(`✓ [PINProvider] Ready to render. isPINSet=${isPINSet}`)

  const value: PINContextType = {
    isPINSet,
    isUnlocked,
    pin,
    setPIN: setPINHandler,
    verifyPIN: verifyPINHandler,
    unlock: unlockHandler,
    lock,
    clearAllData
  }

  return <PINContext.Provider value={value}>{children}</PINContext.Provider>
}

export function usePIN() {
  const context = useContext(PINContext)
  if (!context) {
    throw new Error('usePIN must be used within PINProvider')
  }
  return context
}

