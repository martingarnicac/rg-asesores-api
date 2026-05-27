import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { GraphQLJSON } from 'graphql-type-json';

import { Availability } from '@/common/availability/entities';
import { User } from '@/users/entities';

import { ClauseCategory } from './clause-category.enum';
import { ClauseVariable } from './clause-variable.entity';
import { ClauseTag } from '@/tags/entities/clause-tag.entity';

@ObjectType()
@Entity('clauses')
export class Clause {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code: string | null;

  @Field()
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Field()
  @Column({ type: 'text', nullable: false, name: 'body_text' })
  bodyText: string;

  @Field(() => ClauseCategory)
  @Column({ type: 'enum', enum: ClauseCategory, default: ClauseCategory.OTHER, nullable: false })
  category: ClauseCategory;

  @Field(() => String, { nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'replaces_clause_id' })
  replacesClauseId: string | null;

  @Field(() => Clause, { nullable: true })
  @ManyToOne(() => Clause, { nullable: true })
  @JoinColumn({ name: 'replaces_clause_id' })
  replacesClause: Clause | null;

  @Field(() => String)
  @Column({ type: 'uuid', nullable: false, name: 'created_by' })
  createdBy: string;

  @Field(() => User)
  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

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

  @Field(() => [ClauseVariable])
  @OneToMany(() => ClauseVariable, (clauseVariable) => clauseVariable.clause, { cascade: true })
  clauseVariables: ClauseVariable[];

  @Field(() => [ClauseTag])
  @OneToMany(() => ClauseTag, (clauseTag) => clauseTag.clause)
  clauseTags: ClauseTag[];
}
