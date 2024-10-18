import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscriptions')
export class Subscriptions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  customerId: string;

  @Column({ type: 'varchar', length: 255 })
  subscriptionId: string;

  @Column({ type: 'varchar', length: 255 })
  planId: string;

  @Column({ type: 'varchar', length: 255 })
  billingPeriod: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number;

  @Column({ type: 'varchar', length: 255 })
  mode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
