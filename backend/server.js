// ============================================================================
// Employee Management API — Std0202246 IP Final Exam 2026
// Table Name: NarRue_Employees (Database: ip_std6730202246)
// With automatic graceful fallback to In-Memory storage if MySQL is offline
// ============================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3024;
const TABLE_NAME = process.env.TABLE_NAME || 'NarRue_Employees';

// ─────────────────────────────────────────────────────────────────────────────
// Initial Mock Data (10 Employees across salary ranges)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_EMPLOYEES = [
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

let inMemoryEmployees = [...INITIAL_EMPLOYEES.map((e) => ({ ...e }))];
let inMemoryNextId = 11;
let isDbConnected = false;
let dbPool = null;

// ─────────────────────────────────────────────────────────────────────────────
// MySQL Connection & Table Initialization
// ─────────────────────────────────────────────────────────────────────────────
async function initDatabase() {
  try {
    dbPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'std6730202246',
      password: process.env.DB_PASSWORD || 'o7WmZp@8',
      database: process.env.DB_NAME || 'ip_std6730202246',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const conn = await dbPool.getConnection();
    console.log(`[DB] Connected to MySQL database: ${process.env.DB_NAME || 'ip_std6730202246'}`);

    // Create table NarRue_Employees if it does not exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`position\` VARCHAR(100) NOT NULL,
        \`status\` ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
        \`salary\` DECIMAL(12, 2) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if table has data, if empty seed mock data
    const [rows] = await conn.query(`SELECT COUNT(*) AS count FROM \`${TABLE_NAME}\``);
    if (rows[0].count === 0) {
      console.log(`[DB] Table ${TABLE_NAME} is empty. Seeding initial 10 employees...`);
      for (const emp of INITIAL_EMPLOYEES) {
        await conn.query(
          `INSERT INTO \`${TABLE_NAME}\` (\`name\`, \`position\`, \`status\`, \`salary\`) VALUES (?, ?, ?, ?)`,
          [emp.name, emp.position, emp.status, emp.salary]
        );
      }
      console.log(`[DB] Seeding complete!`);
    }

    conn.release();
    isDbConnected = true;
    console.log(`[DB] Table \`${TABLE_NAME}\` is ready and active!`);
  } catch (err) {
    console.warn(`[DB WARNING] Could not connect to MySQL (${err.message}).`);
    console.log(`[DB INFO] Running in In-Memory fallback mode.`);
    isDbConnected = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/login — Authentication (Phase 1)
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
// GET /api/employees — Return all employee records
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/employees', async (req, res) => {
  if (isDbConnected && dbPool) {
    try {
      const [rows] = await dbPool.query(
        `SELECT id, name, position, status, CAST(salary AS DOUBLE) AS salary FROM \`${TABLE_NAME}\` ORDER BY id ASC`
      );
      return res.json(rows);
    } catch (err) {
      console.error('[DB ERROR] Fetch employees:', err.message);
    }
  }

  res.json(inMemoryEmployees);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employees — Add a new employee (Validation -> 400 Bad Request)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/employees', async (req, res) => {
  const { name, position, salary } = req.body;

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

  const cleanName = String(name).trim();
  const cleanPos = String(position).trim();
  const numSalary = Number(salary);

  if (isDbConnected && dbPool) {
    try {
      const [result] = await dbPool.query(
        `INSERT INTO \`${TABLE_NAME}\` (name, position, status, salary) VALUES (?, ?, 'Active', ?)`,
        [cleanName, cleanPos, numSalary]
      );
      return res.status(201).json({
        id: result.insertId,
        name: cleanName,
        position: cleanPos,
        status: 'Active',
        salary: numSalary,
      });
    } catch (err) {
      console.error('[DB ERROR] Add employee:', err.message);
    }
  }

  // In-Memory
  const newEmp = {
    id: inMemoryNextId++,
    name: cleanName,
    position: cleanPos,
    status: 'Active',
    salary: numSalary,
  };
  inMemoryEmployees.push(newEmp);
  res.status(201).json(newEmp);
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/employees/:id/status — Toggle status (Active <-> On Leave)
// ─────────────────────────────────────────────────────────────────────────────
const handleStatusToggle = async (req, res) => {
  const id = req.params.id;

  if (isDbConnected && dbPool) {
    try {
      const [rows] = await dbPool.query(
        `SELECT * FROM \`${TABLE_NAME}\` WHERE id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const newStatus = rows[0].status === 'Active' ? 'On Leave' : 'Active';
      await dbPool.query(
        `UPDATE \`${TABLE_NAME}\` SET status = ? WHERE id = ?`,
        [newStatus, id]
      );

      return res.json({
        id: rows[0].id,
        name: rows[0].name,
        position: rows[0].position,
        status: newStatus,
        salary: Number(rows[0].salary),
      });
    } catch (err) {
      console.error('[DB ERROR] Toggle status:', err.message);
    }
  }

  // In-Memory
  const emp = inMemoryEmployees.find((e) => String(e.id) === String(id));
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  emp.status = emp.status === 'Active' ? 'On Leave' : 'Active';
  res.json(emp);
};

app.put('/api/employees/:id/status', handleStatusToggle);
app.post('/api/employees/:id/status', handleStatusToggle);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/employees/:id — Edit Employee (Name, Position, Salary, Status)
// ─────────────────────────────────────────────────────────────────────────────
const handleUpdate = async (req, res) => {
  const id = req.params.id;
  const { name, position, salary, status } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!position || !String(position).trim()) {
    return res.status(400).json({ success: false, message: 'Position is required' });
  }
  if (salary === undefined || salary === null || isNaN(Number(salary)) || Number(salary) < 0) {
    return res.status(400).json({ success: false, message: 'Valid positive salary is required' });
  }

  const cleanName = String(name).trim();
  const cleanPos = String(position).trim();
  const numSalary = Number(salary);
  const cleanStatus = status === 'On Leave' ? 'On Leave' : 'Active';

  if (isDbConnected && dbPool) {
    try {
      await dbPool.query(
        `UPDATE \`${TABLE_NAME}\` SET name = ?, position = ?, salary = ?, status = ? WHERE id = ?`,
        [cleanName, cleanPos, numSalary, cleanStatus, id]
      );
      return res.json({
        id: Number(id),
        name: cleanName,
        position: cleanPos,
        status: cleanStatus,
        salary: numSalary,
      });
    } catch (err) {
      console.error('[DB ERROR] Update employee:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // In-Memory
  const emp = inMemoryEmployees.find((e) => String(e.id) === String(id));
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  emp.name = cleanName;
  emp.position = cleanPos;
  emp.salary = numSalary;
  emp.status = cleanStatus;
  res.json(emp);
};

app.put('/api/employees/:id', handleUpdate);
app.post('/api/employees/:id/edit', handleUpdate);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/employees/:id — Remove employee
// ─────────────────────────────────────────────────────────────────────────────
const handleDelete = async (req, res) => {
  const id = req.params.id;
  console.log(`[DELETE] Request to delete employee id: ${id}`);

  if (isDbConnected && dbPool) {
    try {
      const [rows] = await dbPool.query(
        `SELECT name FROM \`${TABLE_NAME}\` WHERE id = ?`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      await dbPool.query(`DELETE FROM \`${TABLE_NAME}\` WHERE id = ?`, [id]);
      console.log(`[DELETE] Deleted ${rows[0].name} (ID: ${id}) from DB`);
      return res.json({
        success: true,
        message: `Deleted ${rows[0].name}`,
      });
    } catch (err) {
      console.error('[DB ERROR] Delete employee:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // In-Memory
  const idx = inMemoryEmployees.findIndex((e) => String(e.id) === String(id));
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const deleted = inMemoryEmployees.splice(idx, 1)[0];
  console.log(`[DELETE] Deleted ${deleted.name} (ID: ${id}) from Memory`);
  res.json({
    success: true,
    message: `Deleted ${deleted.name}`,
  });
};

app.delete('/api/employees/:id', handleDelete);
app.post('/api/employees/:id/delete', handleDelete);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employees/salary-clusters — Phase 2: 1D K-Means Clustering (k=3)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/employees/salary-clusters', async (req, res) => {
  let employeeList = inMemoryEmployees;

  if (isDbConnected && dbPool) {
    try {
      const [rows] = await dbPool.query(
        `SELECT id, name, position, status, CAST(salary AS DOUBLE) as salary FROM \`${TABLE_NAME}\``
      );
      employeeList = rows;
    } catch (err) {
      console.error('[DB ERROR] Cluster query:', err.message);
    }
  }

  if (employeeList.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Need at least 3 employees to perform clustering',
    });
  }

  const salaries = employeeList.map((e) => Number(e.salary));
  const k = 3;

  // 1D K-Means Algorithm
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

    for (let c = 0; c < k; c++) {
      const members = salaries.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        centroids[c] = members.reduce((sum, s) => sum + s, 0) / members.length;
      }
    }
  }

  const clusterResults = [];
  for (let c = 0; c < k; c++) {
    const memberEmployees = employeeList.filter((_, i) => assignments[i] === c);
    clusterResults.push({
      group: '',
      centroid: Math.round(centroids[c]),
      count: memberEmployees.length,
      members: memberEmployees.map((m) => ({
        id: m.id,
        name: m.name,
        salary: Number(m.salary),
        position: m.position,
        status: m.status,
      })),
    });
  }

  clusterResults.sort((a, b) => a.centroid - b.centroid);
  clusterResults.forEach((cl, i) => {
    cl.group = `Tier ${i + 1}`;
  });

  res.status(200).json({
    success: true,
    clusters: clusterResults,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n========================================================`);
  console.log(`★ HR Employee Server running on http://localhost:${PORT}`);
  console.log(`  Table Name : ${TABLE_NAME}`);
  console.log(`  Endpoints  :`);
  console.log(`  - POST   /api/login`);
  console.log(`  - GET    /api/employees`);
  console.log(`  - POST   /api/employees`);
  console.log(`  - PUT    /api/employees/:id (Edit)`);
  console.log(`  - PUT    /api/employees/:id/status`);
  console.log(`  - DELETE /api/employees/:id`);
  console.log(`  - GET    /api/employees/salary-clusters`);
  console.log(`========================================================\n`);

  await initDatabase();
});
