import { Employer } from 'src/modules/users/entities/employer.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employer, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: Employer;

  @Column()
  userType: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column()
  token: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
