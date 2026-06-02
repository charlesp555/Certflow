# CertFlow — COI Compliance Intelligence

AI-powered certificate of insurance tracking for property managers.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + CSS Variables
- **Animations:** Framer Motion
- **Fonts:** IBM Plex Mono + Cabinet Grotesk (Google Fonts)
- **Deploy:** Vercel
- **Domain:** Namecheap → Cloudflare DNS → Vercel

## Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

## Project Structure

```
certflow/
├── app/
│   ├── components/
│   │   ├── Nav.tsx          # Sticky nav with mobile menu
│   │   ├── Dashboard.tsx    # Animated compliance dashboard (hero)
│   │   └── Footer.tsx       # Site footer
│   ├── pricing/
│   │   └── page.tsx         # Pricing page with FAQ
│   ├── early-access/
│   │   └── page.tsx         # Waitlist form
│   ├── globals.css          # CSS variables + Tailwind base
│   ├── layout.tsx           # Root layout + metadata
│   └── page.tsx             # Homepage
├── public/                  # Static assets
├── vercel.json              # Vercel config
├── tailwind.config.ts       # Tailwind + custom tokens
└── next.config.js           # Next.js config
```

## Deploying to Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/certflow.git
git push -u origin main

# 2. Go to vercel.com
# Import your GitHub repo
# Vercel auto-detects Next.js — just click Deploy

# 3. Add your domain
# In Vercel dashboard → Settings → Domains
# Add certflowapp.com
# Update DNS in Cloudflare to point to Vercel
```

## Next Steps (after validation)

- [ ] Connect Supabase for waitlist storage
- [ ] Add Resend for confirmation emails
- [ ] Build COI upload + Claude AI extraction
- [ ] Add Clerk authentication
- [ ] Connect Stripe for payments
