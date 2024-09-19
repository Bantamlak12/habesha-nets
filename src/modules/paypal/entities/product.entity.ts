import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ type: 'timestamptz' })
  create_time: Date;

  @Column({ type: 'timestamptz' })
  update_time: Date;
}
