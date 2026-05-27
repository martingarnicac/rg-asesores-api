import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { Availability } from '@/common/availability/entities';
import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';

import { Tag } from '@/tags/entities';

@InputType()
export class CreateTagInput {
  @Field(() => String)
  @IsString()
  @Length(1, 80)
  name: string;
}

@InputType()
export class UpdateTagInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;
}

@InputType()
export class TagFilterInput {
  @Field(() => [Availability], { nullable: true })
  @IsOptional()
  availability?: Availability[];

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
export class TagSortInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  createdAt?: 'ASC' | 'DESC';

  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: 'ASC' | 'DESC';
}

@InputType()
export class AssignTagToClauseInput {
  @Field()
  @IsUUID()
  clauseId: string;

  @Field()
  @IsUUID()
  tagId: string;
}

@InputType()
export class RemoveTagFromClauseInput {
  @Field()
  @IsUUID()
  clauseId: string;

  @Field()
  @IsUUID()
  tagId: string;
}

@ObjectType()
export class TagResponse extends BaseResponse {
  @Field(() => Tag, { nullable: true })
  data: Tag | null;
}

@ObjectType()
export class TagsByClauseResponse extends BaseResponse {
  @Field(() => [Tag])
  data: Tag[];
}

@ObjectType()
export class TagsPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [Tag])
  items: Tag[];
}

@ObjectType()
export class TagsPaginatedResponse extends BaseResponse {
  @Field(() => TagsPaginatedData)
  data: TagsPaginatedData;
}
