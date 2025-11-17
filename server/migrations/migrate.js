import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306
};

const DB_NAME = process.env.DB_NAME || 'market_spoton_db';

class MigrationManager {
  constructor() {
    this.connection = null;
    this.migrationsPath = path.join(__dirname, '../src/migrations');
    this.seedersPath = path.join(__dirname, '../src/seeders');
  }

  async connect() {
    this.connection = await mysql.createConnection(config);
    console.log('✓ Connected to MySQL server');
  }

  async createDatabase() {
    await this.connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await this.connection.query(`USE ${DB_NAME}`);
    console.log(`✓ Database '${DB_NAME}' ready`);
  }

  async createMigrationsTable() {
    await this.connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getExecutedMigrations() {
    const [rows] = await this.connection.query(
      'SELECT migration_name FROM migrations ORDER BY id'
    );
    return rows.map(row => row.migration_name);
  }

  async getMigrationFiles() {
    const files = await fs.readdir(this.migrationsPath);
    return files.filter(f => f.endsWith('.js')).sort();
  }

  async runMigration(file) {
    console.log(`Running migration: ${file}`);
    const migrationPath = path.join(this.migrationsPath, file);
    const migrationModule = await import(pathToFileURL(migrationPath).href);
    const migration = migrationModule.default ?? migrationModule;

    if (migration.up) {
      await migration.up(this.connection);
      await this.connection.query(
        'INSERT INTO migrations (migration_name) VALUES (?)',
        [file]
      );
      console.log(`✓ Migration completed: ${file}`);
    }
  }

  async rollbackMigration(file) {
    console.log(`Rolling back migration: ${file}`);
    const migrationPath = path.join(this.migrationsPath, file);
    const migrationModule = await import(pathToFileURL(migrationPath).href);
    const migration = migrationModule.default ?? migrationModule;

    if (migration.down) {
      await migration.down(this.connection);
      await this.connection.query(
        'DELETE FROM migrations WHERE migration_name = ?',
        [file]
      );
      console.log(`✓ Rollback completed: ${file}`);
    }
  }

  async runSeeders() {
    const files = await fs.readdir(this.seedersPath);
    const seederFiles = files.filter(f => f.endsWith('.js')).sort();
    
    for (const file of seederFiles) {
      console.log(`Running seeder: ${file}`);
      const seederPath = path.join(this.seedersPath, file);
      const seederModule = await import(pathToFileURL(seederPath).href);
      const seeder = seederModule.default ?? seederModule;
      if (seeder.seed) {
        await seeder.seed(this.connection);
        console.log(`✓ Seeder completed: ${file}`);
      } else if (typeof seeder === 'function') {
        // support exported function
        await seeder(this.connection);
        console.log(`✓ Seeder completed: ${file}`);
      }
    }
  }

  async up() {
    const executed = await this.getExecutedMigrations();
    const allMigrations = await this.getMigrationFiles();
    const pending = allMigrations.filter(m => !executed.includes(m));

    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }

    for (const migration of pending) {
      await this.runMigration(migration);
    }
  }

  async down() {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }

    const lastMigration = executed[executed.length - 1];
    await this.rollbackMigration(lastMigration);
  }

  async fresh() {
    console.log('⚠ Dropping database and recreating...');
    await this.connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    await this.createDatabase();
    await this.createMigrationsTable();
    await this.up();
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

// CLI Handler
(async () => {
  const command = process.argv[2] || 'up';
  const manager = new MigrationManager();

  try {
    await manager.connect();
    await manager.createDatabase();
    await manager.createMigrationsTable();

    switch (command) {
      case 'up':
        await manager.up();
        break;
      case 'down':
        await manager.down();
        break;
      case 'fresh':
        await manager.fresh();
        break;
      case 'seed':
        await manager.runSeeders();
        break;
      default:
        console.log('Usage: node migrate.js [up|down|fresh|seed]');
    }

    console.log('\n✓ Migration process completed successfully\n');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await manager.close();
  }
)();