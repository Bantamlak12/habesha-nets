import { CreateDateColumn, Entity, OneToMany, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';

@Entity()
export class BabySitterFinder extends User {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
