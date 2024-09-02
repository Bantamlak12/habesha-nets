import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
export class Freelancer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userType: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ nullable: true })
  verificationCodeExpires: Date;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profilePicture: string;

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

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    days: string[];
    hours: string;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    city: string;
    state: string;
    country: string;
  };

  @Column({ type: 'enum', enum: ['Phone', 'Email', 'SMS'], default: 'Email' })
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
