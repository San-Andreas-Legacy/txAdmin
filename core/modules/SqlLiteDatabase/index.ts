import { txEnv } from '@core/globalData';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const dbPath = path.resolve(txEnv.profilePath, 'data/reportsDB.db');

export class DB {
    private static instance: DatabaseSync;

    static getInstance(): DatabaseSync {
        if (!this.instance) {
            // Node v22 built-in SQLite (Sync API)
            this.instance = new DatabaseSync(dbPath);
            
            // Setting journal mode via exec
            this.instance.exec('PRAGMA journal_mode = WAL;');
        }
        return this.instance;
    }

    constructor() {}

    /**
     * Executes a SELECT query and returns all rows
     */
    query<T>(sql: string, params: any[] = []): T[] {
        const stmt = DB.getInstance().prepare(sql);
        return stmt.all(...params) as T[];
    }

    /**
     * Dynamically inserts data into a table
     */
    insert(table: string, data: Record<string, any>) {
        const keys = Object.keys(data);
        const columns = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(data);

        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        const stmt = DB.getInstance().prepare(sql);
        
        return stmt.run(...values);
    }
    
    /**
     * Useful for one-off executions like CREATE TABLE
     */
    exec(sql: string) {
        return DB.getInstance().exec(sql);
    }
}

/* Initialize base tables */

const db = new DB();

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY, -- uuid
        reporter_license TEXT,
        reporter_name TEXT,
        subject TEXT,
        status TEXT,
        ts_opened DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%S', 'now')),
        ts_lastaction DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%S', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS reports_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL,
        author_license TEXT NOT NULL,
        author_name TEXT,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%S', 'now')),
        FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_messages_report ON reports_messages(report_id);`
);
