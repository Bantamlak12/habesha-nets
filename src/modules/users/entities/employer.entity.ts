import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Employer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ nullable: true })
  companyName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
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
  description: string;

  @Column({ nullable: true })
  subscriptionStatus: 'subscribed' | 'unsubscribed';

  @Column({ nullable: true })
  subscriptionPlan: 'monthly' | 'sixMonth' | 'Yearly' | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
