import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

export async function setupDatabase(): Promise<Database> {
  const db = await open({
    filename: path.join(__dirname, 'appointments.db'),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctor_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id TEXT NOT NULL,
      weekday INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT CHECK(status IN ('confirmed', 'pending', 'cancelled', 'blocked')) NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_modified_by TEXT NOT NULL,
      recurring_pattern_id TEXT,
      FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    );

    CREATE TABLE IF NOT EXISTS recurring_patterns (
      id TEXT PRIMARY KEY,
      frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
      interval_value INTEGER NOT NULL,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recurring_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_id TEXT NOT NULL,
      exception_date DATETIME NOT NULL,
      FOREIGN KEY (pattern_id) REFERENCES recurring_patterns (id)
    );
  `);

  return db;
}
