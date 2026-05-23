import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, Length } from 'class-validator';

import { Availability } from '@/common/availability/entities';
import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';

import { VariableIcon } from '@/variables/variable-icons/entities';

@InputType()
export class CreateVariableIconInput {
  @Field()
  @IsString()
  @Length(1, 100)
  name: string;

  @Field()
  @IsString()
  @Length(1, 30)
  library: string;

  @Field()
  @IsString()
  @Length(1, 80)
  iconKey: string;
}

@InputType()
export class UpdateVariableIconInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  library?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  iconKey?: string;
}

@InputType()
export class VariableIconFilterInput {
  @Field(() => [Availability], { nullable: true })
  @IsOptional()
  availability?: Availability[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @Field(() => String, { nullable: true, description: 'Filter by createdAt from date, example: YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  createdAtFrom?: string;

  @Field(() => String, { nullable: true, description: 'Filter by createdAt to date, example: YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  createdAtTo?: string;
}

@InputType()
export class VariableIconSortInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  createdAt?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: 'ASC' | 'DESC';
}

@ObjectType()
export class VariableIconResponse extends BaseResponse {
  @Field(() => VariableIcon, { nullable: true })
  data: VariableIcon | null;
}

@ObjectType()
export class VariableIconsPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [VariableIcon])
  items: VariableIcon[];
}

@ObjectType()
export class VariableIconsPaginatedResponse extends BaseResponse {
  @Field(() => VariableIconsPaginatedData)
  data: VariableIconsPaginatedData;
}
