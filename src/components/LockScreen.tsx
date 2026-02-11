import { useState, useEffect } from 'react'
import { usePIN } from '../context/PINContext'

interface LockScreenProps {
  mode: 'unlock' | 'setup'
  onSuccess: () => void
}

export default function LockScreen({ mode, onSuccess }: LockScreenProps) {
  const { setPIN, unlock, isUnlocked } = usePIN()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Listen for successful unlock/setup from context
  useEffect(() => {
    console.log(`✓ [LockScreen.${mode}] Checking: isUnlocked=${isUnlocked}, mode=${mode}`)
    if (mode === 'unlock' && isUnlocked) {
      console.log(`✅ [LockScreen.unlock] SUCCESS! isUnlocked changed to true - closing lock screen`)
      setPin('')
      setError('')
      onSuccess()
    }
  }, [isUnlocked, mode, onSuccess])

  const handlePINInput = (digit: string) => {
    if (mode === 'unlock') {
      if (pin.length < 6) {
        setPin(pin + digit)
        setError('')
      }
    } else {
      // setup mode
      if (confirmPin) {
        if (confirmPin.length < 6) {
          setConfirmPin(confirmPin + digit)
          setError('')
        }
      } else {
        if (pin.length < 6) {
          setPin(pin + digit)
          setError('')
        }
      }
    }
  }

  const handleBackspace = () => {
    if (mode === 'unlock') {
      setPin(pin.slice(0, -1))
    } else {
      if (confirmPin) {
        setConfirmPin(confirmPin.slice(0, -1))
      } else {
        setPin(pin.slice(0, -1))
      }
    }
  }

  const handleSubmit = async () => {
    if (mode === 'unlock') {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits')
        return
      }

      setLoading(true)
      try {
        console.log('🔓 Submitting unlock with PIN length:', pin.length)
        const success = await unlock(pin)
        console.log('📤 Unlock result:', success)
        if (success) {
          console.log('✅ Unlock successful - waiting for context update')
          // useEffect will handle calling onSuccess
        } else {
          console.log('❌ Unlock failed - wrong PIN')
          setError('Wrong PIN')
          setPin('')
        }
      } catch (err) {
        console.error('⚠️ Unlock error:', err)
        setError('Error verifying PIN. Try again.')
        setPin('')
      } finally {
        setLoading(false)
      }
    } else {
      // setup mode
      if (confirmPin) {
        if (pin.length < 4) {
          setError('PIN must be at least 4 digits')
          return
        }
        if (pin !== confirmPin) {
          setError('PINs do not match')
          setPin('')
          setConfirmPin('')
          return
        }

        setLoading(true)
        try {
          console.log('🔐 [LockScreen.setup] Submitting PIN setup for PIN length:', pin.length)
          await setPIN(pin)
          console.log('✅ [LockScreen.setup] PIN set successfully!')
          console.log('✅ [LockScreen.setup] Setup complete - closing lock screen via onSuccess()')
          setError('')
          setPin('')
          setConfirmPin('')
          onSuccess()
        } catch (err) {
          console.error('❌ [LockScreen.setup] Error:', err)
          setError('Error setting PIN')
          setPin('')
          setConfirmPin('')
        } finally {
          setLoading(false)
        }
      } else {
        if (pin.length < 4) {
          setError('PIN must be at least 4 digits')
          return
        }
        setConfirmPin('') // Move to confirm step
      }
    }
  }

  const displayPin = mode === 'unlock' ? pin : confirmPin ? confirmPin : pin

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-sm px-6 py-12 flex flex-col">
        {/* Title */}
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-white text-3xl font-bold text-center mb-2">LifeKit</h1>
        <p className="text-blue-100 text-center mb-12">
          {mode === 'unlock'
            ? 'Unlock with PIN'
            : confirmPin
              ? 'Confirm PIN'
              : 'Create PIN (4-6 digits)'}
        </p>

        {/* PIN Display */}
        <div className="bg-white bg-opacity-20 rounded-lg p-6 mb-8">
          <div className="flex justify-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-lg font-bold text-xl flex items-center justify-center transition-all ${
                  i < displayPin.length
                    ? 'bg-white text-blue-600'
                    : 'bg-white bg-opacity-30'
                }`}
              >
                {i < displayPin.length && '•'}
              </div>
            ))}
          </div>
          {loading && <p className="text-white text-center text-sm mt-2">Verifying...</p>}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3 mb-4 text-center">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePINInput(num.toString())}
              disabled={loading}
              className="h-14 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold text-xl rounded-lg disabled:opacity-50"
            >
              {num}
            </button>
          ))}
        </div>

        {/* 0 and Backspace */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div />
          <button
            onClick={() => handlePINInput('0')}
            disabled={loading}
            className="h-14 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold text-xl rounded-lg disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={loading}
            className="h-14 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold text-xl rounded-lg disabled:opacity-50"
          >
            ← 
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={Boolean(
            loading ||
            (mode === 'unlock' && pin.length < 4) ||
            (mode === 'setup' && !confirmPin && pin.length < 4) ||
            (mode === 'setup' && confirmPin && confirmPin.length < 4)
          )}
          className="w-full h-14 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : mode === 'unlock' ? 'Unlock' : confirmPin ? 'Confirm' : 'Next'}
        </button>
      </div>
    </div>
  )
}
