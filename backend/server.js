// ============================================================================
// Employee Management API — Std6730202246 IP Final Exam 2026
// All data stored in-memory (no database required)
// ============================================================================
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3024;

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Employee Data (Mock — 10 พนักงาน เงินเดือนกระจายตัวดี)
// ─────────────────────────────────────────────────────────────────────────────
let employees = [
  { id: 1,  name: 'สมชาย วงศ์สกุล',     position: 'CEO',              status: 'Active',   salary: 120000 },
  { id: 2,  name: 'วิภาวดี ศรีสมร',       position: 'Senior Developer', status: 'Active',   salary: 75000  },
  { id: 3,  name: 'ธนพล กิจเจริญ',       position: 'Developer',        status: 'Active',   salary: 55000  },
  { id: 4,  name: 'สุภาพร ศรีสุข',        position: 'Designer',         status: 'Active',   salary: 45000  },
  { id: 5,  name: 'อรุณ แสงเดือน',       position: 'HR Manager',       status: 'On Leave', salary: 48000  },
  { id: 6,  name: 'พิมพ์ชนก สว่างจิต',    position: 'Accountant',       status: 'Active',   salary: 38000  },
  { id: 7,  name: 'กมลทิพย์ ร่มเย็น',     position: 'Marketing',        status: 'Active',   salary: 32000  },
  { id: 8,  name: 'ปัณณ์ ภูมิพัฒน์',       position: 'CTO',              status: 'Active',   salary: 95000  },
  { id: 9,  name: 'นภัส คงทน',           position: 'Junior Developer', status: 'Active',   salary: 22000  },
  { id: 10, name: 'วิชัย ใจดี',            position: 'Intern',           status: 'Active',   salary: 15000  },
];

let nextId = 11;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/login — Authentication
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-token',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials — Unauthorized',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employees — List all employees
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employees — Add new employee (with validation → 400)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/employees', (req, res) => {
  const { name, position, salary } = req.body;

  // Validation: ห้ามว่าง
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!position || !String(position).trim()) {
    return res.status(400).json({ success: false, message: 'Position is required' });
  }
  if (salary === undefined || salary === null || salary === '' || isNaN(Number(salary))) {
    return res.status(400).json({ success: false, message: 'Valid salary is required' });
  }
  if (Number(salary) < 0) {
    return res.status(400).json({ success: false, message: 'Salary must be positive' });
  }

  const newEmployee = {
    id: nextId++,
    name: String(name).trim(),
    position: String(position).trim(),
    status: 'Active',
    salary: Number(salary),
  };

  employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/employees/:id/status — Toggle Active ↔ On Leave
// ─────────────────────────────────────────────────────────────────────────────
app.put('/api/employees/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
  res.json(employee);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/employees/:id — Delete employee
// ─────────────────────────────────────────────────────────────────────────────
app.delete('/api/employees/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = employees.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const deleted = employees.splice(index, 1)[0];
  res.json({ success: true, message: `Deleted ${deleted.name}` });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employees/salary-clusters — K-Means 1D (k=3) Salary Analysis
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/employees/salary-clusters', (req, res) => {
  if (employees.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Need at least 3 employees to perform clustering',
    });
  }

  const salaries = employees.map((e) => e.salary);
  const k = 3;

  // ── K-Means 1D Algorithm ──
  const sorted = [...salaries].sort((a, b) => a - b);
  let centroids = [
    sorted[0],
    sorted[Math.floor(sorted.length / 2)],
    sorted[sorted.length - 1],
  ];

  let assignments = new Array(salaries.length).fill(0);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 100) {
    changed = false;
    iterations++;

    // Assign each salary to nearest centroid
    for (let i = 0; i < salaries.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const dist = Math.abs(salaries[i] - centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Recalculate centroids
    for (let c = 0; c < k; c++) {
      const members = salaries.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        centroids[c] = members.reduce((sum, s) => sum + s, 0) / members.length;
      }
    }
  }

  // Build result — sort by centroid ascending
  const clusterResults = [];
  for (let c = 0; c < k; c++) {
    const memberEmployees = employees.filter((_, i) => assignments[i] === c);
    clusterResults.push({
      group: '',
      centroid: Math.round(centroids[c]),
      count: memberEmployees.length,
      members: memberEmployees.map((m) => ({ name: m.name, salary: m.salary, position: m.position })),
    });
  }

  clusterResults.sort((a, b) => a.centroid - b.centroid);
  clusterResults.forEach((cl, i) => {
    cl.group = `Tier ${i + 1}`;
  });

  console.log(`[K-Means] Converged in ${iterations} iterations, ${employees.length} employees → ${k} clusters`);

  res.json({
    success: true,
    clusters: clusterResults,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n★ Employee API Server running on port ${PORT}`);
  console.log(`  POST /api/login`);
  console.log(`  GET  /api/employees`);
  console.log(`  POST /api/employees`);
  console.log(`  PUT  /api/employees/:id/status`);
  console.log(`  DEL  /api/employees/:id`);
  console.log(`  GET  /api/employees/salary-clusters\n`);
});
