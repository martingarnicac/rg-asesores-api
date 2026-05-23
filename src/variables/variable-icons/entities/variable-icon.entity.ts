import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { Availability } from '@/common/availability/entities';

@ObjectType()
@Entity('variable_icons')
export class VariableIcon {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Field()
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Field()
  @Column({ type: 'varchar', length: 30, nullable: false })
  library: string;

  @Field()
  @Column({ type: 'varchar', length: 80, nullable: false, name: 'icon_key' })
  iconKey: string;

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
