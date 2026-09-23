# PayTrack 🚀
### Freelancer Invoice & Payment Tracker

> Built for hackathons: Clean, production-quality, fast, and packed with unique judge-delight features.

---

## ⚡ 2-Minute Judge Demo Guide

1. **Launch**:
   - Backend runs on `http://localhost:5000`
   - Frontend runs on `http://localhost:5173`
2. **Instant Demo Login**:
   - On the login screen, click **"Launch 1-Click Demo"** to log in as **Alex Morgan** (pre-seeded with 5 clients, 12 invoices across 6 months, and payment history).
3. **Explore Dashboard**:
   - 4 summary KPI cards (Total Earned, Total Outstanding, Overdue Amount, Active Clients).
   - **Freelancer Health Score Widget**: Circular progress ring showing 92% health score with on-time payment metrics and cash flow insights.
   - Monthly earnings area trend chart, Paid vs. Pending bar chart, and status donut chart.
4. **Try Micro-Interactions**:
   - Find any pending invoice in the Recent Invoices table and click **"Mark Paid"**.
   - Pick the payment method and date, then hit **Confirm Payment** to see a celebratory confetti explosion (`canvas-confetti`), toast notification, and instant badge update!
5. **Add a Client & Compose an Invoice**:
   - Go to **Clients** -> click **+ Add New Client** (opens a clean modal without page refresh).
   - Go to **Invoices** -> click **+ Create New Invoice**.
   - Select client, pick dates (try the quick `+7d` or `+14d` preset buttons), add items with quantities and rates, and watch the **Live Real-time Invoice Preview** update side-by-side as you type!
6. **Print / Export PDF**:
   - Open any invoice and click **Print / Save PDF** — clean dedicated print styling formats the invoice into a formal document with watermark stamps.
7. **Payment History & CSV Export**:
   - Visit **Payment History** and click **Export to CSV** to download a formatted transaction ledger.
8. **Reset Demo Data Anytime**:
   - Click the **Reset** button in the sidebar or mobile menu to return the workspace to its clean initial demo state.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Canvas-Confetti
- **Backend**: Node.js, Express, SQLite (using Node 24 native `node:sqlite`), JWT authentication, bcryptjs
- **Design System**: Cohesive indigo/slate palette, soft shadows, rounded-2xl cards, pill badges with subtle tints, and fully responsive layouts (mobile drawer & adaptive tables).

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
# In backend/
cd backend
npm install

# In frontend/
cd ../frontend
npm install
```

### 2. Start Servers
```bash
# Terminal 1: Backend
cd backend
npm start
# Running at http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Running at http://localhost:5173
```
