import { Database } from 'sqlite';
import { setupDatabase } from './setup';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await setupDatabase();
  }
  return db;
}
