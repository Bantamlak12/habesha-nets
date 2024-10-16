import { ResetTokens } from 'src/modules/auth/entities/password-reset-token.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';
import { JobPost } from 'src/modules/post/entities/job-post.entity';
import { RentalPost } from 'src/modules/post/entities/rental-post.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
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
  endDate?: Date | string;
}

@Entity('users')
@TableInheritance({ column: { type: 'varchar' } })
export abstract class User {
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

  @Column({ default: false })
  isProfileCompleted: boolean;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, default: null })
  email: string;

  @Column({ unique: true, default: null })
  secondaryEmail: string;

  @Column({ unique: true, default: null })
  phoneNumber: string;

  @Column({ unique: true, default: null })
  secondaryPhoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ type: 'jsonb', nullable: true })
  address: {
    streetAddress: string;
    secondaryAddress: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  };

  @Column({ type: 'enum', enum: ['Phone', 'Email', 'SMS'], default: 'Email' })
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  serviceCategory: string;

  @Column({ nullable: true })
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
  availability: {
    days: string[];
    hours: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  @Column({ nullable: true })
  propertyType: string;

  @Column({ type: 'jsonb', nullable: true })
  budgetRange: {
    min: number;
    max: number;
  };

  @Column({ type: 'int', nullable: true })
  ratings: number;

  @Column({ type: 'jsonb', nullable: true })
  reviews: string[];

  @Column({ default: 'unsubscribed' })
  subscriptionStatus: 'subscribed' | 'unsubscribed';

  @Column({ nullable: true })
  subscriptionId: string;

  @Column({ default: 'no-plan' })
  subscriptionPlan: string;

  @Column({ nullable: true })
  subscriptionUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => ResetTokens, (resetTokens) => resetTokens.user)
  resetTokens: ResetTokens[];

  @OneToMany(() => JobPost, (jobPost) => jobPost.postedBy)
  jobPosts: JobPost[];

  @OneToMany(() => RentalPost, (rentalPost) => rentalPost.postedBy)
  rentalPosts: JobPost[];
}
