import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean, Length } from 'class-validator';

import { Availability } from '@/common/availability/entities';
import { PartyRole } from '@/common/enums/party-role.enum';
import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';
import { VariableValueScope } from '@/variables/entities';

import { Clause, ClauseCategory } from '@/clauses/entities';

@InputType()
export class CreateClauseInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  code?: string | null;

  @Field(() => String)
  @IsString()
  @Length(1, 255)
  title: string;

  @Field(() => String)
  @IsString()
  bodyText: string;

  @Field(() => ClauseCategory, { nullable: true })
  @IsOptional()
  @IsEnum(ClauseCategory)
  category?: ClauseCategory;

  @Field(() => [ClauseVariableSyncInput], { nullable: true })
  @IsOptional()
  variables?: ClauseVariableSyncInput[];
}

@InputType()
export class UpdateClauseInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  code?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bodyText?: string;

  @Field(() => ClauseCategory, { nullable: true })
  @IsOptional()
  @IsEnum(ClauseCategory)
  category?: ClauseCategory;

  @Field(() => [ClauseVariableSyncInput], { nullable: true })
  @IsOptional()
  variables?: ClauseVariableSyncInput[];
}

@InputType()
export class ClauseFilterInput {
  @Field(() => [Availability], { nullable: true })
  @IsOptional()
  availability?: Availability[];

  @Field(() => [ClauseCategory], { nullable: true })
  @IsOptional()
  category?: ClauseCategory[];

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
export class ClauseSortInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  createdAt?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  title?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  category?: 'ASC' | 'DESC';
}

@InputType()
export class ClauseVariableSyncInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field()
  @IsUUID()
  variableId: string;

  @Field(() => VariableValueScope, { nullable: true })
  @IsOptional()
  @IsEnum(VariableValueScope)
  valueScope?: VariableValueScope | null;

  @Field(() => PartyRole, { nullable: true })
  @IsOptional()
  @IsEnum(PartyRole)
  partyRole?: PartyRole | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  keyRequired?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  keyIfEmpty?: string | null;
}

@ObjectType()
export class ClauseResponse extends BaseResponse {
  @Field(() => Clause, { nullable: true })
  data: Clause | null;
}

@ObjectType()
export class ClausesPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [Clause])
  items: Clause[];
}

@ObjectType()
export class ClausesPaginatedResponse extends BaseResponse {
  @Field(() => ClausesPaginatedData)
  data: ClausesPaginatedData;
}
