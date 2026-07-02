const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      classification TEXT NOT NULL,
      unit TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      date DATE NOT NULL,
      qty NUMERIC NOT NULL,
      doc_type TEXT,
      doc_number TEXT,
      party TEXT,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

initDb().then(() => console.log('DB ready')).catch(err => console.error('DB init failed', err));

// ---- API routes ----
app.get('/api/items', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM items ORDER BY created_at ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/items', async (req, res) => {
  try {
    const { id, code, name, classification, unit } = req.body;
    await pool.query(
      'INSERT INTO items (id, code, name, classification, unit) VALUES ($1,$2,$3,$4,$5)',
      [id, code, name, classification, unit]
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM transactions ORDER BY date ASC, created_at ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { id, itemId, type, date, qty, docType, docNumber, party, remarks } = req.body;
    await pool.query(
      `INSERT INTO transactions (id, item_id, type, date, qty, doc_type, doc_number, party, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, itemId, type, date, qty, docType, docNumber, party, remarks]
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- serve frontend build ----
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
