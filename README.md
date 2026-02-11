# LifeKit PWA

Offline-first personal management PWA. Fully functional without a backend, running entirely in your browser.

**🎯 Manage everything locally: Tasks, Money, Contacts & Records**

---

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev  # Opens on localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Features

✅ **4 Modules**
- 📋 **Tasks** - Add, complete, organize with due dates & local reminders
- 💰 **Money** - Track income/expenses with categories & multi-currency support
- 👥 **Contacts** - Store contacts with call & WhatsApp integration
- 📁 **Records** - Upload & store images, PDFs (local storage)

✅ **Offline-First**
- Works completely offline with IndexedDB
- No backend, no cloud sync, no analytics
- Data stays on your device always

✅ **Production Ready**
- Global error boundary (graceful fallbacks)
- Input validation everywhere
- Undo delete (7-second window)
- Toast notifications for all actions
- Dark mode support

---

## Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)

### Steps

1. **Initialize Git** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: LifeKit PWA"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/lifekit.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Framework: Select **Vite** (auto-detected)
   - Root Directory: `.` (already configured)
   - Click **Deploy**

4. **Done!** 🚀
   - Your app is live at `https://lifekit-[random].vercel.app`
   - Get a custom domain: Settings > Domains

### Configuration

The `vercel.json` file is already configured with:
- ✅ SPA routing (all routes → index.html)
- ✅ Service worker caching rules
- ✅ Build & dev commands
- ✅ Output directory settings

No additional setup needed!

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Ultra-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Dexie** - IndexedDB wrapper
- **React Router v6** - Client-side routing
- **Vite PWA Plugin** - Service worker & manifest

---

## Architecture

```
src/
├── pages/          # 5 page components (Tasks, Money, Contacts, Records, Settings, About)
├── components/     # Reusable UI (BottomNav, ErrorBoundary, ToastContainer, etc.)
├── context/        # React Context (ToastProvider)
├── utils/          # Helpers (validation, notifications, backup, currency, db)
├── db/             # Dexie database setup & schema
└── App.tsx         # Router setup
```

**Data Flow:**
1. User actions → Page component
2. Validation → `validation.ts`
3. DB operation → Dexie with error handling
4. Toast notification → `ToastProvider`
5. Undo available → 7-second window

---

## Storage

All data is stored locally in IndexedDB (browser):
- **Tasks** table (title, dueDate, completed, reminders)
- **Transactions** table (income/expense, categories, notes)
- **Contacts** table (name, phone, role, notes, WhatsApp links)
- **Records** table (file blobs, JPEG/PNG/GIF/PDF support, max 10MB)

**Backup & Restore:**
- Export: Settings → "Export All Data" → JSON file
- Import: Settings → "Import Backup" → JSON file

---

## Privacy

- 🔒 All data stays on YOUR device
- 🔒 No server uploads
- 🔒 No tracking, no analytics
- 🔒 Works offline 100%
- 🔒 Only you can see your data

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## PWA Install

**Desktop:**
1. Click the ⊕ (Install) icon in address bar
2. Or: Right-click → "Install app"

**Mobile:**
1. Chrome/Edge: Share button → "Install app"
2. Safari: Share → "Add to Home Screen"

---

## Contributing

This is a personal project. Feel free to fork and modify!

---

## License

MIT

---

**Made with ❤️ for people who value their data.**
