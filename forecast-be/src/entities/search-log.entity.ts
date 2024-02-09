import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class SearchLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dateTime: Date;

  @Column()
  location: string;

  @ManyToOne(() => User, user => user.searchLogs)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
