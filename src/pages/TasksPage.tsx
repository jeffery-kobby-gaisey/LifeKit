import { useEffect, useState } from 'react'
import { db } from '../db/database'
import type { Task } from '../db/database'
import {
  requestNotificationPermission,
  scheduleNotification,
  getReminderTime,
  saveReminderTime,
  cancelNotification,
  rescheduleNotifications
} from '../utils/notifications'
import { useToast } from '../context/ToastContext'
import { validateTask } from '../utils/validation'

export default function TasksPage() {
  const { error: showError, undo } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskReminderTime, setNewTaskReminderTime] = useState('09:00')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingReminderTime, setEditingReminderTime] = useState('09:00')
  const [loading, setLoading] = useState(false)

  // Load tasks and request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
    rescheduleNotifications()
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const allTasks = await db.tasks.toArray()
      // Sort by due date, completed last
      setTasks(
        allTasks.sort((a, b) => {
          if (a.completed === b.completed) {
            return (a.dueDate as any) - (b.dueDate as any)
          }
          return a.completed ? 1 : -1
        })
      )
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const handleAddTask = async () => {
    const validation = validateTask(newTaskTitle)
    if (!validation.valid) {
      showError(validation.error || 'Invalid task')
      return
    }

    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const newTask: Task = {
        title: newTaskTitle.trim(),
        completed: false,
        dueDate: today,
        createdAt: new Date()
      }

      const taskId = await db.tasks.add(newTask)
      const numericTaskId = typeof taskId === 'number' ? taskId : Number(taskId)
      if (!Number.isFinite(numericTaskId)) {
        throw new Error('Unexpected task id')
      }
      
      // Schedule notification with reminder time
      const [hours, minutes] = newTaskReminderTime.split(':').map(Number)
      const reminderTime = new Date(today)
      reminderTime.setHours(hours, minutes, 0)
      
      saveReminderTime(numericTaskId, reminderTime)
      scheduleNotification(numericTaskId, newTaskTitle.trim(), reminderTime)
      
      setNewTaskTitle('')
      setNewTaskReminderTime('09:00')
      await loadTasks()
    } catch (error) {
      console.error('Failed to add task:', error)
      showError('Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (id: number | undefined, completed: boolean) => {
    if (!id) return

    try {
      await db.tasks.update(id, { completed: !completed })
      await loadTasks()
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleDeleteTask = async (id: number | undefined) => {
    if (!id) return

    try {
      const taskToDelete = tasks.find((t) => t.id === id)
      if (!taskToDelete) return

      // Delete immediately
      cancelNotification(id)
      await db.tasks.delete(id)
      
      // Show undo toast
      undo('Task deleted', async () => {
        try {
          await db.tasks.add({ ...taskToDelete, id })
          await loadTasks()
        } catch (err) {
          console.error('Failed to undo delete:', err)
          showError('Failed to restore task')
        }
      }, 7000)
      
      await loadTasks()
    } catch (error) {
      console.error('Failed to delete task:', error)
      showError('Failed to delete task')
    }
  }

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id ?? null)
    setEditingTitle(task.title)
    const reminderTime = getReminderTime(task.id ?? 0)
    if (reminderTime) {
      const hours = reminderTime.getHours().toString().padStart(2, '0')
      const minutes = reminderTime.getMinutes().toString().padStart(2, '0')
      setEditingReminderTime(`${hours}:${minutes}`)
    } else {
      setEditingReminderTime('09:00')
    }
  }

  const handleSaveEdit = async () => {
    const validation = validateTask(editingTitle)
    if (!validation.valid) {
      showError(validation.error || 'Invalid task')
      return
    }

    if (!editingId) return

    try {
      await db.tasks.update(editingId, { title: editingTitle.trim() })
      
      // Update reminder time
      const [hours, minutes] = editingReminderTime.split(':').map(Number)
      const task = tasks.find((t) => t.id === editingId)
      if (task) {
        const reminderTime = new Date(task.dueDate)
        reminderTime.setHours(hours, minutes, 0)
        saveReminderTime(editingId, reminderTime)
        scheduleNotification(editingId, editingTitle.trim(), reminderTime)
      }
      
      setEditingId(null)
      setEditingTitle('')
      setEditingReminderTime('09:00')
      await loadTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      showError('Failed to update task')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const isOverdue = (dueDate: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }

  const isToday = (dueDate: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime()
  }

  // Get today's tasks and overdue
  const todayTasks = tasks.filter(
    (t) => !t.completed && isToday(t.dueDate)
  )
  const overdueTasks = tasks.filter(
    (t) => !t.completed && isOverdue(t.dueDate)
  )
  const otherTasks = tasks.filter(
    (t) => !t.completed && !isToday(t.dueDate) && !isOverdue(t.dueDate)
  )
  const completedTasks = tasks.filter((t) => t.completed)

  return (
    <div className="pb-24 bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white p-4 border-b border-gray-200 z-10">
        <h1 className="text-3xl font-bold mb-4">Tasks</h1>

        {/* Quick add input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask()
            }}
            placeholder="Add task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? '...' : 'Add'}
          </button>
        </div>

        {/* Reminder time input */}
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Remind at:</label>
          <input
            type="time"
            value={newTaskReminderTime}
            onChange={(e) => setNewTaskReminderTime(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">🔔</span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-4 space-y-6">
        {overdueTasks.length > 0 && (
          <div>
            <h2 className="font-bold text-red-600 mb-2 text-sm">
              🔴 OVERDUE ({overdueTasks.length})
            </h2>
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isOverdue={true}
                  isEditing={editingId === task.id}
                  editingTitle={editingTitle}
                  editingReminderTime={editingReminderTime}
                  onEditReminderChange={setEditingReminderTime}
                  onEditChange={setEditingTitle}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Today */}
        {todayTasks.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-700 mb-2 text-sm">
              📅 TODAY ({todayTasks.length})
            </h2>
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isOverdue={false}
                  isEditing={editingId === task.id}
                  editingTitle={editingTitle}
                  editingReminderTime={editingReminderTime}
                  onEditReminderChange={setEditingReminderTime}
                  onEditChange={setEditingTitle}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {otherTasks.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-500 mb-2 text-sm">
              📆 UPCOMING ({otherTasks.length})
            </h2>
            <div className="space-y-2">
              {otherTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isOverdue={false}
                  isEditing={editingId === task.id}
                  editingTitle={editingTitle}
                  editingReminderTime={editingReminderTime}
                  onEditReminderChange={setEditingReminderTime}
                  onEditChange={setEditingTitle}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-400 mb-2 text-sm">
              ✅ DONE ({completedTasks.length})
            </h2>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isOverdue={false}
                  isEditing={editingId === task.id}
                  editingTitle={editingTitle}
                  editingReminderTime={editingReminderTime}
                  onEditReminderChange={setEditingReminderTime}
                  onEditChange={setEditingTitle}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No tasks yet</p>
            <p className="text-sm">Add your first task to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  isOverdue: boolean
  isEditing: boolean
  editingTitle: string
  editingReminderTime: string
  onEditChange: (title: string) => void
  onEditReminderChange: (time: string) => void
  onToggle: (id: number | undefined, completed: boolean) => void
  onDelete: (id: number | undefined) => void
  onEdit: (task: Task) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}

function TaskItem({
  task,
  isOverdue,
  isEditing,
  editingTitle,
  editingReminderTime,
  onEditChange,
  onEditReminderChange,
  onToggle,
  onDelete,
  onEdit,
  onSaveEdit,
  onCancelEdit
}: TaskItemProps) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-yellow-300">
        <div className="flex gap-2">
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit()
              if (e.key === 'Escape') onCancelEdit()
            }}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={onSaveEdit}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            ✓
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Remind:</label>
          <input
            type="time"
            value={editingReminderTime}
            onChange={(e) => onEditReminderChange(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    )
  }

  const reminderTime = getReminderTime(task.id ?? 0)

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors
        ${
          task.completed
            ? 'bg-gray-100 border-gray-200 opacity-60'
            : isOverdue
              ? 'bg-red-50 border-red-200 hover:bg-red-100'
              : 'bg-white border-gray-200 hover:bg-blue-50'
        }
      `}
    >
      {/* Task with checkbox */}
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
            ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : isOverdue
                  ? 'border-red-400 hover:bg-red-100'
                  : 'border-gray-300 hover:border-blue-400'
            }
          `}
        >
          {task.completed && <span className="text-white text-sm">✓</span>}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm break-words
              ${
                task.completed
                  ? 'line-through text-gray-500'
                  : isOverdue
                    ? 'font-bold text-red-600'
                    : 'text-gray-800'
              }
            `}
          >
            {task.title}
          </p>
        </div>

        {/* Date */}
        <div className="flex-shrink-0 text-xs text-gray-500">
          {new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEdit(task)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-sm"
        >
          ✎
        </button>

        {/* Delete button */}
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 text-gray-400 hover:text-red-600 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Reminder time if set */}
      {reminderTime && (
        <div className="text-xs text-gray-500 ml-9">
          🔔 {reminderTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  )
}

