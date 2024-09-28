import { User } from 'src/modules/users/entities/users.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

@Entity('job-posts')
export class JobPost {
  @PrimaryGeneratedColumn('uuid')
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

  @Column({ type: 'jsonb' })
  salary: {
    min: number;
    max: number;
  };

  @Column({ type: 'jsonb', nullable: true })
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
