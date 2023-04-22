const sqlite3 = require('sqlite3').verbose();
import path from 'path';
import { Database } from 'sqlite3';
import { TableSchema } from '../interfaces/tableschema';
import { tableSchemas } from './tables';
import { MessageType, statusMessage } from './console';

let database: any = null;

export async function databaseConnection(): Promise<Database> {
    return new Promise((resolve, reject) => {
        if (!database) {
            const databasePath = path.join(process.cwd(),'./target/site.sqlite');
            database = new sqlite3.Database(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: { message: any; }) => {
                if (err) {
                    statusMessage(MessageType.Error, `Error connecting to the database: ${err.message}`);
                    reject(err);
                }
                statusMessage(MessageType.Info, `Connected to the database`)
                resolve(database);
            });
        } else {
            resolve(database);
        }
    });
}

export async function initializeTables(database: Database): Promise<void> {
    const createTable = (table: TableSchema): Promise<void> => {
        return new Promise((resolve, reject) => {
            const columns = table.schema.join(", ");
            database.run(
                `CREATE TABLE IF NOT EXISTS ${table.name} (${columns})`,
                (err: { message: any }) => {
                    if (err) {
                        statusMessage(MessageType.Error, `Error creating table '${table.name}': ${err.message}`);
                        reject(err);
                    } else {
                        statusMessage(MessageType.Completion, `Table '${table.name}' created successfully`);
                        resolve();
                    }
                }
            );
        });
    };

    for (const table of tableSchemas) {
        await createTable(table);
    }
}

export async function queryTable(database: Database, table: String): Promise<void> {
    return new Promise((resolve, reject) => {
        database.all(`SELECT * FROM ${table}`, (err: Error | null, rows: any[]) => {
            if (err) {
                statusMessage(MessageType.Error, `Error querying table '${table}': ${err.message}`);
                reject();
            } else {
                statusMessage(MessageType.Plain, `${rows}`);
                resolve();
            }
        });
    });
}

export async function queryModuleIDs(database: Database, moduleType: string): Promise<string[]> {
    const moduleIDs: string[] = await new Promise((resolve, reject) => {
        database.all('SELECT preset_id FROM presets WHERE module_type = ?', [moduleType],
            (err, rows: [{preset_id: string}]) => {
                if (err) {
                    reject(err);
                } else {
                    const moduleIDs = rows.map(row => row.preset_id);
                    resolve(moduleIDs);
                }
            });
    });
    return moduleIDs;
}


export async function insertRow(database: Database, table: string, ...params: (string | number | boolean | null)[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const values = new Array(params.length).fill('?').join(', ');
        try {
            const statement = database.prepare(`INSERT OR REPLACE INTO ${table} VALUES (${values})`);
            statement.run(...params, (err: any) => {
                if (err) {
                    statusMessage(MessageType.Error, `Error inserting into table '${table}' with params [${params.join(', ')}]: ${err.message}`);
                    reject(err);
                } else {
                    statusMessage(MessageType.Plain, `Inserted ${params[0]} into table '${table}'`);
                    resolve();
                }
                statement.finalize(); // finalize the statement to release resources
            });
        } catch (err: any) {
            statusMessage(MessageType.Error, `Error preparing statement for table '${table}': ${err.message}`);
            reject(err);
        }
    });
}

export async function updateRow(database: Database, table: string, whereKey: string, whereValue: string, updateKeys: string[], updateValues: (string | number | boolean | null)[]): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const setClause = updateKeys.map((key, _index) => `${key} = ?`).join(', ');
            const statement = database.prepare(`UPDATE ${table} SET ${setClause} WHERE ${whereKey} = ?`);

            const allParams = [...updateValues, whereValue];

            statement.run(allParams, (err: any) => {
                if (err) {
                    statusMessage(MessageType.Error, `Error updating row in table '${table}' with whereKey '${whereKey}' and whereValue '${whereValue}': ${err.message}`);
                    reject(err);
                } else {
                    statusMessage(MessageType.Plain, `Updated row with '${whereKey}' = '${whereValue}' in table '${table}'`);
                    resolve();
                }
                statement.finalize(); // finalize the statement to release resources
            });
        } catch (err: any) {
            statusMessage(MessageType.Error, `Error preparing statement for table '${table}': ${err.message}`);
            reject(err);
        }
    });
}

export async function insertRows(database: Database, table: string, rows: (string | number | boolean | null)[][]): Promise<void> {
    return new Promise((resolve, reject) => {
        if ( !rows.length ) {
            statusMessage(MessageType.Plain, `Ignoring insertion of 0 rows into table '${table}'`);
            resolve();
        }
        const values = new Array(rows[0].length).fill('?').join(', ');
        const sql = `INSERT OR REPLACE INTO ${table} VALUES (${values})`;

        database.serialize(() => {
            database.run("BEGIN TRANSACTION");
            for (const row of rows) {
                database.run(sql, row, (err) => {
                    if (err) {
                        statusMessage(MessageType.Error, `Error inserting row into table '${table}': ${err.message}`);
                        reject(err);
                    }
                });
            }
            database.run("COMMIT", (err) => {
                if (err) {
                    statusMessage(MessageType.Error, `Error committing transaction on table '${table}': ${err.message}`);
                    reject(err);
                } else {
                    statusMessage(MessageType.Plain, `Inserted ${rows.length} rows into table '${table}'`);
                    resolve();
                }
            });
        });
    });
}

export async function updateRows(database: Database, table: string, whereKey: string, whereValues: (string | number | boolean | null)[], updateKeys: string[], updateValues: (string | number | boolean | null)[][]): Promise<void> {
    return new Promise((resolve, reject) => {
        const setClause = updateKeys.map((key) => `${key} = ?`).join(', ');
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereKey} = ?`;

        database.serialize(() => {
            database.run("BEGIN TRANSACTION");
            for (let i = 0; i < whereValues.length; i++) {
                const allParams = [...updateValues[i], whereValues[i]];
                database.run(sql, allParams, (err) => {
                    if (err) {
                        statusMessage(MessageType.Error, `Error updating row in table '${table}' with whereKey '${whereKey}' and whereValue '${whereValues[i]}': ${err.message}`);
                        reject(err);
                    }
                });
            }
            database.run("COMMIT", (err) => {
                if (err) {
                    statusMessage(MessageType.Error, `Error committing transaction on table '${table}': ${err.message}`);
                    reject(err);
                } else {
                    statusMessage(MessageType.Plain, `Updated ${whereValues.length} rows in table '${table}'`);
                    resolve();
                }
            });
        });
    });
}

export async function isModuleScraped(database: Database, module: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        database.get(`SELECT scraped FROM scrapers WHERE module = ? AND scraped = ?`, [module, true], (err, row) => {
            if (err) {
                statusMessage(MessageType.Error, `Error checking if ${module} has been scraped: ${err.message}`);
                reject(err);
            } else {
                if (row) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}
