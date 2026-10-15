# Std0202246IPFinal2026

## Employee Management System — IP Final Exam 2026

**นิสิต:** นรุสรณ์ เรืองโชติ  
**รหัส:** 6730202246 (เลข 7 ตัวท้าย: 0202246)  
**วิชา:** Internet Programming  
**มหาวิทยาลัย:** มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา  
**Database Table:** `NarRue_6730202246` (Database: `ip_std6730202246`)  

---

### Tech Stack
- **Backend:** Node.js + Express.js + MySQL (with In-memory fallback mode)
- **Frontend:** React Native (Expo)
- **AI/ML:** 1D K-Means Clustering (k=3) สำหรับวิเคราะห์โครงสร้างเงินเดือน 3 ระดับ (Tier 1, Tier 2, Tier 3)

### Project Structure
```
Std0202246IPFinal2026/
├── backend/          # Express.js API Server
│   ├── server.js     # Main server with CRUD & K-Means endpoints
│   ├── database.sql  # SQL Table schema for NarRue_6730202246
│   ├── package.json
│   └── .env
├── frontend/         # React Native (Expo) App
│   ├── src/app/      # App screens (Login, Dashboard)
│   └── package.json
├── .gitignore
└── README.md
```

### Getting Started

#### 1. Backend
```bash
cd backend
npm install
node server.js
# Server runs on port 3024
```

#### 2. Frontend
```bash
cd frontend
npm install
npx expo start
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/login | Login (admin / password123) |
| GET | /api/employees | List all employee records |
| POST | /api/employees | Add new employee (Validation 400) |
| PUT | /api/employees/:id/status | Toggle status (Active ↔ On Leave) |
| DELETE | /api/employees/:id | Delete employee |
| GET | /api/employees/salary-clusters | K-Means salary clustering analysis (k=3) |

### Login Credentials
- **Username:** `admin`
- **Password:** `password123`
