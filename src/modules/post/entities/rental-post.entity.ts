import { User } from 'src/modules/users/entities/users.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('rental-posts')
export class RentalPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  rentalType: string; // Car, Truck, House

  @Column('text')
  description: string;

  @Index()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  postalCode: string;

  @OneToMany(() => RentalPostImage, (image) => image.rentalPost, {
    cascade: true,
  })
  images: RentalPostImage[];

  @Column({ type: 'date' })
  availableFrom: Date;

  @Column({ type: 'date' })
  availableUntil: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'enum', enum: ['available', 'rented'], default: 'available' })
  postStatus: 'available' | 'rented';

  @ManyToOne(() => User, (user) => user.rentalPosts, { eager: true })
  postedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('rental-post-images')
export class RentalPostImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RentalPost, (rentalPoast) => rentalPoast.images, {
    onDelete: 'CASCADE',
  })
  rentalPost: RentalPost;

  @Column()
  imageUrl: string;
}
