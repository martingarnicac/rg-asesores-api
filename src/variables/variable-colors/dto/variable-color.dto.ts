import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

import { Availability } from '@/common/availability/entities';
import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';
import { VariableColor } from '@/variables/variable-colors/entities';

@InputType()
export class CreateVariableColorInput {
  @Field()
  @IsString()
  @Length(1, 100)
  name: string;

  @Field()
  @IsString()
  @Length(7, 7)
  @Transform(({ value }: TransformFnParams) => value?.toUpperCase())
  @Matches(/^#[0-9A-F]{6}$/, { message: 'hex must be a valid HEX color code (#RRGGBB), uppercase' })
  hex: string;
}

@InputType()
export class UpdateVariableColorInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'hex must be a valid HEX color code (#RRGGBB)' })
  hex?: string;
}

@InputType()
export class VariableColorFilterInput {
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
export class VariableColorSortInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  createdAt?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: 'ASC' | 'DESC';
}

@ObjectType()
export class VariableColorResponse extends BaseResponse {
  @Field(() => VariableColor, { nullable: true })
  data: VariableColor | null;
}

@ObjectType()
export class VariableColorsPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [VariableColor])
  items: VariableColor[];
}

@ObjectType()
export class VariableColorsPaginatedResponse extends BaseResponse {
  @Field(() => VariableColorsPaginatedData)
  data: VariableColorsPaginatedData;
}
