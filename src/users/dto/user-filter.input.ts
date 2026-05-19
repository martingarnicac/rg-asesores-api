import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

import { BaseFilterInput } from '@/common/filter-sort/inputs/base-filter.input';
import { UserRole } from '@/users/entities';

@InputType()
export class UserFilterInput extends BaseFilterInput {
  @Field(() => [UserRole], { nullable: true })
  @IsOptional()
  role?: UserRole[];
}
