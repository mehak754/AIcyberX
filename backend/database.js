const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './aicyberx.db';
const db = new Database(path.resolve(dbPath));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    phone         TEXT,
    institution   TEXT,
    grade         TEXT,
    city          TEXT,
    password_hash TEXT    NOT NULL,
    avatar_color  TEXT    DEFAULT '#00d4ff',
    bio           TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME
  );

  CREATE TABLE IF NOT EXISTS workshops (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    title             TEXT NOT NULL,
    description       TEXT,
    date              TEXT,
    time              TEXT,
    location          TEXT,
    image_url         TEXT DEFAULT '/assets/images/workshop-placeholder.jpg',
    category          TEXT DEFAULT 'ai',
    tags              TEXT,
    seats_total       INTEGER DEFAULT 50,
    seats_filled      INTEGER DEFAULT 0,
    registration_link TEXT,
    is_active         INTEGER DEFAULT 1,
    is_featured       INTEGER DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id    INTEGER REFERENCES students(id) ON DELETE CASCADE,
    workshop_id   INTEGER REFERENCES workshops(id) ON DELETE CASCADE,
    status        TEXT DEFAULT 'confirmed',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, workshop_id)
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT,
    phone      TEXT,
    school     TEXT,
    message    TEXT,
    type       TEXT DEFAULT 'general',
    status     TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS community_joins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT,
    email      TEXT,
    phone      TEXT,
    city       TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Seed Sample Workshops ─────────────────────────────────────────────────────

const workshopCount = db.prepare('SELECT COUNT(*) as c FROM workshops').get().c;
if (workshopCount === 0) {
  const insert = db.prepare(`
    INSERT INTO workshops (title, description, date, time, location, category, tags, seats_total, is_featured)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  const seedWorkshops = [
    [
      'Intro to AI & Machine Learning',
      'Discover how AI thinks! Hands-on session covering neural networks, image recognition, and voice AI demos. No coding experience needed.',
      '2024-07-15', '10:00 AM', 'Online / Zoom', 'ai', 'beginner,ai,ml', 60, 1
    ],
    [
      'Cybersecurity Awareness Bootcamp',
      'Learn how hackers think! Password cracking demos, phishing simulations, and how to protect yourself online.',
      '2024-07-22', '11:00 AM', 'Online / Zoom', 'cyber', 'cyber,hacking,awareness', 50, 1
    ],
    [
      'AI Image Generation Workshop',
      'Create stunning AI art! Explore tools like Stable Diffusion and DALL-E. Perfect for creative students.',
      '2024-08-05', '3:00 PM', 'Online / Zoom', 'ai', 'ai,image,creative', 40, 0
    ],
    [
      'Ethical Hacking for Beginners',
      'Understand the fundamentals of cybersecurity. Learn how networks work and common attack vectors in a safe environment.',
      '2024-08-12', '2:00 PM', 'Online / Zoom', 'cyber', 'cyber,hacking,network', 35, 0
    ],
    [
      'AIcyberX Summer Tech Challenge',
      'Annual innovation competition combining AI creativity and cybersecurity awareness. Prizes, certificates, and recognition for winners!',
      '2024-08-20', '9:00 AM', 'Online', 'competition', 'competition,ai,cyber,prize', 100, 1
    ],
    [
      'Voice AI & NLP Hands-on Session',
      'Build your own voice assistant! Explore Natural Language Processing, chatbots, and real-time voice cloning demos.',
      '2024-09-02', '4:00 PM', 'Online / Zoom', 'ai', 'ai,voice,nlp,chatbot', 45, 0
    ],
  ];
  seedWorkshops.forEach(w => insert.run(...w));
  console.log('✅ Sample workshops seeded');
}

module.exports = db;
