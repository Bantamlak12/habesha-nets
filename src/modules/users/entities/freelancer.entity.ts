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
export class Freelancer extends User {
  @Column({ nullable: true })
  profession: string;

  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  @Column({ type: 'jsonb', nullable: true })
  portfolioLinks: string[];

  @Column({ type: 'jsonb', nullable: true })
  portfolioFiles: string[];

  @Column({ type: 'jsonb', nullable: true })
  qualifications: Qualifications;

  @Column({ type: 'jsonb', nullable: true })
  experience: Experience[];

  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    days: string[];
    hours: string;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hourlyRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
