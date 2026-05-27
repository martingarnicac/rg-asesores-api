import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

import { Availability } from '@/common/availability/entities';
import { ClauseTag } from './clause-tag.entity';

@ObjectType()
@Entity('tags')
export class Tag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Field()
  @Column({ type: 'varchar', length: 80, unique: true, nullable: false })
  name: string;

  @Field()
  @Column({ type: 'varchar', length: 80, unique: true, nullable: false })
  slug: string;

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

  @Field(() => [ClauseTag])
  @OneToMany(() => ClauseTag, (clauseTag) => clauseTag.tag)
  clauseTags: ClauseTag[];
}
