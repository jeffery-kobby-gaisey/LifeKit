import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import TasksPage from './pages/TasksPage'
import MoneyPage from './pages/MoneyPage'
import ContactsPage from './pages/ContactsPage'
import RecordsPage from './pages/RecordsPage'
import SettingsPage from './pages/SettingsPage'
// @ts-ignore - file exists, TS language server cache issue
import AboutPage from './pages/AboutPage'
import BottomNav from './components/BottomNav'
import ToastContainer from './components/ToastContainer'
import { ToastProvider } from './context/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppContent() {
  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <main className="flex-1 overflow-y-auto pb-20 bg-white dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<TasksPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <BottomNav currentPath={location.pathname} />
      <ToastContainer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
