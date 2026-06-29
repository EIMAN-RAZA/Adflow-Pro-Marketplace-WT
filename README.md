# Adflow-Pro-Marketplace-WT
Service Marketplace with Gig Listings, Booking, Escrow Payments, Moderation, Scheduling, and Analytics.

## 🛠️ Tech Stack
### Frontend
- Framework: React 18 (UI Librry)
- Routing: React Router DOM v6
- HTTP Client: Axios
- Styling: Custom CSS

### Backend
- Runtime: Node.js
- Framework: Express.js
- Database: MongoDB (Mongoose)
- Authentication: JSON Web Tokens (JWT) & Bcryptjs
- Validation: express-validator
- Environment Variables: dotenv

---

## 📁 Folder Structure
```text
adflow-pro/
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Gig.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── Review.js
│   │   ├── Notification.js
│   │   ├── Dispute.js
│   │   └── Category.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── gigs.js
│   │   ├── provider.js
│   │   ├── client.js
│   │   ├── moderator.js
│   │   ├── admin.js
│   │   └── notifications.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── GigCard.js
    │   │   └── Badge.js
    │   │
    │   ├── context/
    │   │   └── AuthContext.js
    │   │
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Explore.js
    │   │   ├── GigDetail.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── ClientDashboard.js
    │   │   ├── ProviderDashboard.js
    │   │   ├── ModeratorDashboard.js
    │   │   └── AdminDashboard.js
    │   │
    │   ├── services/
    │   │   └── api.js
    │   │
    │   ├── styles/
    │   │   └── global.css
    │   │
    │   ├── App.js
    │   └── index.js
    │
    └── package.json
```
## 🚀 Commands to Run Properly
### Backend Setup
```bash
cd adflow-pro/backend
```
Install dependencies:
```bash
npm install
```
Run in development mode:
```bash
npm run dev
```

### Frontend Setup
```bash
cd adflow-pro/frontend
```
Install dependencies:
```bash
npm install
```
Start the dev server:
```bash
npm start
```


## Core Concepts
- Only approved services (gigs) are visible publicly
- Providers define pricing, delivery time, and service scope
- Clients place orders against gigs, not random listings
- Payments are handled using escrow-style verification (simulated)
- Orders follow a strict lifecycle workflow (order → progress → delivery → completion)
- Automation handles deadlines, reminders, completion, and system health

