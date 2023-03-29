const sqlite3 = require('sqlite3').verbose();
import { Database } from 'sqlite3';
import { TableSchema } from '../interfaces/tableschema';

let database: any = null;

export async function databaseConnection(): Promise<Database> {
  return new Promise((resolve, reject) => {
    if (!database) {
      const databasePath = 'site.sqlite';
      database = new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: { message: any; }) => {
        if (err) {
          console.error(err.message);
          reject(err);
        }
        console.log('Connected to the database.');
        resolve(database);
      });
    } else {
      resolve(database);
    }
  });
}

export async function initializeTables(database: Database, tables: TableSchema[]): Promise<void> {
  const createTable = (table: TableSchema): Promise<void> => {
    return new Promise((resolve, reject) => {
      database.run(`CREATE TABLE IF NOT EXISTS ${table.name} ${table.schema}`, (err: { message: any; }) => {
        if (err) {
          console.error(`Error creating table ${table.name}:`, err.message);
          reject(err);
        } else {
          console.log(`Table ${table.name} created successfully.`);
          resolve();
        }
      });
    });
  };

  for (const table of tables) {
    await createTable(table);
  }
}