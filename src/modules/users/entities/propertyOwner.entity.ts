import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity()
export class PropertyOwner extends User {
  @Column({ nullable: true })
  propertyType: string;

  @Column({ nullable: true })
  propertyAddress: string;

  @Column({ type: 'text', nullable: true })
  propertyDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rentalPrice: number;

  @Column({ type: 'jsonb', nullable: true })
  propertyImages: string[];

  @Column({ nullable: true })
  availabilityDate: Date;

  @Column({ nullable: true })
  leaseDuration: string;

  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
