const express = require("express");
const { Pool } = require("pg");
const nanoid = require("nanoid").nanoid;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Database connection ── */
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "urlshortener",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

/* ── Create table if it does not exist ── */
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id          SERIAL PRIMARY KEY,
      short_code  VARCHAR(10)  UNIQUE NOT NULL,
      original_url TEXT        NOT NULL,
      created_at  TIMESTAMP    DEFAULT NOW(),
      clicks      INTEGER      DEFAULT 0
    )
  `);
  console.log("Database initialised");
}

/* ── Middleware ── */
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

/* ── Routes ── */

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Create a short URL
app.post("/api/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    const short_code = nanoid(6);
    const result = await pool.query(
      "INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING short_code, created_at",
      [short_code, url],
    );
    return res.status(201).json({
      short_code: result.rows[0].short_code,
      short_url: `${process.env.BASE_URL || ""}/${result.rows[0].short_code}`,
      original_url: url,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("Error creating short URL:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all URLs (for history display)
app.get("/api/urls", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT short_code, original_url, clicks, created_at FROM urls ORDER BY created_at DESC LIMIT 50",
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Error fetching URLs:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a short URL
app.delete("/api/urls/:short_code", async (req, res) => {
  const { short_code } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM urls WHERE short_code = $1 RETURNING short_code",
      [short_code],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "URL not found" });
    }
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Error deleting URL:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Redirect short URL → original URL  (must be last)
app.get("/:short_code", async (req, res) => {
  const { short_code } = req.params;

  // Skip static asset requests
  if (short_code === "favicon.ico") return res.status(204).end();

  try {
    const result = await pool.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1 RETURNING original_url",
      [short_code],
    );
    if (result.rowCount === 0) {
      return res.status(404).send("Short URL not found");
    }
    return res.redirect(result.rows[0].original_url);
  } catch (err) {
    console.error("Error redirecting:", err.message);
    return res.status(500).send("Server error");
  }
});

/* ── Start ── */
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to initialise DB:", err.message);
    process.exit(1);
  });
