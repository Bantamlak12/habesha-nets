import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('subscription')
export class Subscription {
  @PrimaryColumn()
  id: string;

  @Column()
  plan_id: string;

  @Column()
  user_Id: string;

  @Column()
  status: string;

  @Column({ type: 'timestamptz' })
  status_update_time: Date;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column()
  subscriber_given_name: string;

  @Column()
  subscriber_surname: string;

  @Column()
  subscriber_email_address: string;

  @Column({ type: 'timestamptz' })
  create_time: Date;

  @Column('jsonb')
  subscriptio_links: Record<string, any>[];
}
