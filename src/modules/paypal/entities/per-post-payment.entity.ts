import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    paymentId: string;

    @Column()
    userId: string; // Foreign key referencing User

    @Column()
    state: string;

    @Column()
    payerEmail: string;

    @Column()
    payerFirstName: string;

    @Column()
    payerLastName: string;

    @Column()
    amount: string;

    @Column()
    currency: string;

    @Column()
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column('json')
    links: any; // Store links as JSON
}