# Std6730202246IPFinal2026

## Employee Management System — IP Final Exam 2026

**นิสิต:** นรุสรณ์ เรืองโชติ  
**รหัส:** 6730202246  
**วิชา:** Internet Programming  
**มหาวิทยาลัย:** มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา

---

### Tech Stack
- **Backend:** Node.js + Express.js (In-memory data storage)
- **Frontend:** React Native (Expo)
- **AI/ML:** K-Means Clustering (1D, k=3) สำหรับวิเคราะห์โครงสร้างเงินเดือน

### Project Structure
```
Std6730202246IPFinal2026/
├── backend/          # Express.js API Server
│   ├── server.js     # Main server with all endpoints
│   └── package.json
├── frontend/         # React Native (Expo) App
│   ├── src/app/      # App screens (Login, Dashboard)
│   └── package.json
└── README.md
```

### Getting Started

#### Backend
```bash
cd backend
npm install
node server.js
# Server runs on port 3024
```

#### Frontend
```bash
cd frontend
npx expo start
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login | Login (admin / password123) |
| GET | /api/employees | List all employees |
| POST | /api/employees | Add new employee |
| PUT | /api/employees/:id/status | Toggle Active ↔ On Leave |
| DELETE | /api/employees/:id | Delete employee |
| GET | /api/employees/salary-clusters | K-Means salary analysis (k=3) |

### Login Credentials
- **Username:** `admin`
- **Password:** `password123`
