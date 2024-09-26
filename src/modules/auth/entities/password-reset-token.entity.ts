import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from 'src/modules/users/entities/users.entity';

@Entity()
export class ResetTokens {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date;

  @Column({ nullable: true })
  OTP: string;

  @Column({ nullable: true })
  OtpExpiry: Date;

  @ManyToOne(() => User, (user) => user.resetTokens, {
    onDelete: 'CASCADE',
  })
  user: User;
}
