const sqlite3 = require('sqlite3').verbose();
import { Database } from 'sqlite3';
import { NewsArticle } from '../interfaces/news';
import { TableSchema } from '../interfaces/tableschema';
import { UserAdminUser } from '../interfaces/useradmin';

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

export async function insertUsersTable(database: Database, user_id: String, user: UserAdminUser): Promise<void> {
  return new Promise((resolve, reject) => {
    const statement = database.prepare('INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
statement.run(user_id, user.username, user.forum_post_count, user.forum_votes, user.lastseen, user.datejoined, user.points_total, user.points_day, user.points_week, user.points_month, user.points_forum, user.points_purchase, user.points_other, user.points_spent, user.points_decayed, user.points_adjusted, (err: { message: any; }) => {
      if (err) {
        console.error(`Error inserting into table users with user_id ${user_id}, ${user}:`, err.message);
        reject(err);
      } else {
        console.log(`Inserted ${user_id} into users successfully.`);
        resolve();
      }
    });
  });
}

export async function queryUsersTable(database: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    database.all(`SELECT * FROM users`, (err: Error | null, rows: any[]) => {
      if (err) {
        console.error(`Error querying table users:`, err.message);
        reject();
      } else {
        console.log(rows);
        resolve();
      }
    });
  });
}

export async function insertNewsTable(database: Database, article_id: String, news: NewsArticle): Promise<void> {
  return new Promise((resolve, reject) => {
    const statement = database.prepare('INSERT OR REPLACE INTO news_articles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
statement.run(article_id, news.user_id, news.num_comments, news.timestamp, news.status, news.title, news.content, news.commenting_mode, news.ordering, news.sticky, news.last_updated, news.username, news.displayname, (err: { message: any; }) => {
      if (err) {
        console.error(`Error inserting into table news_articles with article_id ${article_id}, ${news}:`, err.message);
        reject(err);
      } else {
        console.log(`Inserted ${article_id} into news_articles successfully.`);
        resolve();
      }
    });
  });
}

export async function queryNewsTable(database: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    database.all(`SELECT * FROM news_articles`, (err: Error | null, rows: any[]) => {
      if (err) {
        console.error(`Error querying table news_articles:`, err.message);
        reject();
      } else {
        console.log(rows);
        resolve();
      }
    });
  });
}