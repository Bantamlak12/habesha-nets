import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

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
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    city: string;
    state: string;
    country: string;
  };

  @Column({ type: 'enum', enum: ['Phone', 'Email', 'SMS'], default: 'Email' })
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 'unsubscribed' })
  subscriptionStatus: 'subscribed' | 'unsubscribed';

  @Column({ default: 'no-plan' })
  subscriptionPlan: 'per-post | monthly' | 'six-month' | 'Yearly';

  @Column({ type: 'int', nullable: true })
  ratings: number;

  @Column({ type: 'jsonb', nullable: true })
  reviews: string[];
}
