import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './users.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';

@Entity()
export class PropertyOwner extends User {
  @Column({ nullable: true })
  propertyType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
