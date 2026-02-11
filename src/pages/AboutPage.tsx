export default function AboutPage() {
  const buildDate = new Date('2026-02-10').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="pb-24 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold dark:text-white">About</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* App Info */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">LifeKit</h2>
          <p className="text-gray-600 dark:text-gray-400">Your personal command center</p>
        </div>

        {/* Version Info */}
        <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Version</span>
            <span className="font-bold dark:text-white">0.0.1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Build Date</span>
            <span className="font-bold dark:text-white">{buildDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Type</span>
            <span className="font-bold dark:text-white">Offline-First PWA</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg dark:text-white mb-3">Features</h3>
          <div className="space-y-2 text-sm dark:text-gray-300">
            <p>✅ Tasks with local reminders</p>
            <p>✅ Money tracking with multi-currency</p>
            <p>✅ Contacts with WhatsApp integration</p>
            <p>✅ File storage (images, PDFs)</p>
            <p>✅ Full data backup & restore</p>
            <p>✅ Works completely offline</p>
          </div>
        </div>

        {/* Technical */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg dark:text-white mb-3">Technical Stack</h3>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>• React 18 + TypeScript</p>
            <p>• IndexedDB (Dexie) for offline storage</p>
            <p>• Tailwind CSS for styling</p>
            <p>• Vite for fast builds</p>
            <p>• PWA service worker</p>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm dark:text-gray-300">
            <strong>🔒 Privacy First:</strong> All your data stays on your device. Nothing syncs to the cloud. Use the export feature to backup.
          </p>
        </div>

        {/* Made with */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Made with ❤️ for people who value their data
          </p>
        </div>
      </div>
    </div>
  )
}
