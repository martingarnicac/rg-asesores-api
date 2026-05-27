import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { Availability } from '@/common/availability/entities';

@ObjectType()
@Entity('signers')
export class Signer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Field()
  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Field()
  @Column({ type: 'varchar', length: 150, nullable: false, name: 'last_name' })
  lastname: string;

  @Field()
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  phone: string;

  @Field(() => Boolean)
  isDeletable: boolean;

  @Field(() => Availability)
  @Column({ type: 'enum', enum: Availability, default: Availability.ACTIVE, nullable: false })
  availability: Availability;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
