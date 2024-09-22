import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class BillingPlan {
  @PrimaryColumn()
  id: string;

  @Column()
  product_id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  status: string;

  @Column()
  tenure_type: string;

  @Column()
  interval_unit: string;

  @Column()
  interval_count: number;

  @Column()
  currency_code: string;

  @Column()
  value: string;

  @Column('jsonb')
  links: Record<string, any>[];

  @Column({ type: 'timestamptz' })
  created_time: Date;

  @Column({ type: 'timestamptz' })
  update_time: Date;
}
