import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PropertyOwner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ nullable: true })
  verificationCodeExpires: Date;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    city: string;
    state: string;
    country: string;
  };

  @Column({ nullable: true })
  propertyType: string; // e.g., House, Apartment, Venue

  @Column({ nullable: true })
  propertyAddress: string; // Including GPS coordinates or map location

  @Column({ type: 'text', nullable: true })
  propertyDescription: string; // Detailed description including amenities

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rentalPrice: number; // Monthly or daily rent

  @Column({ type: 'jsonb', nullable: true })
  propertyImages: string[]; // Upload multiple images or videos

  @Column({ nullable: true })
  availabilityDate: Date; // When the property is available for rent

  @Column({ nullable: true })
  leaseDuration: string; // Short-term, long-term

  @Column({ type: 'enum', enum: ['Phone', 'Email', 'SMS'], default: 'Email' })
  preferredContactMethod: 'Phone' | 'Email' | 'SMS';

  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
