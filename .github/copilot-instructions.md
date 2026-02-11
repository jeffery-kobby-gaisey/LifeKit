# LifeKit PWA Development

**Project:** Offline-first Personal Management PWA  
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Dexie (IndexedDB)  
**Architecture:** Fully offline, no backend required

## MVP Scope (LOCKED)

- **4 Tabs:** Tasks, Money, Contacts, Records
- **Offline-only:** No backend, full PWA
- **Local storage:** IndexedDB + Dexie
- **Security:** PIN lock + encryption

## Development Guidelines

1. Follow PHASE-by-PHASE approach (see below)
2. Each phase produces a working feature
3. Do NOT add features beyond the 4 modules
4. Test offline before moving to next phase
5. Keep UI text-first and minimal

## Build Checklist

### PHASE 1: Foundation
- [ ] Vite + React + TypeScript
- [ ] Tailwind CSS
- [ ] React Router (4 routes)
- [ ] Bottom navigation
- [ ] PWA shell ready

### PHASE 2: PWA Offline
- [ ] Service worker
- [ ] App manifest
- [ ] Cache strategy
- [ ] Offline test passing

### PHASE 3: Database
- [ ] Dexie setup
- [ ] Tables: transactions, tasks, contacts, records
- [ ] CRUD helpers

### PHASE 4: Tasks
- [ ] Add/list/toggle/delete
- [ ] "Today" filter
- [ ] Notifications

### PHASE 5: Money
- [ ] Income/expense
- [ ] Categories
- [ ] Daily/weekly totals

### PHASE 6: Contacts
- [ ] Add/list/call
- [ ] WhatsApp deep link

### PHASE 7: Records
- [ ] File upload (image/PDF)
- [ ] IndexedDB blob storage
- [ ] Viewer

### PHASE 8: Security
- [ ] PIN lock
- [ ] Encryption

### PHASE 9: Polish
- [ ] Performance
- [ ] UX rules (≤2 taps)
- [ ] Dark mode

### PHASE 10: Launch
- [ ] Full offline test
- [ ] Deploy
- [ ] Share link

## Quick Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```
