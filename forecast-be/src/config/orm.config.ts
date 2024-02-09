import { configDotenv } from 'dotenv';
import { SearchLog } from '../entities/search-log.entity';
import { User } from '../entities/user.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

configDotenv();

export const TypeORMConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT),
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
  schema: process.env.DB_SCHEMA,
  entities: [User, SearchLog],
  migrations: ['dist/src/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: true,
  logging: true,
};