import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { PartyRole } from '@/common/enums/party-role.enum';
import { VariableValueScope } from '@/variables/entities';
import { Variable } from '@/variables/entities';

import { Clause } from './clause.entity';

@ObjectType()
@Entity('clause_variables')
@Unique(['clauseId', 'variableId'])
export class ClauseVariable {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false, name: 'clause_id' })
  clauseId: string;

  @ManyToOne(() => Clause, (clause) => clause.clauseVariables, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clause_id' })
  clause: Clause;

  @Column({ type: 'uuid', nullable: false, name: 'variable_id' })
  variableId: string;

  @Field(() => Variable)
  @ManyToOne(() => Variable, { nullable: false })
  @JoinColumn({ name: 'variable_id' })
  variable: Variable;

  @Field(() => VariableValueScope, { nullable: true })
  @Column({ type: 'enum', enum: VariableValueScope, nullable: true, name: 'value_scope' })
  valueScope: VariableValueScope | null;

  @Field(() => PartyRole, { nullable: true })
  @Column({ type: 'enum', enum: PartyRole, nullable: true, name: 'party_role' })
  partyRole: PartyRole | null;

  @Field()
  @Column({ type: 'boolean', default: false, nullable: false, name: 'key_required' })
  keyRequired: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true, name: 'key_if_empty' })
  keyIfEmpty: string | null;

  @Field(() => Number)
  @Column({ type: 'int', nullable: false, default: 0, name: 'sort_order' })
  sortOrder: number;
}
