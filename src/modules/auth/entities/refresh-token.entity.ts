import { User } from 'src/modules/users/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userType: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isRevoked: boolean;

  @Column()
  token: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;
}
