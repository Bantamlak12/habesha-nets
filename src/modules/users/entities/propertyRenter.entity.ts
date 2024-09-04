import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity()
export class PropertyRenter extends User {
  @Column({ type: 'jsonb', nullable: true })
  budgetRange: {
    min: number;
    max: number;
  };

  @Column({ nullable: true })
  moveInDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
