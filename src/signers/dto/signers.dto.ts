import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

import { BaseResponse } from '@/common/response';
import { PaginatedMeta } from '@/common/response/paginated-meta.model';
import { BaseFilterInput } from '@/common/filter-sort/inputs/base-filter.input';
import { BaseSortInput } from '@/common/filter-sort/inputs/base-sort.input';
import { SortDirection } from '@/common/filter-sort/enums/sort-direction.enum';

import { Signer } from '@/signers/entities';

@InputType()
export class CreateSignerInput {
  @Field(() => String)
  @IsString()
  @Length(1, 150)
  name: string;

  @Field(() => String)
  @IsString()
  @Length(1, 150)
  lastname: string;

  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone?: string;
}

@InputType()
export class UpdateSignerInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  lastname?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone?: string;
}

@InputType()
export class SignerFilterInput extends BaseFilterInput {}

@InputType()
export class SignerSortInput extends BaseSortInput {
  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  name?: SortDirection;

  @Field(() => SortDirection, { nullable: true })
  @IsOptional()
  lastname?: SortDirection;
}

@InputType()
export class SignerLookupInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone?: string;
}

@ObjectType()
export class SignerResponse extends BaseResponse {
  @Field(() => Signer, { nullable: true })
  data: Signer | null;
}

@ObjectType()
export class SignersPaginatedData {
  @Field(() => PaginatedMeta)
  meta: PaginatedMeta;

  @Field(() => [Signer])
  items: Signer[];
}

@ObjectType()
export class SignersPaginatedResponse extends BaseResponse {
  @Field(() => SignersPaginatedData)
  data: SignersPaginatedData;
}
