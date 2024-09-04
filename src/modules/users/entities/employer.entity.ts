import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity()
export class Employer extends User {
  @Column({ nullable: true })
  companyName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
