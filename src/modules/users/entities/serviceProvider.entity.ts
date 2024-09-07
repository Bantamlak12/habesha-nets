import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';

interface Qualifications {
  degree: string;
  certifications: string[];
  trainings: string[];
}

interface Experience {
  positionn: string;
  yearsOfExperience: string;
  responsibilities: string[];
  company?: string;
  startDate?: Date;
  endDate?: Date;
}

@Entity()
export class ServiceProvider extends User {
  @Column({ nullable: true })
  profession: string;

  @Column()
  serviceCategory: string;

  @Column()
  serviceTitle: string;

  @Column({ type: 'jsonb', nullable: true })
  experience: Experience[];

  @Column({ type: 'jsonb', nullable: true })
  qualifications: Qualifications;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true })
  portfolioLinks: string[];

  @Column({ type: 'jsonb', nullable: true })
  portfolioFiles: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'jsonb', nullable: true })
  verificationDocuments: string[];

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
