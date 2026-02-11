export const validateTask = (title: string): { valid: boolean; error?: string } => {
  if (!title.trim()) {
    return { valid: false, error: 'Task title cannot be empty' }
  }
  if (title.length > 200) {
    return { valid: false, error: 'Task title too long (max 200 chars)' }
  }
  return { valid: true }
}

export const validateTransaction = (
  amount: number,
  category: string
): { valid: boolean; error?: string } => {
  if (!amount || amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }
  if (amount > 1000000) {
    return { valid: false, error: 'Amount too large (max 1,000,000)' }
  }
  if (!category || category.trim() === '') {
    return { valid: false, error: 'Category is required' }
  }
  return { valid: true }
}

export const validateContact = (
  name: string,
  phone?: string
): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Contact name is required' }
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name too long (max 100 chars)' }
  }
  if (phone && phone.trim()) {
    // Simple phone validation: at least 7 digits
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 7) {
      return { valid: false, error: 'Phone number too short (min 7 digits)' }
    }
    if (digitsOnly.length > 20) {
      return { valid: false, error: 'Phone number too long (max 20 digits)' }
    }
  }
  return { valid: true }
}

export const validateRecord = (
  title: string,
  file?: File
): { valid: boolean; error?: string } => {
  if (!title.trim()) {
    return { valid: false, error: 'Record title is required' }
  }
  if (title.length > 100) {
    return { valid: false, error: 'Title too long (max 100 chars)' }
  }
  if (file) {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 10MB)' }
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF',
      }
    }
  }
  return { valid: true }
}
