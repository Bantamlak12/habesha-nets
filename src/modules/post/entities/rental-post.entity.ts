import { User } from 'src/modules/users/entities/users.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

@Entity('rental-posts')
export class RentalPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  rentalType: string; // Car, Truck, House

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'jsonb' })
  location: {
    city?: string;
    country?: string;
  };

  @Column({ type: 'jsonb' })
  availabilityDate: {
    from: Date;
    to: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  numberOfBedRooms: number;

  @Column({ type: 'jsonb', nullable: true })
  numberOfBathRooms: number;

  @Column({ nullable: true })
  size: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ nullable: true })
  contactInfo: string;

  @Column({ type: 'text', nullable: true })
  rulesAndConditions: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ nullable: true })
  insurance: number;

  @Column({ nullable: true })
  furnishing: string;

  @Column({ nullable: true })
  utilities: string;

  @Column({ type: 'text', nullable: true })
  rentalTerms: string;

  @Column({ type: 'enum', enum: ['available', 'rented'], default: 'available' })
  postStatus: 'available' | 'rented';

  @ManyToOne(() => User, (user) => user.rentalPosts, { eager: true })
  postedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
