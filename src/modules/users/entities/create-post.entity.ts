import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './users.entity';

@Entity('job-posts')
export class JobPost {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  jobType: string;

  @Column()
  companyName: string;

  @Column({ type: 'jsonb' })
  location: {
    city?: string;
    country?: string;
    remote?: boolean;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryMax: number;

  @Column({ type: 'jsonb' })
  requiredSkills: string[];

  @Column()
  experienceLevel: string;

  @Column()
  category: string;

  @Column()
  applicationDeadline: Date;

  @Column({ type: 'enum', enum: ['active', 'closed'], default: 'active' })
  status: 'active' | 'closed';

  @ManyToOne(() => User, (user) => user.jobPosts, { eager: true })
  postedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
