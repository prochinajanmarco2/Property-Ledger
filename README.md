# Property & Stock Ledger

A multi-user Property/Stock Card system with automatic RSMI/RSPI report generation.

## Deployment (Render, free tier)

1. Create a free PostgreSQL database on Render.
2. Create a free Web Service on Render, connect this repo.
3. Set the DATABASE_URL environment variable to the database's connection string.
4. Build command: `npm install`
5. Start command: `npm start`

The app will create its own tables automatically on first run.
