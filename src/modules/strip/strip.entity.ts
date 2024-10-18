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
  id: string; // Unique identifier for the subscription entry

  @Column({ type: 'varchar', length: 255 })
  customerId: string; // Stripe customer ID

  @Column({ type: 'varchar', length: 255 })
  subscriptionId: string; // Stripe subscription ID

  @Column({ type: 'varchar', length: 255 })
  planId: string; // Plan ID from the metadata

  @Column({ type: 'varchar', length: 255 })
  billingPeriod: string;

  @Column('uuid')
  userId: string; // Internal user ID from your system

  @Column({ type: 'varchar', length: 255, nullable: true })
  status: string; // Subscription status (active, canceled, etc.)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number; // Total amount paid for the subscription

  @Column({ type: 'varchar', length: 255 })  // New mode column
  mode: string;  // Payment mode: subscription or one-time

  @CreateDateColumn()
  createdAt: Date; // Timestamp when the subscription was created

  @UpdateDateColumn()
  updatedAt: Date; // Timestamp when the subscription was last updated
}

// import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
// @Entity('subscriptions')
// export class Subscriptions {
// @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   user_id: string;

//   @Column()
//   payment_intent_id: string ;

//   @Column()
//   subscription_plan_id: string;

//   @Column()
//   amount_paid: number;

//   @Column({ type: 'timestamptz' })
//   created_at: Date;

//   @Column()
//   status: string;
// }
