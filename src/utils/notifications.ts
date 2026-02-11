// Request notification permission (call on app load)
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  return false
}

// Schedule a notification at a specific time
export function scheduleNotification(
  taskId: number,
  taskTitle: string,
  reminderTime: Date
) {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const now = new Date()
  const timeUntilReminder = reminderTime.getTime() - now.getTime()

  if (timeUntilReminder <= 0) {
    // Fire immediately if time is in the past
    new Notification('Task Reminder', {
      body: taskTitle,
      icon: '/favicon.ico',
      tag: `task-${taskId}`
    })
    return
  }

  // Schedule for later
  setTimeout(() => {
    new Notification('Task Reminder', {
      body: taskTitle,
      icon: '/favicon.ico',
      tag: `task-${taskId}`
    })
  }, timeUntilReminder)

  console.log(`[Notifications] Scheduled reminder for "${taskTitle}" at ${reminderTime.toLocaleTimeString()}`)
}

// Cancel a scheduled notification
export function cancelNotification(taskId: number) {
  // Note: The Notification API doesn't provide a way to cancel scheduled notifications
  // This is handled by clearing from localStorage
  localStorage.removeItem(`reminder-${taskId}`)
}

// Store reminder time in localStorage (persists across page reloads)
export function saveReminderTime(taskId: number, reminderTime: Date | null) {
  if (reminderTime) {
    localStorage.setItem(`reminder-${taskId}`, reminderTime.toISOString())
  } else {
    localStorage.removeItem(`reminder-${taskId}`)
  }
}

// Get stored reminder time
export function getReminderTime(taskId: number): Date | null {
  const stored = localStorage.getItem(`reminder-${taskId}`)
  return stored ? new Date(stored) : null
}

// Reschedule all reminders from localStorage (call on app load)
export function rescheduleNotifications() {
  if (Notification.permission !== 'granted') {
    return
  }

  const keys = Object.keys(localStorage)
  keys.forEach((key) => {
    if (key.startsWith('reminder-')) {
      try {
        const reminderTime = new Date(localStorage.getItem(key)!)
        const taskId = parseInt(key.replace('reminder-', ''))
        scheduleNotification(taskId, 'Task reminder', reminderTime)
      } catch (error) {
        console.error('Failed to reschedule notification:', error)
      }
    }
  })
}
