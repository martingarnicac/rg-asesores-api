import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { Clause } from '@/clauses/entities';
import { Tag } from './tag.entity';

@ObjectType()
@Entity('clause_tags')
@Unique(['clauseId', 'tagId'])
export class ClauseTag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'clause_id' })
  clauseId: string;

  @ManyToOne(() => Clause, (clause) => clause.clauseTags, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clause_id' })
  clause: Clause;

  @Column({ type: 'uuid', nullable: false, name: 'tag_id' })
  tagId: string;

  @Field(() => Tag)
  @ManyToOne(() => Tag, (tag) => tag.clauseTags, { nullable: false })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
