import {DataSource} from 'typeorm'
import { configDotenv } from 'dotenv';

configDotenv();


export const PostgreSqlDataSource = new DataSource({
    type: 'postgres',
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DB,
    schema: process.env.DB_SCHEMA,
    entities: ['src/entities/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
  });