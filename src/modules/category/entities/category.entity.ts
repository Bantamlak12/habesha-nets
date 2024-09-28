import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Service } from '../entities/service.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Service, (service) => service.category, { cascade: true })
  services: Service[];
}
