# Deployment Checklist for LifeKit

## Pre-Deployment ✅

- [ ] All tests pass: `npm run build` succeeds
- [ ] No console errors: Run `npm run dev` and check browser console
- [ ] App works offline: Toggle offline in DevTools > Network
- [ ] Data persists: Add data, refresh page, data still there
- [ ] PWA installs: Try installing on desktop/mobile
- [ ] Responsive: Check mobile (iPhone, Android)
- [ ] All pages load: Visit Tasks, Money, Contacts, Records, Settings, About
- [ ] Undo works: Delete something, click undo within 7 seconds
- [ ] Validation works: Try empty inputs, invalid amounts
- [ ] Export/Import: Test backup and restore

## Git Setup

```bash
# Initialize repository
git init
git add .
git commit -m "feat: Initial LifeKit PWA release

- 4 core modules: Tasks, Money, Contacts, Records
- Offline-first with IndexedDB
- Error boundaries & validation
- Undo delete functionality
- Multi-currency support
- Full data export/import"

# Create main branch
git branch -M main

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/lifekit.git

# Push to GitHub
git push -u origin main
```

## Vercel Deployment

1. **Login to Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "lifekit" repository
   - Framework auto-detects as Vite ✓
   - Root Directory: `.` ✓
   - Build Command: `npm run build` ✓
   - Output Directory: `dist` ✓
   - Environment Variables: (none needed)

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Visit your live URL

## Post-Deployment ✅

- [ ] Site loads at https://lifekit-xxx.vercel.app
- [ ] All pages accessible
- [ ] Works offline (disconnect internet in DevTools)
- [ ] Responsive on mobile
- [ ] PWA installs
- [ ] Data persists across refresh
- [ ] No console errors

## Custom Domain (Optional)

1. Go to Vercel Project Settings
2. Domains → "Add Domain"
3. Enter your domain (e.g., `mylifekit.com`)
4. Update domain DNS settings per Vercel instructions
5. SSL certificate auto-generated in ~24 hours

## Analytics (Optional)

Add Web Vitals in Vercel Dashboard:
- Settings → Web Analytics → Enable
- Tracks Lighthouse metrics automatically

## Rollback (If Needed)

In Vercel Dashboard:
1. Deployments tab
2. Find previous deployment
3. Click "..." → "Redeploy"

## Notes

- Builds take ~2-3 minutes
- Service worker updates automatically
- PWA cache busts on new deployment
- All data is client-side (no server cleanup needed)
- Free tier: includes 3 deployments/day + unlimited bandwidth

---

**First deployment typically takes 5-10 minutes total.**
