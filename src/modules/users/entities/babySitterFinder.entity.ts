import { CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity()
export class BabySitterFinder extends User {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
