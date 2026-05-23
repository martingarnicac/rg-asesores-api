import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GraphQLJSON } from 'graphql-type-json';

import { Availability } from '@/common/availability/entities';
import { PartyRole } from '@/common/enums/party-role.enum';

import { VariableIcon } from '@/variables/variable-icons/entities';
import { VariableColor } from '@/variables/variable-colors/entities';
import { VariableDataType } from '@/variables/entities/variable-data-type.enum';
import { VariableDataFormat } from '@/variables/entities/variable-data-format.enum';
import { VariableValueScope } from '@/variables/entities/variable-value-scope.enum';

@ObjectType()
@Entity('variables')
export class Variable {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  identifier: string;

  @Field()
  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  key: string;

  @Field()
  @Column({ type: 'varchar', length: 255, nullable: false })
  label: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Field(() => VariableDataType)
  @Column({ type: 'enum', enum: VariableDataType, nullable: false, name: 'data_type' })
  dataType: VariableDataType;

  @Field(() => VariableDataFormat, { nullable: true })
  @Column({ type: 'enum', enum: VariableDataFormat, nullable: true, name: 'data_format' })
  dataFormat: VariableDataFormat | null;

  @Field()
  @Column({ type: 'boolean', default: false, nullable: false, name: 'is_array' })
  isArray: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', default: '{}', nullable: false, name: 'type_options' })
  typeOptions: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'default_value' })
  defaultValue: any;

  @Field(() => VariableValueScope)
  @Column({ type: 'enum', enum: VariableValueScope, default: VariableValueScope.CONTRACT, nullable: false, name: 'value_scope' })
  valueScope: VariableValueScope;

  @Field(() => PartyRole, { nullable: true })
  @Column({ type: 'enum', enum: PartyRole, nullable: true, name: 'default_party_role' })
  defaultPartyRole: PartyRole | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder: string | null;

  @Field(() => VariableIcon)
  @ManyToOne(() => VariableIcon, { nullable: false })
  @JoinColumn({ name: 'icon_id' })
  icon: VariableIcon;

  @Column({ type: 'uuid', nullable: false, name: 'icon_id' })
  iconId: string;

  @Field(() => VariableColor)
  @ManyToOne(() => VariableColor, { nullable: false })
  @JoinColumn({ name: 'color_id' })
  color: VariableColor;

  @Column({ type: 'uuid', nullable: false, name: 'color_id' })
  colorId: string;

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
