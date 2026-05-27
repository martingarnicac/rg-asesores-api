import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsBoolean, IsUUID, Length } from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

import { Availability } from '@/common/availability/entities';
import { PartyRole } from '@/common/enums/party-role.enum';
import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';

import { Variable, VariableDataType, VariableDataFormat, VariableValueScope } from '@/variables/entities';

@InputType()
export class CreateVariableInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  key?: string;

  @Field()
  @IsString()
  @Length(1, 255)
  label: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => VariableDataType)
  @IsEnum(VariableDataType)
  dataType: VariableDataType;

  @Field(() => VariableDataFormat, { nullable: true })
  @IsOptional()
  @IsEnum(VariableDataFormat)
  dataFormat?: VariableDataFormat | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArray?: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  typeOptions?: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  defaultValue?: any;

  @Field(() => VariableValueScope, { nullable: true })
  @IsOptional()
  @IsEnum(VariableValueScope)
  valueScope?: VariableValueScope;

  @Field(() => PartyRole, { nullable: true })
  @IsOptional()
  @IsEnum(PartyRole)
  defaultPartyRole?: PartyRole | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  placeholder?: string | null;

  @Field()
  @IsUUID()
  iconId: string;

  @Field()
  @IsUUID()
  colorId: string;
}

@InputType()
export class UpdateVariableInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  key?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  label?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Field(() => VariableDataType, { nullable: true })
  @IsOptional()
  @IsEnum(VariableDataType)
  dataType?: VariableDataType;

  @Field(() => VariableDataFormat, { nullable: true })
  @IsOptional()
  @IsEnum(VariableDataFormat)
  dataFormat?: VariableDataFormat | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArray?: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  typeOptions?: Record<string, any>;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  defaultValue?: any;

  @Field(() => VariableValueScope, { nullable: true })
  @IsOptional()
  @IsEnum(VariableValueScope)
  valueScope?: VariableValueScope;

  @Field(() => PartyRole, { nullable: true })
  @IsOptional()
  @IsEnum(PartyRole)
  defaultPartyRole?: PartyRole | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  placeholder?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  iconId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  colorId?: string;
}

@InputType()
export class VariableFilterInput {
  @Field(() => [Availability], { nullable: true })
  @IsOptional()
  availability?: Availability[];

  @Field(() => [VariableDataType], { nullable: true })
  @IsOptional()
  dataType?: VariableDataType[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  createdAtFrom?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  createdAtTo?: string;
}

@InputType()
export class VariableSortInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  createdAt?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  dataType?: 'ASC' | 'DESC';
}

@ObjectType()
export class VariableResponse extends BaseResponse {
  @Field(() => Variable, { nullable: true })
  data: Variable | null;
}

@ObjectType()
export class VariablesPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [Variable])
  items: Variable[];
}

@ObjectType()
export class VariablesPaginatedResponse extends BaseResponse {
  @Field(() => VariablesPaginatedData)
  data: VariablesPaginatedData;
}
