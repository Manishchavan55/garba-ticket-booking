import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

let pool;

export const getDatabasePool = () => {
  if (!pool) {
    const { database } = config;
    if (!database.name || !database.user) {
      throw new Error('Database configuration is incomplete. Set DB_NAME and DB_USER.');
    }

    pool = mysql.createPool({
      host: database.host,
      port: database.port,
      database: database.name,
      user: database.user,
      password: database.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
};

export const closeDatabasePool = async () => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};
