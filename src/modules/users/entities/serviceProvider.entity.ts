import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity()
export class ServiceProvider extends User {
  @Column()
  serviceTitle: string;

  @Column()
  serviceCategory: string;

  @Column({ type: 'jsonb', nullable: true })
  qualifications: {
    degrees: string[];
    certifications: string[];
    trainings: string[];
  };

  @Column({ type: 'int', nullable: true })
  experience: number;

  @Column({ type: 'jsonb', nullable: true })
  verificationDocuments: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'jsonb', nullable: true })
  serviceAreas: string[];

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    days: string[];
    hours: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
